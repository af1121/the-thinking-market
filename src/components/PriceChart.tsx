
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, Area, AreaChart } from 'recharts';
import { PricePoint, Trade } from '@/lib/types';
import { TrendingUp, LineChart as LineChartIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [chartType, setChartType] = useState<'line' | 'area'>('area');
  
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
  
  // Calculate if the latest price is higher or lower than the previous one
  const priceDirection = useMemo(() => {
    if (chartData.length < 2) return 'neutral';
    const lastPrice = chartData[chartData.length - 1].price;
    const prevPrice = chartData[chartData.length - 2].price;
    return lastPrice > prevPrice ? 'up' : lastPrice < prevPrice ? 'down' : 'neutral';
  }, [chartData]);
  
  // Effect to add a pulsing animation to the chart when new data comes in
  const pulseClass = chartData.length > 0 ? 'animate-pulse-slow' : '';

  return (
    <Card className={`glass ${className} animate-fade-in`}>
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <LineChartIcon className="w-5 h-5 text-primary" />
          Price Chart
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className={`h-8 w-8 p-0 ${chartType === 'line' ? 'bg-primary/10' : ''}`}
            onClick={() => setChartType('line')}
          >
            <TrendingUp className="h-4 w-4" />
            <span className="sr-only">Line Chart</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={`h-8 w-8 p-0 ${chartType === 'area' ? 'bg-primary/10' : ''}`}
            onClick={() => setChartType('area')}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Area Chart</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-2 relative">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No trade data available
          </div>
        ) : (
          <div className={`${pulseClass}`}>
            <ResponsiveContainer width="100%" height={height}>
              {chartType === 'line' ? (
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
                    stroke={priceDirection === 'up' ? 'hsl(var(--bid))' : priceDirection === 'down' ? 'hsl(var(--ask))' : 'hsl(var(--primary))'}
                    dot={false} 
                    strokeWidth={2}
                    animationDuration={300}
                  />
                </LineChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop 
                        offset="5%" 
                        stopColor={priceDirection === 'up' ? 'hsl(var(--bid))' : priceDirection === 'down' ? 'hsl(var(--ask))' : 'hsl(var(--primary))'}
                        stopOpacity={0.8}
                      />
                      <stop 
                        offset="95%" 
                        stopColor={priceDirection === 'up' ? 'hsl(var(--bid))' : priceDirection === 'down' ? 'hsl(var(--ask))' : 'hsl(var(--primary))'}
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
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
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke={priceDirection === 'up' ? 'hsl(var(--bid))' : priceDirection === 'down' ? 'hsl(var(--ask))' : 'hsl(var(--primary))'}
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                    animationDuration={300}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
            <div className="absolute top-0 right-0 m-2">
              <div className={`px-2 py-1 rounded text-xs font-semibold ${
                priceDirection === 'up' ? 'bg-bid/20 text-bid' : 
                priceDirection === 'down' ? 'bg-ask/20 text-ask' : 
                'bg-neutral/20 text-neutral'
              }`}>
                {priceDirection === 'up' ? 'Bullish' : priceDirection === 'down' ? 'Bearish' : 'Stable'}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceChart;
