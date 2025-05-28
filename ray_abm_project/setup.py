#!/usr/bin/env python3
"""
Setup script for Ray ABM Trading Simulation
"""

import subprocess
import sys
import os
import platform
from pathlib import Path

def run_command(command, description=""):
    """Run a shell command and handle errors"""
    print(f"🔄 {description}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"   Command: {command}")
        print(f"   Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    print("🐍 Checking Python version...")
    version = sys.version_info
    if version.major == 3 and version.minor >= 8:
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} is compatible")
        return True
    else:
        print(f"❌ Python {version.major}.{version.minor}.{version.micro} is not compatible")
        print("   Ray ABM requires Python 3.8 or higher")
        return False

def check_conda():
    """Check if conda is available"""
    print("🔍 Checking for conda...")
    try:
        result = subprocess.run("conda --version", shell=True, check=True, capture_output=True, text=True)
        print(f"✅ Found conda: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError:
        print("❌ Conda not found")
        print("   Please install Anaconda or Miniconda first")
        return False

def create_conda_environment():
    """Create conda environment for Ray ABM"""
    env_name = "ray_abm"
    
    print(f"🏗️  Creating conda environment '{env_name}'...")
    
    # Check if environment already exists
    try:
        result = subprocess.run(f"conda env list | grep {env_name}", shell=True, capture_output=True, text=True)
        if env_name in result.stdout:
            print(f"⚠️  Environment '{env_name}' already exists")
            response = input("Do you want to remove and recreate it? (y/N): ")
            if response.lower() == 'y':
                run_command(f"conda env remove -n {env_name}", f"Removing existing environment '{env_name}'")
            else:
                print(f"Using existing environment '{env_name}'")
                return True
    except:
        pass
    
    # Create new environment
    success = run_command(
        f"conda create -n {env_name} python=3.10 -y",
        f"Creating conda environment '{env_name}'"
    )
    
    if success:
        print(f"✅ Conda environment '{env_name}' created successfully")
        print(f"💡 To activate: conda activate {env_name}")
    
    return success

def install_dependencies():
    """Install Python dependencies"""
    print("📦 Installing Python dependencies...")
    
    # Check if we're in a conda environment
    conda_env = os.environ.get('CONDA_DEFAULT_ENV')
    if conda_env != 'ray_abm':
        print("⚠️  Warning: Not in 'ray_abm' conda environment")
        print("   Please run: conda activate ray_abm")
        response = input("Continue anyway? (y/N): ")
        if response.lower() != 'y':
            return False
    
    # Install dependencies
    success = run_command(
        "pip install -r requirements.txt",
        "Installing dependencies from requirements.txt"
    )
    
    if success:
        print("✅ All dependencies installed successfully")
    
    return success

def create_directories():
    """Create necessary directories"""
    print("📁 Creating project directories...")
    
    directories = [
        "results",
        "checkpoints",
        "logs",
        "data"
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"   Created: {directory}/")
    
    print("✅ Project directories created")
    return True

def test_installation():
    """Test if the installation works"""
    print("🧪 Testing installation...")
    
    # Run the test script
    success = run_command(
        "python test_setup.py",
        "Running installation tests"
    )
    
    return success

def print_next_steps():
    """Print next steps for the user"""
    print("\n" + "="*60)
    print("🎉 Ray ABM Setup Complete!")
    print("="*60)
    print("\n🚀 Next Steps:")
    print("1. Activate the conda environment:")
    print("   conda activate ray_abm")
    print("\n2. Start the FastAPI backend:")
    print("   cd api")
    print("   python main.py")
    print("\n3. In another terminal, start your React frontend:")
    print("   cd .. # (back to main project)")
    print("   npm run dev")
    print("\n4. Train your first RL agent:")
    print("   cd training")
    print("   python train_agents.py")
    print("\n5. Open your browser and navigate to the 'Ray ABM' tab")
    print("\n📚 Documentation:")
    print("   - API docs: http://localhost:8000/docs")
    print("   - README: ray_abm_project/README.md")
    print("\n💡 Tips:")
    print("   - Start with a small training run (10-20 iterations)")
    print("   - Monitor the backend logs for training progress")
    print("   - Use stress testing to evaluate agent robustness")
    print("\n🆘 Need help?")
    print("   - Check the README.md for detailed instructions")
    print("   - Run 'python test_setup.py' to verify installation")
    print("   - Ensure all dependencies are properly installed")

def main():
    """Main setup function"""
    print("🚀 Ray ABM Trading Simulation Setup")
    print("="*50)
    
    # Change to the ray_abm_project directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Check system requirements
    if not check_python_version():
        sys.exit(1)
    
    # Setup steps
    steps = [
        ("Check conda", check_conda),
        ("Create conda environment", create_conda_environment),
        ("Install dependencies", install_dependencies),
        ("Create directories", create_directories),
        ("Test installation", test_installation)
    ]
    
    failed_steps = []
    
    for step_name, step_func in steps:
        print(f"\n{'='*20} {step_name} {'='*20}")
        if not step_func():
            failed_steps.append(step_name)
            print(f"❌ {step_name} failed")
        else:
            print(f"✅ {step_name} completed")
    
    # Summary
    print(f"\n{'='*50}")
    if failed_steps:
        print(f"⚠️  Setup completed with {len(failed_steps)} issues:")
        for step in failed_steps:
            print(f"   - {step}")
        print("\nPlease resolve these issues before proceeding.")
    else:
        print_next_steps()

if __name__ == "__main__":
    main() 