import { Agent, AgentType, MarketState, Order, OrderSide, OrderType } from './types';

// Base class for all agents
export abstract class TradingAgent implements Agent {
  id: string;
  type: AgentType;
  cash: number;
  inventory: number;
  active: boolean;
  parameters: Record<string, number>;

  constructor(
    id: string,
    type: AgentType,
    initialCash: number = 100000,
    initialInventory: number = 0,
    parameters: Record<string, number> = {}
  ) {
    this.id = id;
    this.type = type;
    this.cash = initialCash;
    this.inventory = initialInventory;
    this.active = true;
    this.parameters = parameters;
  }

  abstract makeDecision(state: MarketState): Order | null;

  protected createOrder(
    side: OrderSide,
    price: number,
    quantity: number,
    type: OrderType = OrderType.LIMIT
  ): Order {
    return {
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId: this.id,
      agentType: this.type,
      price,
      quantity,
      side,
      type,
      timestamp: Date.now(),
    };
  }

  updatePositionAfterTrade(price: number, quantity: number, side: OrderSide): void {
    if (side === OrderSide.BUY) {
      this.cash -= price * quantity;
      this.inventory += quantity;
    } else {
      this.cash += price * quantity;
      this.inventory -= quantity;
    }
  }
}

// Market Maker agent that provides liquidity by quoting both sides
export class MarketMakerAgent extends TradingAgent {
  constructor(
    id: string,
    parameters: Record<string, number> = {
      spreadPercentage: 0.002, // 0.2% spread
      orderSize: 10,          // Units to trade
      inventoryLimit: 100,    // Maximum inventory before adjusting prices
      priceAdjustment: 0.001  // Price adjustment based on inventory
    }
  ) {
    super(id, AgentType.MARKET_MAKER, 100000, 0, parameters);
  }

  makeDecision(state: MarketState): Order | null {
    // If there's no current price, we can't make a market
    if (state.currentPrice === null) return null;

    const {
      spreadPercentage = 0.002,
      orderSize = 10,
      inventoryLimit = 100,
      priceAdjustment = 0.001
    } = this.parameters;

    // Calculate base spread
    const halfSpreadPercentage = spreadPercentage / 2;
    
    // Adjust prices based on inventory
    const inventoryRatio = this.inventory / inventoryLimit;
    const inventoryAdjustment = inventoryRatio * priceAdjustment * state.currentPrice;
    
    // Calculate bid and ask prices with adjustments
    const baseBid = state.currentPrice * (1 - halfSpreadPercentage);
    const baseAsk = state.currentPrice * (1 + halfSpreadPercentage);
    
    // Adjust prices down when inventory is high, up when inventory is low
    const bidPrice = baseBid - inventoryAdjustment;
    const askPrice = baseAsk - inventoryAdjustment;
    
    // Randomly choose whether to place a bid or ask or both
    const random = Math.random();
    
    if (random < 0.4 || this.inventory <= -inventoryLimit) {
      // Place a bid order (buy)
      return this.createOrder(OrderSide.BUY, bidPrice, orderSize);
    } else if (random < 0.8 || this.inventory >= inventoryLimit) {
      // Place an ask order (sell)
      return this.createOrder(OrderSide.SELL, askPrice, orderSize);
    } else {
      // No order this time
      return null;
    }
  }
}

// Momentum trader that follows recent price trends
export class MomentumTraderAgent extends TradingAgent {
  private priceHistory: number[] = [];

  constructor(
    id: string,
    parameters: Record<string, number> = {
      lookbackPeriod: 5,      // Reduced from 10 to 5 - less history needed
      threshold: 0.0005,      // Reduced from 0.001 to 0.0005 (0.05% instead of 0.1%)
      orderSize: 10,          // Units to trade
      maxPositionSize: 100    // Maximum inventory (long or short)
    }
  ) {
    super(id, AgentType.MOMENTUM_TRADER, 100000, 0, parameters);
  }

