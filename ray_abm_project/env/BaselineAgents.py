#!/usr/bin/env python3
"""
Baseline Trading Agents for Comparison

This module implements various baseline trading strategies to compare against
RL agents, providing proper benchmarks for thesis evaluation.
"""

import numpy as np
import random
from typing import Dict, List, Tuple, Any
from abc import ABC, abstractmethod

class BaselineAgent(ABC):
    """Abstract base class for baseline trading agents"""
    
    def __init__(self, name: str, initial_cash: float = 10000.0, max_inventory: int = 50):
        self.name = name
        self.initial_cash = initial_cash
        self.max_inventory = max_inventory
        self.reset()
    
    def reset(self):
        """Reset agent state"""
        self.cash = self.initial_cash
        self.inventory = 0
        self.total_trades = 0
        self.profitable_trades = 0
        self.trade_history = []
        self.price_history = []
        self.action_history = []
        
    @abstractmethod
    def get_action(self, observation: np.ndarray) -> int:
        """Get trading action based on observation"""
        pass
    
    def update_state(self, price: float, action: int, reward: float):
        """Update agent state after action"""
        self.price_history.append(price)
        self.action_history.append(action)
        
        if action == 1:  # Buy
            if self.inventory < self.max_inventory and self.cash >= price:
                self.inventory += 1
                self.cash -= price
                self.total_trades += 1
                self.trade_history.append(('BUY', price))
        elif action == 2:  # Sell
            if self.inventory > 0:
                self.inventory -= 1
                self.cash += price
                self.total_trades += 1
                self.trade_history.append(('SELL', price))
                
                # Check if profitable (simple heuristic)
                if len(self.trade_history) >= 2:
                    last_buy = None
                    for i in range(len(self.trade_history) - 1, -1, -1):
                        if self.trade_history[i][0] == 'BUY':
                            last_buy = self.trade_history[i][1]
                            break
                    if last_buy and price > last_buy:
                        self.profitable_trades += 1
    
    def get_portfolio_value(self, current_price: float) -> float:
        """Calculate total portfolio value"""
        return self.cash + (self.inventory * current_price)
    
    def get_performance_metrics(self, current_price: float) -> Dict[str, float]:
        """Calculate performance metrics"""
        portfolio_value = self.get_portfolio_value(current_price)
        total_return = (portfolio_value - self.initial_cash) / self.initial_cash
        
        win_rate = 0.0
        if self.total_trades > 0:
            win_rate = self.profitable_trades / self.total_trades
        
        return {
            'total_return': total_return,
            'portfolio_value': portfolio_value,
            'total_trades': self.total_trades,
            'win_rate': win_rate,
            'cash': self.cash,
            'inventory': self.inventory
        }

class RandomAgent(BaselineAgent):
    """Random trading agent - completely random actions"""
    
    def __init__(self, seed: int = 42):
        super().__init__("Random Agent")
        random.seed(seed)
        np.random.seed(seed)
    
    def get_action(self, observation: np.ndarray) -> int:
        """Random action selection"""
        return random.choice([0, 1, 2])  # Hold, Buy, Sell

class BuyAndHoldAgent(BaselineAgent):
    """Buy and hold strategy - buy once and hold"""
    
    def __init__(self):
        super().__init__("Buy & Hold Agent")
        self.has_bought = False
    
    def reset(self):
        super().reset()
        self.has_bought = False
    
    def get_action(self, observation: np.ndarray) -> int:
        """Buy once at the beginning, then hold"""
        if not self.has_bought and self.cash > 0:
            self.has_bought = True
            return 1  # Buy
        return 0  # Hold

class MomentumAgent(BaselineAgent):
    """Momentum strategy - follow price trends"""
    
    def __init__(self, lookback: int = 5, threshold: float = 0.02):
        super().__init__("Momentum Agent")
        self.lookback = lookback
        self.threshold = threshold
    
    def get_action(self, observation: np.ndarray) -> int:
        """Buy on upward momentum, sell on downward momentum"""
        if len(self.price_history) < self.lookback:
            return 0  # Hold until enough history
        
        # Calculate momentum (price change over lookback period)
        recent_prices = self.price_history[-self.lookback:]
        momentum = (recent_prices[-1] - recent_prices[0]) / recent_prices[0]
        
        if momentum > self.threshold:
            return 1  # Buy on positive momentum
        elif momentum < -self.threshold:
            return 2  # Sell on negative momentum
        else:
            return 0  # Hold

class MeanReversionAgent(BaselineAgent):
    """Mean reversion strategy - buy low, sell high relative to moving average"""
    
    def __init__(self, window: int = 10, threshold: float = 0.05):
        super().__init__("Mean Reversion Agent")
        self.window = window
        self.threshold = threshold
    
    def get_action(self, observation: np.ndarray) -> int:
        """Buy when price is below MA, sell when above MA"""
        if len(self.price_history) < self.window:
            return 0  # Hold until enough history
        
        # Calculate moving average
        recent_prices = self.price_history[-self.window:]
        moving_avg = np.mean(recent_prices)
        current_price = self.price_history[-1]
        
        # Calculate deviation from moving average
        deviation = (current_price - moving_avg) / moving_avg
        
        if deviation < -self.threshold:
            return 1  # Buy when price is significantly below MA
        elif deviation > self.threshold:
            return 2  # Sell when price is significantly above MA
        else:
            return 0  # Hold

