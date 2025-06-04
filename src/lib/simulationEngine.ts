import { OrderBook } from './orderBook';
import { createAgent } from './agents';
import {
  Agent,
  AgentType,
  MarketState,
  Order,
  OrderSide,
  SimulationParameters,
  SimulationState,
  Trade,
  MetricsData,
  MarketEventType,
  MarketEvent,
  VolatilityAnalytics,
  OrderType
} from './types';
import { rlAgentService, type RLAgentInfo, type MarketObservation, type RLAgentOrder } from '../services/rlAgentService';

export class SimulationEngine {
  private state: SimulationState;
  private orderBook: OrderBook;
  private priceHistory: number[] = [];
  private lastUpdateTime: number = 0;
  private timerId: number | null = null;
  private rlAgents: Record<string, RLAgentInfo> = {};
  private rlAgentUpdateInterval: number | null = null;
  private analytics: VolatilityAnalytics = {
    volatilityTimeSeries: [],
    agentContribution: {
      [AgentType.MARKET_MAKER]: [],
      [AgentType.MOMENTUM_TRADER]: [],
      [AgentType.FUNDAMENTAL_TRADER]: [],
      [AgentType.NOISE_TRADER]: []
    },
    stressEvents: [],
    interventionEffects: {
      circuitBreakerTriggered: 0,
      avgVolatilityReduction: 0
    }
  };

  constructor(initialParams?: Partial<SimulationParameters>) {
    const defaultParams: SimulationParameters = {
      initialPrice: 100,
      fundamentalValue: 100,
      volatilityBase: 0.01,
      tickSize: 0.01,
      timeStep: 100, // milliseconds - changed from 1000 to 100 for faster updates
      maxOrdersPerLevel: 50,
      maxLevels: 10,
      circuitBreakerThreshold: 0.1, // 10% price change
      circuitBreakerDuration: 60000 // 1 minute
    };

    const params = { ...defaultParams, ...initialParams };
    
    this.orderBook = new OrderBook(params.tickSize, params.maxLevels);
    
    this.state = {
      running: false,
      speed: 1,
      tick: 0,
      startTime: Date.now(),
      elapsedTime: 0,
      market: {
        currentPrice: params.initialPrice,
        lastPrice: null,
        fundamentalValue: params.fundamentalValue,
        volatility: params.volatilityBase,
        timestamp: Date.now(),
        trades: [],
        orderBook: this.orderBook.getSnapshot(),
        events: []
      },
      agents: [],
      parameters: params,
      circuitBreakerActive: false,
      circuitBreakerEndTime: null
    };

    // Start monitoring RL agents
    this.startRLAgentMonitoring();
  }

  /**
   * Start monitoring RL agents from the backend service
   */
  private startRLAgentMonitoring(): void {
    this.rlAgentUpdateInterval = window.setInterval(async () => {
      if (rlAgentService.isServiceConnected()) {
        const agents = await rlAgentService.getAgents();
        if (agents) {
          this.rlAgents = agents;
        }
      }
    }, 2000); // Update every 2 seconds
  }

  /**
   * Stop monitoring RL agents
   */
  private stopRLAgentMonitoring(): void {
    if (this.rlAgentUpdateInterval) {
      clearInterval(this.rlAgentUpdateInterval);
      this.rlAgentUpdateInterval = null;
    }
  }

  /**
   * Get current market observation for RL agents
   */
  private getMarketObservation(): MarketObservation {
    return {
      currentPrice: this.state.market.currentPrice,
      fundamentalValue: this.state.market.fundamentalValue,
      volatility: this.state.market.volatility,
      orderBook: {
        bids: this.state.market.orderBook.bids,
        asks: this.state.market.orderBook.asks
      },
      priceHistory: [...this.priceHistory],
      timestamp: this.state.market.timestamp
    };
  }

