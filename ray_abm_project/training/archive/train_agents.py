import ray
from ray import tune
from ray.rllib.algorithms.ppo import PPOConfig
from ray.rllib.algorithms.dqn import DQNConfig
from ray.rllib.algorithms.sac import SACConfig
from ray.tune.registry import register_env
import os
import sys
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime

# Add the parent directory to the path to import MarketEnv
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from env.MarketEnv import MarketEnv

# Register the environment with Ray
def env_creator(env_config):
    return MarketEnv(config=env_config)

register_env("MarketEnv", env_creator)

class RLTrainer:
    """
    Trainer class for Deep RL trading agents using Ray RLlib
    """
    
    def __init__(self, algorithm="PPO", num_workers=2, training_iterations=50):
        self.algorithm = algorithm
        self.num_workers = num_workers
        self.training_iterations = training_iterations
        self.results_dir = "results"
        self.checkpoint_dir = f"checkpoints/{algorithm}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Initialize Ray
        if not ray.is_initialized():
            ray.init(ignore_reinit_error=True)
        
        # Create results directory
        os.makedirs(self.results_dir, exist_ok=True)
        os.makedirs(self.checkpoint_dir, exist_ok=True)
    
    def create_config(self):
        """Create algorithm configuration"""
        
        # Environment configuration
        env_config = {
            'max_steps': 1000,
            'initial_price': 100.0,
            'fundamental_value': 100.0,
            'tick_size': 0.01,
            'max_inventory': 100,
            'initial_cash': 10000.0
        }
        
        if self.algorithm == "PPO":
            config = (PPOConfig()
                     .environment("MarketEnv", env_config=env_config)
                     .framework("torch")
                     .api_stack(enable_rl_module_and_learner=False, enable_env_runner_and_connector_v2=False)
                     .rollouts(num_rollout_workers=self.num_workers)
                     .training(
                         train_batch_size=4000,
                         sgd_minibatch_size=128,
                         num_sgd_iter=10,
                         lr=3e-4,
                         gamma=0.99,
                         lambda_=0.95,
                         clip_param=0.2,
                         entropy_coeff=0.01,
                         vf_loss_coeff=0.5,
                         model={
                             "fcnet_hiddens": [256, 256],
                             "fcnet_activation": "relu",
                         }
                     )
                     .evaluation(
                         evaluation_interval=10,
                         evaluation_duration=10,
                         evaluation_config={"explore": False}
                     ))
        
        elif self.algorithm == "DQN":
            config = (DQNConfig()
                     .environment("MarketEnv", env_config=env_config)
                     .framework("torch")
                     .api_stack(enable_rl_module_and_learner=False, enable_env_runner_and_connector_v2=False)
                     .rollouts(num_rollout_workers=self.num_workers)
                     .training(
                         lr=1e-4,
                         gamma=0.99,
                         target_network_update_freq=1000,
                         buffer_size=50000,
                         train_batch_size=32,
                         exploration_config={
                             "type": "EpsilonGreedy",
                             "initial_epsilon": 1.0,
                             "final_epsilon": 0.02,
                             "epsilon_timesteps": 10000,
                         },
                         model={
                             "fcnet_hiddens": [256, 256],
                             "fcnet_activation": "relu",
                         }
                     ))
        
        elif self.algorithm == "SAC":
            config = (SACConfig()
                     .environment("MarketEnv", env_config=env_config)
                     .framework("torch")
                     .api_stack(enable_rl_module_and_learner=False, enable_env_runner_and_connector_v2=False)
                     .rollouts(num_rollout_workers=self.num_workers)
                     .training(
                         lr=3e-4,
                         gamma=0.99,
                         tau=0.005,
                         target_entropy="auto",
                         buffer_size=100000,
                         train_batch_size=256,
                         model={
                             "fcnet_hiddens": [256, 256],
                             "fcnet_activation": "relu",
                         }
                     ))
        
        else:
            raise ValueError(f"Unsupported algorithm: {self.algorithm}")
        
        return config
    
    def train(self):
        """Train the RL agent"""
        print(f"Starting {self.algorithm} training with {self.num_workers} workers...")
        
        # Create algorithm
        config = self.create_config()
        algo = config.build()
        
        # Training metrics
        training_results = []
        best_reward = float('-inf')
        
        try:
            for iteration in range(self.training_iterations):
                # Train for one iteration
                result = algo.train()
                
                # Extract key metrics
                episode_reward_mean = result.get("episode_reward_mean", 0)
                episode_len_mean = result.get("episode_len_mean", 0)
                training_iteration = result.get("training_iteration", iteration)
                
                training_results.append({
                    'iteration': training_iteration,
                    'episode_reward_mean': episode_reward_mean,
                    'episode_len_mean': episode_len_mean,
                    'timesteps_total': result.get("timesteps_total", 0)
                })
                
                # Print progress
                print(f"Iteration {iteration + 1}/{self.training_iterations}: "
                      f"Mean Reward: {episode_reward_mean:.2f}, "
                      f"Mean Episode Length: {episode_len_mean:.1f}")
                
                # Save best model
                if episode_reward_mean > best_reward:
                    best_reward = episode_reward_mean
                    checkpoint_path = algo.save(self.checkpoint_dir)
                    print(f"New best model saved: {checkpoint_path}")
                
                # Save checkpoint every 20 iterations
                if (iteration + 1) % 20 == 0:
                    checkpoint_path = algo.save(self.checkpoint_dir)
                    print(f"Checkpoint saved: {checkpoint_path}")
        
        except KeyboardInterrupt:
            print("Training interrupted by user")
        
        finally:
            # Save final model
            final_checkpoint = algo.save(self.checkpoint_dir)
            print(f"Final model saved: {final_checkpoint}")
            
            # Save training results
            self._save_training_results(training_results)
            
            # Plot training progress
            self._plot_training_progress(training_results)
            
            algo.stop()
        
        return training_results, final_checkpoint
    
    def _save_training_results(self, results):
        """Save training results to file"""
        import json
        
        results_file = os.path.join(self.results_dir, f"{self.algorithm}_training_results.json")
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"Training results saved to: {results_file}")
    
    def _plot_training_progress(self, results):
        """Plot training progress"""
        if not results:
            return
        
        iterations = [r['iteration'] for r in results]
        rewards = [r['episode_reward_mean'] for r in results]
        episode_lengths = [r['episode_len_mean'] for r in results]
        
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8))
        
        # Plot rewards
        ax1.plot(iterations, rewards, 'b-', linewidth=2)
        ax1.set_xlabel('Training Iteration')
        ax1.set_ylabel('Mean Episode Reward')
        ax1.set_title(f'{self.algorithm} Training Progress - Rewards')
        ax1.grid(True, alpha=0.3)
        
        # Plot episode lengths
        ax2.plot(iterations, episode_lengths, 'r-', linewidth=2)
        ax2.set_xlabel('Training Iteration')
        ax2.set_ylabel('Mean Episode Length')
        ax2.set_title(f'{self.algorithm} Training Progress - Episode Lengths')
        ax2.grid(True, alpha=0.3)
        
        plt.tight_layout()
        
        # Save plot
        plot_file = os.path.join(self.results_dir, f"{self.algorithm}_training_progress.png")
        plt.savefig(plot_file, dpi=300, bbox_inches='tight')
        plt.show()
        
        print(f"Training progress plot saved to: {plot_file}")