class RSIAgent(BaselineAgent):
    """RSI-based trading strategy"""
    
    def __init__(self, period: int = 14, oversold: float = 30, overbought: float = 70):
        super().__init__("RSI Agent")
        self.period = period
        self.oversold = oversold
        self.overbought = overbought
    
    def calculate_rsi(self, prices: List[float]) -> float:
        """Calculate RSI indicator"""
        if len(prices) < self.period + 1:
            return 50.0  # Neutral RSI
        
        deltas = np.diff(prices)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        
        avg_gain = np.mean(gains[-self.period:])
        avg_loss = np.mean(losses[-self.period:])
        
        if avg_loss == 0:
            return 100.0
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def get_action(self, observation: np.ndarray) -> int:
        """Trade based on RSI signals"""
        if len(self.price_history) < self.period + 1:
            return 0  # Hold until enough history
        
        rsi = self.calculate_rsi(self.price_history)
        
        if rsi < self.oversold:
            return 1  # Buy when oversold
        elif rsi > self.overbought:
            return 2  # Sell when overbought
        else:
            return 0  # Hold

class MovingAverageCrossoverAgent(BaselineAgent):
    """Moving average crossover strategy"""
    
    def __init__(self, short_window: int = 5, long_window: int = 20):
        super().__init__("MA Crossover Agent")
        self.short_window = short_window
        self.long_window = long_window
        self.position = 0  # Track current position for crossover signals
    
    def get_action(self, observation: np.ndarray) -> int:
        """Trade based on moving average crossover"""
        if len(self.price_history) < self.long_window:
            return 0  # Hold until enough history
        
        # Calculate moving averages
        short_ma = np.mean(self.price_history[-self.short_window:])
        long_ma = np.mean(self.price_history[-self.long_window:])
        
        # Previous MAs for crossover detection
        if len(self.price_history) >= self.long_window + 1:
            prev_short_ma = np.mean(self.price_history[-self.short_window-1:-1])
            prev_long_ma = np.mean(self.price_history[-self.long_window-1:-1])
            
            # Bullish crossover (short MA crosses above long MA)
            if prev_short_ma <= prev_long_ma and short_ma > long_ma:
                return 1  # Buy signal
            
            # Bearish crossover (short MA crosses below long MA)
            elif prev_short_ma >= prev_long_ma and short_ma < long_ma:
                return 2  # Sell signal
        
        return 0  # Hold

class BaselineComparison:
    """Class to run and compare baseline agents"""
    
    def __init__(self):
        self.agents = {
            'random': RandomAgent(),
            'buy_hold': BuyAndHoldAgent(),
            'momentum': MomentumAgent(),
            'mean_reversion': MeanReversionAgent(),
            'rsi': RSIAgent(),
            'ma_crossover': MovingAverageCrossoverAgent()
        }
        self.results = {}
    
    def run_comparison(self, env, episodes: int = 10) -> Dict[str, Dict[str, float]]:
        """Run all baseline agents and collect results"""
        self.results = {}
        
        for agent_name, agent in self.agents.items():
            print(f"Running {agent_name}...")
            episode_results = []
            
            for episode in range(episodes):
                agent.reset()
                obs, _ = env.reset()
                total_reward = 0
                
                for step in range(200):  # Max steps per episode
                    action = agent.get_action(obs)
                    obs, reward, terminated, truncated, info = env.step(action)
                    
                    # Update agent state
                    current_price = obs[0] if len(obs) > 0 else 100.0
                    agent.update_state(current_price, action, reward)
                    total_reward += reward
                    
                    if terminated or truncated:
                        break
                
                # Get final performance metrics
                final_price = obs[0] if len(obs) > 0 else 100.0
                metrics = agent.get_performance_metrics(final_price)
                metrics['total_reward'] = total_reward
                episode_results.append(metrics)
            
            # Calculate average performance across episodes
            avg_metrics = {}
            for key in episode_results[0].keys():
                avg_metrics[key] = np.mean([ep[key] for ep in episode_results])
                avg_metrics[f'{key}_std'] = np.std([ep[key] for ep in episode_results])
            
            self.results[agent_name] = avg_metrics
        
        return self.results
    
    def get_comparison_summary(self) -> Dict[str, Any]:
        """Get summary comparison of all agents"""
        if not self.results:
            return {}
        
        summary = {
            'best_return': max(self.results.items(), key=lambda x: x[1]['total_return']),
            'best_reward': max(self.results.items(), key=lambda x: x[1]['total_reward']),
            'most_trades': max(self.results.items(), key=lambda x: x[1]['total_trades']),
            'best_win_rate': max(self.results.items(), key=lambda x: x[1]['win_rate']),
            'rankings': {}
        }
        
        # Create rankings for each metric
        metrics = ['total_return', 'total_reward', 'win_rate', 'total_trades']
        for metric in metrics:
            sorted_agents = sorted(self.results.items(), 
                                 key=lambda x: x[1][metric], reverse=True)
            summary['rankings'][metric] = [(name, results[metric]) for name, results in sorted_agents]
        
        return summary

if __name__ == "__main__":
    # Example usage
    print("Baseline Trading Agents Module")
    print("Available agents:")
    comparison = BaselineComparison()
    for name, agent in comparison.agents.items():
        print(f"  - {name}: {agent.name}") 