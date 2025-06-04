#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from env.MultiAgentMarketEnv import MultiAgentMarketEnv
import numpy as np

print('🔍 Correlation Analysis Demonstration:')
print('=' * 50)

# Create a simple environment
env = MultiAgentMarketEnv({'num_rl_agents': 3, 'max_steps': 50})
obs, _ = env.reset()

# Simulate some correlated actions
for step in range(30):
    if step == 15:
        env.inject_market_stress('flash_crash', 0.1, duration=5)
        print('   💥 Stress injected at step 15')
    
    # Simulate correlated behavior during stress
    if env.stress_mode:
        # All agents tend to sell during stress (correlation)
        actions = {
            'rl_agent_0': 1,  # SELL
            'rl_agent_1': 1,  # SELL  
            'rl_agent_2': 1 if np.random.random() > 0.3 else 2  # Mostly SELL, some HOLD
        }
    else:
        # Random actions during normal periods
        actions = {
            'rl_agent_0': np.random.choice([0, 1, 2]),
            'rl_agent_1': np.random.choice([0, 1, 2]),
            'rl_agent_2': np.random.choice([0, 1, 2])
        }
    
    obs, rewards, done, truncated, infos = env.step(actions)

# Get correlation analysis
correlations = env.get_agent_correlations()
h1_analysis = env.get_h1_analysis()

print('   📊 Agent Correlations:')
for agent1, corr_dict in correlations.items():
    for agent2, corr in corr_dict.items():
        if agent1 < agent2:  # Avoid duplicate pairs
            print(f'      {agent1} ↔ {agent2}: {corr:.3f}')

print('   📈 H1 Analysis:')
if not h1_analysis.get('insufficient_data', False):
    print(f'      Amplification factor: {h1_analysis.get("amplification_factor", 0):.2f}')
    print(f'      Volatility increase: {h1_analysis.get("volatility_increase_pct", 0):.1f}%')
    print(f'      Stress correlation: {h1_analysis.get("stress_correlation_mean", 0):.3f}')
    print(f'      H1 evidence: {h1_analysis.get("h1_evidence", False)}')
else:
    print('      Insufficient data for analysis') 