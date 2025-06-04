import gymnasium as gym
import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import random
from ray.rllib.env.multi_agent_env import MultiAgentEnv

# Import the comprehensive hypothesis analyzer
try:
    from .HypothesisAnalyzer import ComprehensiveHypothesisAnalyzer
except ImportError:
    # Fallback for when running directly
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from HypothesisAnalyzer import ComprehensiveHypothesisAnalyzer

class OrderSide(Enum):
    BUY = 0
    SELL = 1
    HOLD = 2

class AgentType(Enum):
    RL_AGENT = 0
    MARKET_MAKER = 1
    FUNDAMENTAL = 2
    NOISE = 3
    MOMENTUM = 4

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

class TradingAgent:
    """Base class for all trading agents"""
    def __init__(self, agent_id: str, agent_type: AgentType, initial_cash: float, max_inventory: int):
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.cash = initial_cash
        self.inventory = 0
        self.max_inventory = max_inventory
        self.trades = []
        
    def get_action(self, market_state: dict) -> Tuple[OrderSide, float, int]:
        """Return (side, price, quantity) - to be implemented by subclasses"""
        raise NotImplementedError
        
    def update_position(self, trade: Trade, is_buyer: bool):
        """Update agent's position after a trade"""
        if is_buyer:
            self.cash -= trade.price * trade.quantity
            self.inventory += trade.quantity
        else:
            self.cash += trade.price * trade.quantity
            self.inventory -= trade.quantity
        self.trades.append(trade)
    
    def get_pnl(self, current_price: float) -> float:
        """Calculate current profit and loss"""
        return self.cash + self.inventory * current_price - (self.cash + self.inventory * current_price - sum([t.price * t.quantity * (1 if t.buyer_id == self.agent_id else -1) for t in self.trades]))

class MarketMakerAgent(TradingAgent):
    """Market maker that provides liquidity"""
    def __init__(self, agent_id: str, initial_cash: float = 10000, max_inventory: int = 100):
        super().__init__(agent_id, AgentType.MARKET_MAKER, initial_cash, max_inventory)
        self.target_spread = 0.005  # 0.5% spread (tighter)
        
    def get_action(self, market_state: dict) -> Tuple[OrderSide, float, int]:
        current_price = market_state['current_price']
        
        # Market maker strategy: provide liquidity on both sides
        if abs(self.inventory) < self.max_inventory * 0.8:
            if random.random() < 0.5:
                # Place bid (buy order)
                bid_price = current_price * (1 - self.target_spread/2)
                return OrderSide.BUY, bid_price, 5
            else:
                # Place ask (sell order)
                ask_price = current_price * (1 + self.target_spread/2)
                return OrderSide.SELL, ask_price, 5
        
        return OrderSide.HOLD, current_price, 0

class FundamentalAgent(TradingAgent):
    """Fundamental trader that trades based on fair value"""
    def __init__(self, agent_id: str, fundamental_value: float, initial_cash: float = 10000, max_inventory: int = 50):
        super().__init__(agent_id, AgentType.FUNDAMENTAL, initial_cash, max_inventory)
        self.fundamental_value = fundamental_value
        self.threshold = 0.02  # 2% deviation threshold
        
    def get_action(self, market_state: dict) -> Tuple[OrderSide, float, int]:
        current_price = market_state['current_price']
        deviation = (current_price - self.fundamental_value) / self.fundamental_value
        
        if deviation > self.threshold and self.inventory > -self.max_inventory:
            # Price too high, sell
            return OrderSide.SELL, current_price * 0.999, 10
        elif deviation < -self.threshold and self.inventory < self.max_inventory:
            # Price too low, buy
            return OrderSide.BUY, current_price * 1.001, 10
            
        return OrderSide.HOLD, current_price, 0

