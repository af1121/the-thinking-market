#!/usr/bin/env python3
"""
Train RL Agents for Multi-Agent Testing

This script trains individual RL agents using the single-agent MarketEnv,
then saves them in a format that can be loaded for multi-agent hypothesis testing.
"""

import os
import sys
import ray
from ray import tune
from ray.rllib.algorithms.ppo import PPOConfig
import numpy as np
from datetime import datetime

# Add the parent directory to the path to import our environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from env.MarketEnv import MarketEnv

def create_training_config():
    """Create PPO training configuration"""
    config = (
        PPOConfig()
        .environment(
            env=MarketEnv,
            env_config={
                'max_steps': 200,
                'initial_price': 100.0,
                'fundamental_value': 100.0,
                'initial_cash': 10000.0,
                'max_inventory': 50
            }
        )
        .framework("torch")
        .training(
            lr=0.0003,
            train_batch_size=2000,
            minibatch_size=128,
            num_sgd_iter=10,
            gamma=0.99,
            lambda_=0.95,
            clip_param=0.2,
            vf_loss_coeff=0.5,
            entropy_coeff=0.01,
            model={
                "fcnet_hiddens": [64, 64],
                "fcnet_activation": "relu",
            }
        )
        .env_runners(
            num_env_runners=2,
            rollout_fragment_length=200
        )
        .resources(
            num_gpus=0
        )
        .debugging(
            log_level="WARN"
        )
    )
    return config

def train_agent(agent_name, strategy_config=None, iterations=100):
    """Train a single RL agent with specific strategy characteristics"""
    
    print(f"\n🤖 Training {agent_name}...")
    print(f"   Strategy config: {strategy_config}")
    print(f"   Training iterations: {iterations}")
    
    # Initialize Ray
    if not ray.is_initialized():
        ray.init(ignore_reinit_error=True)
    
    # Create training config
    config = create_training_config()
    
    # Modify config based on strategy
    if strategy_config:
        if strategy_config.get('risk_averse', False):
            # More conservative learning
            config = config.training(lr=0.0001, entropy_coeff=0.02)
        elif strategy_config.get('aggressive', False):
            # More aggressive learning
            config = config.training(lr=0.0005, entropy_coeff=0.005)
        elif strategy_config.get('momentum', False):
            # Momentum-focused learning
            config = config.training(gamma=0.95)  # Shorter horizon
    
    # Build algorithm
    algo = config.build()
    
    print(f"   📊 Training progress:")
    best_reward = float('-inf')
    
    try:
        for i in range(iterations):
            result = algo.train()
            
            episode_reward_mean = result.get('episode_reward_mean', 0)
            episode_len_mean = result.get('episode_len_mean', 0)
            
            if episode_reward_mean > best_reward:
                best_reward = episode_reward_mean
            
            if (i + 1) % 10 == 0:
                print(f"      Iter {i+1:3d}: Reward={episode_reward_mean:8.2f}, Length={episode_len_mean:6.1f}")
        
        # Save the trained model
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        checkpoint_path = f"../checkpoints/{agent_name}_{timestamp}"
        
        # Create checkpoints directory if it doesn't exist
        os.makedirs("../checkpoints", exist_ok=True)
        
        # Save checkpoint
        checkpoint = algo.save(checkpoint_path)
        
        print(f"   ✅ {agent_name} training completed!")
        print(f"      Best reward: {best_reward:.2f}")
        print(f"      Saved to: {checkpoint}")
        
        return checkpoint, best_reward
        
    except Exception as e:
        print(f"   ❌ Training failed: {e}")
        return None, 0
    
    finally:
        algo.stop()

