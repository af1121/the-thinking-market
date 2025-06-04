"""
Training configuration for RL agents
"""

# Environment configurations
ENV_CONFIGS = {
    'quick': {
        'max_steps': 100,
        'initial_price': 100.0,
        'fundamental_value': 100.0,
        'tick_size': 0.01,
        'max_inventory': 25,
        'initial_cash': 2500.0
    },
    'standard': {
        'max_steps': 200,
        'initial_price': 100.0,
        'fundamental_value': 100.0,
        'tick_size': 0.01,
        'max_inventory': 50,
        'initial_cash': 5000.0
    },
    'advanced': {
        'max_steps': 500,
        'initial_price': 100.0,
        'fundamental_value': 100.0,
        'tick_size': 0.01,
        'max_inventory': 100,
        'initial_cash': 10000.0
    },
    'extended': {
        'max_steps': 500,
        'initial_price': 100.0,
        'fundamental_value': 100.0,
        'tick_size': 0.01,
        'max_inventory': 100,
        'initial_cash': 10000.0
    }
}

# PPO training configurations
PPO_CONFIGS = {
    'quick': {
        'train_batch_size': 200,
        'minibatch_size': 32,
        'num_epochs': 2,
        'lr': 5e-4,
        'gamma': 0.99,
        'lambda_': 0.95,
        'clip_param': 0.2,
        'entropy_coeff': 0.01,
        'vf_loss_coeff': 0.5,
        'iterations': 10
    },
    'standard': {
        'train_batch_size': 500,
        'minibatch_size': 64,
        'num_epochs': 3,
        'lr': 3e-4,
        'gamma': 0.99,
        'lambda_': 0.95,
        'clip_param': 0.2,
        'entropy_coeff': 0.01,
        'vf_loss_coeff': 0.5,
        'iterations': 50
    },
    'advanced': {
        'train_batch_size': 1000,
        'minibatch_size': 128,
        'num_epochs': 5,
        'lr': 1e-4,
        'gamma': 0.99,
        'lambda_': 0.95,
        'clip_param': 0.2,
        'entropy_coeff': 0.005,
        'vf_loss_coeff': 0.5,
        'iterations': 100
    }
}

# Model architectures
MODEL_CONFIGS = {
    'small': {
        "fcnet_hiddens": [32, 32],
        "fcnet_activation": "relu"
    },
    'standard': {
        "fcnet_hiddens": [64, 64],
        "fcnet_activation": "relu"
    },
    'large': {
        "fcnet_hiddens": [128, 128, 64],
        "fcnet_activation": "relu"
    }
} 