#!/usr/bin/env python3
"""
RL Agent Service - Backend API for Real Trained RL Agents

This service loads the actual trained RL agents and provides a REST API
for the frontend simulation to interact with them in real-time.
"""

import os
import sys
import json
import pickle
import numpy as np
import torch
import torch.nn as nn
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import threading
import time

# Add the training directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'training'))
from simple_train_agents import SimpleRLAgent, TrainedAgentWrapper

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

class RLAgentService:
    """Service to manage and run trained RL agents"""
    
    def __init__(self):
        self.agents = {}
        self.agent_registry = {}
        self.load_agent_registry()
        self.load_trained_agents()
        
    def load_agent_registry(self):
        """Load the agent registry to find trained models"""
        try:
            registry_path = os.path.join(os.path.dirname(__file__), '..', 'checkpoints', 'simple_agent_registry.json')
            with open(registry_path, 'r') as f:
                self.agent_registry = json.load(f)
            print(f"✅ Loaded agent registry with {len(self.agent_registry['agents'])} agents")
        except Exception as e:
            print(f"❌ Failed to load agent registry: {e}")
            self.agent_registry = {'agents': {}}
    
    def load_trained_agents(self):
        """Load all trained RL agents"""
        for agent_name, agent_info in self.agent_registry.get('agents', {}).items():
            try:
                # Convert relative path to absolute path
                agent_path = agent_info['path']
                if agent_path.startswith('../'):
                    agent_path = os.path.join(os.path.dirname(__file__), '..', agent_path[3:])
                
                # Load the agent
                wrapper = TrainedAgentWrapper(agent_path, agent_name)
                
                self.agents[agent_name] = {
                    'wrapper': wrapper,
                    'info': agent_info,
                    'active': False,
                    'position': 0,
                    'cash': 10000.0,
                    'trades': [],
                    'performance': {
                        'total_return': 0.0,
                        'sharpe_ratio': 0.0,
                        'max_drawdown': 0.0,
                        'win_rate': 0.0
                    }
                }
                
                print(f"✅ Loaded RL agent: {agent_name}")
                
            except Exception as e:
                print(f"❌ Failed to load agent {agent_name}: {e}")
    
    def get_agent_action(self, agent_name, market_observation):
        """Get action from a specific RL agent"""
        if agent_name not in self.agents:
            return None
            
        agent = self.agents[agent_name]
        if not agent['active']:
            return None
            
        try:
            # Convert market observation to agent format
            observation = self._convert_market_observation(market_observation, agent_name)
            
            # Get action from trained agent
            action = agent['wrapper'].get_action(observation)
            
            # Convert action to order format
            order = self._convert_action_to_order(action, market_observation, agent_name)
            
            return order
            
        except Exception as e:
            print(f"Warning: Failed to get action from {agent_name}: {e}")
            return None
    
    def _convert_market_observation(self, market_obs, agent_name):
        """Convert market observation to RL agent observation format"""
        try:
            # Extract key market features
            current_price = market_obs.get('currentPrice', 100.0)
            fundamental_value = market_obs.get('fundamentalValue', 100.0)
            volatility = market_obs.get('volatility', 0.01)
            
            # Get order book data
            order_book = market_obs.get('orderBook', {})
            bids = order_book.get('bids', [])
            asks = order_book.get('asks', [])
            
            # Calculate spread and imbalance
            best_bid = bids[0]['price'] if bids else current_price - 0.5
            best_ask = asks[0]['price'] if asks else current_price + 0.5
            spread = best_ask - best_bid
            
            bid_volume = sum(bid['quantity'] for bid in bids[:5])
            ask_volume = sum(ask['quantity'] for ask in asks[:5])
            imbalance = (bid_volume - ask_volume) / (bid_volume + ask_volume + 1e-8)
            
            # Get recent price returns
            price_history = market_obs.get('priceHistory', [current_price] * 5)
            returns = []
            for i in range(1, min(6, len(price_history))):
                if price_history[i-1] != 0:
                    ret = (price_history[i] - price_history[i-1]) / price_history[i-1]
                    returns.append(ret)
            
            # Pad returns to 5 elements
            while len(returns) < 5:
                returns.append(0.0)
            
            # Get agent-specific data
            agent_data = self.agents[agent_name]
            inventory = agent_data['position']
            cash_ratio = agent_data['cash'] / 10000.0  # Normalize cash
            
            # Create observation vector (12 dimensions to match training)
            observation = np.array([
                current_price / 100.0,           # Normalized price
                fundamental_value / 100.0,       # Normalized fundamental
                volatility * 100,                # Scaled volatility
                spread,                          # Spread
                imbalance,                       # Order imbalance
                returns[0],                      # Return t-1
                returns[1],                      # Return t-2
                returns[2],                      # Return t-3
                returns[3],                      # Return t-4
                returns[4],                      # Return t-5
                inventory / 50.0,                # Normalized inventory
                cash_ratio                       # Cash ratio
            ], dtype=np.float32)
            
            return observation
            
        except Exception as e:
            print(f"Error converting observation: {e}")
            return np.zeros(12, dtype=np.float32)
    
    def _convert_action_to_order(self, action, market_obs, agent_name):
        """Convert RL agent action to market order"""
        try:
            current_price = market_obs.get('currentPrice', 100.0)
            agent_data = self.agents[agent_name]
            
            # Action mapping: 0=BUY, 1=SELL, 2=HOLD
            if action == 0:  # BUY
                # Calculate order size based on cash available
                max_quantity = min(10, int(agent_data['cash'] / current_price))
                if max_quantity > 0:
                    return {
                        'side': 'buy',
                        'quantity': max_quantity,
                        'price': current_price + 0.01,  # Slightly above market
                        'agentId': f'rl_{agent_name}',
                        'agentType': 'RL_AGENT'
                    }
                    
            elif action == 1:  # SELL
                # Calculate order size based on position
                max_quantity = min(10, abs(agent_data['position'])) if agent_data['position'] > 0 else 10
                if max_quantity > 0:
                    return {
                        'side': 'sell',
                        'quantity': max_quantity,
                        'price': current_price - 0.01,  # Slightly below market
                        'agentId': f'rl_{agent_name}',
                        'agentType': 'RL_AGENT'
                    }
            
            # HOLD or invalid action
            return None
            
        except Exception as e:
            print(f"Error converting action to order: {e}")
            return None
    
    def update_agent_state(self, agent_name, trade_data):
        """Update agent state after a trade"""
        if agent_name not in self.agents:
            return
            
        try:
            agent = self.agents[agent_name]
            
            # Update position and cash
            if trade_data['side'] == 'buy':
                agent['position'] += trade_data['quantity']
                agent['cash'] -= trade_data['quantity'] * trade_data['price']
            else:
                agent['position'] -= trade_data['quantity']
                agent['cash'] += trade_data['quantity'] * trade_data['price']
            
            # Record trade
            agent['trades'].append({
                'timestamp': datetime.now().isoformat(),
                'side': trade_data['side'],
                'quantity': trade_data['quantity'],
                'price': trade_data['price'],
                'value': trade_data['quantity'] * trade_data['price']
            })
            
            # Update performance metrics
            self._update_performance_metrics(agent_name)
            
        except Exception as e:
            print(f"Error updating agent state: {e}")
    
    def _update_performance_metrics(self, agent_name):
        """Update performance metrics for an agent"""
        try:
            agent_data = self.agents[agent_name]
            trades = agent_data['trades']
            
            if len(trades) == 0:
                return
                
            # Calculate total return
            initial_value = 10000.0
            current_value = agent_data['cash'] + (agent_data['position'] * trades[-1].get('price', 100.0))
            total_return = (current_value - initial_value) / initial_value
            
            # Calculate win rate
            profitable_trades = sum(1 for trade in trades if trade.get('pnl', 0) > 0)
            win_rate = profitable_trades / len(trades) if trades else 0.0
            
            # Simple Sharpe ratio approximation
            returns = [trade.get('pnl', 0) / initial_value for trade in trades]
            if len(returns) > 1:
                mean_return = np.mean(returns)
                std_return = np.std(returns)
                sharpe_ratio = mean_return / std_return if std_return > 0 else 0.0
            else:
                sharpe_ratio = 0.0
            
            # Update performance
            agent_data['performance'].update({
                'total_return': total_return,
                'win_rate': win_rate,
                'sharpe_ratio': sharpe_ratio,
                'max_drawdown': 0.0  # Simplified for now
            })
            
        except Exception as e:
            print(f"Error updating performance for {agent_name}: {e}")

    def reset_agents(self):
        """Reset all RL agents to their initial state"""
        try:
            for agent_name in self.agents:
                self.agents[agent_name].update({
                    'active': False,  # Deactivate all agents
                    'position': 0,
                    'cash': 10000.0,
                    'trades': [],
                    'performance': {
                        'total_return': 0.0,
                        'sharpe_ratio': 0.0,
                        'max_drawdown': 0.0,
                        'win_rate': 0.0
                    }
                })
            print(f"✅ Reset {len(self.agents)} RL agents to initial state (all deactivated)")
            return True
        except Exception as e:
            print(f"❌ Failed to reset agents: {e}")
            return False

