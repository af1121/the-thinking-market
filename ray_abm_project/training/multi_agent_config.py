from ray.rllib.algorithms.ppo import PPOConfig
from ray.rllib.env.multi_agent_env import MultiAgentEnv
from ray.rllib.policy.policy import PolicySpec
from ray.tune.registry import register_env
import sys
import os

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from env.MultiAgentMarketEnv import MultiAgentMarketEnv

# Register the environment for Ray workers
def env_creator(env_config):
    return MultiAgentMarketEnv(env_config)

register_env("MultiAgentMarketEnv", env_creator)

def get_multi_agent_config():
    """
    Configuration for training multiple RL agents in a shared market environment
    """
    
    # Environment configuration
    env_config = {
        'max_steps': 500,
        'initial_price': 100.0,
        'fundamental_value': 100.0,
        'num_rl_agents': 3,  # Number of RL agents to train
    }
    
    # Multi-agent policies - each RL agent gets its own policy
    policies = {}
    policy_mapping_fn_map = {}
    
    for i in range(env_config['num_rl_agents']):
        agent_id = f"rl_agent_{i}"
        policies[f"policy_{i}"] = PolicySpec()
        policy_mapping_fn_map[agent_id] = f"policy_{i}"
    
    def policy_mapping_fn(agent_id, episode, worker, **kwargs):
        return policy_mapping_fn_map.get(agent_id, "policy_0")
    
    # PPO Configuration
    config = (
        PPOConfig()
        .environment(
            env="MultiAgentMarketEnv",
            env_config=env_config
        )
        .multi_agent(
            policies=policies,
            policy_mapping_fn=policy_mapping_fn,
            policies_to_train=list(policies.keys())
        )
        .training(
            # PPO hyperparameters
            lr=3e-4,
            gamma=0.99,
            lambda_=0.95,
            clip_param=0.2,
            vf_clip_param=10.0,
            entropy_coeff=0.01,
            
            # Training batch sizes
            train_batch_size=4000,
            minibatch_size=128,
            num_epochs=10,
            
            # Model architecture
            model={
                "fcnet_hiddens": [256, 256],
                "fcnet_activation": "relu",
                "vf_share_layers": False,
            }
        )
        .env_runners(
            num_env_runners=2,
            rollout_fragment_length=200,
            batch_mode="complete_episodes"
        )
        .resources(
            num_gpus=0,
            num_cpus_per_worker=1
        )
        .debugging(
            log_level="INFO"
        )
    )
    
    return config

def get_competitive_config():
    """
    Configuration where RL agents compete more directly
    """
    
    # Environment configuration with more competition
    env_config = {
        'max_steps': 1000,
        'initial_price': 100.0,
        'fundamental_value': 100.0,
        'num_rl_agents': 4,  # More agents for competition
    }
    
    # Shared policy - all agents use the same policy (self-play)
    policies = {
        "shared_policy": PolicySpec()
    }
    
    def policy_mapping_fn(agent_id, episode, worker, **kwargs):
        return "shared_policy"
    
    # PPO Configuration optimized for competition
    config = (
        PPOConfig()
        .environment(
            env="MultiAgentMarketEnv",
            env_config=env_config
        )
        .multi_agent(
            policies=policies,
            policy_mapping_fn=policy_mapping_fn,
            policies_to_train=["shared_policy"]
        )
        .training(
            # More aggressive learning for competition
            lr=5e-4,
            gamma=0.95,  # Shorter horizon for trading
            lambda_=0.9,
            clip_param=0.3,
            vf_clip_param=10.0,
            entropy_coeff=0.02,  # More exploration
            
            # Larger batches for stability
            train_batch_size=8000,
            minibatch_size=256,
            num_epochs=15,
            
            # Deeper network for complex interactions
            model={
                "fcnet_hiddens": [512, 256, 128],
                "fcnet_activation": "tanh",
                "vf_share_layers": False,
            }
        )
        .env_runners(
            num_env_runners=4,
            rollout_fragment_length=250,
            batch_mode="complete_episodes"
        )
        .resources(
            num_gpus=0,
            num_cpus_per_worker=1
        )
        .debugging(
            log_level="INFO"
        )
    )
    
    return config

def get_diverse_config():
    """
    Configuration with diverse agent types and strategies
    """
    
    # Environment configuration
    env_config = {
        'max_steps': 750,
        'initial_price': 100.0,
        'fundamental_value': 100.0,
        'num_rl_agents': 3,
    }
    
    # Different policies for different agent types
    policies = {
        "aggressive_policy": PolicySpec(
            config={
                "gamma": 0.9,  # Short-term focus
                "lr": 1e-3,    # Fast learning
            }
        ),
        "conservative_policy": PolicySpec(
            config={
                "gamma": 0.99,  # Long-term focus
                "lr": 1e-4,     # Slow learning
            }
        ),
        "balanced_policy": PolicySpec(
            config={
                "gamma": 0.95,  # Medium-term focus
                "lr": 3e-4,     # Medium learning rate
            }
        )
    }
    
    # Map agents to different policies
    policy_map = {
        "rl_agent_0": "aggressive_policy",
        "rl_agent_1": "conservative_policy", 
        "rl_agent_2": "balanced_policy"
    }
    
    def policy_mapping_fn(agent_id, episode, worker, **kwargs):
        return policy_map.get(agent_id, "balanced_policy")
    
    # PPO Configuration
    config = (
        PPOConfig()
        .environment(
            env="MultiAgentMarketEnv",
            env_config=env_config
        )
        .multi_agent(
            policies=policies,
            policy_mapping_fn=policy_mapping_fn,
            policies_to_train=list(policies.keys())
        )
        .training(
            # Base hyperparameters
            lr=3e-4,
            gamma=0.95,
            lambda_=0.95,
            clip_param=0.2,
            vf_clip_param=10.0,
            entropy_coeff=0.01,
            
            train_batch_size=6000,
            minibatch_size=200,
            num_epochs=12,
            
            model={
                "fcnet_hiddens": [256, 128],
                "fcnet_activation": "relu",
                "vf_share_layers": False,
            }
        )
        .env_runners(
            num_env_runners=3,
            rollout_fragment_length=250,
            batch_mode="complete_episodes"
        )
        .resources(
            num_gpus=0,
            num_cpus_per_worker=1
        )
        .debugging(
            log_level="INFO"
        )
    )
    
    return config

# Configuration presets
CONFIGS = {
    "multi_agent": get_multi_agent_config,
    "competitive": get_competitive_config,
    "diverse": get_diverse_config
}

if __name__ == "__main__":
    # Test configuration
    config = get_multi_agent_config()
    print("✅ Multi-agent configuration created successfully!")
    print(f"📊 Environment: {config.env_config}")
    print(f"🤖 Policies: {list(config.multi_agent_config['policies'].keys())}") 