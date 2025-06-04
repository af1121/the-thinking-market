# 🏗️ **The Thinking Market - Backend**

A comprehensive research platform with reinforcement learning agents, built with Ray, RLlib, and React.

## 🎯 **What This Does**

This backend powers The Thinking Market research platform, providing:

- **Multi-Agent RL Training**: Train 3 different RL agents using PPO
- **Market Simulation**: Realistic order matching and price discovery
- **Research API**: 15+ endpoints for hypothesis testing
- **Real-time Trading**: Live agent interactions and market dynamics

## 🚀 **Quick Start**

### Prerequisites
- Python 3.8+
- Ray 2.0+
- At least 8GB RAM (16GB recommended)

### Installation
```bash
cd ray_abm_project/api
pip install -r requirements.txt
```

### Start the RL Service
```bash
./start_rl_service.sh
```

The API will be available at `http://localhost:8000`

## 🧠 **RL Agent Architecture**

### Agent Types
1. **Momentum Agent**: Trend-following strategy
2. **Mean Reversion Agent**: Value-based contrarian approach  
3. **Adaptive Agent**: Balanced learning approach

### Training Configuration
- **Algorithm**: Proximal Policy Optimization (PPO)
- **Network**: Deep neural networks
- **Environment**: Custom MultiAgentMarketEnv
- **Observation Space**: 15-dimensional market state
- **Action Space**: BUY, SELL, HOLD

## 📊 **API Endpoints**

### Core Simulation
- `POST /start_simulation` - Initialize market
- `POST /step_simulation` - Advance one time step
- `GET /market_state` - Current market data
- `POST /reset_simulation` - Reset environment

### Agent Management  
- `GET /agents` - List all agents
- `POST /add_agent` - Deploy new agent
- `DELETE /agents/{id}` - Remove agent

### Research & Analysis
- `GET /performance_metrics` - Agent performance data
- `GET /market_analysis` - Statistical analysis
- `POST /inject_event` - Market event simulation
- `GET /hypothesis_test/{hypothesis}` - Research validation

## 🔬 **Research Features**

### Hypothesis Testing
The system validates three key research hypotheses:

1. **Volatility Amplification**: Measures how RL agents affect market volatility
2. **Liquidity Impact**: Analyzes liquidity provision during stress periods  
3. **Herding Behavior**: Detects coordination between multiple RL agents

### Statistical Validation
- Confidence interval analysis
- P-value calculations
- Multiple scenario testing
- Stress period simulation

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                    Ray Cluster                          │
├─────────────────────────────────────────────────────────┤
│  MultiAgentMarketEnv  │  PPO Trainer  │  Checkpoints   │
├─────────────────────────────────────────────────────────┤
│              FastAPI Service Layer                      │
├─────────────────────────────────────────────────────────┤
│    Agent Manager  │  Market Engine  │  Research API    │
└─────────────────────────────────────────────────────────┘
```

## 📁 **Project Structure**

```
ray_abm_project/
├── api/                    # FastAPI service
│   ├── rl_agent_service.py # Main API server
│   ├── requirements.txt    # Python dependencies
│   └── start_rl_service.sh # Startup script
├── checkpoints/            # Trained RL models
│   ├── momentum_agent/     # Trend-following agent
│   ├── mean_reversion_agent/ # Value-based agent
│   └── adaptive_agent/     # Balanced agent
├── agents/                 # Agent implementations
├── env/                    # Trading environment
└── training/               # Training scripts
```

## 🎯 **Performance Metrics**

The system tracks comprehensive metrics:

- **Financial**: P&L, Sharpe ratio, maximum drawdown
- **Trading**: Win rate, average trade size, frequency
- **Market Impact**: Volatility contribution, liquidity provision
- **Learning**: Reward progression, policy convergence

## 🔧 **Configuration**

### Environment Variables
```bash
export RAY_DISABLE_IMPORT_WARNING=1
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Training Parameters
- Learning rate: 5e-5
- Batch size: 4000
- Training iterations: Configurable
- Rollout fragment length: 200

## 🚀 **Deployment**

### Local Development
```bash
cd ray_abm_project/api
python rl_agent_service.py
```

### Production Deployment
The backend can be deployed to:
- Railway
- Render  
- Heroku
- AWS/GCP/Azure

## 📊 **Research Output**

The system generates:
- Real-time market data
- Agent performance metrics
- Statistical test results
- Hypothesis validation reports
- Market impact analysis

---

**Powering advanced financial market research with AI** 🤖📈 