# 🚀 Scalable Parallel Agent-Based Financial Market Simulation

## 📋 Project Overview

This project implements a **scalable, distributed simulation environment** for studying financial market volatility amplification using **Deep Reinforcement Learning (RL) agents** and **Ray** for parallel computations. The simulation includes multiple trader-agent types interacting within a market environment, with a focus on studying behavior during extreme market stress conditions.

## 🎯 Research Question

> **"How do adaptive Deep Reinforcement Learning (RL) trading agents interact with traditional algorithmic traders (Market makers, Fundamental traders, Noise traders, Momentum traders) and affect market volatility during periods of extreme market stress?"**

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  FastAPI Backend │    │   Ray Cluster   │
│                 │◄──►│                 │◄──►│                 │
│ • Visualization │    │ • API Endpoints │    │ • RL Training   │
│ • Controls      │    │ • State Mgmt    │    │ • Parallel Sim  │
│ • Analytics     │    │ • Agent Serving │    │ • Distributed   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🧩 Agent Types

| Agent Type | Role | Behavior |
|------------|------|----------|
| **Market Maker** | Liquidity Provider | Places bid/ask orders around current price |
| **Fundamental Trader** | Value-based Trading | Trades based on fundamental value deviations |
| **Noise Trader** | Random Behavior | Adds market noise and irrationality |
| **Momentum Trader** | Trend Following | Follows price trends and momentum |
| **Adaptive RL Agent** | Learning Trader | Uses Deep RL to adapt strategies dynamically |

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Create conda environment
conda create -n ray_abm python=3.10 -y
conda activate ray_abm

# Install dependencies
cd ray_abm_project
pip install -r requirements.txt
```

### 2. Start the Backend API

```bash
# Start FastAPI server
cd api
python main.py

# API will be available at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### 3. Train RL Agents

```bash
# Train a PPO agent
cd training
python train_agents.py

# Or train different algorithms
python -c "
from train_agents import RLTrainer
trainer = RLTrainer(algorithm='DQN', num_workers=4, training_iterations=100)
trainer.train()
"
```

### 4. Run Simulations

```bash
# Test the environment
cd env
python -c "
from MarketEnv import MarketEnv
env = MarketEnv()
obs = env.reset()
for i in range(100):
    action = env.action_space.sample()
    obs, reward, done, info = env.step(action)
    if done:
        break
print(f'Final PnL: {info[\"pnl\"]:.2f}')
"
```

## 📊 Market Environment

The `MarketEnv` is a Gym-compatible environment with:

- **Observation Space**: 13-dimensional vector including:
  - Current price, fundamental value, volatility, spread
  - Order book imbalance, recent returns (5 periods)
  - Agent inventory, cash ratio

- **Action Space**: Discrete(3) - [BUY, SELL, HOLD]

- **Reward Function**: Based on:
  - Profit from price prediction accuracy
  - Inventory management penalties
  - Risk-adjusted returns

## 🎛️ API Endpoints

### Simulation Control
- `POST /simulation/start` - Start new simulation
- `POST /simulation/stop` - Stop current simulation
- `GET /simulation/state` - Get current market state
- `POST /simulation/step` - Execute one simulation step

### Agent Management
- `POST /agent/action` - Get action from RL agent
- `POST /agent/load` - Load trained agent from checkpoint
- `GET /models/list` - List available trained models

### Stress Testing
- `POST /simulation/stress` - Inject market stress events
- `GET /analytics/performance` - Get performance analytics

### Training
- `POST /training/start` - Start RL agent training

## 🧪 Stress Test Scenarios

The simulation supports various stress scenarios:

```python
stress_scenarios = {
    "flash_crash": {
        "stress_event": {"type": "flash_crash", "magnitude": 0.1}
    },
    "high_volatility": {
        "stress_event": {"type": "volatility_spike", "magnitude": 2.0}
    },
    "liquidity_crisis": {
        "stress_event": {"type": "liquidity_shock", "magnitude": 1.5}
    }
}
```

## 📈 Training Deep RL Agents