# Global service instance
rl_service = RLAgentService()

# API Endpoints

@app.route('/api/agents', methods=['GET'])
def get_agents():
    """Get list of available RL agents"""
    agents_info = {}
    for name, agent in rl_service.agents.items():
        agents_info[name] = {
            'name': name,
            'active': agent['active'],
            'strategy': agent['info'].get('strategy', {}),
            'best_reward': agent['info'].get('best_reward', 0),
            'position': agent['position'],
            'cash': agent['cash'],
            'performance': agent['performance']
        }
    
    return jsonify(agents_info)

@app.route('/api/agents/<agent_name>/activate', methods=['POST'])
def activate_agent(agent_name):
    """Activate an RL agent"""
    if agent_name in rl_service.agents:
        rl_service.agents[agent_name]['active'] = True
        return jsonify({'success': True, 'message': f'{agent_name} activated'})
    return jsonify({'success': False, 'message': 'Agent not found'}), 404

@app.route('/api/agents/<agent_name>/deactivate', methods=['POST'])
def deactivate_agent(agent_name):
    """Deactivate an RL agent"""
    if agent_name in rl_service.agents:
        rl_service.agents[agent_name]['active'] = False
        return jsonify({'success': True, 'message': f'{agent_name} deactivated'})
    return jsonify({'success': False, 'message': 'Agent not found'}), 404

