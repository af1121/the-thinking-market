import ray
from ray import tune
from ray.rllib.algorithms.ppo import PPO
import numpy as np
import matplotlib.pyplot as plt
import json
import os
from datetime import datetime
import sys

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from multi_agent_config import CONFIGS
from env.MultiAgentMarketEnv import MultiAgentMarketEnv

def train_multi_agent_system(config_name="multi_agent", num_iterations=100, checkpoint_freq=25):
    """
    Train multiple RL agents in a shared market environment
    
    Args:
        config_name: Which configuration to use ("multi_agent", "competitive", "diverse")
        num_iterations: Number of training iterations
        checkpoint_freq: How often to save checkpoints
    """
    
    # Initialize Ray
    if not ray.is_initialized():
        ray.init(ignore_reinit_error=True)
    
    print(f"🚀 Starting multi-agent training with config: {config_name}")
    print(f"📈 Training for {num_iterations} iterations")
    
    # Get configuration
    if config_name not in CONFIGS:
        raise ValueError(f"Unknown config: {config_name}. Available: {list(CONFIGS.keys())}")
    
    config = CONFIGS[config_name]()
    
    # Create algorithm
    algo = PPO(config=config)
    
    # Training metrics
    training_results = []
    episode_rewards = {f"rl_agent_{i}": [] for i in range(config.env_config['num_rl_agents'])}
    episode_lengths = []
    market_prices = []
    
    print(f"🏛️ Environment: {config.env_config['num_rl_agents']} RL agents + traditional agents")
    print(f"🧠 Policies: {list(config.multi_agent()['policies'].keys())}")
    
    try:
        for iteration in range(num_iterations):
            # Train one iteration
            result = algo.train()
            
            # Extract metrics
            env_runners = result.get('env_runners', {})
            episode_reward_mean = env_runners.get('episode_reward_mean', 0)
            episode_len_mean = env_runners.get('episode_len_mean', 0)
            
            # Store results
            training_results.append({
                'iteration': iteration,
                'episode_reward_mean': episode_reward_mean,
                'episode_len_mean': episode_len_mean,
                'timestamp': datetime.now().isoformat()
            })
            
            episode_lengths.append(episode_len_mean)
            
            # Extract individual agent rewards if available
            policy_rewards = result.get('policy_reward_mean', {})
            for policy_id, reward in policy_rewards.items():
                # Map policy to agent (simplified)
                if policy_id in episode_rewards or f"rl_agent_{policy_id.split('_')[-1]}" in episode_rewards:
                    agent_key = f"rl_agent_{policy_id.split('_')[-1]}" if policy_id.startswith('policy_') else policy_id
                    if agent_key in episode_rewards:
                        episode_rewards[agent_key].append(reward)
            
            # Print progress
            if iteration % 10 == 0 or iteration == num_iterations - 1:
                print(f"📊 Iteration {iteration:3d}: "
                      f"Reward: {episode_reward_mean:8.3f}, "
                      f"Length: {episode_len_mean:6.1f}")
                
                # Print individual agent performance if available
                if policy_rewards:
                    print(f"    Agent rewards: {policy_rewards}")
            
            # Save checkpoint
            if iteration % checkpoint_freq == 0 and iteration > 0:
                checkpoint_path = algo.save()
                print(f"💾 Checkpoint saved: {checkpoint_path}")
        
        # Final checkpoint
        final_checkpoint = algo.save()
        print(f"🏁 Final checkpoint saved: {final_checkpoint}")
        
        # Test the trained agents
        print("\n🧪 Testing trained multi-agent system...")
        test_results = test_multi_agent_system(algo, config.env_config, num_episodes=5)
        
        # Save results
        results_data = {
            'config_name': config_name,
            'num_iterations': num_iterations,
            'training_results': training_results,
            'episode_rewards': episode_rewards,
            'episode_lengths': episode_lengths,
            'test_results': test_results,
            'final_checkpoint': final_checkpoint,
            'timestamp': datetime.now().isoformat()
        }
        
        # Create results directory
        results_dir = "multi_agent_results"
        os.makedirs(results_dir, exist_ok=True)
        
        # Save results
        results_file = f"{results_dir}/multi_agent_{config_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(results_file, 'w') as f:
            json.dump(results_data, f, indent=2)
        
        print(f"📁 Results saved to: {results_file}")
        
        # Plot results
        plot_multi_agent_results(training_results, episode_rewards, config_name)
        
        return algo, results_data
        
    except Exception as e:
        print(f"❌ Training failed: {e}")
        raise
    finally:
        algo.stop()

