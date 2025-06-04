/**
 * RL Agent Service - Frontend interface to real trained RL agents
 * 
 * This service communicates with the Python backend that loads and runs
 * the actual trained RL agents in real-time.
 */

export interface RLAgentInfo {
  name: string;
  active: boolean;
  strategy: Record<string, boolean | number | string>;
  best_reward: number;
  position: number;
  cash: number;
  performance: {
    total_return: number;
    sharpe_ratio: number;
    max_drawdown: number;
    win_rate: number;
  };
}

export interface MarketObservation {
  currentPrice: number;
  fundamentalValue: number;
  volatility: number;
  orderBook: {
    bids: Array<{ price: number; quantity: number }>;
    asks: Array<{ price: number; quantity: number }>;
  };
  priceHistory: number[];
  timestamp: number;
}

export interface RLAgentOrder {
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  agentId: string;
  agentType: string;
}

export interface TradeData {
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: string;
}

class RLAgentService {
  private baseUrl = 'http://localhost:5001/api';
  private isConnected = false;
  private connectionCheckInterval: number | null = null;

  constructor() {
    this.checkConnection();
    this.startConnectionMonitoring();
  }

  /**
   * Check if the RL agent service is running
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        this.isConnected = true;
        console.log('✅ Connected to RL Agent Service');
        return true;
      } else {
        this.isConnected = false;
        return false;
      }
    } catch (error) {
      this.isConnected = false;
      console.warn('⚠️ RL Agent Service not available:', error);
      return false;
    }
  }

  /**
   * Start monitoring connection to the backend
   */
  private startConnectionMonitoring(): void {
    this.connectionCheckInterval = window.setInterval(() => {
      this.checkConnection();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Stop monitoring connection
   */
  public stopConnectionMonitoring(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  /**
   * Get all available RL agents
   */
  async getAgents(): Promise<Record<string, RLAgentInfo> | null> {
    if (!this.isConnected) {
      console.warn('RL Agent Service not connected');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/agents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const agents = await response.json();
        return agents;
      } else {
        console.error('Failed to get agents:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error getting agents:', error);
      return null;
    }
  }

  /**
   * Activate an RL agent
   */
  async activateAgent(agentName: string): Promise<boolean> {
    if (!this.isConnected) {
      console.warn('RL Agent Service not connected');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentName}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Activated RL agent: ${agentName}`);
        return result.success;
      } else {
        console.error(`Failed to activate agent ${agentName}:`, response.statusText);
        return false;
      }
    } catch (error) {
      console.error(`Error activating agent ${agentName}:`, error);
      return false;
    }
  }

  /**
   * Deactivate an RL agent
   */
  async deactivateAgent(agentName: string): Promise<boolean> {
    if (!this.isConnected) {
      console.warn('RL Agent Service not connected');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentName}/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Deactivated RL agent: ${agentName}`);
        return result.success;
      } else {
        console.error(`Failed to deactivate agent ${agentName}:`, response.statusText);
        return false;
      }
    } catch (error) {
      console.error(`Error deactivating agent ${agentName}:`, error);
      return false;
    }
  }

  /**
   * Get action from an RL agent given market observation
   */
  async getAgentAction(agentName: string, marketObservation: MarketObservation): Promise<RLAgentOrder | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentName}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(marketObservation),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.order) {
          return result.order;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting action from agent ${agentName}:`, error);
      return null;
    }
  }

  /**
   * Update agent state after a trade execution
   */
  async updateAgentTrade(agentName: string, tradeData: TradeData): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentName}/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradeData),
      });

      if (response.ok) {
        const result = await response.json();
        return result.success;
      } else {
        console.error(`Failed to update trade for agent ${agentName}:`, response.statusText);
        return false;
      }
    } catch (error) {
      console.error(`Error updating trade for agent ${agentName}:`, error);
      return false;
    }
  }

  /**
   * Get connection status
   */
  public isServiceConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get all active agents and their actions for the current market state
   */
  async getAllActiveAgentActions(marketObservation: MarketObservation): Promise<RLAgentOrder[]> {
    if (!this.isConnected) {
      return [];
    }

    try {
      const agents = await this.getAgents();
      if (!agents) return [];

      const orders: RLAgentOrder[] = [];
      
      // Get actions from all active agents
      for (const [agentName, agentInfo] of Object.entries(agents)) {
        if (agentInfo.active) {
          const order = await this.getAgentAction(agentName, marketObservation);
          if (order) {
            orders.push(order);
          }
        }
      }

      return orders;
    } catch (error) {
      console.error('Error getting actions from all active agents:', error);
      return [];
    }
  }

  /**
   * Batch update multiple agent trades
   */
  async updateMultipleAgentTrades(trades: Array<{ agentName: string; tradeData: TradeData }>): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    // Update each agent's trade in parallel
    const updatePromises = trades.map(({ agentName, tradeData }) =>
      this.updateAgentTrade(agentName, tradeData)
    );

    try {
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error updating multiple agent trades:', error);
    }
  }

  /**
   * Reset all RL agents to their initial state
   */
  async resetAgents(): Promise<boolean> {
    if (!this.isConnected) {
      console.warn('RL Agent Service not connected');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Reset all RL agents to initial state');
        return result.status === 'success';
      } else {
        console.error('Failed to reset RL agents:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error resetting RL agents:', error);
      return false;
    }
  }
}

// Export singleton instance
export const rlAgentService = new RLAgentService(); 