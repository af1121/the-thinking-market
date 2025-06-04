#!/usr/bin/env python3
"""
Test script for RL Agent Service
"""

import sys
import os

# Add the training directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'training'))

try:
    from rl_agent_service import RLAgentService
    
    print("🧪 Testing RL Agent Service...")
    service = RLAgentService()
    
    print(f"✅ Loaded {len(service.agents)} RL agents successfully!")
    
    for name, agent in service.agents.items():
        reward = agent['info']['best_reward']
        strategy = agent['info']['strategy']
        print(f"  🤖 {name}: {reward:.2f} reward, strategy: {strategy}")
    
    print("\n🎉 RL Agent Service test completed successfully!")
    print("Ready to integrate with frontend simulation!")
    
except Exception as e:
    print(f"❌ Test failed: {e}")
    sys.exit(1) 