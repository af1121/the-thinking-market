import { Order, OrderBookLevel, OrderBookSnapshot, OrderSide, Trade } from './types';

export class OrderBook {
  private bids: Map<number, Order[]> = new Map();
  private asks: Map<number, Order[]> = new Map();
  private tickSize: number;
  private maxLevels: number;

  constructor(tickSize: number = 0.01, maxLevels: number = 10) {
    this.tickSize = tickSize;
    this.maxLevels = maxLevels;
  }

  public getSnapshot(limitLevels: number = this.maxLevels): OrderBookSnapshot {
    const bidLevels = this.getLevels(this.bids, true, limitLevels);
    const askLevels = this.getLevels(this.asks, false, limitLevels);
    
    const bestBid = bidLevels.length > 0 ? bidLevels[0].price : null;
    const bestAsk = askLevels.length > 0 ? askLevels[0].price : null;
    
    const spread = (bestBid !== null && bestAsk !== null) ? (bestAsk - bestBid) : null;
    const midPrice = (bestBid !== null && bestAsk !== null) ? (bestBid + bestAsk) / 2 : null;
    
    return {
      bids: bidLevels,
      asks: askLevels,
      spread,
      midPrice
    };
  }

  public addOrder(order: Order): void {
    const priceMap = order.side === OrderSide.BUY ? this.bids : this.asks;
    const price = this.roundToTickSize(order.price);
    
    if (!priceMap.has(price)) {
      priceMap.set(price, []);
    }
    
    priceMap.get(price)!.push(order);
  }

  public removeOrder(order: Order): boolean {
    const priceMap = order.side === OrderSide.BUY ? this.bids : this.asks;
    const orders = priceMap.get(order.price);
    
    if (!orders) return false;
    
    const index = orders.findIndex(o => o.id === order.id);
    if (index === -1) return false;
    
    orders.splice(index, 1);
    
    if (orders.length === 0) {
      priceMap.delete(order.price);
    }
    
    return true;
  }

  public matchOrder(order: Order): { remainingOrder: Order | null; trades: Trade[] } {
    const trades: Trade[] = [];
    let remainingQuantity = order.quantity;
    
    // If it's a buy order, match against asks
    // If it's a sell order, match against bids
    const oppositeBook = order.side === OrderSide.BUY ? this.asks : this.bids;
    
    // Sort prices for matching
    // For buy orders, we want to match against the lowest ask prices first
    // For sell orders, we want to match against the highest bid prices first
    const sortedPrices = Array.from(oppositeBook.keys()).sort((a, b) => 
      order.side === OrderSide.BUY ? a - b : b - a
    );
    
    for (const price of sortedPrices) {
      // For limit orders, check if the price is acceptable
      if (order.side === OrderSide.BUY && price > order.price) continue;
      if (order.side === OrderSide.SELL && price < order.price) continue;
      
      const oppositeSideOrders = oppositeBook.get(price)!;
      let i = 0;
      
      while (i < oppositeSideOrders.length && remainingQuantity > 0) {
        const matchedOrder = oppositeSideOrders[i];
        const tradeQuantity = Math.min(remainingQuantity, matchedOrder.quantity);
        
        // Create a trade
        const trade: Trade = {
          id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          price,
          quantity: tradeQuantity,
          timestamp: Date.now(),
          buyOrderId: order.side === OrderSide.BUY ? order.id : matchedOrder.id,
          sellOrderId: order.side === OrderSide.SELL ? order.id : matchedOrder.id,
          buyAgentId: order.side === OrderSide.BUY ? order.agentId : matchedOrder.agentId,
          sellAgentId: order.side === OrderSide.SELL ? order.agentId : matchedOrder.agentId,
        };
        
        trades.push(trade);
        
        // Update the remaining quantities
        remainingQuantity -= tradeQuantity;
        matchedOrder.quantity -= tradeQuantity;
        
        // If the matched order is fully filled, remove it
        if (matchedOrder.quantity === 0) {
          oppositeSideOrders.splice(i, 1);
        } else {
          i++;
        }
      }
      
      // If there are no orders left at this price level, remove the price
      if (oppositeSideOrders.length === 0) {
        oppositeBook.delete(price);
      }
      
      // If the order is fully filled, we're done
      if (remainingQuantity === 0) break;
    }
    
    // If there's remaining quantity, create a new order with the remaining quantity
    let remainingOrder: Order | null = null;
    if (remainingQuantity > 0) {
      remainingOrder = { ...order, quantity: remainingQuantity };
      this.addOrder(remainingOrder);
    }
    
    return { remainingOrder, trades };
  }

  public getBestBid(): { price: number; quantity: number } | null {
    if (this.bids.size === 0) return null;
    
    const bestPrice = Math.max(...Array.from(this.bids.keys()));
    const orders = this.bids.get(bestPrice)!;
    const totalQuantity = orders.reduce((sum, order) => sum + order.quantity, 0);
    
    return { price: bestPrice, quantity: totalQuantity };
  }

  public getBestAsk(): { price: number; quantity: number } | null {
    if (this.asks.size === 0) return null;
    
    const bestPrice = Math.min(...Array.from(this.asks.keys()));
    const orders = this.asks.get(bestPrice)!;
    const totalQuantity = orders.reduce((sum, order) => sum + order.quantity, 0);
    
    return { price: bestPrice, quantity: totalQuantity };
  }

  public getMidPrice(): number | null {
    const bestBid = this.getBestBid();
    const bestAsk = this.getBestAsk();
    
    if (!bestBid || !bestAsk) return null;
    
    return (bestBid.price + bestAsk.price) / 2;
  }

  public getSpread(): number | null {
    const bestBid = this.getBestBid();
    const bestAsk = this.getBestAsk();
    
    if (!bestBid || !bestAsk) return null;
    
    return bestAsk.price - bestBid.price;
  }

  public clear(): void {
    this.bids.clear();
    this.asks.clear();
  }

  public removeLiquidityShock(removalPercentage: number): void {
    // Remove a percentage of orders from both sides of the book
    this.removeLiquidityFromSide(this.bids, removalPercentage);
    this.removeLiquidityFromSide(this.asks, removalPercentage);
  }

  private removeLiquidityFromSide(priceMap: Map<number, Order[]>, removalPercentage: number): void {
    const prices = Array.from(priceMap.keys());
    
    for (const price of prices) {
      const orders = priceMap.get(price)!;
      const ordersToRemove = Math.floor(orders.length * removalPercentage);
      
      // Remove orders randomly from this price level
      for (let i = 0; i < ordersToRemove; i++) {
        if (orders.length > 0) {
          const randomIndex = Math.floor(Math.random() * orders.length);
          orders.splice(randomIndex, 1);
        }
      }
      
      // If no orders left at this price level, remove the price
      if (orders.length === 0) {
        priceMap.delete(price);
      }
    }
  }

  private getLevels(priceMap: Map<number, Order[]>, isBid: boolean, limit: number): OrderBookLevel[] {
    const prices = Array.from(priceMap.keys()).sort((a, b) => isBid ? b - a : a - b);
    return prices.slice(0, limit).map(price => {
      const orders = priceMap.get(price)!;
      const totalQuantity = orders.reduce((sum, order) => sum + order.quantity, 0);
      return {
        price,
        quantity: totalQuantity,
        orders: orders.length
      };
    });
  }

  private roundToTickSize(price: number): number {
    return Math.round(price / this.tickSize) * this.tickSize;
  }
}