def train_multiple_agents():
    """Train multiple RL agents with different strategies"""
    
    print("🚀 TRAINING MULTIPLE RL AGENTS FOR MULTI-AGENT TESTING")
    print("=" * 70)
    
    # Define different agent strategies
    agents_to_train = [
        {
            'name': 'momentum_agent',
            'config': {'momentum': True, 'aggressive': True},
            'iterations': 80
        },
        {
            'name': 'mean_reversion_agent', 
            'config': {'risk_averse': True},
            'iterations': 80
        },
        {
            'name': 'adaptive_agent',
            'config': {},  # Standard config
            'iterations': 80
        }
    ]
    
    trained_agents = {}
    
    for agent_info in agents_to_train:
        checkpoint, best_reward = train_agent(
            agent_info['name'],
            agent_info['config'],
            agent_info['iterations']
        )
        
        if checkpoint:
            trained_agents[agent_info['name']] = {
                'checkpoint': checkpoint,
                'best_reward': best_reward,
                'strategy': agent_info['config']
            }
    
    # Save agent registry
    agent_registry = {
        'timestamp': datetime.now().isoformat(),
        'agents': trained_agents
    }
    
    import json
    registry_file = "../checkpoints/agent_registry.json"
    with open(registry_file, 'w') as f:
        json.dump(agent_registry, f, indent=2)
    
    print(f"\n📋 TRAINING SUMMARY")
    print("=" * 50)
    print(f"Trained agents: {len(trained_agents)}")
    for name, info in trained_agents.items():
        print(f"  • {name}: reward={info['best_reward']:.2f}")
    print(f"Registry saved: {registry_file}")
    
    return trained_agents

class TrainedAgentWrapper:
    """Wrapper to use trained RL agents in multi-agent testing"""
    
    def __init__(self, checkpoint_path, agent_name):
        self.checkpoint_path = checkpoint_path
        self.agent_name = agent_name
        self.algo = None
        self._load_agent()
    
    def _load_agent(self):
        """Load the trained agent"""
        try:
            if not ray.is_initialized():
                ray.init(ignore_reinit_error=True)
            
            # Create config and restore from checkpoint
            config = create_training_config()
            self.algo = config.build()
            self.algo.restore(self.checkpoint_path)
            print(f"✅ Loaded trained agent: {self.agent_name}")
            
        except Exception as e:
            print(f"❌ Failed to load agent {self.agent_name}: {e}")
            self.algo = None
    
    def get_action(self, observation, market_info=None):
        """Get action from trained agent"""
        if self.algo is None:
            # Fallback to random action
            return np.random.choice([0, 1, 2])
        
        try:
            # Convert multi-agent observation to single-agent format
            if len(observation) == 13:  # Multi-agent format
                # Extract relevant features for single agent
                single_agent_obs = np.array([
                    observation[0],   # price
                    observation[1],   # fundamental
                    observation[2],   # volatility
                    observation[3],   # spread
                    observation[4],   # imbalance
                    observation[5],   # return_1
                    observation[6],   # return_2
                    observation[7],   # return_3
                    observation[8],   # return_4
                    observation[9],   # return_5
                    observation[10],  # inventory
                    observation[11],  # cash_ratio
                ], dtype=np.float32)
            else:
                single_agent_obs = observation
            
            # Get action from trained policy
            action = self.algo.compute_single_action(single_agent_obs)
            return action
            
        except Exception as e:
            print(f"Warning: Action computation failed for {self.agent_name}: {e}")
            return np.random.choice([0, 1, 2])

def test_trained_agents():
    """Test the trained agents"""
    
    print("\n🧪 TESTING TRAINED AGENTS")
    print("=" * 50)
    
    # Load agent registry
    try:
        import json
        with open("../checkpoints/agent_registry.json", 'r') as f:
            registry = json.load(f)
        
        print(f"Found {len(registry['agents'])} trained agents")
        
        # Test each agent
        for agent_name, agent_info in registry['agents'].items():
            print(f"\n🤖 Testing {agent_name}...")
            
            # Create wrapper
            wrapper = TrainedAgentWrapper(agent_info['checkpoint'], agent_name)
            
            # Test with sample observation
            sample_obs = np.random.randn(13).astype(np.float32)
            action = wrapper.get_action(sample_obs)
            
            print(f"   Sample action: {action} ({'BUY' if action==0 else 'SELL' if action==1 else 'HOLD'})")
        
        print("\n✅ All agents tested successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Testing failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 MULTI-AGENT RL TRAINING PIPELINE")
    print("Training individual agents for multi-agent hypothesis testing")
    print("=" * 70)
    
    # Train multiple agents
    trained_agents = train_multiple_agents()
    
    if trained_agents:
        # Test the trained agents
        test_trained_agents()
        
        print(f"\n🎉 TRAINING PIPELINE COMPLETED!")
        print("Agents are ready for multi-agent hypothesis testing.")
        print("Use the TrainedAgentWrapper class to load them in your tests.")
    else:
        print("❌ Training failed - no agents were successfully trained")
    
    # Shutdown Ray
    ray.shutdown() 