@app.route('/api/agents/<agent_name>/action', methods=['POST'])
def get_agent_action(agent_name):
    """Get action from an RL agent given market observation"""
    try:
        market_obs = request.json
        order = rl_service.get_agent_action(agent_name, market_obs)
        
        if order:
            return jsonify({'success': True, 'order': order})
        else:
            return jsonify({'success': False, 'message': 'No action taken'})
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/agents/<agent_name>/trade', methods=['POST'])
def update_agent_trade(agent_name):
    """Update agent state after a trade execution"""
    try:
        trade_data = request.json
        rl_service.update_agent_state(agent_name, trade_data)
        return jsonify({'success': True, 'message': 'Agent state updated'})
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'agents_loaded': len(rl_service.agents),
        'active_agents': len([a for a in rl_service.agents.values() if a['active']]),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/reset', methods=['POST'])
def reset_agents():
    """Reset all RL agents to initial state"""
    try:
        success = rl_service.reset_agents()
        if success:
            return jsonify({
                'status': 'success',
                'message': 'All RL agents reset to initial state',
                'agents_reset': len(rl_service.agents),
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to reset agents'
            }), 500
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Reset failed: {str(e)}'
        }), 500

if __name__ == '__main__':
    print("🚀 Starting RL Agent Service...")
    print(f"Loaded {len(rl_service.agents)} trained RL agents")
    
    # Start the Flask server
    app.run(host='0.0.0.0', port=5001, debug=True) 