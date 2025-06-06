import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricsData } from '@/lib/types';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart2, 
  DollarSign, 
  Percent
} from 'lucide-react';

interface MetricsPanelProps {
  metrics: MetricsData;
  currentPrice: number | null;
  totalTrades: number;
  className?: string;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ 
  metrics, 
  currentPrice, 
  totalTrades,
  className = '' 
}) => {
  const { volatility, spreadAverage, tradingVolume, orderBookDepth, fundamentalDeviation } = metrics;
  
  // State to track previous values to show trends
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  const [prevValues, setPrevValues] = useState({
    volatility: 0,
    spread: 0,
    volume: 0,
    deviation: 0,
    trades: 0
  });
  
  // Update previous values when current values change
  useEffect(() => {
    if (currentPrice !== null && prevPrice !== null) {
      setPrevValues({
        volatility: volatility,
        spread: spreadAverage || 0,
        volume: tradingVolume,
        deviation: fundamentalDeviation,
        trades: totalTrades
      });
    }
    
    if (currentPrice !== null) {
      setPrevPrice(currentPrice);
    }
  }, [currentPrice, volatility, spreadAverage, tradingVolume, fundamentalDeviation, totalTrades, prevPrice]);
  
  // Helper to determine trend class
  const getTrendClass = (current: number, previous: number) => {
    if (current > previous) return 'value-increase';
    if (current < previous) return 'value-decrease';
    return 'value-neutral';
  };
  
  // Helper to determine trend icon
  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4" />;
    if (current < previous) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  return (
    <Card className={`glass ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-primary" />
          Market Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="space-y-3">
          <div className="p-3 rounded-md border border-border/40 bg-background/50 flex justify-between items-center hover:shadow-md transition-all duration-300 hover:border-primary/30">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Price</span>
            </div>
            <div className={`text-lg font-semibold ${currentPrice && prevPrice ? getTrendClass(currentPrice, prevPrice) : ''}`}>
              <span className="flex items-center gap-1">
                {currentPrice ? currentPrice.toFixed(2) : '-'}
                {currentPrice && prevPrice && getTrendIcon(currentPrice, prevPrice)}
              </span>
            </div>
          </div>
          
          <div className="p-3 rounded-md border border-border/40 bg-background/50 flex justify-between items-center hover:shadow-md transition-all duration-300 hover:border-primary/30">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Volatility</span>
            </div>
            <div className={`text-lg font-semibold ${getTrendClass(volatility, prevValues.volatility)}`}>
              <span className="flex items-center gap-1">
                {(volatility * 100).toFixed(2)}%
                {getTrendIcon(volatility, prevValues.volatility)}
              </span>
            </div>
          </div>
          
          <div className="p-3 rounded-md border border-border/40 bg-background/50 flex justify-between items-center hover:shadow-md transition-all duration-300 hover:border-primary/30">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Spread</span>
            </div>
            <div className={`text-lg font-semibold ${spreadAverage !== null && prevValues.spread !== null ? getTrendClass(spreadAverage, prevValues.spread) : ''}`}>
              <span className="flex items-center gap-1">
                {spreadAverage !== null ? spreadAverage.toFixed(3) : '-'}
                {spreadAverage !== null && prevValues.spread !== null && getTrendIcon(spreadAverage, prevValues.spread)}
              </span>
            </div>
          </div>
          
          <div className="p-3 rounded-md border border-border/40 bg-background/50 flex justify-between items-center hover:shadow-md transition-all duration-300 hover:border-primary/30">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Volume</span>
            </div>
            <div className={`text-lg font-semibold ${getTrendClass(tradingVolume, prevValues.volume)}`}>
              <span className="flex items-center gap-1">
                {tradingVolume}
                {getTrendIcon(tradingVolume, prevValues.volume)}
              </span>
            </div>
          </div>
          
          <div className="p-3 rounded-md border border-border/40 bg-background/50 flex justify-between items-center hover:shadow-md transition-all duration-300 hover:border-primary/30">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Total Trades</span>
            </div>
            <div className={`text-lg font-semibold ${getTrendClass(totalTrades, prevValues.trades)}`}>
              <span className="flex items-center gap-1">
                {totalTrades.toLocaleString()}
                {getTrendIcon(totalTrades, prevValues.trades)}
              </span>
            </div>
          </div>
          
          <div className="p-3 rounded-md border border-border/40 bg-background/50 flex justify-between items-center hover:shadow-md transition-all duration-300 hover:border-primary/30">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Deviation</span>
            </div>
            <div className={`text-lg font-semibold ${getTrendClass(fundamentalDeviation, prevValues.deviation)}`}>
              <span className="flex items-center gap-1">
                {(fundamentalDeviation * 100).toFixed(2)}%
                {getTrendIcon(fundamentalDeviation, prevValues.deviation)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricsPanel;
