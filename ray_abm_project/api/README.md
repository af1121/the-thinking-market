# Real RL Agent Integration

This directory contains the backend service that integrates **real trained RL agents** into the market simulation platform.

## 🎯 What This Does

Instead of using mock data, this service:
- ✅ **Loads actual trained RL agents** from the training checkpoints
- ✅ **Runs real neural network inference** for trading decisions
- ✅ **Tracks real agent performance** with position and P&L
- ✅ **Provides live market observations** to RL agents
- ✅ **Processes real trading orders** from RL agents

## 🏗️ Architecture

```
Frontend (React/TypeScript)
    ↕️ HTTP API
Backend Service (Python/Flask)
    ↕️ Direct Loading
Trained RL Agents (PyTorch Models)
```

## 🚀 Quick Start

### 1. Ensure Trained Agents Exist
```bash
cd ../training
python simple_train_agents.py
```

### 2. Start the RL Agent Service
```bash
./start_rl_service.sh
```

### 3. Start the Frontend
```bash
cd ../../
npm run dev
```

### 4. Use Real RL Agents
1. Open the simulation at `http://localhost:5173`
2. Go to the "Live Trading" tab
3. In the "Trained RL Agents" section, click "Add" for any agent
4. Watch real RL agents trade in the market!

## 📊 Available Agents

| Agent Name | Strategy | Best Reward | Description |
|------------|----------|-------------|-------------|
| `momentum_agent` | Aggressive | 9.89 | Trend-following behavior |
| `mean_reversion_agent` | Risk-Averse | 8.66 | Value-based trading |
| `adaptive_agent` | Balanced | 7.50 | Adaptive learning |

## 🔧 API Endpoints

### Health Check
```bash
GET /api/health
```

### Get All Agents
```bash
GET /api/agents
```

### Activate Agent
```bash
POST /api/agents/{agent_name}/activate
```

### Get Agent Action
```bash
POST /api/agents/{agent_name}/action
Content-Type: application/json

{
  "currentPrice": 100.0,
  "fundamentalValue": 100.0,
  "volatility": 0.01,
  "orderBook": {...},
  "priceHistory": [...]
}
```

### Update Agent Trade
```bash
POST /api/agents/{agent_name}/trade
Content-Type: application/json

{
  "side": "buy",
  "quantity": 10,
  "price": 100.5,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 🧠 How RL Agents Work

### 1. Market Observation
The service converts market state into a 12-dimensional observation vector:
- Normalized current price
- Normalized fundamental value  
- Scaled volatility
- Bid-ask spread
- Order book imbalance
- 5 recent price returns
- Agent inventory (normalized)
- Cash ratio

### 2. Neural Network Inference
Each RL agent runs a trained neural network:
```python
# 64x64 hidden layers with ReLU activation
observation → NN → action_probabilities → action
```

### 3. Action Mapping
- **Action 0**: BUY (place buy order slightly above market)
- **Action 1**: SELL (place sell order slightly below market)  
- **Action 2**: HOLD (no action)

### 4. Order Execution
Valid orders are submitted to the simulation's order book for matching.

## 📈 Real Performance Tracking

The service tracks real metrics for each agent:
- **Position**: Current inventory
- **Cash**: Available cash
- **Total Return**: Portfolio performance
- **Win Rate**: Percentage of profitable trades
- **Trade History**: Complete trading record

## 🔍 Debugging

### Check Service Status
```bash
curl http://localhost:5001/api/health
```

### View Agent Status
```bash
curl http://localhost:5001/api/agents
```

### Check Logs
The service prints detailed logs including:
- Agent loading status
- Action computation results
- Trade execution confirmations
- Error messages

## ⚠️ Troubleshooting

### "RL Agent Service not available"
- Ensure the service is running on port 5001
- Check firewall settings
- Verify Python dependencies are installed

### "Failed to activate RL agent"
- Check that trained agents exist in `../checkpoints/`
- Verify agent registry file exists
- Check service logs for errors

### "No action taken"
- Normal behavior - agents may choose to HOLD
- Check market conditions (agents may be conservative)
- Verify agent has sufficient cash/inventory

## 🎉 Success Indicators

When working correctly, you should see:
- ✅ Service starts without errors
- ✅ Agents load successfully
- ✅ Frontend shows "Connected to RL Agent Service"
- ✅ RL agents appear in the simulation
- ✅ Real trades appear in the market
- ✅ Agent performance updates in real-time

## 🔬 Research Applications

This integration enables:
- **Real hypothesis testing** with actual RL behavior
- **Live performance comparison** vs traditional agents
- **Market impact analysis** of RL trading strategies
- **Stress testing** with real adaptive agents
- **Behavioral analysis** of trained RL policies

---

**🎯 This is the real deal - actual trained RL agents trading in a live market simulation!** 