def test_multi_agent_system(algo, env_config, num_episodes=5):
    """Test the trained multi-agent system"""
    
    # Create test environment
    env = MultiAgentMarketEnv(env_config)
    
    test_results = {
        'episodes': [],
        'agent_performance': {f"rl_agent_{i}": [] for i in range(env_config['num_rl_agents'])},
        'market_dynamics': []
    }
    
    for episode in range(num_episodes):
        obs, _ = env.reset()
        done = {agent_id: False for agent_id in obs.keys()}
        episode_rewards = {agent_id: 0 for agent_id in obs.keys()}
        episode_trades = {agent_id: 0 for agent_id in obs.keys()}
        price_history = [env.current_price]
        
        step = 0
        while not all(done.values()) and step < env_config['max_steps']:
            # Get actions from all agents
            actions = {}
            for agent_id in obs.keys():
                if not done[agent_id]:
                    # Get policy for this agent
                    policy_id = algo.config.multi_agent()['policy_mapping_fn'](agent_id, None, None)
                    action = algo.compute_single_action(obs[agent_id], policy_id=policy_id)
                    actions[agent_id] = action
            
            # Step environment
            obs, rewards, terminated, truncated, infos = env.step(actions)
            
            # Update metrics
            for agent_id in rewards.keys():
                episode_rewards[agent_id] += rewards[agent_id]
                if infos[agent_id]['num_trades'] > episode_trades[agent_id]:
                    episode_trades[agent_id] = infos[agent_id]['num_trades']
            
            price_history.append(env.current_price)
            
            # Update done status
            for agent_id in terminated.keys():
                done[agent_id] = terminated[agent_id] or truncated[agent_id]
            
            step += 1
        
        # Store episode results
        episode_result = {
            'episode': episode,
            'steps': step,
            'final_price': env.current_price,
            'price_volatility': np.std(price_history) if len(price_history) > 1 else 0,
            'total_trades': len(env.trades),
            'agent_rewards': episode_rewards,
            'agent_trades': episode_trades,
            'agent_final_pnl': {aid: infos[aid]['pnl'] for aid in infos.keys()}
        }
        
        test_results['episodes'].append(episode_result)
        
        # Update agent performance tracking
        for agent_id, reward in episode_rewards.items():
            test_results['agent_performance'][agent_id].append(reward)
        
        print(f"  Episode {episode}: {len(env.trades)} trades, "
              f"Price: ${env.current_price:.2f}, "
              f"Avg reward: {np.mean(list(episode_rewards.values())):.3f}")
    
    # Calculate summary statistics
    test_results['summary'] = {
        'avg_episode_length': np.mean([ep['steps'] for ep in test_results['episodes']]),
        'avg_total_trades': np.mean([ep['total_trades'] for ep in test_results['episodes']]),
        'avg_price_volatility': np.mean([ep['price_volatility'] for ep in test_results['episodes']]),
        'agent_avg_rewards': {
            agent_id: np.mean(rewards) 
            for agent_id, rewards in test_results['agent_performance'].items()
        },
        'agent_avg_pnl': {
            agent_id: np.mean([ep['agent_final_pnl'][agent_id] for ep in test_results['episodes']])
            for agent_id in test_results['agent_performance'].keys()
        }
    }
    
    print(f"\n📈 Test Summary:")
    print(f"  Average episode length: {test_results['summary']['avg_episode_length']:.1f}")
    print(f"  Average trades per episode: {test_results['summary']['avg_total_trades']:.1f}")
    print(f"  Average price volatility: {test_results['summary']['avg_price_volatility']:.4f}")
    print(f"  Agent average rewards: {test_results['summary']['agent_avg_rewards']}")
    print(f"  Agent average PnL: {test_results['summary']['agent_avg_pnl']}")
    
    return test_results

