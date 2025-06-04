#!/bin/bash

echo "🚀 Starting The Thinking Market..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo "🎯 Starting frontend in demo mode..."
echo "Visit http://localhost:5173 to access The Thinking Market"
echo ""
echo "💡 To enable RL agents:"
echo "   1. Open a new terminal"
echo "   2. cd ray_abm_project/api"
echo "   3. pip install -r requirements.txt"
echo "   4. ./start_rl_service.sh"
echo ""

npm run dev 