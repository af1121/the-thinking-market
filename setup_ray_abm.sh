#!/bin/bash

# Ray ABM Trading Simulation Quick Setup Script
echo "🚀 Ray ABM Trading Simulation Quick Setup"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the main project directory (where package.json is located)"
    exit 1
fi

# Check if ray_abm_project directory exists
if [ ! -d "ray_abm_project" ]; then
    echo "❌ Error: ray_abm_project directory not found"
    echo "   Please ensure the Ray ABM project has been created"
    exit 1
fi

echo "📁 Found ray_abm_project directory"

# Navigate to ray_abm_project
cd ray_abm_project

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed or not in PATH"
    echo "   Please install Python 3.8 or higher"
    exit 1
fi

echo "✅ Python 3 found"

# Check if conda is available
if ! command -v conda &> /dev/null; then
    echo "⚠️  Warning: Conda not found"
    echo "   You can still proceed with pip, but conda is recommended"
    echo "   Install Anaconda or Miniconda for better environment management"
    
    read -p "Continue with pip installation? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled. Please install conda and try again."
        exit 1
    fi
    
    # Pip installation
    echo "📦 Installing dependencies with pip..."
    pip3 install -r requirements.txt
    
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully"
    else
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "✅ Conda found"
    
    # Run the Python setup script
    echo "🔧 Running Python setup script..."
    python3 setup.py
    
    if [ $? -ne 0 ]; then
        echo "❌ Setup script failed"
        exit 1
    fi
fi

# Create necessary directories
echo "📁 Creating additional directories..."
mkdir -p results checkpoints logs data

# Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x test_setup.py
chmod +x setup.py

echo ""
echo "🎉 Ray ABM setup completed!"
echo ""
echo "🚀 Quick Start Guide:"
echo "1. Activate conda environment (if using conda):"
echo "   conda activate ray_abm"
echo ""
echo "2. Test the installation:"
echo "   cd ray_abm_project"
echo "   python test_setup.py"
echo ""
echo "3. Start the FastAPI backend:"
echo "   cd api"
echo "   python main.py"
echo ""
echo "4. In another terminal, start the React frontend:"
echo "   cd .. # (back to main project)"
echo "   npm run dev"
echo ""
echo "5. Open http://localhost:3000 and click on the 'Ray ABM' tab"
echo ""
echo "📚 For detailed instructions, see: ray_abm_project/README.md"
echo "🔧 API documentation: http://localhost:8000/docs (when backend is running)" 