def evaluate_agent(checkpoint_path, num_episodes=10):
    """Evaluate a trained agent"""
    from ray.rllib.algorithms.algorithm import Algorithm
    
    print(f"Evaluating agent from checkpoint: {checkpoint_path}")
    
    # Load the trained agent
    algo = Algorithm.from_checkpoint(checkpoint_path)
    
    # Create environment for evaluation
    env = MarketEnv()
    
    total_rewards = []
    total_pnls = []
    
    for episode in range(num_episodes):
        obs = env.reset()
        episode_reward = 0
        done = False
        step_count = 0
        
        while not done and step_count < 1000:
            # Get action from trained agent
            action = algo.compute_single_action(obs, explore=False)
            
            # Take step in environment
            obs, reward, done, info = env.step(action)
            episode_reward += reward
            step_count += 1
        
        total_rewards.append(episode_reward)
        total_pnls.append(info['pnl'])
        
        print(f"Episode {episode + 1}: Reward = {episode_reward:.2f}, "
              f"PnL = {info['pnl']:.2f}, Steps = {step_count}")
    
    # Print evaluation summary
    print(f"\nEvaluation Summary ({num_episodes} episodes):")
    print(f"Average Reward: {np.mean(total_rewards):.2f} ± {np.std(total_rewards):.2f}")
    print(f"Average PnL: {np.mean(total_pnls):.2f} ± {np.std(total_pnls):.2f}")
    print(f"Win Rate: {sum(1 for pnl in total_pnls if pnl > 0) / len(total_pnls) * 100:.1f}%")
    
    algo.stop()
    return total_rewards, total_pnls

