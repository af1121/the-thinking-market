#!/usr/bin/env python3

import ray
from ray.rllib.algorithms.ppo import PPOConfig
from ray.tune.registry import register_env
import sys
import os
import numpy as np
import matplotlib.pyplot as plt

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from env.MultiAgentMarketEnv import MultiAgentMarketEnv

def env_creator(env_config):
    return MultiAgentMarketEnv(env_config)

def local_multi_agent_train():
    """Local multi-agent training without distributed workers"""
    
    # Initialize Ray in local mode
    if not ray.is_initialized():
        ray.init(local_mode=True)  # Local mode avoids worker import issues
    
    # Register environment
    register_env("MultiAgentMarketEnv", env_creator)
    
    # Environment configuration
    env_config = {
        'max_steps': 200,
        'initial_price': 100.0,
        'fundamental_value': 100.0,
        'num_rl_agents': 3,
    }
    
    # Create a test environment to get spaces
    test_env = MultiAgentMarketEnv(env_config)
    obs_space = test_env.observation_space
    action_space = test_env.action_space
    
    print(f"🏛️ Environment: {env_config['num_rl_agents']} RL agents + traditional agents")
    print(f"📊 Observation space: {obs_space}")
    print(f"🎯 Action space: {action_space}")
    
    # Simple policy mapping - all agents use the same policy
    def policy_mapping_fn(agent_id, episode=None, worker=None, **kwargs):
        return "shared_policy"
    
    # Configure PPO with old API for compatibility
    config = (
        PPOConfig()
        .api_stack(
            enable_rl_module_and_learner=False,
            enable_env_runner_and_connector_v2=False
        )
        .environment(
            env="MultiAgentMarketEnv",
            env_config=env_config
        )
        .multi_agent(
            policies={
                "shared_policy": (None, obs_space, action_space, {})
            },
            policy_mapping_fn=policy_mapping_fn,
            policies_to_train=["shared_policy"]
        )
        .training(
            lr=3e-4,
            gamma=0.99,
            lambda_=0.95,
            clip_param=0.2,
            vf_clip_param=10.0,
            entropy_coeff=0.01,
            train_batch_size=1000,  # Smaller for local mode
            minibatch_size=64,
            num_epochs=5,
            model={
                "fcnet_hiddens": [64, 64],  # Smaller network
                "fcnet_activation": "relu",
                "vf_share_layers": False,
            }
        )
        .env_runners(
            num_env_runners=0,  # No remote workers
            rollout_fragment_length=50,
            batch_mode="complete_episodes",
            num_cpus_per_env_runner=1
        )
        .resources(
            num_gpus=0
        )
        .debugging(
            log_level="INFO"
        )
    )
    
    # Create algorithm
    print("🚀 Creating PPO algorithm...")
    algo = config.build()
    
    # Training loop
    print("📈 Starting training...")
    results = []
    
    for iteration in range(5):  # Fewer iterations for demo
        print(f"🔄 Training iteration {iteration + 1}/5...")
        
        try:
            result = algo.train()
            
            # Extract metrics
            reward = result.get('episode_reward_mean', 0)
            length = result.get('episode_len_mean', 0)
            
            results.append({
                'iteration': iteration + 1,
                'reward': reward,
                'length': length,
                'result': result
            })
            
            print(f"📊 Iteration {iteration + 1:2d}: Reward: {reward:8.3f}, Length: {length:6.1f}")
            
        except Exception as e:
            print(f"❌ Training iteration {iteration + 1} failed: {e}")
            continue
    
    print("🏁 Training completed!")
    
    # Test the trained agents
    print("\n🧪 Testing trained agents...")
    test_trained_agents(algo, env_config)
    
    # Save results
    save_results(results, "local_multi_agent")
    
    # Cleanup
    algo.stop()
    ray.shutdown()
    
    return results

def test_trained_agents(algo, env_config, num_episodes=3):
    """Test the trained multi-agent system"""
    
    env = MultiAgentMarketEnv(env_config)
    
    for episode in range(num_episodes):
        print(f"\n🎮 Episode {episode + 1}:")
        
        obs, _ = env.reset()
        done = False
        step = 0
        total_rewards = {agent_id: 0 for agent_id in obs.keys()}
        
        while not done and step < 30:  # Limit steps for demo
            actions = {}
            
            # Get actions from trained policy
            for agent_id in obs.keys():
                try:
                    action = algo.compute_single_action(obs[agent_id], policy_id="shared_policy")
                    actions[agent_id] = action
                except Exception as e:
                    # Fallback to random action
                    actions[agent_id] = env.action_space.sample()
            
            # Step environment
            obs, rewards, terminated, truncated, infos = env.step(actions)
            
            # Update totals
            for agent_id, reward in rewards.items():
                total_rewards[agent_id] += reward
            
            # Check if done
            done = any(terminated.values()) or any(truncated.values())
            step += 1
        
        print(f"  📊 Final rewards: {total_rewards}")
        print(f"  💰 Final price: ${env.current_price:.2f}")
        print(f"  📈 Total trades: {len(env.trades)}")

def save_results(results, name):
    """Save training results"""
    
    if not results:
        print("⚠️ No results to save")
        return
    
    # Extract data for plotting
    iterations = [r['iteration'] for r in results]
    rewards = [r['reward'] for r in results]
    lengths = [r['length'] for r in results]
    
    # Create plots
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
    
    # Reward plot
    ax1.plot(iterations, rewards, 'b-o', linewidth=2, markersize=6)
    ax1.set_xlabel('Iteration')
    ax1.set_ylabel('Episode Reward Mean')
    ax1.set_title('Multi-Agent Training Progress - Rewards')
    ax1.grid(True, alpha=0.3)
    
    # Episode length plot
    ax2.plot(iterations, lengths, 'r-s', linewidth=2, markersize=6)
    ax2.set_xlabel('Iteration')
    ax2.set_ylabel('Episode Length Mean')
    ax2.set_title('Multi-Agent Training Progress - Episode Length')
    ax2.grid(True, alpha=0.3)
    
    plt.tight_layout()
    
    # Save plot
    filename = f"{name}_training_results.png"
    plt.savefig(filename, dpi=300, bbox_inches='tight')
    print(f"📊 Results saved to {filename}")
    
    plt.close()

if __name__ == "__main__":
    print("🎯 Local Multi-Agent Training")
    print("=" * 50)
    
    results = local_multi_agent_train()
    
    print("\n✅ Training complete!")
    if results:
        final_reward = results[-1]['reward']
        print(f"🏆 Final average reward: {final_reward:.3f}") 