class NoiseAgent(TradingAgent):
    """Noise trader that makes random trades"""
    def __init__(self, agent_id: str, initial_cash: float = 5000, max_inventory: int = 30):
        super().__init__(agent_id, AgentType.NOISE, initial_cash, max_inventory)
        
    def get_action(self, market_state: dict) -> Tuple[OrderSide, float, int]:
        current_price = market_state['current_price']
        
        if random.random() < 0.1:  # 10% chance to trade
            if random.random() < 0.5 and self.inventory < self.max_inventory:
                # Random buy
                price = current_price * random.uniform(0.995, 1.005)
                return OrderSide.BUY, price, random.randint(1, 5)
            elif self.inventory > -self.max_inventory:
                # Random sell
                price = current_price * random.uniform(0.995, 1.005)
                return OrderSide.SELL, price, random.randint(1, 5)
                
        return OrderSide.HOLD, current_price, 0

class MomentumAgent(TradingAgent):
    """Momentum trader that follows trends"""
    def __init__(self, agent_id: str, initial_cash: float = 8000, max_inventory: int = 40):
        super().__init__(agent_id, AgentType.MOMENTUM, initial_cash, max_inventory)
        self.lookback = 5
        
    def get_action(self, market_state: dict) -> Tuple[OrderSide, float, int]:
        current_price = market_state['current_price']
        price_history = market_state['price_history']
        
        if len(price_history) >= self.lookback:
            recent_return = (current_price - price_history[-self.lookback]) / price_history[-self.lookback]
            
            if recent_return > 0.01 and self.inventory < self.max_inventory:
                # Positive momentum, buy
                return OrderSide.BUY, current_price * 1.001, 8
            elif recent_return < -0.01 and self.inventory > -self.max_inventory:
                # Negative momentum, sell
                return OrderSide.SELL, current_price * 0.999, 8
                
        return OrderSide.HOLD, current_price, 0