def stress_test_agent(checkpoint_path, stress_scenarios):
    """Test agent under various stress scenarios"""
    from ray.rllib.algorithms.algorithm import Algorithm
    
    print("Running stress tests...")
    
    # Load the trained agent
    algo = Algorithm.from_checkpoint(checkpoint_path)
    
    stress_results = {}
    
    for scenario_name, scenario_config in stress_scenarios.items():
        print(f"\nTesting scenario: {scenario_name}")
        
        # Create environment with stress configuration
        env = MarketEnv(config=scenario_config.get('env_config', {}))
        
        episode_rewards = []
        episode_pnls = []
        
        for episode in range(5):  # 5 episodes per scenario
            obs = env.reset()
            
            # Inject stress event if specified
            if 'stress_event' in scenario_config:
                stress_event = scenario_config['stress_event']
                env.inject_market_stress(
                    stress_event['type'], 
                    stress_event['magnitude']
                )
            
            episode_reward = 0
            done = False
            step_count = 0
            
            while not done and step_count < 1000:
                action = algo.compute_single_action(obs, explore=False)
                obs, reward, done, info = env.step(action)
                episode_reward += reward
                step_count += 1
            
            episode_rewards.append(episode_reward)
            episode_pnls.append(info['pnl'])
        
        stress_results[scenario_name] = {
            'avg_reward': np.mean(episode_rewards),
            'avg_pnl': np.mean(episode_pnls),
            'std_reward': np.std(episode_rewards),
            'std_pnl': np.std(episode_pnls)
        }
        
        print(f"  Average Reward: {stress_results[scenario_name]['avg_reward']:.2f}")
        print(f"  Average PnL: {stress_results[scenario_name]['avg_pnl']:.2f}")
    
    algo.stop()
    return stress_results

if __name__ == "__main__":
    # Training configuration
    ALGORITHM = "PPO"  # Options: PPO, DQN, SAC
    NUM_WORKERS = 2    # Adjust based on your CPU cores
    TRAINING_ITERATIONS = 50
    
    # Create trainer
    trainer = RLTrainer(
        algorithm=ALGORITHM,
        num_workers=NUM_WORKERS,
        training_iterations=TRAINING_ITERATIONS
    )
    
    # Train the agent
    print("Starting RL agent training...")
    results, checkpoint_path = trainer.train()
    
    # Evaluate the trained agent
    print("\nEvaluating trained agent...")
    evaluate_agent(checkpoint_path, num_episodes=10)
    
    # Define stress test scenarios
    stress_scenarios = {
        "flash_crash": {
            "stress_event": {"type": "flash_crash", "magnitude": 0.1}
        },
        "high_volatility": {
            "stress_event": {"type": "volatility_spike", "magnitude": 2.0}
        },
        "liquidity_crisis": {
            "stress_event": {"type": "liquidity_shock", "magnitude": 1.5}
        }
    }
    
    # Run stress tests
    print("\nRunning stress tests...")
    stress_results = stress_test_agent(checkpoint_path, stress_scenarios)
    
    print("\nTraining and evaluation completed!")
    print(f"Best model checkpoint: {checkpoint_path}") 