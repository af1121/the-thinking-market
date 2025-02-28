
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
  MetricsData
} from './types';

export class SimulationEngine {
  private state: SimulationState;
  private orderBook: OrderBook;
  private priceHistory: number[] = [];
  private lastUpdateTime: number = 0;
  private timerId: number | null = null;

  constructor(initialParams?: Partial<SimulationParameters>) {
    const defaultParams: SimulationParameters = {
      initialPrice: 100,
      fundamentalValue: 100,
      volatilityBase: 0.01,
      tickSize: 0.01,
      timeStep: 1000, // milliseconds
      maxOrdersPerLevel: 50,
      maxLevels: 10
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
        orderBook: this.orderBook.getSnapshot()
      },
      agents: [],
      parameters: params
    };
  }

  public getState(): SimulationState {
    return { ...this.state };
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
        orderBook: this.orderBook.getSnapshot()
      },
      agents: [],
      parameters: params
    };
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

  public injectMarketEvent(eventType: 'news' | 'liquidity_shock' | 'price_shock', magnitude: number): void {
    switch (eventType) {
      case 'news':
        // Change in fundamental value
        this.state.market.fundamentalValue *= (1 + magnitude);
        break;
      
      case 'liquidity_shock':
        // Remove a significant portion of orders
        // (Not fully implemented - would need to actually remove orders)
        this.state.market.volatility *= (1 + magnitude);
        break;
      
      case 'price_shock':
        // Force a price change
        if (this.state.market.currentPrice !== null) {
          this.state.market.lastPrice = this.state.market.currentPrice;
          this.state.market.currentPrice *= (1 + magnitude);
        }
        break;
    }
  }

  public getMetrics(): MetricsData {
    // Calculate various market quality metrics
    const volatility = this.calculateVolatility();
    const spread = this.state.market.orderBook.spread;
    
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
    
    return {
      volatility,
      spread,
      tradingVolume,
      orderBookDepth,
      fundamentalDeviation
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
    
    this.timerId = window.setTimeout(() => {
      this.tick();
      this.scheduleNextTick();
    }, timeStep);
  }

  private tick(): void {
    const currentTime = Date.now();
    this.state.elapsedTime += currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;
    
    this.state.tick++;
    
    // Occasionally update the fundamental value with small random changes
    if (this.state.tick % 10 === 0) {
      const fundamentalChange = (Math.random() - 0.5) * 0.002 * this.state.market.fundamentalValue;
      this.state.market.fundamentalValue += fundamentalChange;
    }
    
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
    
    // Update market state
    this.state.market.timestamp = Date.now();
    this.state.market.orderBook = this.orderBook.getSnapshot();
    
    // Calculate and update volatility
    this.state.market.volatility = this.calculateVolatility();
    
    // Limit the trade history to prevent memory issues
    if (this.state.market.trades.length > 1000) {
      this.state.market.trades = this.state.market.trades.slice(-1000);
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
