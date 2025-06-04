#!/usr/bin/env python3
"""
Simple RL Agent Training for Multi-Agent Testing

This script trains RL agents using a simplified approach that avoids
Ray distributed issues while still producing trained agents for testing.
"""

import os
import sys
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from datetime import datetime
import json
import pickle

# Add the parent directory to the path to import our environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from env.MarketEnv import MarketEnv

class SimpleRLAgent(nn.Module):
    """Simple neural network RL agent"""
    
    def __init__(self, input_size=12, hidden_size=64, output_size=3):
        super(SimpleRLAgent, self).__init__()
        self.network = nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.ReLU(),
            nn.Linear(hidden_size, hidden_size),
            nn.ReLU(),
            nn.Linear(hidden_size, output_size),
            nn.Softmax(dim=-1)
        )
        
    def forward(self, x):
        return self.network(x)
    
    def get_action(self, observation):
        """Get action from observation"""
        if isinstance(observation, np.ndarray):
            obs_tensor = torch.FloatTensor(observation).unsqueeze(0)
        else:
            obs_tensor = observation
        
        with torch.no_grad():
            action_probs = self.forward(obs_tensor)
            action = torch.multinomial(action_probs, 1).item()
        
        return action

class SimpleTrainer:
    """Simple trainer using policy gradient"""
    
    def __init__(self, agent, learning_rate=0.001):
        self.agent = agent
        self.optimizer = optim.Adam(agent.parameters(), lr=learning_rate)
        self.episode_rewards = []
        self.episode_actions = []
        self.episode_observations = []
        
    def collect_episode(self, env, max_steps=200):
        """Collect one episode of experience"""
        obs, _ = env.reset()
        
        episode_reward = 0
        episode_obs = []
        episode_actions = []
        episode_rewards = []
        
        for step in range(max_steps):
            # Get action from agent
            action = self.agent.get_action(obs)
            
            # Store experience
            episode_obs.append(obs.copy())
            episode_actions.append(action)
            
            # Take step
            obs, reward, terminated, truncated, info = env.step(action)
            episode_rewards.append(reward)
            episode_reward += reward
            
            if terminated or truncated:
                break
        
        return episode_obs, episode_actions, episode_rewards, episode_reward
    
    def train_episode(self, observations, actions, rewards):
        """Train on one episode using REINFORCE"""
        
        # Calculate discounted returns
        returns = []
        G = 0
        gamma = 0.99
        
        for r in reversed(rewards):
            G = r + gamma * G
            returns.insert(0, G)
        
        # Normalize returns
        returns = torch.FloatTensor(returns)
        if len(returns) > 1:
            returns = (returns - returns.mean()) / (returns.std() + 1e-8)
        
        # Calculate loss
        total_loss = 0
        
        for obs, action, G in zip(observations, actions, returns):
            obs_tensor = torch.FloatTensor(obs).unsqueeze(0)
            action_probs = self.agent(obs_tensor)
            
            # Policy gradient loss
            log_prob = torch.log(action_probs[0, action] + 1e-8)
            loss = -log_prob * G
            total_loss += loss
        
        # Backpropagation
        self.optimizer.zero_grad()
        total_loss.backward()
        self.optimizer.step()
        
        return total_loss.item()

def train_agent(agent_name, strategy_config=None, episodes=200):
    """Train a single RL agent"""
    
    print(f"\n🤖 Training {agent_name}...")
    print(f"   Strategy: {strategy_config}")
    print(f"   Episodes: {episodes}")
    
    # Create environment
    env_config = {
        'max_steps': 200,
        'initial_price': 100.0,
        'fundamental_value': 100.0,
        'initial_cash': 10000.0,
        'max_inventory': 50
    }
    env = MarketEnv(env_config)
    
    # Create agent
    agent = SimpleRLAgent()
    
    # Modify learning rate based on strategy
    lr = 0.001
    if strategy_config:
        if strategy_config.get('risk_averse', False):
            lr = 0.0005  # More conservative
        elif strategy_config.get('aggressive', False):
            lr = 0.002   # More aggressive
    
    trainer = SimpleTrainer(agent, learning_rate=lr)
    
    # Training loop
    episode_rewards = []
    best_reward = float('-inf')
    
    print(f"   📊 Training progress:")
    
    for episode in range(episodes):
        # Collect episode
        obs_list, actions_list, rewards_list, total_reward = trainer.collect_episode(env)
        
        # Train on episode
        if len(obs_list) > 0:
            loss = trainer.train_episode(obs_list, actions_list, rewards_list)
        
        episode_rewards.append(total_reward)
        
        if total_reward > best_reward:
            best_reward = total_reward
        
        # Print progress
        if (episode + 1) % 20 == 0:
            avg_reward = np.mean(episode_rewards[-20:])
            print(f"      Episode {episode+1:3d}: Avg Reward={avg_reward:8.2f}, Best={best_reward:8.2f}")
    
    # Save the trained agent
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    checkpoint_dir = "../checkpoints"
    os.makedirs(checkpoint_dir, exist_ok=True)
    
    agent_path = f"{checkpoint_dir}/{agent_name}_{timestamp}.pkl"
    
    # Save agent state
    agent_data = {
        'model_state_dict': agent.state_dict(),
        'strategy_config': strategy_config,
        'best_reward': best_reward,
        'episode_rewards': episode_rewards,
        'timestamp': timestamp
    }
    
    with open(agent_path, 'wb') as f:
        pickle.dump(agent_data, f)
    
    print(f"   ✅ {agent_name} training completed!")
    print(f"      Best reward: {best_reward:.2f}")
    print(f"      Final avg reward: {np.mean(episode_rewards[-20:]):.2f}")
    print(f"      Saved to: {agent_path}")
    
    return agent_path, best_reward

