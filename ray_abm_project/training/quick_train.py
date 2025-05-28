#!/usr/bin/env python3
"""
Quick training script to create a model compatible with current environment
"""

import ray
from ray.rllib.algorithms.ppo import PPOConfig
from ray.tune.registry import register_env
import gymnasium as gym
from gymnasium import spaces
import numpy as np
import random
from datetime import datetime
import os
import sys

# Add the parent directory to the path to import MarketEnv
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from env.MarketEnv import MarketEnv

def env_creator(env_config):
    """Create MarketEnv instance"""
    return MarketEnv(config=env_config)

def main():
    """Main training function"""
    print("🚀 Starting quick RL training for integration...")
    
    # Initialize Ray
    if not ray.is_initialized():
        ray.init(ignore_reinit_error=True)
    
    # Register environment
    register_env("MarketEnv", env_creator)
    
    # Environment configuration
    env_config = {
        'max_steps': 200,  # Shorter episodes for quick training
        'initial_price': 100.0,
        'fundamental_value': 100.0,
        'tick_size': 0.01,
        'max_inventory': 50,
        'initial_cash': 5000.0
    }
    
    # Create PPO configuration
    config = (PPOConfig()
             .environment("MarketEnv", env_config=env_config)
             .framework("torch")
             .env_runners(num_env_runners=0)  # No remote workers for simplicity
             .training(
                 train_batch_size=500,
                 minibatch_size=64,
                 num_sgd_iter=3,
                 lr=3e-4,
                 gamma=0.99,
                 lambda_=0.95,
                 clip_param=0.2,
                 entropy_coeff=0.01,
                 vf_loss_coeff=0.5,
                 model={
                     "fcnet_hiddens": [64, 64],
                     "fcnet_activation": "relu"
                 }
             )
             .evaluation(
                 evaluation_interval=None,  # No evaluation for quick training
             ))
    
    # Build algorithm
    algo = config.build()
    
    print("📊 Training for 10 iterations...")
    
    # Train for a few iterations
    for i in range(10):
        result = algo.train()
        print(f"Iteration {i+1}: Reward Mean = {result.get('env_runners/episode_reward_mean', 0):.2f}")
    
    # Save checkpoint
    checkpoint_dir = "checkpoints"
    os.makedirs(checkpoint_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    checkpoint_path = os.path.join(checkpoint_dir, f"quick_ppo_{timestamp}")
    
    saved_checkpoint = algo.save(checkpoint_path)
    print(f"✅ Model saved to: {saved_checkpoint}")
    
    # Test the model
    print("🧪 Testing the trained model...")
    env = MarketEnv(config=env_config)
    obs, _ = env.reset()
    
    for step in range(5):
        action = algo.compute_single_action(obs, explore=False)
        obs, reward, terminated, truncated, info = env.step(action)
        print(f"Step {step+1}: Action={action}, Reward={reward:.3f}, Price={info['price']:.2f}")
        
        if terminated or truncated:
            break
    
    algo.stop()
    ray.shutdown()
    
    return saved_checkpoint

if __name__ == "__main__":
    checkpoint_path = main()
    print(f"\n🎉 Quick training complete! Checkpoint: {checkpoint_path}") 