### Supported Algorithms
- **PPO** (Proximal Policy Optimization) - Default
- **DQN** (Deep Q-Network)
- **SAC** (Soft Actor-Critic)

### Training Configuration
```python
config = {
    'max_steps': 1000,
    'initial_price': 100.0,
    'fundamental_value': 100.0,
    'num_workers': 4,
    'training_iterations': 100
}
```

### Example Training Script
```python
from training.train_agents import RLTrainer

# Create trainer
trainer = RLTrainer(
    algorithm="PPO",
    num_workers=4,
    training_iterations=50
)

# Train agent
results, checkpoint_path = trainer.train()

# Evaluate agent
from training.train_agents import evaluate_agent
evaluate_agent(checkpoint_path, num_episodes=10)
```

## 🔬 Research Experiments

### Experiment 1: Baseline Performance
```bash
python training/train_agents.py
```

### Experiment 2: Stress Testing
```python
from training.train_agents import stress_test_agent

stress_scenarios = {
    "flash_crash": {"stress_event": {"type": "flash_crash", "magnitude": 0.1}},
    "volatility_spike": {"stress_event": {"type": "volatility_spike", "magnitude": 2.0}}
}

results = stress_test_agent(checkpoint_path, stress_scenarios)
```

### Experiment 3: Multi-Agent Interaction
```python
# Run simulation with multiple RL agents
# (Implementation in progress)
```

## 📊 Key Metrics

The simulation tracks various metrics for analysis:

- **Market Metrics**: Price volatility, liquidity, spread
- **Agent Metrics**: Profit & Loss, trading frequency, inventory
- **Stress Metrics**: Volatility amplification, recovery time
- **RL Metrics**: Reward, episode length, action distribution

## 🔧 Configuration

### Environment Configuration
```python
env_config = {
    'max_steps': 1000,
    'initial_price': 100.0,
    'fundamental_value': 100.0,
    'tick_size': 0.01,
    'max_inventory': 100,
    'initial_cash': 10000.0
}
```

### Training Configuration
```python
training_config = {
    'algorithm': 'PPO',
    'num_workers': 4,
    'training_iterations': 100,
    'lr': 3e-4,
    'gamma': 0.99,
    'train_batch_size': 4000
}
```

## 📁 Project Structure

```
ray_abm_project/
├── env/
│   └── MarketEnv.py              # Gym-compatible market environment
├── training/
│   └── train_agents.py           # RL agent training scripts
├── api/
│   └── main.py                   # FastAPI backend
├── results/                      # Training results and checkpoints
├── checkpoints/                  # Saved model checkpoints
├── requirements.txt              # Python dependencies
└── README.md                     # This file
```

## 🚀 Integration with React Frontend

The existing React frontend can be enhanced to communicate with the Python backend:

```javascript
// Example API calls
const startSimulation = async (config) => {
  const response = await fetch('http://localhost:8000/simulation/start', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(config)
  });
  return response.json();
};

const getAgentAction = async (observation) => {
  const response = await fetch('http://localhost:8000/agent/action', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({observation})
  });
  return response.json();
};
```

## 🔬 Research Applications

This simulation environment enables research into:

1. **Market Microstructure**: How RL agents affect bid-ask spreads and liquidity
2. **Volatility Dynamics**: Impact of adaptive agents on market volatility
3. **Systemic Risk**: How RL agents contribute to or mitigate market crashes
4. **Regulatory Policy**: Testing circuit breakers and other interventions
5. **Agent Interaction**: Emergent behaviors from multi-agent systems

## 📚 Next Steps

1. **Enhanced Agent Models**: Implement more sophisticated RL architectures
2. **Multi-Agent Training**: Train multiple RL agents simultaneously
3. **Real Data Integration**: Use historical market data for training
4. **Advanced Analytics**: Implement more sophisticated market analysis
5. **Scalability**: Optimize for larger-scale simulations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests and documentation
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

For questions or collaboration opportunities, please reach out to the research team.

---

**Happy Trading! 🚀📈** 