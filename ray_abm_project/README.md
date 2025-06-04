# 🏗️ **Ray ABM Trading Simulator**

A comprehensive algorithmic trading simulator with reinforcement learning agents, built with Ray, RLlib, and React.

## 🚀 **Quick Start**

### 1. Setup Environment
```bash
# Install dependencies
pip install -r requirements.txt

# Verify installation
python test_setup.py
```

### 2. Train an RL Agent
```bash
cd training
python train.py --config standard --model standard
```

### 3. Start Backend API
```bash
cd api
python main.py
```

### 4. Launch Frontend
```bash
cd ../../  # Back to main project
npm run dev
```

## 📁 **Project Structure**

```
ray_abm_project/
├── 📚 docs/                          # Documentation
│   └── TRAINING_GUIDE.md             # Comprehensive training guide
├── 🤖 training/                      # RL Training System
│   ├── train.py                      # Main training script
│   ├── modern_train.py               # Alternative training script
│   ├── quick_train.py                # Quick testing script
│   ├── configs/                      # Training configurations
│   │   └── training_config.py        # Centralized config management
│   ├── utils/                        # Training utilities
│   │   └── model_utils.py            # Model management functions
│   └── archive/                      # Legacy training scripts
├── 🌍 env/                           # Trading Environment
│   └── MarketEnv.py                  # Gymnasium-compatible market environment
├── 🔗 api/                           # FastAPI Backend
│   └── main.py                       # API server with all endpoints
├── 🤖 agents/                        # Traditional Trading Agents
│   ├── market_maker.py               # Market making strategies
│   ├── fundamental_trader.py         # Value-based trading
│   ├── noise_trader.py               # Random trading behavior
│   └── momentum_trader.py            # Trend-following strategies
├── 💾 checkpoints/                   # Trained Model Storage
│   ├── PPO_20250528_152947/          # Legacy model
│   └── modern_ppo_20250528_160636/   # Latest trained model
├── 📊 results/                       # Training Results & Analytics
├── 📈 data/                          # Market Data & Datasets
├── 📋 logs/                          # System Logs
├── 🎨 visualization/                 # Plotting & Analysis Tools
├── requirements.txt                  # Python dependencies
├── setup.py                          # Package configuration
└── test_setup.py                     # Installation verification
```

## 🎯 **Core Features**

### 🤖 **Reinforcement Learning**
- **PPO Algorithm**: Proximal Policy Optimization for stable training
- **Custom Environment**: 12-dimensional observation space with market microstructure
- **Flexible Configurations**: Quick, standard, and advanced training modes
- **Model Management**: Automated saving, loading, and evaluation utilities

### 🌍 **Market Environment**
- **Realistic Trading**: Order book simulation with bid-ask spreads
- **Market Dynamics**: Volatility, fundamental values, and price discovery
- **Risk Management**: Position limits and transaction costs
- **Stress Testing**: Configurable market shock scenarios

### 🔗 **API Backend**
- **FastAPI**: High-performance async API with automatic documentation
- **Ray Integration**: Distributed computing for scalable simulations
- **Real-time Control**: Start/stop simulations, inject market events
- **Analytics**: Performance metrics, risk analysis, and market statistics

### 🎨 **React Frontend**
- **Real-time Dashboard**: Live market data and agent performance
- **Interactive Controls**: Simulation management and parameter tuning
- **Visualization**: Charts, graphs, and market analysis tools
- **Model Integration**: Load and test trained RL agents

## 🛠️ **Usage Examples**

### Training Models

```bash
# Quick training for testing (10 iterations)
python train.py --config quick --model small --name "test_model"

# Standard training for research (50 iterations)
python train.py --config standard --model standard

# Advanced training for production (100 iterations)
python train.py --config advanced --model large --name "production_v1"
```

### API Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Start simulation
curl -X POST http://localhost:8000/simulation/start

# Execute trading step
curl -X POST http://localhost:8000/simulation/step

# Inject market stress
curl -X POST http://localhost:8000/simulation/stress \
  -H "Content-Type: application/json" \
  -d '{"event_type": "flash_crash", "magnitude": 0.1}'

# Get performance analytics
curl http://localhost:8000/analytics/performance
```

### Model Management

```python
from training.utils.model_utils import list_available_models, evaluate_model

# List all trained models
models = list_available_models()
print(f"Found {len(models)} trained models")

# Evaluate model performance
results = evaluate_model(algo, env_config, num_episodes=10)
print(f"Average reward: {results['avg_reward']:.2f}")
```

## 📊 **Environment Details**

### Observation Space (12 dimensions)
1. **Current Price** - Normalized market price
2. **Fundamental Value** - Theoretical fair value  
3. **Volatility** - Recent price volatility
4. **Spread** - Bid-ask spread
5. **Order Imbalance** - Market microstructure signal
6-10. **Recent Returns** - Last 5 period returns
11. **Inventory** - Current position (normalized)
12. **Cash Ratio** - Available cash percentage

### Action Space
- **0**: BUY - Purchase shares
- **1**: SELL - Sell shares
- **2**: HOLD - No action

### Reward Function
- **Trading Profit**: Realized P&L from completed trades
- **Inventory Penalty**: Cost for holding large positions
- **Transaction Costs**: Bid-ask spread and trading fees
- **Risk Adjustment**: Volatility-based risk penalties

## 🔧 **Configuration**

### Training Configurations
| Config | Iterations | Batch Size | Environment Steps | Use Case |
|--------|------------|------------|-------------------|----------|
| `quick` | 10 | 200 | 100 | Testing, debugging |
| `standard` | 50 | 500 | 200 | Development, research |
| `advanced` | 100 | 1000 | 500 | Production models |

### Model Architectures
| Model | Hidden Layers | Parameters | Training Time | Use Case |
|-------|---------------|------------|---------------|----------|
| `small` | [32, 32] | ~3K | Fast | Quick experiments |
| `standard` | [64, 64] | ~12K | Medium | Balanced performance |
| `large` | [128, 128, 64] | ~35K | Slow | Best performance |

## 🚀 **Advanced Features**

### Multi-Agent Simulation
- **Market Makers**: Provide liquidity with bid-ask quotes
- **Fundamental Traders**: Trade based on value analysis
- **Noise Traders**: Random trading for market realism
- **Momentum Traders**: Trend-following strategies
- **RL Agents**: Adaptive learning agents

### Stress Testing
- **Flash Crashes**: Sudden price drops
- **Volatility Spikes**: Increased market uncertainty
- **Liquidity Crises**: Reduced market depth
- **News Events**: Fundamental value shocks

### Analytics & Monitoring
- **Real-time Metrics**: P&L, Sharpe ratio, drawdown
- **Risk Analysis**: VaR, position concentration
- **Market Statistics**: Volume, volatility, correlations
- **Agent Performance**: Individual and comparative analysis

## 📚 **Documentation**

- **[Training Guide](docs/TRAINING_GUIDE.md)**: Comprehensive RL training documentation
- **API Documentation**: Available at `http://localhost:8000/docs` when server is running
- **Environment Specification**: See `env/MarketEnv.py` for detailed implementation

## 🤝 **Contributing**

1. **Code Organization**: Follow the established directory structure
2. **Configuration**: Use the centralized config system in `training/configs/`
3. **Documentation**: Update relevant docs when adding features
4. **Testing**: Verify changes with `python test_setup.py`

## 📄 **License**

This project is for research and educational purposes. See individual component licenses for details.

---

**Built with**: Ray 2.46.0, RLlib, FastAPI, React, TypeScript, Gymnasium 