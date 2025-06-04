#!/bin/bash

echo "🚀 Starting RL Agent Service..."
echo "================================"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📥 Installing requirements..."
pip install -r requirements.txt

# Check if trained agents exist
if [ ! -f "../checkpoints/simple_agent_registry.json" ]; then
    echo "❌ No trained agents found!"
    echo "Please run the training script first:"
    echo "cd ../training && python simple_train_agents.py"
    exit 1
fi

echo "✅ Starting RL Agent Service on port 5001..."
echo "🌐 Service will be available at: http://localhost:5001"
echo "📊 Health check: http://localhost:5001/api/health"
echo ""
echo "Press Ctrl+C to stop the service"
echo "================================"

# Start the service
python rl_agent_service.py 