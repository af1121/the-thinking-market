from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import ray
import numpy as np
import json
import os
import sys
from datetime import datetime
import asyncio
import uvicorn
from ray.tune.registry import register_env

# Add the parent directory to the path to import MarketEnv
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from env.MarketEnv import MarketEnv

app = FastAPI(title="Ray ABM Trading Simulation API", version="1.0.0")

# Add CORS middleware to allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8082"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for simulation state
simulation_state = {
    "running": False,
    "environment": None,
    "rl_agent": None,
    "current_step": 0,
    "episode_data": [],
    "stress_mode": False
}

# Pydantic models for API requests/responses
class AgentAction(BaseModel):
    observation: List[float]
    agent_id: Optional[str] = "rl_agent"

class AgentActionResponse(BaseModel):
    action: int
    confidence: Optional[float] = None
    agent_id: str

class MarketState(BaseModel):
    current_price: float
    fundamental_value: float
    volatility: float
    spread: float
    inventory: int
    cash: float
    pnl: float
    step: int
    timestamp: str

class StressEvent(BaseModel):
    event_type: str  # "flash_crash", "volatility_spike", "liquidity_shock"
    magnitude: float
    duration: Optional[int] = 1

class SimulationConfig(BaseModel):
    max_steps: Optional[int] = 1000
    initial_price: Optional[float] = 100.0
    fundamental_value: Optional[float] = 100.0
    num_traditional_agents: Optional[int] = 10
    rl_agent_enabled: Optional[bool] = True

class TrainingRequest(BaseModel):
    algorithm: str = "PPO"
    num_workers: int = 2
    training_iterations: int = 50
    env_config: Optional[Dict] = None

# Initialize Ray (if not already initialized)
@app.on_event("startup")
async def startup_event():
    if not ray.is_initialized():
        ray.init(ignore_reinit_error=True)
    print("Ray initialized successfully")

    # Register the environment with Ray
    def env_creator(env_config):
        return MarketEnv(config=env_config)

    register_env("MarketEnv", env_creator)

@app.on_event("shutdown")
async def shutdown_event():
    if ray.is_initialized():
        ray.shutdown()
    print("Ray shutdown successfully")

@app.get("/")
async def root():
    return {"message": "Ray ABM Trading Simulation API", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "ray_initialized": ray.is_initialized(),
        "simulation_running": simulation_state["running"],
        "timestamp": datetime.now().isoformat()
    }

