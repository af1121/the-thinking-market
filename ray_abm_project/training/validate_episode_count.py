#!/usr/bin/env python3
"""
Episode Count Validation Study

This script systematically validates the optimal number of training episodes
using accepted RL methodology:
1. Learning curves analysis
2. Validation curves across episode counts
3. Multiple seed validation
4. Statistical significance testing
"""

import os
import sys
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
import matplotlib.pyplot as plt
from datetime import datetime
import json
import pickle
from collections import deque
import seaborn as sns

# Add the parent directory to the path
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

class ValidationTrainer:
    """Trainer with detailed tracking for validation"""
    
    def __init__(self, agent, learning_rate=0.001, seed=42):
        torch.manual_seed(seed)
        np.random.seed(seed)
        
        self.agent = agent
        self.optimizer = optim.Adam(agent.parameters(), lr=learning_rate)
        self.episode_rewards = []
        self.moving_averages = []
        self.convergence_window = 50
        
    def collect_episode(self, env, max_steps=200):
        """Collect one episode of experience"""
        obs, _ = env.reset()
        
        episode_reward = 0
        episode_obs = []
        episode_actions = []
        episode_rewards = []
        
        for step in range(max_steps):
            action = self.agent.get_action(obs)
            episode_obs.append(obs.copy())
            episode_actions.append(action)
            
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
            
            log_prob = torch.log(action_probs[0, action] + 1e-8)
            loss = -log_prob * G
            total_loss += loss
        
        # Backpropagation
        self.optimizer.zero_grad()
        total_loss.backward()
        self.optimizer.step()
        
        return total_loss.item()
    
    def train_with_tracking(self, env, episodes):
        """Train agent with detailed tracking"""
        
        for episode in range(episodes):
            # Collect and train on episode
            obs_list, actions_list, rewards_list, total_reward = self.collect_episode(env)
            
            if len(obs_list) > 0:
                self.train_episode(obs_list, actions_list, rewards_list)
            
            self.episode_rewards.append(total_reward)
            
            # Calculate moving average
            if len(self.episode_rewards) >= self.convergence_window:
                moving_avg = np.mean(self.episode_rewards[-self.convergence_window:])
                self.moving_averages.append(moving_avg)
            else:
                self.moving_averages.append(np.mean(self.episode_rewards))
        
        return self.episode_rewards, self.moving_averages
    
    def has_converged(self, patience=50, min_episodes=100):
        """Check if training has converged"""
        if len(self.episode_rewards) < min_episodes:
            return False
        
        if len(self.moving_averages) < patience:
            return False
        
        # Check if moving average has stabilized
        recent_avgs = self.moving_averages[-patience:]
        variance = np.var(recent_avgs)
        
        # Convergence if variance is low
        return variance < 0.1  # Threshold for convergence

def validate_episode_counts():
    """Systematic validation of different episode counts"""
    
    print("🔬 EPISODE COUNT VALIDATION STUDY")
    print("=" * 60)
    
    # Test different episode counts
    episode_counts = [50, 100, 150, 200, 300, 500, 750, 1000]
    seeds = [42, 123, 456, 789, 999]  # Multiple seeds for robustness
    
    results = {}
    
    for episodes in episode_counts:
        print(f"\n📊 Testing {episodes} episodes...")
        
        episode_results = []
        convergence_points = []
        
        for seed in seeds:
            print(f"   Seed {seed}...", end=" ")
            
            # Create environment
            env_config = {
                'max_steps': 200,
                'initial_price': 100.0,
                'fundamental_value': 100.0,
                'initial_cash': 10000.0,
                'max_inventory': 50
            }
            env = MarketEnv(env_config)
            
            # Create and train agent
            agent = SimpleRLAgent()
            trainer = ValidationTrainer(agent, seed=seed)
            
            rewards, moving_avgs = trainer.train_with_tracking(env, episodes)
            
            # Find convergence point
            convergence_episode = None
            for i in range(100, len(moving_avgs)):
                if trainer.has_converged():
                    convergence_episode = i
                    break
            
            final_performance = np.mean(rewards[-50:])  # Last 50 episodes
            episode_results.append(final_performance)
            convergence_points.append(convergence_episode)
            
            print(f"Final: {final_performance:.2f}")
        
        # Store results
        results[episodes] = {
            'performances': episode_results,
            'mean_performance': np.mean(episode_results),
            'std_performance': np.std(episode_results),
            'convergence_points': convergence_points,
            'mean_convergence': np.mean([c for c in convergence_points if c is not None])
        }
        
        print(f"   Mean performance: {results[episodes]['mean_performance']:.2f} ± {results[episodes]['std_performance']:.2f}")
    
    return results

