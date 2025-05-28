import gymnasium as gym
import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import random

class OrderSide(Enum):
    BUY = 0
    SELL = 1
    HOLD = 2

class AgentType(Enum):
    MARKET_MAKER = 0
    FUNDAMENTAL = 1
    NOISE = 2
    MOMENTUM = 3
    ADAPTIVE_RL = 4

@dataclass
class Order:
    agent_id: str
    agent_type: AgentType
    side: OrderSide
    price: float
    quantity: int
    timestamp: int

@dataclass
class Trade:
    price: float
    quantity: int
    timestamp: int
    buyer_id: str
    seller_id: str

class MarketEnv(gym.Env):
    """
    Gym-compatible market environment for training RL agents.
    
    Observation Space: [current_price, fundamental_value, volatility, spread, 
                       order_book_imbalance, recent_returns(5), inventory, cash_ratio]
    Action Space: Discrete(3) - [BUY, SELL, HOLD]
    """
    
    def __init__(self, config=None):
        super(MarketEnv, self).__init__()
        
        # Configuration
        self.config = config or {}
        self.max_steps = self.config.get('max_steps', 1000)
        self.initial_price = self.config.get('initial_price', 100.0)
        self.fundamental_value = self.config.get('fundamental_value', 100.0)
        self.tick_size = self.config.get('tick_size', 0.01)
        self.max_inventory = self.config.get('max_inventory', 100)
        self.initial_cash = self.config.get('initial_cash', 10000.0)
        
        # Action space: BUY, SELL, HOLD
        self.action_space = gym.spaces.Discrete(3)
        
        # Observation space: 12-dimensional
        # [price, fundamental, volatility, spread, imbalance, returns(5), inventory, cash_ratio]
        self.observation_space = gym.spaces.Box(
            low=-np.inf, 
            high=np.inf, 
            shape=(12,), 
            dtype=np.float32
        )
        
        # Market state
        self.current_price = self.initial_price
        self.price_history = [self.initial_price]
        self.trades = []
        self.order_book = {'bids': [], 'asks': []}
        self.volatility = 0.01
        self.spread = 0.02
        
        # Agent state (for the RL agent)
        self.inventory = 0
        self.cash = self.initial_cash
        self.step_count = 0
        
        # Market participants (traditional agents)
        self.market_agents = []
        self._initialize_market_agents()
        
        # Market stress parameters
        self.stress_mode = False
        self.stress_magnitude = 0.0
        
    def _initialize_market_agents(self):
        """Initialize traditional trading agents"""
        # This will be populated with traditional agents
        # For now, we'll simulate their behavior
        pass
    
    def reset(self, seed=None, options=None):
        """Reset the environment to initial state"""
        super().reset(seed=seed)
        
        self.current_price = self.initial_price
        self.price_history = [self.initial_price]
        self.trades = []
        self.order_book = {'bids': [], 'asks': []}
        self.volatility = 0.01
        self.spread = 0.02
        self.inventory = 0
        self.cash = self.initial_cash
        self.step_count = 0
        self.stress_mode = False
        self.stress_magnitude = 0.0
        
        return self._get_observation(), {}
    
    def step(self, action):
        """Execute one step in the environment"""
        self.step_count += 1
        
        # Execute RL agent action
        reward = self._execute_action(action)
        
        # Simulate traditional agents' actions
        self._simulate_traditional_agents()
        
        # Update market state
        self._update_market_state()
        
        # Check if episode is done
        terminated = (self.step_count >= self.max_steps or 
                     abs(self.inventory) > self.max_inventory or
                     self.cash < 0)
        truncated = False
        
        # Get new observation
        obs = self._get_observation()
        
        # Additional info
        info = {
            'price': self.current_price,
            'inventory': self.inventory,
            'cash': self.cash,
            'pnl': self._calculate_pnl(),
            'volatility': self.volatility
        }
        
        return obs, reward, terminated, truncated, info
    
    def _execute_action(self, action):
        """Execute the RL agent's action and return reward"""
        reward = 0.0
        order_size = 10  # Fixed order size for simplicity
        
        if action == OrderSide.BUY.value:
            if self.cash >= self.current_price * order_size:
                # Execute buy order
                execution_price = self.current_price * (1 + self.spread/2)
                self.cash -= execution_price * order_size
                self.inventory += order_size
                
                # Record trade
                trade = Trade(
                    price=execution_price,
                    quantity=order_size,
                    timestamp=self.step_count,
                    buyer_id="rl_agent",
                    seller_id="market"
                )
                self.trades.append(trade)
                
                # Reward based on price movement prediction
                if len(self.price_history) > 1:
                    price_change = self.current_price - self.price_history[-2]
                    reward = price_change * order_size  # Profit if price goes up
                
        elif action == OrderSide.SELL.value:
            if self.inventory >= order_size:
                # Execute sell order
                execution_price = self.current_price * (1 - self.spread/2)
                self.cash += execution_price * order_size
                self.inventory -= order_size
                
                # Record trade
                trade = Trade(
                    price=execution_price,
                    quantity=order_size,
                    timestamp=self.step_count,
                    buyer_id="market",
                    seller_id="rl_agent"
                )
                self.trades.append(trade)
                
                # Reward based on price movement prediction
                if len(self.price_history) > 1:
                    price_change = self.price_history[-2] - self.current_price
                    reward = price_change * order_size  # Profit if price goes down
        
        # Add inventory penalty to encourage balanced trading
        inventory_penalty = -0.001 * abs(self.inventory)
        reward += inventory_penalty
        
        return reward
    
    def _simulate_traditional_agents(self):
        """Simulate the behavior of traditional trading agents"""
        # Market Maker behavior
        if random.random() < 0.3:
            self._add_liquidity()
        
        # Fundamental trader behavior
        if random.random() < 0.2:
            self._fundamental_trade()
        
        # Noise trader behavior
        if random.random() < 0.1:
            self._noise_trade()
        
        # Momentum trader behavior
        if random.random() < 0.15:
            self._momentum_trade()
    
    def _add_liquidity(self):
        """Market maker adds liquidity"""
        bid_price = self.current_price * (1 - self.spread/2)
        ask_price = self.current_price * (1 + self.spread/2)
        
        # Simulate market maker orders
        if random.random() < 0.5:
            # Sometimes execute against market maker
            price_impact = random.uniform(-0.001, 0.001)
            self.current_price *= (1 + price_impact)
    
    def _fundamental_trade(self):
        """Fundamental trader trades based on fundamental value"""
        deviation = (self.current_price - self.fundamental_value) / self.fundamental_value
        
        if abs(deviation) > 0.02:  # 2% threshold
            # Price impact from fundamental trading
            impact = -0.5 * deviation * random.uniform(0.5, 1.5)
            self.current_price *= (1 + impact * 0.001)
    
    def _noise_trade(self):
        """Noise trader makes random trades"""
        # Random price impact
        impact = random.uniform(-0.002, 0.002)
        self.current_price *= (1 + impact)
    
    def _momentum_trade(self):
        """Momentum trader follows trends"""
        if len(self.price_history) >= 5:
            recent_trend = (self.current_price - self.price_history[-5]) / self.price_history[-5]
            if abs(recent_trend) > 0.01:  # 1% threshold
                # Momentum amplification
                momentum_impact = 0.3 * recent_trend * random.uniform(0.5, 1.5)
                self.current_price *= (1 + momentum_impact * 0.001)
    
    def _update_market_state(self):
        """Update market state after all actions"""
        # Add current price to history
        self.price_history.append(self.current_price)
        
        # Keep only recent history
        if len(self.price_history) > 100:
            self.price_history = self.price_history[-100:]
        
        # Update volatility
        if len(self.price_history) >= 10:
            returns = np.diff(np.log(self.price_history[-10:]))
            self.volatility = np.std(returns) * np.sqrt(252)  # Annualized
        
        # Apply market stress if active
        if self.stress_mode:
            stress_impact = self.stress_magnitude * random.uniform(-1, 1)
            self.current_price *= (1 + stress_impact)
        
        # Ensure price stays positive
        self.current_price = max(self.current_price, 0.01)
    
    def _get_observation(self):
        """Get current observation state"""
        # Calculate recent returns (last 5 periods)
        recent_returns = np.zeros(5)
        if len(self.price_history) > 5:
            prices = np.array(self.price_history[-6:])
            returns = np.diff(np.log(prices))
            recent_returns[:len(returns)] = returns
        
        # Order book imbalance (simplified)
        imbalance = random.uniform(-0.1, 0.1)  # Placeholder
        
        # Cash ratio
        total_value = self.cash + self.inventory * self.current_price
        cash_ratio = self.cash / total_value if total_value > 0 else 0
        
        # Normalize inventory
        normalized_inventory = self.inventory / self.max_inventory
        
        obs = np.array([
            self.current_price / 100.0,  # 1: Normalized price
            self.fundamental_value / 100.0,  # 2: Normalized fundamental
            self.volatility,  # 3: Volatility
            self.spread,  # 4: Spread
            imbalance,  # 5: Order book imbalance
            recent_returns[0],  # 6: Return t-1
            recent_returns[1],  # 7: Return t-2
            recent_returns[2],  # 8: Return t-3
            recent_returns[3],  # 9: Return t-4
            recent_returns[4],  # 10: Return t-5
            normalized_inventory,  # 11: Normalized inventory
            cash_ratio  # 12: Cash ratio
        ], dtype=np.float32)
        
        # Ensure we have exactly 12 dimensions (not 13 as originally specified)
        assert len(obs) == 12, f"Observation has {len(obs)} dimensions, expected 12"
        
        return obs
    
    def _calculate_pnl(self):
        """Calculate current profit and loss"""
        total_value = self.cash + self.inventory * self.current_price
        return total_value - self.initial_cash
    
    def inject_market_stress(self, stress_type: str, magnitude: float):
        """Inject market stress for testing"""
        self.stress_mode = True
        self.stress_magnitude = magnitude
        
        if stress_type == "flash_crash":
            self.current_price *= (1 - magnitude)
        elif stress_type == "volatility_spike":
            self.volatility *= (1 + magnitude)
        elif stress_type == "liquidity_shock":
            self.spread *= (1 + magnitude)
    
    def render(self, mode='human'):
        """Render the environment (optional)"""
        if mode == 'human':
            print(f"Step: {self.step_count}, Price: {self.current_price:.2f}, "
                  f"Inventory: {self.inventory}, Cash: {self.cash:.2f}, "
                  f"PnL: {self._calculate_pnl():.2f}") 