@app.post("/simulation/start")
async def start_simulation(config: SimulationConfig):
    """Start a new simulation with the given configuration"""
    try:
        # Create new environment
        env_config = {
            'max_steps': config.max_steps,
            'initial_price': config.initial_price,
            'fundamental_value': config.fundamental_value,
            'tick_size': 0.01,
            'max_inventory': 100,
            'initial_cash': 10000.0
        }
        
        simulation_state["environment"] = MarketEnv(config=env_config)
        simulation_state["current_step"] = 0
        simulation_state["episode_data"] = []
        simulation_state["running"] = True
        simulation_state["stress_mode"] = False
        
        # Reset environment
        initial_obs, info = simulation_state["environment"].reset()
        
        return {
            "status": "started",
            "initial_observation": initial_obs.tolist(),
            "config": env_config,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start simulation: {str(e)}")

@app.post("/simulation/stop")
async def stop_simulation():
    """Stop the current simulation"""
    simulation_state["running"] = False
    simulation_state["environment"] = None
    simulation_state["current_step"] = 0
    
    return {
        "status": "stopped",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/simulation/state")
async def get_simulation_state():
    """Get current simulation state"""
    if not simulation_state["running"] or simulation_state["environment"] is None:
        raise HTTPException(status_code=400, detail="Simulation not running")
    
    env = simulation_state["environment"]
    
    return MarketState(
        current_price=env.current_price,
        fundamental_value=env.fundamental_value,
        volatility=env.volatility,
        spread=env.spread,
        inventory=env.inventory,
        cash=env.cash,
        pnl=env._calculate_pnl(),
        step=simulation_state["current_step"],
        timestamp=datetime.now().isoformat()
    )

@app.post("/agent/action")
async def get_agent_action(request: AgentAction):
    """Get action from trained RL agent"""
    try:
        if simulation_state["rl_agent"] is None:
            # If no trained agent is loaded, return random action
            action = np.random.choice([0, 1, 2])  # BUY, SELL, HOLD
            confidence = 0.33
        else:
            # Use trained agent to compute action
            obs = np.array(request.observation, dtype=np.float32)
            action = simulation_state["rl_agent"].compute_single_action(obs, explore=False)
            confidence = 0.8  # Placeholder - could extract from agent if available
        
        return AgentActionResponse(
            action=int(action),
            confidence=confidence,
            agent_id=request.agent_id
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute agent action: {str(e)}")

@app.post("/simulation/step")
async def simulation_step(action: Optional[int] = None):
    """Execute one step in the simulation"""
    if not simulation_state["running"] or simulation_state["environment"] is None:
        raise HTTPException(status_code=400, detail="Simulation not running")
    
    try:
        env = simulation_state["environment"]
        
        # If no action provided, get action from RL agent
        if action is None:
            obs = env._get_observation()
            if simulation_state["rl_agent"] is not None:
                action = simulation_state["rl_agent"].compute_single_action(obs, explore=False)
            else:
                action = np.random.choice([0, 1, 2])  # Random action
        
        # Execute step
        obs, reward, terminated, truncated, info = env.step(action)
        simulation_state["current_step"] += 1
        
        # Store step data
        step_data = {
            "step": simulation_state["current_step"],
            "action": int(action),
            "reward": float(reward),
            "observation": obs.tolist(),
            "info": info,
            "done": terminated or truncated,
            "timestamp": datetime.now().isoformat()
        }
        simulation_state["episode_data"].append(step_data)
        
        # Check if episode is done
        if terminated or truncated:
            simulation_state["running"] = False
        
        return step_data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute simulation step: {str(e)}")

@app.post("/simulation/stress")
async def inject_stress_event(stress_event: StressEvent):
    """Inject a market stress event"""
    if not simulation_state["running"] or simulation_state["environment"] is None:
        raise HTTPException(status_code=400, detail="Simulation not running")
    
    try:
        env = simulation_state["environment"]
        env.inject_market_stress(stress_event.event_type, stress_event.magnitude)
        simulation_state["stress_mode"] = True
        
        return {
            "status": "stress_injected",
            "event_type": stress_event.event_type,
            "magnitude": stress_event.magnitude,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to inject stress event: {str(e)}")

@app.get("/simulation/data")
async def get_simulation_data():
    """Get all simulation episode data"""
    return {
        "episode_data": simulation_state["episode_data"],
        "total_steps": len(simulation_state["episode_data"]),
        "running": simulation_state["running"]
    }

@app.post("/agent/load")
async def load_trained_agent(checkpoint_path: str):
    """Load a trained RL agent from checkpoint"""
    try:
        from ray.rllib.algorithms.algorithm import Algorithm
        
        if not os.path.exists(checkpoint_path):
            raise HTTPException(status_code=404, detail=f"Checkpoint not found: {checkpoint_path}")
        
        # Load the trained agent
        simulation_state["rl_agent"] = Algorithm.from_checkpoint(checkpoint_path)
        
        return {
            "status": "agent_loaded",
            "checkpoint_path": checkpoint_path,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load agent: {str(e)}")

@app.post("/training/start")
async def start_training(background_tasks: BackgroundTasks, request: TrainingRequest):
    """Start training a new RL agent in the background"""
    try:
        # Import training module
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'training'))
        from train_agents import RLTrainer
        
        # Create trainer
        trainer = RLTrainer(
            algorithm=request.algorithm,
            num_workers=request.num_workers,
            training_iterations=request.training_iterations
        )
        
        # Start training in background
        background_tasks.add_task(run_training, trainer)
        
        return {
            "status": "training_started",
            "algorithm": request.algorithm,
            "num_workers": request.num_workers,
            "training_iterations": request.training_iterations,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start training: {str(e)}")

async def run_training(trainer):
    """Background task for training RL agent"""
    try:
        results, checkpoint_path = trainer.train()
        print(f"Training completed. Best checkpoint: {checkpoint_path}")
        
        # Automatically load the trained agent
        simulation_state["rl_agent"] = trainer.algo
        
    except Exception as e:
        print(f"Training failed: {str(e)}")

@app.get("/models/list")
async def list_available_models():
    """List available trained models"""
    checkpoints_dir = "checkpoints"
    models = []
    
    if os.path.exists(checkpoints_dir):
        for item in os.listdir(checkpoints_dir):
            item_path = os.path.join(checkpoints_dir, item)
            if os.path.isdir(item_path):
                models.append({
                    "name": item,
                    "path": item_path,
                    "created": datetime.fromtimestamp(os.path.getctime(item_path)).isoformat()
                })
    
    return {"models": models}

@app.get("/analytics/performance")
async def get_performance_analytics():
    """Get performance analytics from current episode"""
    if not simulation_state["episode_data"]:
        return {"message": "No episode data available"}
    
    data = simulation_state["episode_data"]
    
    # Calculate basic analytics
    rewards = [step["reward"] for step in data]
    prices = [step["info"]["price"] for step in data if "price" in step["info"]]
    pnls = [step["info"]["pnl"] for step in data if "pnl" in step["info"]]
    
    analytics = {
        "total_steps": len(data),
        "total_reward": sum(rewards),
        "average_reward": np.mean(rewards) if rewards else 0,
        "reward_std": np.std(rewards) if rewards else 0,
        "final_pnl": pnls[-1] if pnls else 0,
        "max_pnl": max(pnls) if pnls else 0,
        "min_pnl": min(pnls) if pnls else 0,
        "price_volatility": np.std(prices) if len(prices) > 1 else 0,
        "action_distribution": {
            "buy": sum(1 for step in data if step["action"] == 0),
            "sell": sum(1 for step in data if step["action"] == 1),
            "hold": sum(1 for step in data if step["action"] == 2)
        }
    }
    
    return analytics

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 