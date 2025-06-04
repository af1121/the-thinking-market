# 🚀 Algorithmic Trading Simulator

A sophisticated web-based trading simulation platform that combines traditional algorithmic trading strategies with reinforcement learning (RL) agents for research and educational purposes.

## 🎯 What This System Does

This platform simulates a realistic financial market where different types of trading agents interact:

- **Traditional Agents**: Market makers, momentum traders, fundamental analysts, and noise traders
- **RL Agents**: Trained neural networks that make trading decisions based on market observations
- **Market Events**: News shocks, volatility spikes, and circuit breakers
- **Real-time Analytics**: Live charts, order books, and performance metrics

## 🏗️ System Architecture

```
Frontend (React/TypeScript)     Backend (Python/Flask)
┌─────────────────────────┐    ┌──────────────────────┐
│ • Trading Interface     │    │ • RL Agent Service   │
│ • Real-time Charts      │◄──►│ • Trained Models     │
│ • Market Controls       │    │ • Trading Logic      │
│ • Analytics Dashboard   │    │ • Performance API    │
└─────────────────────────┘    └──────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Git

### 1. Install Frontend Dependencies
```bash
npm install
```

### 2. Start Frontend (Demo Mode)
```bash
npm run dev
```
Visit `http://localhost:5173` to see the trading simulator with traditional agents.

### 3. Enable RL Agents (Optional)
For full functionality with trained RL agents:

```bash
# Navigate to backend
cd ray_abm_project/api

# Install Python dependencies
pip install -r requirements.txt

# Start RL agent service
./start_rl_service.sh
```

Then refresh the frontend to connect to RL agents.

## 📊 Features

### Trading Simulation
- **Multi-Agent Market**: Different trading strategies compete in real-time
- **Order Book**: Live bid/ask spreads and market depth
- **Price Discovery**: Realistic price formation through agent interactions

### Market Events
- **News Injection**: Simulate market-moving news events
- **Volatility Shocks**: Test agent behavior during market stress
- **Circuit Breakers**: Automatic trading halts during extreme moves

### Analytics & Research
- **Performance Metrics**: P&L, Sharpe ratios, win rates
- **Market Impact**: Measure how different agents affect prices
- **Behavioral Analysis**: Study agent decision patterns
- **Risk Management**: Real-time risk monitoring

### RL Integration
- **Trained Agents**: Pre-trained neural networks with different strategies
- **Live Learning**: Agents adapt to market conditions
- **Performance Comparison**: RL vs traditional algorithm benchmarking

## 🎮 How to Use

1. **Start Simulation**: Click "Start Market" to begin trading
2. **Add Agents**: Deploy different types of trading agents
3. **Inject Events**: Test market reactions with news/shocks
4. **Monitor Performance**: Track agent profitability and behavior
5. **Analyze Results**: Review detailed analytics and metrics

## 🔧 Configuration

### Frontend Configuration
- `vite.config.ts`: Build and development settings
- `tailwind.config.ts`: UI styling configuration
- `src/services/`: API integration settings

### Backend Configuration
- `ray_abm_project/api/requirements.txt`: Python dependencies
- `ray_abm_project/checkpoints/`: Trained RL model files
- `ray_abm_project/api/rl_agent_service.py`: RL agent logic

## 📁 Project Structure

```
├── src/                          # Frontend React application
│   ├── components/              # UI components
│   ├── pages/                   # Application pages
│   ├── services/                # API integration
│   └── hooks/                   # Custom React hooks
├── ray_abm_project/             # RL backend system
│   ├── api/                     # Flask API service
│   ├── checkpoints/             # Trained RL models
│   ├── agents/                  # Agent implementations
│   └── env/                     # Trading environment
├── public/                      # Static assets
└── dist/                        # Built application
```

## 🚀 Deployment

### Frontend Only (Demo Mode)
```bash
npm run build
vercel --prod
```

### Full System (with RL Backend)
Deploy frontend to Vercel and backend to a cloud service that supports Python.

## 🔬 Research Applications

This platform enables research in:
- **Market Microstructure**: How different agents affect price formation
- **Algorithmic Trading**: Performance comparison of trading strategies
- **Market Stability**: Impact of RL agents on market volatility
- **Behavioral Finance**: Agent decision-making under different conditions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational and research purposes.

---

**Ready to explore algorithmic trading? Start the simulation and watch AI agents trade!** 🤖📈 