def plot_validation_results(results):
    """Plot validation curve and convergence analysis"""
    
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))
    
    # 1. Validation Curve
    episodes = list(results.keys())
    means = [results[e]['mean_performance'] for e in episodes]
    stds = [results[e]['std_performance'] for e in episodes]
    
    ax1.errorbar(episodes, means, yerr=stds, marker='o', capsize=5)
    ax1.set_xlabel('Training Episodes')
    ax1.set_ylabel('Final Performance')
    ax1.set_title('Validation Curve: Performance vs Episodes')
    ax1.grid(True, alpha=0.3)
    
    # Find optimal point
    optimal_idx = np.argmax(means)
    optimal_episodes = episodes[optimal_idx]
    ax1.axvline(x=optimal_episodes, color='red', linestyle='--', 
                label=f'Optimal: {optimal_episodes} episodes')
    ax1.legend()
    
    # 2. Convergence Analysis
    convergence_points = [results[e]['mean_convergence'] for e in episodes 
                         if not np.isnan(results[e]['mean_convergence'])]
    convergence_episodes = [e for e in episodes 
                           if not np.isnan(results[e]['mean_convergence'])]
    
    if convergence_points:
        ax2.plot(convergence_episodes, convergence_points, marker='s')
        ax2.set_xlabel('Training Episodes')
        ax2.set_ylabel('Convergence Point')
        ax2.set_title('Convergence Analysis')
        ax2.grid(True, alpha=0.3)
    
    # 3. Performance Distribution
    all_performances = []
    episode_labels = []
    for episodes in [50, 150, 300, 1000]:  # Key points
        if episodes in results:
            all_performances.extend(results[episodes]['performances'])
            episode_labels.extend([f'{episodes}'] * len(results[episodes]['performances']))
    
    if all_performances:
        import pandas as pd
        df = pd.DataFrame({'Episodes': episode_labels, 'Performance': all_performances})
        sns.boxplot(data=df, x='Episodes', y='Performance', ax=ax3)
        ax3.set_title('Performance Distribution by Episode Count')
    
    # 4. Efficiency Analysis (Performance per Episode)
    episodes_list = list(episodes)
    efficiency = [means[i] / episodes_list[i] for i in range(len(episodes_list))]
    ax4.plot(episodes_list, efficiency, marker='^')
    ax4.set_xlabel('Training Episodes')
    ax4.set_ylabel('Performance per Episode')
    ax4.set_title('Training Efficiency')
    ax4.grid(True, alpha=0.3)
    
    plt.tight_layout()
    
    # Save plot
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    plt.savefig(f'episode_validation_{timestamp}.png', dpi=300, bbox_inches='tight')
    print(f"\n📊 Validation plots saved as: episode_validation_{timestamp}.png")
    
    return optimal_episodes

def statistical_analysis(results):
    """Perform statistical analysis of results"""
    
    print("\n📈 STATISTICAL ANALYSIS")
    print("=" * 40)
    
    episodes = list(results.keys())
    
    # Find optimal episode count
    means = [results[e]['mean_performance'] for e in episodes]
    optimal_idx = np.argmax(means)
    optimal_episodes = episodes[optimal_idx]
    optimal_performance = means[optimal_idx]
    
    print(f"🎯 OPTIMAL EPISODE COUNT: {optimal_episodes}")
    print(f"   Performance: {optimal_performance:.3f}")
    
    # Statistical significance testing
    from scipy import stats
    
    print(f"\n🔬 STATISTICAL SIGNIFICANCE:")
    
    # Compare optimal vs other episode counts
    optimal_data = results[optimal_episodes]['performances']
    
    for episodes in [50, 100, 200, 300, 500, 1000]:
        if episodes in results and episodes != optimal_episodes:
            other_data = results[episodes]['performances']
            
            # Perform t-test
            t_stat, p_value = stats.ttest_ind(optimal_data, other_data)
            
            significance = "***" if p_value < 0.001 else "**" if p_value < 0.01 else "*" if p_value < 0.05 else ""
            
            print(f"   {optimal_episodes} vs {episodes}: p={p_value:.4f} {significance}")
    
    # Convergence analysis
    convergence_data = [results[e]['mean_convergence'] for e in episodes 
                       if not np.isnan(results[e]['mean_convergence'])]
    
    if convergence_data:
        mean_convergence = np.mean(convergence_data)
        print(f"\n⏱️  CONVERGENCE ANALYSIS:")
        print(f"   Average convergence: {mean_convergence:.1f} episodes")
        print(f"   Optimal episodes: {optimal_episodes}")
        print(f"   Efficiency ratio: {optimal_episodes/mean_convergence:.2f}")
    
    return optimal_episodes

def main():
    """Run complete episode validation study"""
    
    print("🚀 Starting Episode Count Validation Study")
    print("This will take approximately 30-45 minutes...")
    
    # Run validation
    results = validate_episode_counts()
    
    # Plot results
    optimal_episodes = plot_validation_results(results)
    
    # Statistical analysis
    validated_optimal = statistical_analysis(results)
    
    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f'episode_validation_results_{timestamp}.json'
    
    # Convert numpy types for JSON serialization
    json_results = {}
    for episodes, data in results.items():
        json_results[str(episodes)] = {
            'performances': [float(x) for x in data['performances']],
            'mean_performance': float(data['mean_performance']),
            'std_performance': float(data['std_performance']),
            'convergence_points': [float(x) if x is not None else None for x in data['convergence_points']],
            'mean_convergence': float(data['mean_convergence']) if not np.isnan(data['mean_convergence']) else None
        }
    
    with open(results_file, 'w') as f:
        json.dump({
            'results': json_results,
            'optimal_episodes': int(validated_optimal),
            'timestamp': timestamp,
            'methodology': 'Multi-seed validation with convergence analysis'
        }, f, indent=2)
    
    print(f"\n💾 Results saved to: {results_file}")
    
    print(f"\n🎉 VALIDATION COMPLETE!")
    print(f"   Scientifically validated optimal episodes: {validated_optimal}")
    print(f"   This provides rigorous evidence for your thesis!")

if __name__ == "__main__":
    main() 