class MultiAgentMarketEnv(MultiAgentEnv):
    """
    Multi-agent market environment where multiple RL agents and traditional agents interact
    """
    
    def __init__(self, config=None):
        super(MultiAgentMarketEnv, self).__init__()
        
        # Configuration
        self.config = config or {}
        self.max_steps = self.config.get('max_steps', 1000)
        self.initial_price = self.config.get('initial_price', 100.0)
        self.fundamental_value = self.config.get('fundamental_value', 100.0)
        self.tick_size = self.config.get('tick_size', 0.01)
        self.max_inventory = self.config.get('max_inventory', 100)
        self.initial_cash = self.config.get('initial_cash', 10000.0)
        self.num_rl_agents = self.config.get('num_rl_agents', 3)
        
        # Action space for each RL agent: BUY, SELL, HOLD
        self.action_space = gym.spaces.Discrete(3)
        
        # Observation space: 15-dimensional for each agent
        # [price, fundamental, volatility, spread, imbalance, returns(5), inventory, cash_ratio, other_agents_inventory(2)]
        self.observation_space = gym.spaces.Box(
            low=-np.inf, 
            high=np.inf, 
            shape=(15,), 
            dtype=np.float32
        )
        
        # Multi-agent spaces (required by Ray)
        self.action_spaces = {}
        self.observation_spaces = {}
        for i in range(self.num_rl_agents):
            agent_id = f"rl_agent_{i}"
            self.action_spaces[agent_id] = self.action_space
            self.observation_spaces[agent_id] = self.observation_space
        
        # Required by Ray MultiAgentEnv
        self.possible_agents = [f"rl_agent_{i}" for i in range(self.num_rl_agents)]
        self.agents = self.possible_agents.copy()
        
        # Market state
        self.current_price = self.initial_price
        self.price_history = [self.initial_price]
        self.trades = []
        self.order_book = {'bids': [], 'asks': []}
        self.volatility = 0.01
        self.step_count = 0
        
        # Initialize all agents
        self.rl_agents = {}
        self.traditional_agents = []
        self._initialize_agents()
    
    def _initialize_agents(self):
        """Initialize all agents in the market"""
        # Create RL agents
        for i in range(self.num_rl_agents):
            agent_id = f"rl_agent_{i}"
            self.rl_agents[agent_id] = {
                'cash': 5000.0,
                'inventory': 20,  # Start with some inventory so they can sell
                'max_inventory': 50,
                'trades': []
            }
        
        # Create traditional agents
        self.traditional_agents = [
            MarketMakerAgent("market_maker_1", 15000, 100),
            MarketMakerAgent("market_maker_2", 15000, 100),
            FundamentalAgent("fundamental_1", self.fundamental_value, 12000, 60),
            FundamentalAgent("fundamental_2", self.fundamental_value, 12000, 60),
            NoiseAgent("noise_1", 5000, 30),
            NoiseAgent("noise_2", 5000, 30),
            NoiseAgent("noise_3", 5000, 30),
            MomentumAgent("momentum_1", 8000, 40),
            MomentumAgent("momentum_2", 8000, 40),
        ]
        
        print(f"🏛️ Market initialized with {self.num_rl_agents} RL agents and {len(self.traditional_agents)} traditional agents")
    
    def reset(self, seed=None, options=None):
        """Reset the environment to initial state"""
        super().reset(seed=seed)
        
        self.current_price = self.initial_price
        self.price_history = [self.initial_price]
        self.trades = []
        self.order_book = {'bids': [], 'asks': []}
        self.volatility = 0.01
        self.step_count = 0
        
        # Reset RL agents
        for agent_id in self.rl_agents:
            self.rl_agents[agent_id] = {
                'cash': 5000.0,
                'inventory': 20,  # Start with some inventory
                'max_inventory': 50,
                'trades': [],
                'previous_pnl': 0.0
            }
        
        # Reset traditional agents properly
        for agent in self.traditional_agents:
            agent.inventory = 10  # Give traditional agents some starting inventory too
            agent.trades = []
            # Reset cash based on agent type
            if agent.agent_type == AgentType.MARKET_MAKER:
                agent.cash = 15000.0
            elif agent.agent_type == AgentType.FUNDAMENTAL:
                agent.cash = 12000.0
            elif agent.agent_type == AgentType.NOISE:
                agent.cash = 5000.0
            elif agent.agent_type == AgentType.MOMENTUM:
                agent.cash = 8000.0
        
        # Return observations for all RL agents
        observations = {}
        for agent_id in self.rl_agents:
            observations[agent_id] = self._get_observation(agent_id)
            
        return observations, {}
    
    def step(self, actions: Dict[str, int]):
        """Execute one step with actions from all RL agents"""
        self.step_count += 1
        
        # Collect all orders (RL agents + traditional agents)
        all_orders = []
        
        # Get RL agent orders
        for agent_id, action in actions.items():
            if agent_id in self.rl_agents:
                order = self._rl_agent_action_to_order(agent_id, action)
                if order:
                    all_orders.append(order)
        
        # Get traditional agent orders
        market_state = {
            'current_price': self.current_price,
            'price_history': self.price_history,
            'volatility': self.volatility,
            'step_count': self.step_count
        }
        
        for agent in self.traditional_agents:
            side, price, quantity = agent.get_action(market_state)
            if side != OrderSide.HOLD and quantity > 0:
                order = Order(
                    agent_id=agent.agent_id,
                    agent_type=agent.agent_type,
                    side=side,
                    price=price,
                    quantity=quantity,
                    timestamp=self.step_count
                )
                all_orders.append(order)
        
        # Execute market matching
        executed_trades = self._match_orders(all_orders)
        
        # Update agent positions
        self._update_agent_positions(executed_trades)
        
        # Update market state
        self._update_market_state(executed_trades)
        
        # Calculate rewards for RL agents
        rewards = {}
        for agent_id in self.rl_agents:
            rewards[agent_id] = self._calculate_reward(agent_id)
        
        # Check if episode is done
        episode_terminated = self.step_count >= self.max_steps
        episode_truncated = False
        
        # Get observations for all RL agents
        observations = {}
        infos = {}
        for agent_id in self.rl_agents:
            observations[agent_id] = self._get_observation(agent_id)
            infos[agent_id] = {
                'price': self.current_price,
                'inventory': self.rl_agents[agent_id]['inventory'],
                'cash': self.rl_agents[agent_id]['cash'],
                'pnl': self._calculate_pnl(agent_id),
                'num_trades': len(self.rl_agents[agent_id]['trades'])
            }
        
        # Return dict format for multi-agent
        terminated = {agent_id: episode_terminated for agent_id in self.rl_agents}
        terminated['__all__'] = episode_terminated
        
        truncated = {agent_id: episode_truncated for agent_id in self.rl_agents}
        truncated['__all__'] = episode_truncated
        
        return observations, rewards, terminated, truncated, infos
    
    def _rl_agent_action_to_order(self, agent_id: str, action: int) -> Optional[Order]:
        """Convert RL agent action to order"""
        agent = self.rl_agents[agent_id]
        order_size = 5  # Smaller order size for more trading
        
        if action == OrderSide.BUY.value:
            if agent['cash'] >= self.current_price * order_size:
                return Order(
                    agent_id=agent_id,
                    agent_type=AgentType.RL_AGENT,
                    side=OrderSide.BUY,
                    price=self.current_price * 1.005,  # More aggressive pricing
                    quantity=order_size,
                    timestamp=self.step_count
                )
        elif action == OrderSide.SELL.value:
            if agent['inventory'] >= order_size:
                return Order(
                    agent_id=agent_id,
                    agent_type=AgentType.RL_AGENT,
                    side=OrderSide.SELL,
                    price=self.current_price * 0.995,  # More aggressive pricing
                    quantity=order_size,
                    timestamp=self.step_count
                )
        
        return None
    
    def _match_orders(self, orders: List[Order]) -> List[Trade]:
        """Simple order matching engine"""
        executed_trades = []
        
        # Separate buy and sell orders
        buy_orders = [o for o in orders if o.side == OrderSide.BUY]
        sell_orders = [o for o in orders if o.side == OrderSide.SELL]
        
        # Sort orders by price (best prices first)
        buy_orders.sort(key=lambda x: x.price, reverse=True)  # Highest price first
        sell_orders.sort(key=lambda x: x.price)  # Lowest price first
        
        # Match orders
        for buy_order in buy_orders:
            for sell_order in sell_orders:
                if buy_order.price >= sell_order.price:
                    # Orders can be matched
                    trade_price = (buy_order.price + sell_order.price) / 2
                    trade_quantity = min(buy_order.quantity, sell_order.quantity)
                    
                    trade = Trade(
                        price=trade_price,
                        quantity=trade_quantity,
                        timestamp=self.step_count,
                        buyer_id=buy_order.agent_id,
                        seller_id=sell_order.agent_id
                    )
                    
                    executed_trades.append(trade)
                    
                    # Update order quantities
                    buy_order.quantity -= trade_quantity
                    sell_order.quantity -= trade_quantity
                    
                    # Remove filled orders
                    if buy_order.quantity == 0:
                        break
                    if sell_order.quantity == 0:
                        sell_orders.remove(sell_order)
        
        return executed_trades
    
    def _update_agent_positions(self, trades: List[Trade]):
        """Update all agent positions after trades"""
        for trade in trades:
            # Update RL agents
            if trade.buyer_id in self.rl_agents:
                agent = self.rl_agents[trade.buyer_id]
                agent['cash'] -= trade.price * trade.quantity
                agent['inventory'] += trade.quantity
                agent['trades'].append(trade)
            
            if trade.seller_id in self.rl_agents:
                agent = self.rl_agents[trade.seller_id]
                agent['cash'] += trade.price * trade.quantity
                agent['inventory'] -= trade.quantity
                agent['trades'].append(trade)
            
            # Update traditional agents
            for agent in self.traditional_agents:
                if agent.agent_id == trade.buyer_id:
                    agent.update_position(trade, is_buyer=True)
                elif agent.agent_id == trade.seller_id:
                    agent.update_position(trade, is_buyer=False)
    
    def _update_market_state(self, trades: List[Trade]):
        """Update market state after trades"""
        if trades:
            # Update price to last trade price
            self.current_price = trades[-1].price
            
        # Add to price history
        self.price_history.append(self.current_price)
        
        # Keep only recent history
        if len(self.price_history) > 100:
            self.price_history = self.price_history[-100:]
        
        # Update volatility
        if len(self.price_history) >= 10:
            returns = np.diff(np.log(self.price_history[-10:]))
            self.volatility = np.std(returns) * np.sqrt(252)  # Annualized
        
        # Add trades to global list
        self.trades.extend(trades)
    
    def _calculate_reward(self, agent_id: str) -> float:
        """Calculate reward for an RL agent"""
        agent = self.rl_agents[agent_id]
        reward = 0.0
        
        # PnL-based reward
        current_pnl = self._calculate_pnl(agent_id)
        if 'previous_pnl' in agent:
            pnl_change = current_pnl - agent['previous_pnl']
            reward += pnl_change * 0.1
        agent['previous_pnl'] = current_pnl
        
        # Trading activity reward
        recent_trades = [t for t in agent['trades'] if t.timestamp > self.step_count - 10]
        if recent_trades:
            reward += 0.01 * len(recent_trades)
        
        # Inventory penalty
        reward -= 0.0001 * abs(agent['inventory'])
        
        return reward
    
    def _calculate_pnl(self, agent_id: str) -> float:
        """Calculate PnL for an RL agent"""
        agent = self.rl_agents[agent_id]
        total_value = agent['cash'] + agent['inventory'] * self.current_price
        return total_value - (5000.0 + 20 * self.initial_price)  # Adjust for initial inventory
    
    def _get_observation(self, agent_id: str) -> np.ndarray:
        """Get observation for a specific RL agent"""
        agent = self.rl_agents[agent_id]
        
        # Calculate recent returns
        recent_returns = np.zeros(5)
        if len(self.price_history) > 5:
            prices = np.array(self.price_history[-6:])
            returns = np.diff(np.log(prices))
            recent_returns[:len(returns)] = returns
        
        # Calculate spread (from recent trades)
        spread = 0.02  # Default
        if len(self.trades) > 0:
            recent_prices = [t.price for t in self.trades[-10:]]
            if len(recent_prices) > 1:
                spread = (max(recent_prices) - min(recent_prices)) / np.mean(recent_prices)
        
        # Order book imbalance (simplified)
        imbalance = random.uniform(-0.1, 0.1)
        
        # Cash ratio
        total_value = agent['cash'] + agent['inventory'] * self.current_price
        cash_ratio = agent['cash'] / total_value if total_value > 0 else 0
        
        # Other agents' average inventory (market sentiment)
        other_rl_inventories = [self.rl_agents[aid]['inventory'] for aid in self.rl_agents if aid != agent_id]
        avg_rl_inventory = np.mean(other_rl_inventories) if other_rl_inventories else 0
        
        traditional_inventories = [a.inventory for a in self.traditional_agents]
        avg_traditional_inventory = np.mean(traditional_inventories) if traditional_inventories else 0
        
        obs = np.array([
            self.current_price / 100.0,  # 1: Normalized price
            self.fundamental_value / 100.0,  # 2: Normalized fundamental
            self.volatility,  # 3: Volatility
            spread,  # 4: Spread
            imbalance,  # 5: Order book imbalance
            recent_returns[0],  # 6: Return t-1
            recent_returns[1],  # 7: Return t-2
            recent_returns[2],  # 8: Return t-3
            recent_returns[3],  # 9: Return t-4
            recent_returns[4],  # 10: Return t-5
            agent['inventory'] / agent['max_inventory'],  # 11: Normalized inventory
            cash_ratio,  # 12: Cash ratio
            avg_rl_inventory / 50.0,  # 13: Other RL agents avg inventory
            avg_traditional_inventory / 50.0,  # 14: Traditional agents avg inventory
            len(self.trades) / 1000.0,  # 15: Market activity level
        ], dtype=np.float32)
        
        return obs
    
    def render(self, mode='human'):
        """Render the environment"""
        if mode == 'human':
            print(f"Step: {self.step_count}, Price: ${self.current_price:.2f}")
            print(f"RL Agents: {[(aid, f'${self._calculate_pnl(aid):.2f}') for aid in self.rl_agents]}")
            print(f"Total Trades: {len(self.trades)}") 