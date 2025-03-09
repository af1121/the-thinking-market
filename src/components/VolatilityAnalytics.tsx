
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { AgentType, MarketEvent, VolatilityAnalytics } from '@/lib/types';

interface VolatilityAnalyticsProps {
  analytics: VolatilityAnalytics;
  className?: string;
  height?: number;
}

const VolatilityAnalytics: React.FC<VolatilityAnalyticsProps> = ({ 
  analytics, 
  className = '',
  height = 300
}) => {
  const { volatilityTimeSeries, agentContribution, stressEvents, interventionEffects } = analytics;
  
  // Transform data for the agent contribution chart
  const agentContributionData = Object.keys(agentContribution).map((agentType) => {
    return {
      name: agentType,
      contribution: agentContribution[agentType as AgentType].reduce(
        (sum, val) => sum + val, 0
      ) / agentContribution[agentType as AgentType].length
    };
  });

  return (
    <Card className={`glass ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-normal">Volatility Analytics</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {/* Volatility Time Series Chart */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Volatility Time Series</h3>
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={volatilityTimeSeries} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <XAxis 
                dataKey="time" 
                type="number"
                domain={['dataMin', 'dataMax']}
                tick={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                formatter={(value: any) => [`${(Number(value) * 100).toFixed(2)}%`, 'Volatility']}
                labelFormatter={(label) => `Time: ${new Date(label).toLocaleTimeString()}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="volatility" 
                stroke="hsl(var(--primary))" 
                dot={false} 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Agent Contribution Chart */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Agent Contribution to Volatility</h3>
          <ResponsiveContainer width="100%" height={height / 1.5}>
            <BarChart data={agentContributionData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <XAxis 
                dataKey="name"
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                formatter={(value: any) => [`${(Number(value) * 100).toFixed(2)}%`, 'Contribution']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)'
                }}
              />
              <Bar dataKey="contribution" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Stress Events */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Stress Events</h3>
          {stressEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stress events detected</p>
          ) : (
            <div className="space-y-2">
              {stressEvents.map((event, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 border border-border/40 rounded-md">
                  <div>
                    <Badge variant="outline" className="mb-1">
                      {event.type}
                    </Badge>
                    <p className="text-sm">{event.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {event.magnitude > 0 ? '+' : ''}{(event.magnitude * 100).toFixed(2)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Intervention Effects */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Intervention Effects</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-md border border-border/40 bg-background/50 flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Circuit Breakers Triggered</span>
              <span className="text-xl font-light mt-1">
                {interventionEffects.circuitBreakerTriggered}
              </span>
            </div>
            <div className="p-3 rounded-md border border-border/40 bg-background/50 flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Volatility Reduction</span>
              <span className="text-xl font-light mt-1">
                {(interventionEffects.avgVolatilityReduction * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VolatilityAnalytics;