def plot_multi_agent_results(training_results, episode_rewards, config_name):
    """Plot training results for multi-agent system"""
    
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))
    fig.suptitle(f'Multi-Agent Training Results - {config_name}', fontsize=16)
    
    # Extract data
    iterations = [r['iteration'] for r in training_results]
    rewards = [r['episode_reward_mean'] for r in training_results]
    lengths = [r['episode_len_mean'] for r in training_results]
    
    # Plot 1: Overall reward progression
    axes[0, 0].plot(iterations, rewards, 'b-', linewidth=2)
    axes[0, 0].set_title('Average Episode Reward')
    axes[0, 0].set_xlabel('Iteration')
    axes[0, 0].set_ylabel('Reward')
    axes[0, 0].grid(True, alpha=0.3)
    
    # Plot 2: Episode length progression
    axes[0, 1].plot(iterations, lengths, 'g-', linewidth=2)
    axes[0, 1].set_title('Average Episode Length')
    axes[0, 1].set_xlabel('Iteration')
    axes[0, 1].set_ylabel('Steps')
    axes[0, 1].grid(True, alpha=0.3)
    
    # Plot 3: Individual agent rewards (if available)
    if any(episode_rewards.values()):
        for agent_id, agent_rewards in episode_rewards.items():
            if agent_rewards:
                axes[1, 0].plot(agent_rewards, label=agent_id, linewidth=2)
        axes[1, 0].set_title('Individual Agent Rewards')
        axes[1, 0].set_xlabel('Episode')
        axes[1, 0].set_ylabel('Reward')
        axes[1, 0].legend()
        axes[1, 0].grid(True, alpha=0.3)
    else:
        axes[1, 0].text(0.5, 0.5, 'Individual agent\nrewards not available', 
                       ha='center', va='center', transform=axes[1, 0].transAxes)
    
    # Plot 4: Reward distribution
    if rewards:
        axes[1, 1].hist(rewards, bins=20, alpha=0.7, color='purple')
        axes[1, 1].set_title('Reward Distribution')
        axes[1, 1].set_xlabel('Reward')
        axes[1, 1].set_ylabel('Frequency')
        axes[1, 1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    
    # Save plot
    plot_file = f"multi_agent_results/training_plot_{config_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    plt.savefig(plot_file, dpi=300, bbox_inches='tight')
    print(f"📊 Training plot saved: {plot_file}")
    
    plt.show()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Train multi-agent trading system')
    parser.add_argument('--config', type=str, default='multi_agent', 
                       choices=['multi_agent', 'competitive', 'diverse'],
                       help='Configuration to use')
    parser.add_argument('--iterations', type=int, default=100,
                       help='Number of training iterations')
    parser.add_argument('--checkpoint-freq', type=int, default=25,
                       help='Checkpoint frequency')
    
    args = parser.parse_args()
    
    try:
        algo, results = train_multi_agent_system(
            config_name=args.config,
            num_iterations=args.iterations,
            checkpoint_freq=args.checkpoint_freq
        )
        print("🎉 Multi-agent training completed successfully!")
        
    except KeyboardInterrupt:
        print("\n⏹️ Training interrupted by user")
    except Exception as e:
        print(f"❌ Training failed: {e}")
        raise
    finally:
        if ray.is_initialized():
            ray.shutdown() 