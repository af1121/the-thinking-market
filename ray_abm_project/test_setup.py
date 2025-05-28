#!/usr/bin/env python3
"""
Test script to verify Ray ABM project setup
"""

import sys
import os
import traceback

def test_imports():
    """Test if all required packages can be imported"""
    print("🔍 Testing imports...")
    
    try:
        import ray
        print("✅ Ray imported successfully")
    except ImportError as e:
        print(f"❌ Ray import failed: {e}")
        return False
    
    try:
        import gym
        print("✅ Gym imported successfully")
    except ImportError as e:
        print(f"❌ Gym import failed: {e}")
        return False
    
    try:
        import torch
        print("✅ PyTorch imported successfully")
    except ImportError as e:
        print(f"❌ PyTorch import failed: {e}")
        return False
    
    try:
        import numpy as np
        print("✅ NumPy imported successfully")
    except ImportError as e:
        print(f"❌ NumPy import failed: {e}")
        return False
    
    try:
        from fastapi import FastAPI
        print("✅ FastAPI imported successfully")
    except ImportError as e:
        print(f"❌ FastAPI import failed: {e}")
        return False
    
    return True

def test_market_env():
    """Test MarketEnv functionality"""
    print("\n🏪 Testing MarketEnv...")
    
    try:
        from env.MarketEnv import MarketEnv
        print("✅ MarketEnv imported successfully")
        
        # Create environment
        env = MarketEnv()
        print("✅ MarketEnv created successfully")
        
        # Test reset
        obs = env.reset()
        print(f"✅ Environment reset, observation shape: {obs.shape}")
        
        # Test step
        action = env.action_space.sample()
        obs, reward, done, info = env.step(action)
        print(f"✅ Environment step executed, reward: {reward:.4f}")
        
        # Test stress injection
        env.inject_market_stress("flash_crash", 0.1)
        print("✅ Stress event injection successful")
        
        return True
        
    except Exception as e:
        print(f"❌ MarketEnv test failed: {e}")
        traceback.print_exc()
        return False

def test_ray_initialization():
    """Test Ray initialization"""
    print("\n🚀 Testing Ray initialization...")
    
    try:
        import ray
        
        # Initialize Ray
        if not ray.is_initialized():
            ray.init(ignore_reinit_error=True)
        
        print("✅ Ray initialized successfully")
        
        # Test basic Ray functionality
        @ray.remote
        def test_function(x):
            return x * 2
        
        result = ray.get(test_function.remote(5))
        assert result == 10
        print("✅ Ray remote function test passed")
        
        return True
        
    except Exception as e:
        print(f"❌ Ray test failed: {e}")
        traceback.print_exc()
        return False

def test_rllib_import():
    """Test RLlib import and basic functionality"""
    print("\n🤖 Testing RLlib...")
    
    try:
        from ray.rllib.algorithms.ppo import PPOConfig
        from ray.rllib.algorithms.dqn import DQNConfig
        print("✅ RLlib algorithms imported successfully")
        
        # Test config creation
        config = PPOConfig()
        print("✅ PPO config created successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ RLlib test failed: {e}")
        traceback.print_exc()
        return False

def test_training_setup():
    """Test training module setup"""
    print("\n🎯 Testing training setup...")
    
    try:
        from training.train_agents import RLTrainer
        print("✅ RLTrainer imported successfully")
        
        # Create trainer (don't actually train)
        trainer = RLTrainer(
            algorithm="PPO",
            num_workers=1,
            training_iterations=1
        )
        print("✅ RLTrainer created successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Training setup test failed: {e}")
        traceback.print_exc()
        return False

def test_api_setup():
    """Test API setup"""
    print("\n🌐 Testing API setup...")
    
    try:
        from api.main import app
        print("✅ FastAPI app imported successfully")
        
        # Test that app is properly configured
        assert app.title == "Ray ABM Trading Simulation API"
        print("✅ FastAPI app configuration verified")
        
        return True
        
    except Exception as e:
        print(f"❌ API setup test failed: {e}")
        traceback.print_exc()
        return False

def run_integration_test():
    """Run a simple integration test"""
    print("\n🔗 Running integration test...")
    
    try:
        # Import everything
        from env.MarketEnv import MarketEnv
        from training.train_agents import RLTrainer
        import ray
        
        # Initialize Ray
        if not ray.is_initialized():
            ray.init(ignore_reinit_error=True)
        
        # Create environment
        env = MarketEnv()
        obs = env.reset()
        
        # Run a few steps
        total_reward = 0
        for i in range(10):
            action = env.action_space.sample()
            obs, reward, done, info = env.step(action)
            total_reward += reward
            if done:
                break
        
        print(f"✅ Integration test completed, total reward: {total_reward:.4f}")
        print(f"   Final PnL: {info['pnl']:.2f}")
        
        return True
        
    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("🧪 Ray ABM Project Setup Test")
    print("=" * 50)
    
    tests = [
        ("Package Imports", test_imports),
        ("MarketEnv", test_market_env),
        ("Ray Initialization", test_ray_initialization),
        ("RLlib", test_rllib_import),
        ("Training Setup", test_training_setup),
        ("API Setup", test_api_setup),
        ("Integration Test", run_integration_test)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        if test_func():
            passed += 1
            print(f"✅ {test_name} PASSED")
        else:
            print(f"❌ {test_name} FAILED")
    
    print(f"\n{'='*50}")
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your Ray ABM setup is ready!")
        print("\n🚀 Next steps:")
        print("1. Start the API server: cd api && python main.py")
        print("2. Train an RL agent: cd training && python train_agents.py")
        print("3. Integrate with your React frontend")
    else:
        print("⚠️  Some tests failed. Please check the error messages above.")
        print("💡 Make sure you've installed all dependencies: pip install -r requirements.txt")
    
    # Cleanup
    try:
        import ray
        if ray.is_initialized():
            ray.shutdown()
    except:
        pass

if __name__ == "__main__":
    main() 