
import React from 'react';
import { OrderBookSnapshot } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OrderBookProps {
  orderBook: OrderBookSnapshot;
  className?: string;
}

const OrderBook: React.FC<OrderBookProps> = ({ orderBook, className = '' }) => {
  const { bids, asks, spread, midPrice } = orderBook;
  
  // Find the maximum quantity for scaling the depth visualization
  const maxQuantity = Math.max(
    ...bids.map(level => level.quantity),
    ...asks.map(level => level.quantity),
    1  // Fallback if there are no orders
  );

  // Calculate the width percentage based on the quantity
  const getWidthPercentage = (quantity: number) => {
    return (quantity / maxQuantity) * 100;
  };

  return (
    <Card className={`glass ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-normal">Order Book</CardTitle>
        <div className="flex justify-between text-sm mt-1">
          <span>Spread: {spread !== null ? spread.toFixed(3) : '-'}</span>
          <span>Mid Price: {midPrice !== null ? midPrice.toFixed(2) : '-'}</span>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        <div className="flex flex-col">
          {/* Asks (sell orders) - displayed in descending order */}
          <div className="space-y-1">
            {asks.length === 0 ? (
              <div className="text-center text-sm p-1 text-muted-foreground">No sell orders</div>
            ) : (
              asks.slice().reverse().map((level) => (
                <div 
                  key={`ask-${level.price}`} 
                  className="relative flex justify-between p-1 text-sm order-book-ask rounded-sm"
                >
                  <div 
                    className="absolute inset-0 bg-ask/5 rounded-sm" 
                    style={{ width: `${getWidthPercentage(level.quantity)}%` }}
                  />
                  <span className="relative z-10">{level.price.toFixed(2)}</span>
                  <span className="relative z-10">{level.quantity}</span>
                </div>
              ))
            )}
          </div>
          
          {/* Price indicator */}
          <div className="flex justify-between py-2 px-1 border-y border-border/50 my-2 text-sm">
            <span>Price</span>
            <span>Quantity</span>
          </div>
          
          {/* Bids (buy orders) - displayed in descending order */}
          <div className="space-y-1">
            {bids.length === 0 ? (
              <div className="text-center text-sm p-1 text-muted-foreground">No buy orders</div>
            ) : (
              bids.map((level) => (
                <div 
                  key={`bid-${level.price}`} 
                  className="relative flex justify-between p-1 text-sm order-book-bid rounded-sm"
                >
                  <div 
                    className="absolute inset-0 bg-bid/5 rounded-sm" 
                    style={{ width: `${getWidthPercentage(level.quantity)}%` }}
                  />
                  <span className="relative z-10">{level.price.toFixed(2)}</span>
                  <span className="relative z-10">{level.quantity}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderBook;
