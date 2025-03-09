
// Agent types
export enum AgentType {
  MARKET_MAKER = 'Market Maker',
  MOMENTUM_TRADER = 'Momentum Trader',
  FUNDAMENTAL_TRADER = 'Fundamental Trader',
  NOISE_TRADER = 'Noise Trader',
}

// Order types
export enum OrderType {
  LIMIT = 'LIMIT',
  MARKET = 'MARKET',
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export interface Order {
  id: string;
  agentId: string;
  agentType: AgentType;
  price: number;
  quantity: number;
  side: OrderSide;
  type: OrderType;
  timestamp: number;
}

export interface Trade {
  id: string;
  price: number;
  quantity: number;
  timestamp: number;
  buyOrderId: string;
  sellOrderId: string;
  buyAgentId: string;
  sellAgentId: string;
}

export interface Agent {
  id: string;
  type: AgentType;
  cash: number;
  inventory: number;
  active: boolean;
  parameters: Record<string, number>;
  
  // Adding the missing methods that are used in the simulation engine
  makeDecision(state: MarketState): Order | null;
  updatePositionAfterTrade(price: number, quantity: number, side: OrderSide): void;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
  orders: number;
}

export interface OrderBookSnapshot {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number | null;
  midPrice: number | null;
}

export interface MarketState {
  currentPrice: number | null;
  lastPrice: number | null;
  fundamentalValue: number;
  volatility: number;
  timestamp: number;
  trades: Trade[];
  orderBook: OrderBookSnapshot;
}

export interface SimulationParameters {
  initialPrice: number;
  fundamentalValue: number;
  volatilityBase: number;
  tickSize: number;
  timeStep: number;
  maxOrdersPerLevel: number;
  maxLevels: number;
}

export interface SimulationState {
  running: boolean;
  speed: number;
  tick: number;
  startTime: number;
  elapsedTime: number;
  market: MarketState;
  agents: Agent[];
  parameters: SimulationParameters;
}

// For chart data
export interface PricePoint {
  time: number;
  price: number;
  volume?: number;
}

export interface MetricsData {
  volatility: number;
  spread: number | null;
  tradingVolume: number;
  orderBookDepth: number;
  fundamentalDeviation: number;
}
