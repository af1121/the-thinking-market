
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricsData } from '@/lib/types';

interface MetricsPanelProps {
  metrics: MetricsData;
  currentPrice: number | null;
  className?: string;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ 
  metrics, 
  currentPrice, 
  className = '' 
}) => {
  const { volatility, spread, tradingVolume, orderBookDepth, fundamentalDeviation } = metrics;

  return (
    <Card className={`glass ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-normal">Market Metrics</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-3 rounded-md border border-border/40 bg-background/50 flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Price</span>
            <span className="text-xl font-light mt-1">
              {currentPrice ? currentPrice.toFixed(2) : '-'}
            </span>
          </div>
          
          <div className="p-3 rounded-md border border-border/40 bg-background/50 flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Volatility</span>
            <span className="text-xl font-light mt-1">
              {(volatility * 100).toFixed(2)}%
            </span>
          </div>
          
          <div className="p-3 rounded-md border border-border/40 bg-background/50 flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Spread</span>
            <span className="text-xl font-light mt-1">
              {spread !== null ? spread.toFixed(3) : '-'}
            </span>
          </div>
          
          <div className="p-3 rounded-md border border-border/40 bg-background/50 flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Volume</span>
            <span className="text-xl font-light mt-1">
              {tradingVolume}
            </span>
          </div>
          
          <div className="p-3 rounded-md border border-border/40 bg-background/50 flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Deviation</span>
            <span className="text-xl font-light mt-1">
              {(fundamentalDeviation * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricsPanel;