  makeDecision(state: MarketState): Order | null {
    if (state.currentPrice === null) return null;

    // Update price history
    this.priceHistory.push(state.currentPrice);
    
    const {
      lookbackPeriod = 5,     // Updated default
      threshold = 0.0005,     // Updated default
      orderSize = 10,
      maxPositionSize = 100
    } = this.parameters;
    
    // Keep only the most recent prices
    if (this.priceHistory.length > lookbackPeriod) {
      this.priceHistory.shift();
    }
    
    // Need enough history to calculate momentum
    if (this.priceHistory.length < lookbackPeriod) return null;
    
    // Calculate momentum (simple price change)
    const oldPrice = this.priceHistory[0];
    const momentumPercentage = (state.currentPrice - oldPrice) / oldPrice;
    
    // Decide whether to trade based on momentum
    if (Math.abs(momentumPercentage) < threshold) return null;
    
    // Buy if positive momentum, sell if negative
    if (momentumPercentage > 0 && this.inventory < maxPositionSize) {
      // Strong upward trend - buy
      return this.createOrder(
        OrderSide.BUY,
        state.currentPrice * 1.001, // Willing to pay slightly above market
        orderSize
      );
    } else if (momentumPercentage < 0 && this.inventory > -maxPositionSize) {
      // Strong downward trend - sell
      return this.createOrder(
        OrderSide.SELL,
        state.currentPrice * 0.999, // Willing to sell slightly below market
        orderSize
      );
    }
    
    return null;
  }
}

// Fundamental trader that trades based on perceived fundamental value
export class FundamentalTraderAgent extends TradingAgent {
  constructor(
    id: string,
    parameters: Record<string, number> = {
      valuationNoise: 0.05,    // Random noise in valuation (percentage)
      thresholdPercentage: 0.005, // Reduced from 0.02 to 0.005 (0.5% instead of 2%)
      orderSize: 10,           // Units to trade
      maxPositionSize: 100     // Maximum inventory (long or short)
    }
  ) {
    super(id, AgentType.FUNDAMENTAL_TRADER, 100000, 0, parameters);
  }

  makeDecision(state: MarketState): Order | null {
    if (state.currentPrice === null) return null;

    const {
      valuationNoise = 0.05,
      thresholdPercentage = 0.005, // Updated default
      orderSize = 10,
      maxPositionSize = 100
    } = this.parameters;
    
    // Add some noise to the perceived fundamental value
    const noise = (Math.random() * 2 - 1) * valuationNoise;
    const perceivedValue = state.fundamentalValue * (1 + noise);
    
    // Calculate percentage difference
    const priceDifference = (perceivedValue - state.currentPrice) / state.currentPrice;
    
    // Decide whether to trade based on the difference
    if (Math.abs(priceDifference) < thresholdPercentage) return null;
    
    if (priceDifference > 0 && this.inventory < maxPositionSize) {
      // Undervalued - buy
      return this.createOrder(
        OrderSide.BUY,
        Math.min(perceivedValue, state.currentPrice * 1.005), // Don't overpay
        orderSize
      );
    } else if (priceDifference < 0 && this.inventory > -maxPositionSize) {
      // Overvalued - sell
      return this.createOrder(
        OrderSide.SELL,
        Math.max(perceivedValue, state.currentPrice * 0.995), // Don't undersell
        orderSize
      );
    }
    
    return null;
  }
}

// Noise trader that makes random decisions
export class NoiseTraderAgent extends TradingAgent {
  constructor(
    id: string,
    parameters: Record<string, number> = {
      tradeProbability: 0.3,   // Probability of making a trade
      maxPriceDeviation: 0.01, // Maximum percentage deviation from current price
      orderSize: 5,            // Units to trade
    }
  ) {
    super(id, AgentType.NOISE_TRADER, 100000, 0, parameters);
  }

  makeDecision(state: MarketState): Order | null {
    if (state.currentPrice === null) return null;

    const {
      tradeProbability = 0.3,
      maxPriceDeviation = 0.01,
      orderSize = 5
    } = this.parameters;
    
    // Decide whether to trade
    if (Math.random() > tradeProbability) return null;
    
    // Decide to buy or sell randomly
    const isBuy = Math.random() > 0.5;
    
    // Calculate random price deviation
    const deviation = (Math.random() * maxPriceDeviation);
    
    if (isBuy) {
      const price = state.currentPrice * (1 + deviation);
      return this.createOrder(OrderSide.BUY, price, orderSize);
    } else {
      const price = state.currentPrice * (1 - deviation);
      return this.createOrder(OrderSide.SELL, price, orderSize);
    }
  }
}

export function createAgent(
  type: AgentType,
  id: string,
  parameters: Record<string, number> = {}
): TradingAgent {
  switch (type) {
    case AgentType.MARKET_MAKER:
      return new MarketMakerAgent(id, parameters);
    case AgentType.MOMENTUM_TRADER:
      return new MomentumTraderAgent(id, parameters);
    case AgentType.FUNDAMENTAL_TRADER:
      return new FundamentalTraderAgent(id, parameters);
    case AgentType.NOISE_TRADER:
      return new NoiseTraderAgent(id, parameters);
    default:
      throw new Error(`Unknown agent type: ${type}`);
  }
}
