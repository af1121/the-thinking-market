"""
Utility functions for model management and evaluation
"""

import os
import json
from datetime import datetime
from typing import List, Dict, Optional
import ray
from ray.rllib.algorithms.algorithm import Algorithm

def list_available_models(checkpoints_dir: str = "../checkpoints") -> List[Dict]:
    """List all available trained models"""
    models = []
    
    if not os.path.exists(checkpoints_dir):
        return models
    
    for item in os.listdir(checkpoints_dir):
        item_path = os.path.join(checkpoints_dir, item)
        if os.path.isdir(item_path):
            # Try to get model info
            info = {
                "name": item,
                "path": item_path,
                "created": datetime.fromtimestamp(os.path.getctime(item_path)).isoformat(),
                "size_mb": get_directory_size(item_path) / (1024 * 1024)
            }
            
            # Try to extract config info from name
            if "quick" in item:
                info["config"] = "quick"
            elif "standard" in item:
                info["config"] = "standard"
            elif "advanced" in item:
                info["config"] = "advanced"
            else:
                info["config"] = "unknown"
            
            if "small" in item:
                info["model_size"] = "small"
            elif "large" in item:
                info["model_size"] = "large"
            else:
                info["model_size"] = "standard"
            
            models.append(info)
    
    # Sort by creation time (newest first)
    models.sort(key=lambda x: x["created"], reverse=True)
    return models

def get_directory_size(path: str) -> int:
    """Get total size of directory in bytes"""
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(path):
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            if os.path.exists(filepath):
                total_size += os.path.getsize(filepath)
    return total_size

def load_model(checkpoint_path: str) -> Optional[Algorithm]:
    """Load a trained model from checkpoint"""
    try:
        if not os.path.exists(checkpoint_path):
            print(f"❌ Checkpoint not found: {checkpoint_path}")
            return None
        
        print(f"📥 Loading model from: {checkpoint_path}")
        algo = Algorithm.from_checkpoint(checkpoint_path)
        print(f"✅ Model loaded successfully")
        return algo
        
    except Exception as e:
        print(f"❌ Failed to load model: {str(e)}")
        return None

def evaluate_model(algo: Algorithm, env_config: Dict, num_episodes: int = 5) -> Dict:
    """Evaluate a trained model"""
    from env.MarketEnv import MarketEnv
    
    env = MarketEnv(config=env_config)
    results = {
        "episodes": [],
        "total_reward": 0,
        "avg_reward": 0,
        "avg_length": 0,
        "success_rate": 0
    }
    
    for episode in range(num_episodes):
        obs, _ = env.reset()
        episode_reward = 0
        episode_length = 0
        
        while True:
            action = algo.compute_single_action(obs, explore=False)
            obs, reward, terminated, truncated, info = env.step(action)
            episode_reward += reward
            episode_length += 1
            
            if terminated or truncated:
                break
        
        episode_data = {
            "episode": episode + 1,
            "reward": episode_reward,
            "length": episode_length,
            "final_pnl": info.get("pnl", 0),
            "final_price": info.get("price", 0)
        }
        results["episodes"].append(episode_data)
        results["total_reward"] += episode_reward
    
    results["avg_reward"] = results["total_reward"] / num_episodes
    results["avg_length"] = sum(ep["length"] for ep in results["episodes"]) / num_episodes
    results["success_rate"] = sum(1 for ep in results["episodes"] if ep["reward"] > 0) / num_episodes
    
    return results

def cleanup_old_models(checkpoints_dir: str = "../checkpoints", keep_latest: int = 10):
    """Remove old model checkpoints, keeping only the latest N"""
    models = list_available_models(checkpoints_dir)
    
    if len(models) <= keep_latest:
        print(f"📁 {len(models)} models found, no cleanup needed")
        return
    
    models_to_remove = models[keep_latest:]
    print(f"🧹 Removing {len(models_to_remove)} old models...")
    
    for model in models_to_remove:
        try:
            import shutil
            shutil.rmtree(model["path"])
            print(f"  ❌ Removed: {model['name']}")
        except Exception as e:
            print(f"  ⚠️  Failed to remove {model['name']}: {e}")
    
    print(f"✅ Cleanup complete, {keep_latest} models retained")

def compare_models(model_paths: List[str], env_config: Dict) -> Dict:
    """Compare performance of multiple models"""
    results = {}
    
    for path in model_paths:
        model_name = os.path.basename(path)
        print(f"🔍 Evaluating {model_name}...")
        
        algo = load_model(path)
        if algo:
            eval_results = evaluate_model(algo, env_config)
            results[model_name] = eval_results
            algo.stop()
            print(f"  Avg Reward: {eval_results['avg_reward']:.2f}")
        else:
            print(f"  ❌ Failed to load model")
    
    return results 