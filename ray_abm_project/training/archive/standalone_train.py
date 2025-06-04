#!/usr/bin/env python3
"""
Standalone RL training script with embedded MarketEnv
"""

import ray
from ray.rllib.algorithms.ppo import PPOConfig
from ray.tune.registry import register_env
import gym
from gym import spaces
import numpy as np
import random
from datetime import datetime
import os

class MarketEnv(gym.Env):
    """
    Simplified Market Environment for RL training
    """
    
    def __init__(self, config=None):
        super(MarketEnv, self).__init__()
        
        # Default configuration
        self.config = config or {}
        self.max_steps = self.config.get('max_steps', 500)
        self.initial_price = self.config.get('initial_price', 100.0)
        self.fundamental_value = self.config.get('fundamental_value', 100.0)
        self.tick_size = self.config.get('tick_size', 0.01)
        self.max_inventory = self.config.get('max_inventory', 50)
        self.initial_cash = self.config.get('initial_cash', 10000.0)
        
        # Action space: 0=HOLD, 1=BUY, 2=SELL
        self.action_space = spaces.Discrete(3)
        
        # Observation space: [price, inventory, cash, pnl, volatility, trend, time_remaining]
        self.observation_space = spaces.Box(
            low=np.array([0, -self.max_inventory, 0, -np.inf, 0, -1, 0]),
            high=np.array([np.inf, self.max_inventory, np.inf, np.inf, np.inf, 1, 1]),
            dtype=np.float32
        )
        
        self.reset()
    
    def reset(self):
        """Reset environment to initial state"""
        self.current_step = 0
        self.price = self.initial_price
        self.inventory = 0
        self.cash = self.initial_cash
        self.initial_portfolio_value = self.cash
        self.price_history = [self.price]
        self.last_action = 0
        
        return self._get_observation()
    
    def step(self, action):
        """Execute one step in the environment"""
        self.current_step += 1
        
        # Update price with random walk + mean reversion
        price_change = np.random.normal(0, 0.5)  # Random component
        mean_reversion = 0.01 * (self.fundamental_value - self.price)  # Mean reversion
        self.price = max(0.01, self.price + price_change + mean_reversion)
        self.price_history.append(self.price)
        
        # Execute action
        reward = 0
        trade_executed = False
        
        if action == 1 and self.inventory < self.max_inventory:  # BUY
            if self.cash >= self.price:
                self.cash -= self.price
                self.inventory += 1
                trade_executed = True
                reward += 0.1  # Small reward for trading
        
        elif action == 2 and self.inventory > -self.max_inventory:  # SELL
            self.cash += self.price
            self.inventory -= 1
            trade_executed = True
            reward += 0.1  # Small reward for trading
        
        # Calculate PnL and reward
        portfolio_value = self.cash + self.inventory * self.price
        pnl = portfolio_value - self.initial_portfolio_value
        
        # Reward based on PnL change
        if hasattr(self, 'last_pnl'):
            pnl_change = pnl - self.last_pnl
            reward += pnl_change * 0.01  # Scale reward
        
        self.last_pnl = pnl
        
        # Penalty for large inventory
        inventory_penalty = abs(self.inventory) * 0.01
        reward -= inventory_penalty
        
        # Check if episode is done
        done = (self.current_step >= self.max_steps) or (self.cash < 0)
        
        # Additional info
        info = {
            'pnl': pnl,
            'inventory': self.inventory,
            'cash': self.cash,
            'price': self.price,
            'portfolio_value': portfolio_value,
            'trade_executed': trade_executed
        }
        
        return self._get_observation(), reward, done, info
    
    def _get_observation(self):
        """Get current observation"""
        # Calculate volatility (last 10 prices)
        if len(self.price_history) >= 10:
            recent_prices = self.price_history[-10:]
            volatility = np.std(recent_prices)
        else:
            volatility = 0.0
        
        # Calculate trend (price change over last 5 steps)
        if len(self.price_history) >= 5:
            trend = (self.price_history[-1] - self.price_history[-5]) / self.price_history[-5]
        else:
            trend = 0.0
        
        # Time remaining (normalized)
        time_remaining = (self.max_steps - self.current_step) / self.max_steps
        
        # Portfolio value
        portfolio_value = self.cash + self.inventory * self.price
        pnl = portfolio_value - self.initial_portfolio_value
        
        obs = np.array([
            self.price / 100.0,  # Normalized price
            self.inventory / self.max_inventory,  # Normalized inventory
            self.cash / self.initial_cash,  # Normalized cash
            pnl / self.initial_cash,  # Normalized PnL
            volatility,
            np.clip(trend, -1, 1),  # Clipped trend
            time_remaining
        ], dtype=np.float32)
        
        return obs

def env_creator(env_config):
    """Create MarketEnv instance"""
    return MarketEnv(config=env_config)

def main():
    """Main training function"""
    print("🚀 Starting standalone RL training...")
    
    # Initialize Ray
    if not ray.is_initialized():
        ray.init(ignore_reinit_error=True)
    
    # Register environment
    register_env("MarketEnv", env_creator)
    
    # Environment configuration
    env_config = {
        'max_steps': 500,
        'initial_price': 100.0,
        'fundamental_value': 100.0,
        'tick_size': 0.01,
        'max_inventory': 50,
        'initial_cash': 10000.0
    }
    
    # Create PPO configuration with single worker (no distributed training)
    config = (PPOConfig()
             .environment("MarketEnv", env_config=env_config)
             .framework("torch")
             .api_stack(enable_rl_module_and_learner=False, enable_env_runner_and_connector_v2=False)
             .rollouts(num_rollout_workers=0)  # No remote workers
             .training(
                 train_batch_size=1000,
                 sgd_minibatch_size=64,
                 num_sgd_iter=5,
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
             .resources(num_gpus=0)
             .debugging(log_level="INFO"))
    
    # Build algorithm
    print("🔧 Building PPO algorithm...")
    algo = config.build()
    
    # Training loop
    print("🎯 Starting training loop...")
    num_iterations = 30
    
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
            
            # Save checkpoint every 10 iterations
            if (i + 1) % 10 == 0:
                checkpoint_dir = f"checkpoints/standalone_ppo_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                os.makedirs(checkpoint_dir, exist_ok=True)
                checkpoint_path = algo.save(checkpoint_dir)
                print(f"💾 Checkpoint saved: {checkpoint_path}")
        
        # Save final model
        final_checkpoint_dir = f"checkpoints/standalone_ppo_final_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
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
        print(f"   Final inventory: {info.get('inventory', 0)}")
        
        return final_checkpoint
        
    except KeyboardInterrupt:
        print("\n⏹️  Training interrupted by user")
        checkpoint_dir = f"checkpoints/standalone_ppo_interrupted_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
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