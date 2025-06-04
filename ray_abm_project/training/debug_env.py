#!/usr/bin/env python3
"""
Debug script to test MarketEnv behavior
"""

import sys
import os
import numpy as np

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from env.MarketEnv import MarketEnv

def test_environment():
    """Test the environment with manual actions"""
    print("🔍 Testing MarketEnv...")
    
    # Create environment
    env_config = {
        'max_steps': 10,
        'initial_price': 100.0,
        'fundamental_value': 100.0,
        'tick_size': 0.01,
        'max_inventory': 100,
        'initial_cash': 10000.0
    }
    
    env = MarketEnv(config=env_config)
    obs, info = env.reset()
    
    print(f"Initial state:")
    print(f"  Cash: ${env.cash:.2f}")
    print(f"  Inventory: {env.inventory}")
    print(f"  Price: ${env.current_price:.2f}")
    print(f"  Observation shape: {obs.shape}")
    print(f"  Observation: {obs}")
    
    # Test different actions
    actions = [0, 1, 2, 0, 1, 2]  # BUY, SELL, HOLD, BUY, SELL, HOLD
    action_names = ['BUY', 'SELL', 'HOLD']
    
    total_reward = 0
    for step, action in enumerate(actions):
        print(f"\nStep {step + 1}: Taking action {action_names[action]}")
        print(f"  Before: Cash=${env.cash:.2f}, Inventory={env.inventory}, Price=${env.current_price:.2f}")
        
        obs, reward, terminated, truncated, info = env.step(action)
        total_reward += reward
        
        print(f"  After:  Cash=${env.cash:.2f}, Inventory={env.inventory}, Price=${env.current_price:.2f}")
        print(f"  Reward: {reward:.4f}, Total: {total_reward:.4f}")
        print(f"  PnL: ${info['pnl']:.2f}")
        
        if terminated or truncated:
            print(f"  Episode ended: terminated={terminated}, truncated={truncated}")
            break
    
    print(f"\n📊 Final Results:")
    print(f"  Total Reward: {total_reward:.4f}")
    print(f"  Final PnL: ${env._calculate_pnl():.2f}")
    print(f"  Steps taken: {env.step_count}")

def test_reward_function():
    """Test the reward function specifically"""
    print("\n🎯 Testing Reward Function...")
    
    env_config = {
        'max_steps': 100,
        'initial_price': 100.0,
        'fundamental_value': 100.0,
        'tick_size': 0.01,
        'max_inventory': 100,
        'initial_cash': 10000.0
    }
    
    env = MarketEnv(config=env_config)
    obs, info = env.reset()
    
    # Force some price movement
    env.current_price = 100.0
    env.price_history = [99.0, 100.0]  # Price went up
    
    print(f"Price history: {env.price_history}")
    print(f"Current price: ${env.current_price:.2f}")
    
    # Test BUY action (should get positive reward if price went up)
    print(f"\nTesting BUY action:")
    print(f"  Before: Cash=${env.cash:.2f}, Inventory={env.inventory}")
    reward = env._execute_action(0)  # BUY
    print(f"  After:  Cash=${env.cash:.2f}, Inventory={env.inventory}")
    print(f"  Reward: {reward:.4f}")
    
    # Reset and test SELL action
    env.reset()
    env.inventory = 20  # Give some inventory to sell
    env.current_price = 99.0
    env.price_history = [100.0, 99.0]  # Price went down
    
    print(f"\nTesting SELL action:")
    print(f"  Before: Cash=${env.cash:.2f}, Inventory={env.inventory}")
    print(f"  Price history: {env.price_history}")
    reward = env._execute_action(1)  # SELL
    print(f"  After:  Cash=${env.cash:.2f}, Inventory={env.inventory}")
    print(f"  Reward: {reward:.4f}")

if __name__ == "__main__":
    test_environment()
    test_reward_function() 