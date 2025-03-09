
import React from 'react';
import { OrderBookSnapshot } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, TrendingUp, TrendingDown } from 'lucide-react';

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
    <Card className={`glass ${className} animate-slide-up`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Order Book
        </CardTitle>
        <div className="flex justify-between text-sm mt-1">
          <span className="flex items-center gap-1">
            <TrendingDown className="w-4 h-4 text-ask" />
            Spread: {spread !== null ? spread.toFixed(3) : '-'}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-neutral" />
            Mid Price: {midPrice !== null ? midPrice.toFixed(2) : '-'}
          </span>
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
                  className="relative flex justify-between p-1 text-sm order-book-ask rounded-sm hover:shadow-md transition-all duration-200"
                >
                  <div 
                    className="absolute inset-0 bg-ask/5 rounded-sm transition-all duration-300 hover:bg-ask/10" 
                    style={{ width: `${getWidthPercentage(level.quantity)}%` }}
                  />
                  <span className="relative z-10 font-semibold">{level.price.toFixed(2)}</span>
                  <span className="relative z-10 font-semibold">{level.quantity}</span>
                </div>
              ))
            )}
          </div>
          
          {/* Price indicator */}
          <div className="flex justify-between py-2 px-1 border-y border-border/50 my-2 text-sm font-medium">
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
                  className="relative flex justify-between p-1 text-sm order-book-bid rounded-sm hover:shadow-md transition-all duration-200"
                >
                  <div 
                    className="absolute inset-0 bg-bid/5 rounded-sm transition-all duration-300 hover:bg-bid/10" 
                    style={{ width: `${getWidthPercentage(level.quantity)}%` }}
                  />
                  <span className="relative z-10 font-semibold">{level.price.toFixed(2)}</span>
                  <span className="relative z-10 font-semibold">{level.quantity}</span>
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
