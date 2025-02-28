
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { PricePoint, Trade } from '@/lib/types';

interface PriceChartProps {
  trades: Trade[];
  fundamentalValue: number;
  className?: string;
  height?: number;
}

const PriceChart: React.FC<PriceChartProps> = ({ 
  trades, 
  fundamentalValue, 
  className = '',
  height = 300
}) => {
  // Convert trades to chart data points
  const chartData = useMemo(() => {
    if (trades.length === 0) return [];
    
    // Group trades in small time buckets for visualization
    const bucketSize = 500; // milliseconds
    const buckets: Record<number, PricePoint> = {};
    
    trades.forEach(trade => {
      const bucketTime = Math.floor(trade.timestamp / bucketSize) * bucketSize;
      
      if (!buckets[bucketTime]) {
        buckets[bucketTime] = { time: bucketTime, price: trade.price, volume: trade.quantity };
      } else {
        // Update existing bucket with latest price and sum up volume
        buckets[bucketTime].price = trade.price;
        buckets[bucketTime].volume = (buckets[bucketTime].volume || 0) + trade.quantity;
      }
    });
    
    // Convert buckets to array and limit to last 100 points
    return Object.values(buckets).sort((a, b) => a.time - b.time).slice(-100);
  }, [trades]);

  // Calculate the price domain with 10% padding
  const priceDomain = useMemo(() => {
    if (chartData.length === 0) return [90, 110]; // Default domain when no data
    
    const prices = chartData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // Ensure min/max are different to avoid domain issues
    const range = Math.max(maxPrice - minPrice, 1);
    return [
      Math.max(0, minPrice - range * 0.1), // Lower bound (ensure positive)
      maxPrice + range * 0.1   // Upper bound
    ];
  }, [chartData]);

  return (
    <Card className={`glass ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-normal">Price Chart</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No trade data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <XAxis 
                dataKey="time" 
                type="number" 
                domain={['dataMin', 'dataMax']} 
                tick={false} 
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                domain={priceDomain}
                tickFormatter={(value) => value.toFixed(1)}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                formatter={(value: any) => [`${Number(value).toFixed(2)}`, 'Price']}
                labelFormatter={(label) => `Time: ${new Date(label).toLocaleTimeString()}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)'
                }}
              />
              <ReferenceLine 
                y={fundamentalValue} 
                stroke="hsl(var(--neutral))" 
                strokeDasharray="3 3" 
                label={{ 
                  value: "Fundamental", 
                  position: "insideBottomLeft",
                  fill: "hsl(var(--neutral))",
                  fontSize: 12
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="hsl(var(--primary))" 
                dot={false} 
                strokeWidth={2}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceChart;
