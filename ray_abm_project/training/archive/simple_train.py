#!/usr/bin/env python3
"""
Simplified RL training script for Ray ABM
"""

import ray
from ray.rllib.algorithms.ppo import PPOConfig
from ray.tune.registry import register_env
import os
import sys
import numpy as np
from datetime import datetime

# Add the parent directory to the path to import MarketEnv
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from env.MarketEnv import MarketEnv

def env_creator(env_config):
    """Create MarketEnv instance"""
    return MarketEnv(config=env_config)

def main():
    """Main training function"""
    print("🚀 Starting simplified RL training...")
    
    # Initialize Ray
    if not ray.is_initialized():
        ray.init(ignore_reinit_error=True)
    
    # Register environment
    register_env("MarketEnv", env_creator)
    
    # Environment configuration
    env_config = {
        'max_steps': 500,  # Shorter episodes for faster training
        'initial_price': 100.0,
        'fundamental_value': 100.0,
        'tick_size': 0.01,
        'max_inventory': 50,
        'initial_cash': 10000.0
    }
    
    # Create simple PPO configuration
    config = (PPOConfig()
             .environment("MarketEnv", env_config=env_config)
             .framework("torch")
             .training(
                 train_batch_size=2000,
                 lr=3e-4,
                 gamma=0.99,
                 lambda_=0.95,
                 clip_param=0.2,
                 entropy_coeff=0.01,
                 vf_loss_coeff=0.5,
                 model={
                     "fcnet_hiddens": [128, 128],
                     "fcnet_activation": "relu",
                 }
             )
             .resources(num_gpus=0)  # Use CPU only
             .debugging(log_level="INFO"))
    
    # Build algorithm
    print("🔧 Building PPO algorithm...")
    algo = config.build()
    
    # Training loop
    print("🎯 Starting training loop...")
    num_iterations = 20  # Start with fewer iterations
    
    try:
        for i in range(num_iterations):
            print(f"\n📊 Training iteration {i+1}/{num_iterations}")
            
            # Train for one iteration
            result = algo.train()
            
            # Print progress
            episode_reward_mean = result.get("episode_reward_mean", 0)
            episode_len_mean = result.get("episode_len_mean", 0)
            timesteps_total = result.get("timesteps_total", 0)
            
            print(f"   Mean Reward: {episode_reward_mean:.3f}")
            print(f"   Mean Episode Length: {episode_len_mean:.1f}")
            print(f"   Total Timesteps: {timesteps_total}")
            
            # Save checkpoint every 5 iterations
            if (i + 1) % 5 == 0:
                checkpoint_dir = f"checkpoints/simple_ppo_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                os.makedirs(checkpoint_dir, exist_ok=True)
                checkpoint_path = algo.save(checkpoint_dir)
                print(f"💾 Checkpoint saved: {checkpoint_path}")
        
        # Save final model
        final_checkpoint_dir = f"checkpoints/simple_ppo_final_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        os.makedirs(final_checkpoint_dir, exist_ok=True)
        final_checkpoint = algo.save(final_checkpoint_dir)
        print(f"\n🎉 Training completed! Final model saved: {final_checkpoint}")
        
        # Quick evaluation
        print("\n🧪 Running quick evaluation...")
        env = MarketEnv(config=env_config)
        obs = env.reset()
        total_reward = 0
        
        for step in range(100):
            action = algo.compute_single_action(obs, explore=False)
            obs, reward, done, info = env.step(action)
            total_reward += reward
            if done:
                break
        
        print(f"   Evaluation reward: {total_reward:.3f}")
        print(f"   Final PnL: {info.get('pnl', 0):.2f}")
        
        return final_checkpoint
        
    except KeyboardInterrupt:
        print("\n⏹️  Training interrupted by user")
        checkpoint_dir = f"checkpoints/simple_ppo_interrupted_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        os.makedirs(checkpoint_dir, exist_ok=True)
        checkpoint_path = algo.save(checkpoint_dir)
        print(f"💾 Model saved: {checkpoint_path}")
        return checkpoint_path
        
    finally:
        algo.stop()
        print("🔄 Algorithm stopped")

if __name__ == "__main__":
    checkpoint = main()
    print(f"\n✅ Training session complete!")
    print(f"📁 Model checkpoint: {checkpoint}")
    print(f"🎯 You can now load this model in the React frontend!") 