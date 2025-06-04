#!/usr/bin/env python3
"""
Unified RL training script for market agents
Usage: python train.py [--config quick|standard|advanced] [--model small|standard|large]
"""

import argparse
import ray
from ray.rllib.algorithms.ppo import PPOConfig
from ray.tune.registry import register_env
import os
import sys
from datetime import datetime

# Add parent directories to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from env.MarketEnv import MarketEnv
from training.configs.training_config import ENV_CONFIGS, PPO_CONFIGS, MODEL_CONFIGS

def env_creator(env_config):
    """Create MarketEnv instance"""
    return MarketEnv(config=env_config)

def train_agent(config_name='standard', model_name='standard', save_name=None):
    """
    Train an RL agent with specified configuration
    
    Args:
        config_name: 'quick', 'standard', or 'advanced'
        model_name: 'small', 'standard', or 'large'
        save_name: Custom name for saved model
    """
    print(f"🚀 Starting RL training with {config_name} config and {model_name} model...")
    
    # Initialize Ray
    if not ray.is_initialized():
        ray.init(ignore_reinit_error=True)
    
    # Register environment
    register_env("MarketEnv", env_creator)
    
    # Get configurations
    env_config = ENV_CONFIGS[config_name]
    ppo_config = PPO_CONFIGS[config_name]
    model_config = MODEL_CONFIGS[model_name]
    
    print(f"📊 Environment: {env_config['max_steps']} steps, ${env_config['initial_cash']} cash")
    print(f"🧠 Model: {model_config['fcnet_hiddens']} hidden layers")
    print(f"⚙️  Training: {ppo_config['iterations']} iterations, batch size {ppo_config['train_batch_size']}")
    
    # Create PPO configuration
    config = (PPOConfig()
             .environment("MarketEnv", env_config=env_config)
             .framework("torch")
             .api_stack(
                 enable_rl_module_and_learner=False,
                 enable_env_runner_and_connector_v2=False
             )
             .env_runners(num_env_runners=0)
             .training(
                 train_batch_size=ppo_config['train_batch_size'],
                 minibatch_size=ppo_config['minibatch_size'],
                 num_epochs=ppo_config['num_epochs'],
                 lr=ppo_config['lr'],
                 gamma=ppo_config['gamma'],
                 lambda_=ppo_config['lambda_'],
                 clip_param=ppo_config['clip_param'],
                 entropy_coeff=ppo_config['entropy_coeff'],
                 vf_loss_coeff=ppo_config['vf_loss_coeff'],
                 model=model_config
             )
             .evaluation(evaluation_interval=None))
    
    # Build algorithm
    algo = config.build()
    
    # Training loop
    best_reward = float('-inf')
    print(f"\n📈 Training Progress:")
    print("-" * 50)
    
    for i in range(ppo_config['iterations']):
        result = algo.train()
        
        # Fix reward extraction - use nested dictionary access
        episode_reward_mean = result.get('env_runners', {}).get('episode_reward_mean', 0)
        episode_len_mean = result.get('env_runners', {}).get('episode_len_mean', 0)
        
        print(f"Iter {i+1:3d}: Reward={episode_reward_mean:7.2f}, Length={episode_len_mean:6.1f}")
        
        if episode_reward_mean > best_reward:
            best_reward = episode_reward_mean
    
    # Save checkpoint
    checkpoint_dir = "../checkpoints"
    os.makedirs(checkpoint_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    if save_name:
        checkpoint_name = f"{save_name}_{timestamp}"
    else:
        checkpoint_name = f"ppo_{config_name}_{model_name}_{timestamp}"
    
    checkpoint_path = os.path.join(checkpoint_dir, checkpoint_name)
    saved_checkpoint = algo.save(checkpoint_path)
    
    print(f"\n✅ Training completed!")
    print(f"📁 Model saved: {saved_checkpoint.checkpoint.path}")
    print(f"🎯 Best reward: {best_reward:.2f}")
    
    # Test the model
    print(f"\n🧪 Testing trained model...")
    env = MarketEnv(config=env_config)
    obs, _ = env.reset()
    
    total_reward = 0
    for step in range(min(10, env_config['max_steps'])):
        action = algo.compute_single_action(obs, explore=False)
        obs, reward, terminated, truncated, info = env.step(action)
        total_reward += reward
        
        action_names = ['BUY', 'SELL', 'HOLD']
        print(f"  Step {step+1}: {action_names[action]}, Reward={reward:6.3f}, Price=${info['price']:6.2f}, PnL=${info['pnl']:7.2f}")
        
        if terminated or truncated:
            break
    
    print(f"🎯 Test total reward: {total_reward:.2f}")
    
    algo.stop()
    ray.shutdown()
    
    return saved_checkpoint.checkpoint.path

def main():
    parser = argparse.ArgumentParser(description='Train RL trading agent')
    parser.add_argument('--config', choices=['quick', 'standard', 'advanced'], 
                       default='standard', help='Training configuration')
    parser.add_argument('--model', choices=['small', 'standard', 'large'], 
                       default='standard', help='Model architecture')
    parser.add_argument('--name', type=str, help='Custom name for saved model')
    
    args = parser.parse_args()
    
    checkpoint_path = train_agent(args.config, args.model, args.name)
    print(f"\n🎉 Training complete! Use this model in your frontend:")
    print(f"   Model path: {os.path.basename(checkpoint_path)}")

if __name__ == "__main__":
    main() 