  /**
   * Process RL agent actions during simulation tick
   */
  private async processRLAgentActions(): Promise<void> {
    if (!rlAgentService.isServiceConnected()) {
      return;
    }

    try {
      const marketObs = this.getMarketObservation();
      const rlOrders = await rlAgentService.getAllActiveAgentActions(marketObs);

      for (const rlOrder of rlOrders) {
        // Convert RL agent order to simulation order
        const order: Order = {
          id: `rl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          agentId: rlOrder.agentId,
          agentType: AgentType.NOISE_TRADER, // RL agents are treated as a special type of noise trader
          side: rlOrder.side === 'buy' ? OrderSide.BUY : OrderSide.SELL,
          quantity: rlOrder.quantity,
          price: rlOrder.price,
          type: OrderType.LIMIT,
          timestamp: Date.now()
        };

        // Submit order to order book
        const result = this.orderBook.matchOrder(order);

        // Process trades
        for (const trade of result.trades) {
          this.state.market.trades.push(trade);

          // Update market price
          this.state.market.lastPrice = this.state.market.currentPrice;
          this.state.market.currentPrice = trade.price;

          // Record price for volatility calculation
          this.priceHistory.push(trade.price);
          if (this.priceHistory.length > 100) {
            this.priceHistory.shift();
          }

          // Update RL agent state in backend
          const agentName = rlOrder.agentId.replace('rl_', '');
          await rlAgentService.updateAgentTrade(agentName, {
            side: rlOrder.side,
            quantity: trade.quantity,
            price: trade.price,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error processing RL agent actions:', error);
    }
  }

  /**
   * Get active RL agents count
   */
  public getActiveRLAgentsCount(): number {
    return Object.values(this.rlAgents).filter(agent => agent.active).length;
  }

  /**
   * Get RL agents info
   */
  public getRLAgents(): Record<string, RLAgentInfo> {
    return { ...this.rlAgents };
  }

  /**
   * Activate an RL agent
   */
  public async activateRLAgent(agentName: string): Promise<boolean> {
    const success = await rlAgentService.activateAgent(agentName);
    if (success && this.rlAgents[agentName]) {
      this.rlAgents[agentName].active = true;
    }
    return success;
  }

  /**
   * Deactivate an RL agent
   */
  public async deactivateRLAgent(agentName: string): Promise<boolean> {
    const success = await rlAgentService.deactivateAgent(agentName);
    if (success && this.rlAgents[agentName]) {
      this.rlAgents[agentName].active = false;
    }
    return success;
  }

  public getState(): SimulationState {
    return { ...this.state };
  }

  public getAnalytics(): VolatilityAnalytics {
    return { ...this.analytics };
  }

  public addAgent(type: AgentType, parameters: Record<string, number> = {}): string {
    const id = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const agent = createAgent(type, id, parameters);
    this.state.agents.push(agent);
    return id;
  }

  public removeAgent(id: string): boolean {
    const index = this.state.agents.findIndex(agent => agent.id === id);
    if (index === -1) return false;
    
    this.state.agents.splice(index, 1);
    return true;
  }

  public toggleAgentActive(id: string): boolean {
    const agent = this.state.agents.find(agent => agent.id === id);
    if (!agent) return false;
    
    agent.active = !agent.active;
    return true;
  }

  public updateAgentParameters(id: string, parameters: Record<string, number>): boolean {
    const agent = this.state.agents.find(agent => agent.id === id);
    if (!agent) return false;
    
    agent.parameters = { ...agent.parameters, ...parameters };
    return true;
  }

  public start(): void {
    if (this.state.running) return;
    
    this.state.running = true;
    this.state.startTime = Date.now();
    this.lastUpdateTime = Date.now();
    
    this.scheduleNextTick();
  }

  public stop(): void {
    if (!this.state.running) return;
    
    this.state.running = false;
    
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public setSpeed(speed: number): void {
    this.state.speed = Math.max(0.1, Math.min(10, speed));
  }

  public reset(): void {
    this.stop();
    
    const params = this.state.parameters;
    
    this.orderBook.clear();
    this.priceHistory = [];
    
    this.state = {
      running: false,
      speed: 1,
      tick: 0,
      startTime: Date.now(),
      elapsedTime: 0,
      market: {
        currentPrice: params.initialPrice,
        lastPrice: null,
        fundamentalValue: params.fundamentalValue,
        volatility: params.volatilityBase,
        timestamp: Date.now(),
        trades: [],
        orderBook: this.orderBook.getSnapshot(),
        events: []
      },
      agents: [],
      parameters: params,
      circuitBreakerActive: false,
      circuitBreakerEndTime: null
    };

    this.analytics = {
      volatilityTimeSeries: [],
      agentContribution: {
        [AgentType.MARKET_MAKER]: [],
        [AgentType.MOMENTUM_TRADER]: [],
        [AgentType.FUNDAMENTAL_TRADER]: [],
        [AgentType.NOISE_TRADER]: []
      },
      stressEvents: [],
      interventionEffects: {
        circuitBreakerTriggered: 0,
        avgVolatilityReduction: 0
      }
    };

    // Reset RL agents to initial state
    this.resetRLAgents();
  }

  /**
   * Reset RL agents to their initial state
   */
  private async resetRLAgents(): Promise<void> {
    try {
      if (rlAgentService.isServiceConnected()) {
        const success = await rlAgentService.resetAgents();
        if (success) {
          console.log('✅ RL agents reset to initial state');
          // Clear local RL agent cache to force refresh
          this.rlAgents = {};
          // Force immediate refresh of agent data
          setTimeout(async () => {
            const agents = await rlAgentService.getAgents();
            if (agents) {
              this.rlAgents = agents;
            }
          }, 100);
        } else {
          console.warn('⚠️ Failed to reset RL agents');
        }
      } else {
        // If service is not connected, just clear local cache
        this.rlAgents = {};
      }
    } catch (error) {
      console.error('Error resetting RL agents:', error);
      // Clear local cache even if reset fails
      this.rlAgents = {};
    }
  }

  public updateParameters(params: Partial<SimulationParameters>): void {
    this.state.parameters = { ...this.state.parameters, ...params };
    
    // Update order book tick size if it changed
    if (params.tickSize) {
      this.orderBook = new OrderBook(
        params.tickSize,
        params.maxLevels || this.state.parameters.maxLevels
      );
    }
  }

  public injectMarketEvent(
    eventType: MarketEventType,
    magnitude: number
  ): void {
    const event: MarketEvent = {
      type: eventType,
      magnitude,
      timestamp: Date.now(),
      description: `${eventType} event with magnitude ${(magnitude * 100).toFixed(2)}%`
    };

    // Add event to market state and analytics
    this.state.market.events.push(event);
    this.analytics.stressEvents.push(event);

    // Store the price before the event for circuit breaker calculation
    const priceBeforeEvent = this.state.market.currentPrice;

    switch (eventType) {
      case MarketEventType.NEWS:
        // Change in fundamental value
        this.state.market.fundamentalValue *= (1 + magnitude);
        break;
      
      case MarketEventType.LIQUIDITY_SHOCK: {
        // Remove a significant portion of orders from the order book
        const removalPercentage = Math.abs(magnitude);
        this.orderBook.removeLiquidityShock(removalPercentage);
        // Also increase volatility to reflect the liquidity crisis
        this.state.market.volatility *= (1 + Math.abs(magnitude));
        break;
      }
      
      case MarketEventType.PRICE_SHOCK:
        // Force a price change
        if (this.state.market.currentPrice !== null) {
          this.state.market.lastPrice = this.state.market.currentPrice;
          this.state.market.currentPrice *= (1 + magnitude);
          // Record price for volatility calculation
          this.priceHistory.push(this.state.market.currentPrice);
          if (this.priceHistory.length > 100) {
            this.priceHistory.shift();
          }
        }
        break;
      
      case MarketEventType.VOLATILITY_SPIKE:
        // Increase market volatility
        this.state.market.volatility *= (1 + magnitude * 2);
        break;
      
      case MarketEventType.FLASH_CRASH:
        // Sharp price decline followed by recovery
        if (this.state.market.currentPrice !== null) {
          this.state.market.lastPrice = this.state.market.currentPrice;
          this.state.market.currentPrice *= (1 - Math.abs(magnitude));
          // Record price for volatility calculation
          this.priceHistory.push(this.state.market.currentPrice);
          if (this.priceHistory.length > 100) {
            this.priceHistory.shift();
          }
          // Recovery will happen gradually through subsequent ticks
        }
        break;
    }

    // Check if this event should trigger the circuit breaker
    if (priceBeforeEvent !== null && this.state.market.currentPrice !== null && 
        !this.state.circuitBreakerActive && this.state.parameters.circuitBreakerThreshold > 0) {
      
      const priceChange = Math.abs(
        (this.state.market.currentPrice - priceBeforeEvent) / priceBeforeEvent
      );
      
      console.log(`Market event ${eventType}: Price change ${(priceChange * 100).toFixed(2)}%, threshold ${(this.state.parameters.circuitBreakerThreshold * 100).toFixed(2)}%`);
      
      if (priceChange > this.state.parameters.circuitBreakerThreshold) {
        this.state.circuitBreakerActive = true;
        this.state.circuitBreakerEndTime = 
          Date.now() + this.state.parameters.circuitBreakerDuration;
        
        // Record circuit breaker trigger
        this.analytics.interventionEffects.circuitBreakerTriggered++;
        
        console.log(`🚨 Circuit breaker triggered by ${eventType} event! Price change: ${(priceChange * 100).toFixed(2)}%`);
      }
    }
  }

  public getMetrics(): MetricsData {
    // Calculate various market quality metrics
    const volatility = this.calculateVolatility();
    
    // Calculate total trading volume in last 10 ticks
    const recentTrades = this.state.market.trades.slice(-50);
    const tradingVolume = recentTrades.reduce((sum, trade) => sum + trade.quantity, 0);
    
    // Calculate order book depth (sum of all quantities in the book)
    const bids = this.state.market.orderBook.bids;
    const asks = this.state.market.orderBook.asks;
    const orderBookDepth = 
      bids.reduce((sum, level) => sum + level.quantity, 0) +
      asks.reduce((sum, level) => sum + level.quantity, 0);
    
    // Calculate deviation from fundamental value
    const fundamentalDeviation = this.state.market.currentPrice !== null
      ? Math.abs((this.state.market.currentPrice - this.state.market.fundamentalValue) / this.state.market.fundamentalValue)
      : 0;
    
    // Calculate price impact
    const priceImpact = 0.01; // Placeholder for actual calculation

    // Calculate volatility by agent type
    const volatilityByAgentType = {
      [AgentType.MARKET_MAKER]: 0.005,
      [AgentType.MOMENTUM_TRADER]: 0.015,
      [AgentType.FUNDAMENTAL_TRADER]: 0.008,
      [AgentType.NOISE_TRADER]: 0.02
    };

    return {
      volatility,
      spreadAverage: this.state.market.orderBook.spread,
      tradingVolume,
      orderBookDepth,
      fundamentalDeviation,
      priceImpact,
      volatilityByAgentType
    };
  }

  public submitExternalOrder(order: Omit<Order, 'id' | 'timestamp' | 'agentId' | 'agentType'>): Trade[] {
    const fullOrder: Order = {
      ...order,
      id: `ext-order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      agentId: 'external',
      agentType: AgentType.NOISE_TRADER // Just use noise trader as a placeholder
    };
    
    const result = this.orderBook.matchOrder(fullOrder);
    
    // Add trades to the market state
    if (result.trades.length > 0) {
      this.state.market.trades.push(...result.trades);
      
      // Update market price based on the most recent trade
      const lastTrade = result.trades[result.trades.length - 1];
      this.state.market.lastPrice = this.state.market.currentPrice;
      this.state.market.currentPrice = lastTrade.price;
      
      // Record price for volatility calculation
      this.priceHistory.push(lastTrade.price);
      if (this.priceHistory.length > 100) {
        this.priceHistory.shift();
      }
    }
    
    return result.trades;
  }

  private scheduleNextTick(): void {
    if (!this.state.running) return;
    
    const timeStep = this.state.parameters.timeStep / this.state.speed;
    
    this.timerId = window.setTimeout(async () => {
      await this.tick();
      this.scheduleNextTick();
    }, timeStep);
  }

  private async tick(): Promise<void> {
    const currentTime = Date.now();
    this.state.elapsedTime += currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;
    
    this.state.tick++;
    
    // Check if circuit breaker should end
    if (this.state.circuitBreakerActive && 
        this.state.circuitBreakerEndTime !== null && 
        currentTime >= this.state.circuitBreakerEndTime) {
      this.state.circuitBreakerActive = false;
      this.state.circuitBreakerEndTime = null;
      
      // Record volatility reduction effect
      const volatilityBefore = this.state.market.volatility;
      // Record approximate volatility reduction (simple simulation)
      this.analytics.interventionEffects.avgVolatilityReduction = 
        (this.analytics.interventionEffects.avgVolatilityReduction * 
         (this.analytics.interventionEffects.circuitBreakerTriggered - 1) + 
         0.3) / this.analytics.interventionEffects.circuitBreakerTriggered;
    }
    
    // Occasionally update the fundamental value with small random changes
    if (this.state.tick % 5 === 0) {
      const fundamentalChange = (Math.random() - 0.5) * 0.01 * this.state.market.fundamentalValue;
      this.state.market.fundamentalValue += fundamentalChange;
    }
    
    // Add some random price movement to help momentum traders
    if (this.state.tick % 3 === 0 && this.state.market.currentPrice !== null) {
      const randomMovement = (Math.random() - 0.5) * 0.003 * this.state.market.currentPrice;
      this.state.market.currentPrice += randomMovement;
      this.priceHistory.push(this.state.market.currentPrice);
      if (this.priceHistory.length > 100) {
        this.priceHistory.shift();
      }
    }
    
    // Only allow trading if circuit breaker is not active
    if (!this.state.circuitBreakerActive) {
      // Each agent makes a decision
      for (const agent of this.state.agents) {
        if (!agent.active) continue;
        
        try {
          const order = agent.makeDecision(this.state.market);
          
          if (order) {
            const result = this.orderBook.matchOrder(order);
            
            // Process trades
            for (const trade of result.trades) {
              // Add the trade to the market's trade history
              this.state.market.trades.push(trade);
              
              // Update agent positions
              const buyer = this.state.agents.find(a => a.id === trade.buyAgentId);
              const seller = this.state.agents.find(a => a.id === trade.sellAgentId);
              
              if (buyer) {
                buyer.updatePositionAfterTrade(trade.price, trade.quantity, OrderSide.BUY);
              }
              
              if (seller) {
                seller.updatePositionAfterTrade(trade.price, trade.quantity, OrderSide.SELL);
              }
              
              // Update current price
              this.state.market.lastPrice = this.state.market.currentPrice;
              this.state.market.currentPrice = trade.price;
              
              // Record price for volatility calculation
              this.priceHistory.push(trade.price);
              if (this.priceHistory.length > 100) {
                this.priceHistory.shift();
              }
            }
          }
        } catch (error) {
          console.error(`Error in agent ${agent.id} decision:`, error);
        }
      }

      // Process RL agent actions only if circuit breaker is not active
      try {
        await this.processRLAgentActions();
      } catch (error) {
        console.error('Error processing RL agent actions:', error);
      }
    }
    
    // Update market state
    this.state.market.timestamp = Date.now();
    this.state.market.orderBook = this.orderBook.getSnapshot();
    
    // Check for circuit breaker conditions
    if (!this.state.circuitBreakerActive && 
        this.state.market.lastPrice !== null && 
        this.state.market.currentPrice !== null &&
        this.state.parameters.circuitBreakerThreshold > 0) {
      
      const priceChange = Math.abs(
        (this.state.market.currentPrice - this.state.market.lastPrice) / 
        this.state.market.lastPrice
      );
      
      // Add debug logging for circuit breaker
      if (priceChange > 0.01) { // Log significant price changes (>1%)
        console.log(`Tick ${this.state.tick}: Price change ${(priceChange * 100).toFixed(2)}%, threshold ${(this.state.parameters.circuitBreakerThreshold * 100).toFixed(2)}%`);
      }
      
      if (priceChange > this.state.parameters.circuitBreakerThreshold) {
        this.state.circuitBreakerActive = true;
        this.state.circuitBreakerEndTime = 
          Date.now() + this.state.parameters.circuitBreakerDuration;
        
        // Record circuit breaker trigger
        this.analytics.interventionEffects.circuitBreakerTriggered++;
        
        console.log(`🚨 Circuit breaker triggered by trading! Price change: ${(priceChange * 100).toFixed(2)}%`);
        console.log(`Previous price: $${this.state.market.lastPrice.toFixed(3)}, Current price: $${this.state.market.currentPrice.toFixed(3)}`);
      }
    }
    
    // Calculate and update volatility
    this.state.market.volatility = this.calculateVolatility();
    
    // Update volatility analytics
    this.analytics.volatilityTimeSeries.push({
      time: Date.now(),
      volatility: this.state.market.volatility
    });
    
    // Keep analytics time series at a reasonable length
    if (this.analytics.volatilityTimeSeries.length > 100) {
      this.analytics.volatilityTimeSeries.shift();
    }
    
    // Update agent contribution data
    const activeAgentTypes = new Set(this.state.agents.filter(a => a.active).map(a => a.type));
    
    // Simple simulation of agent contribution - in a real system this would be more sophisticated
    Object.keys(this.analytics.agentContribution).forEach(type => {
      const agentType = type as AgentType;
      let contribution = 0;
      
      // If this type of agent is active, calculate a simulated contribution
      if (activeAgentTypes.has(agentType)) {
        // Different agent types have different volatility signatures
        switch (agentType) {
          case AgentType.MARKET_MAKER:
            contribution = this.state.market.volatility * 0.5; // Market makers reduce volatility
            break;
          case AgentType.MOMENTUM_TRADER:
            contribution = this.state.market.volatility * 1.5; // Momentum traders amplify volatility
            break;
          case AgentType.FUNDAMENTAL_TRADER:
            contribution = this.state.market.volatility * 0.7; // Fundamental traders moderate volatility
            break;
          case AgentType.NOISE_TRADER:
            contribution = this.state.market.volatility * 1.3; // Noise traders add volatility
            break;
        }
      }
      
      this.analytics.agentContribution[agentType].push(contribution);
      
      // Keep contribution data arrays at a reasonable length
      if (this.analytics.agentContribution[agentType].length > 100) {
        this.analytics.agentContribution[agentType].shift();
      }
    });
    
    // Limit the trade history to prevent memory issues while allowing sufficient data for research
    // Increased from 1000 to 10000 to support longer simulation runs
    if (this.state.market.trades.length > 10000) {
      this.state.market.trades = this.state.market.trades.slice(-10000);
    }
  }

  private calculateVolatility(): number {
    if (this.priceHistory.length < 2) return this.state.parameters.volatilityBase;
    
    // Calculate log returns
    const returns: number[] = [];
    for (let i = 1; i < this.priceHistory.length; i++) {
      returns.push(Math.log(this.priceHistory[i] / this.priceHistory[i - 1]));
    }
    
    // Calculate standard deviation of returns
    const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    const squaredDiffs = returns.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / returns.length;
    
    return Math.sqrt(variance);
  }
}

// Create a default simulation engine for easy import
export const defaultSimulation = new SimulationEngine();