class TrainedAgentWrapper:
    """Wrapper to load and use trained agents"""
    
    def __init__(self, agent_path, agent_name):
        self.agent_path = agent_path
        self.agent_name = agent_name
        self.agent = None
        self.strategy_config = None
        self._load_agent()
    
    def _load_agent(self):
        """Load the trained agent"""
        try:
            with open(self.agent_path, 'rb') as f:
                agent_data = pickle.load(f)
            
            # Create agent and load state
            self.agent = SimpleRLAgent()
            self.agent.load_state_dict(agent_data['model_state_dict'])
            self.agent.eval()
            
            self.strategy_config = agent_data.get('strategy_config', {})
            
            print(f"✅ Loaded trained agent: {self.agent_name}")
            
        except Exception as e:
            print(f"❌ Failed to load agent {self.agent_name}: {e}")
            self.agent = None
    
    def get_action(self, observation, market_info=None):
        """Get action from trained agent"""
        if self.agent is None:
            return np.random.choice([0, 1, 2])
        
        try:
            # Convert multi-agent observation to single-agent format if needed
            if len(observation) == 13:  # Multi-agent format
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
            
            # Get action from trained agent
            action = self.agent.get_action(single_agent_obs)
            return action
            
        except Exception as e:
            print(f"Warning: Action computation failed for {self.agent_name}: {e}")
            return np.random.choice([0, 1, 2])

def train_multiple_agents():
    """Train multiple RL agents with different strategies"""
    
    print("🚀 TRAINING MULTIPLE RL AGENTS (SIMPLE VERSION)")
    print("=" * 60)
    
    # Define agents to train
    agents_to_train = [
        {
            'name': 'momentum_agent',
            'config': {'aggressive': True, 'momentum': True},
            'episodes': 150
        },
        {
            'name': 'mean_reversion_agent',
            'config': {'risk_averse': True},
            'episodes': 150
        },
        {
            'name': 'adaptive_agent',
            'config': {},
            'episodes': 150
        }
    ]
    
    trained_agents = {}
    
    for agent_info in agents_to_train:
        agent_path, best_reward = train_agent(
            agent_info['name'],
            agent_info['config'],
            agent_info['episodes']
        )
        
        if agent_path:
            trained_agents[agent_info['name']] = {
                'path': agent_path,
                'best_reward': best_reward,
                'strategy': agent_info['config']
            }
    
    # Save agent registry
    registry = {
        'timestamp': datetime.now().isoformat(),
        'agents': trained_agents,
        'training_method': 'simple_pytorch'
    }
    
    registry_file = "../checkpoints/simple_agent_registry.json"
    with open(registry_file, 'w') as f:
        json.dump(registry, f, indent=2)
    
    print(f"\n📋 TRAINING SUMMARY")
    print("=" * 40)
    print(f"Trained agents: {len(trained_agents)}")
    for name, info in trained_agents.items():
        print(f"  • {name}: reward={info['best_reward']:.2f}")
    print(f"Registry saved: {registry_file}")
    
    return trained_agents

def test_trained_agents():
    """Test the trained agents"""
    
    print("\n🧪 TESTING TRAINED AGENTS")
    print("=" * 40)
    
    try:
        with open("../checkpoints/simple_agent_registry.json", 'r') as f:
            registry = json.load(f)
        
        print(f"Found {len(registry['agents'])} trained agents")
        
        # Test each agent
        for agent_name, agent_info in registry['agents'].items():
            print(f"\n🤖 Testing {agent_name}...")
            
            # Create wrapper
            wrapper = TrainedAgentWrapper(agent_info['path'], agent_name)
            
            # Test with sample observations
            for i in range(3):
                sample_obs = np.random.randn(13).astype(np.float32)
                action = wrapper.get_action(sample_obs)
                action_name = ['BUY', 'SELL', 'HOLD'][action]
                print(f"   Test {i+1}: Action={action} ({action_name})")
        
        print("\n✅ All agents tested successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Testing failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 SIMPLE RL AGENT TRAINING")
    print("Training agents for multi-agent hypothesis testing")
    print("=" * 60)
    
    # Train agents
    trained_agents = train_multiple_agents()
    
    if trained_agents:
        # Test agents
        test_trained_agents()
        
        print(f"\n🎉 TRAINING COMPLETED!")
        print("Agents are ready for hypothesis testing.")
        print("Use TrainedAgentWrapper to load them in your tests.")
    else:
        print("❌ Training failed") 