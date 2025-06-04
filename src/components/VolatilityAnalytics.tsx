import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, AreaChart, Area, ComposedChart } from 'recharts';
import { AgentType, MarketEvent, VolatilityAnalytics as VolatilityAnalyticsType } from '@/lib/types';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  Shield, 
  Target,
  BarChart3,
  Zap,
  Users
} from 'lucide-react';

interface VolatilityAnalyticsProps {
  analytics: VolatilityAnalyticsType;
  className?: string;
  height?: number;
}

const VolatilityAnalytics: React.FC<VolatilityAnalyticsProps> = ({ 
  analytics, 
  className = '',
  height = 200
}) => {
  const { volatilityTimeSeries, agentContribution, stressEvents, interventionEffects } = analytics;
  
  // Calculate volatility statistics
  const volatilityValues = volatilityTimeSeries.map(d => d.volatility);
  const currentVolatility = volatilityValues[volatilityValues.length - 1] || 0;
  const avgVolatility = volatilityValues.length > 0 ? volatilityValues.reduce((a, b) => a + b, 0) / volatilityValues.length : 0;
  const maxVolatility = volatilityValues.length > 0 ? Math.max(...volatilityValues) : 0;
  const minVolatility = volatilityValues.length > 0 ? Math.min(...volatilityValues) : 0;
  const volatilityStd = volatilityValues.length > 1 ? Math.sqrt(volatilityValues.reduce((sum, val) => sum + Math.pow(val - avgVolatility, 2), 0) / volatilityValues.length) : 0;
  
  // Calculate volatility trend (last 10 vs previous 10 data points)
  const recentVolatility = volatilityValues.slice(-10);
  const previousVolatility = volatilityValues.slice(-20, -10);
  const recentAvg = recentVolatility.length > 0 ? recentVolatility.reduce((a, b) => a + b, 0) / recentVolatility.length : 0;
  const previousAvg = previousVolatility.length > 0 ? previousVolatility.reduce((a, b) => a + b, 0) / previousVolatility.length : 0;
  const volatilityTrend = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
  
  // Risk assessment
  const getRiskLevel = (vol: number) => {
    if (vol > 0.05) return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
    if (vol > 0.02) return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
  };
  
  const riskAssessment = getRiskLevel(currentVolatility);
  
  // Transform data for enhanced charts
  const agentContributionData = Object.keys(agentContribution).map((agentType) => {
    const contributions = agentContribution[agentType as AgentType];
    const avgContribution = contributions.length > 0 ? contributions.reduce((sum, val) => sum + val, 0) / contributions.length : 0;
    const recentContribution = contributions.length > 0 ? contributions[contributions.length - 1] : 0;
    
    return {
      name: agentType.replace('_', ' '),
      avgContribution: avgContribution,
      recentContribution: recentContribution,
      impact: avgContribution > 0.01 ? 'High' : avgContribution > 0.005 ? 'Medium' : 'Low'
    };
  });
  
  // Enhanced volatility data with moving averages
  const enhancedVolatilityData = volatilityTimeSeries.map((point, index) => {
    const windowSize = 5;
    const startIndex = Math.max(0, index - windowSize + 1);
    const window = volatilityTimeSeries.slice(startIndex, index + 1);
    const movingAvg = window.reduce((sum, p) => sum + p.volatility, 0) / window.length;
    
    return {
      ...point,
      movingAverage: movingAvg,
      timeFormatted: new Date(point.time).toLocaleTimeString()
    };
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Volatility Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-lg border ${riskAssessment.bgColor} ${riskAssessment.borderColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${riskAssessment.color}`} />
              <span className="text-sm font-medium text-gray-700">Current Risk</span>
            </div>
            <Badge variant="outline" className={`${riskAssessment.color} border-current`}>
              {riskAssessment.level}
            </Badge>
          </div>
          <div className={`text-lg font-bold mt-1 ${riskAssessment.color}`}>
            {(currentVolatility * 100).toFixed(2)}%
          </div>
        </div>
        
        <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Trend</span>
            </div>
            {volatilityTrend > 0 ? (
              <TrendingUp className="w-4 h-4 text-red-500" />
            ) : volatilityTrend < 0 ? (
              <TrendingDown className="w-4 h-4 text-green-500" />
            ) : (
              <Activity className="w-4 h-4 text-gray-500" />
            )}
          </div>
          <div className={`text-lg font-bold mt-1 ${volatilityTrend > 0 ? 'text-red-600' : volatilityTrend < 0 ? 'text-green-600' : 'text-gray-600'}`}>
            {volatilityTrend > 0 ? '+' : ''}{volatilityTrend.toFixed(1)}%
          </div>
        </div>
      </div>
      
      {/* Enhanced Volatility Chart */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Volatility Trends & Moving Average
        </h3>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={enhancedVolatilityData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
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
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                `${(value * 100).toFixed(3)}%`, 
                name === 'volatility' ? 'Current' : 'Moving Avg'
              ]}
              labelFormatter={(label: number) => `${new Date(label).toLocaleTimeString()}`}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
                fontSize: '12px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="volatility" 
              fill="hsl(var(--primary))" 
              fillOpacity={0.1}
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="movingAverage" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
            />
            <Legend />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Volatility Statistics */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className="text-center p-2 bg-gray-50 rounded border">
          <div className="font-medium text-gray-600">Average</div>
          <div className="font-bold text-blue-600">{(avgVolatility * 100).toFixed(2)}%</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded border">
          <div className="font-medium text-gray-600">Maximum</div>
          <div className="font-bold text-red-600">{(maxVolatility * 100).toFixed(2)}%</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded border">
          <div className="font-medium text-gray-600">Minimum</div>
          <div className="font-bold text-green-600">{(minVolatility * 100).toFixed(2)}%</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded border">
          <div className="font-medium text-gray-600">Std Dev</div>
          <div className="font-bold text-purple-600">{(volatilityStd * 100).toFixed(2)}%</div>
        </div>
      </div>
      
      {/* Agent Impact Analysis */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Users className="w-4 h-4" />
          Agent Impact on Volatility
        </h3>
        <div className="space-y-2">
          {agentContributionData.map((agent, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  agent.impact === 'High' ? 'bg-red-500' : 
                  agent.impact === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <span className="text-sm font-medium">{agent.name}</span>
                <Badge variant="outline" className="text-xs">
                  {agent.impact}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">
                  {(agent.recentContribution * 100).toFixed(3)}%
                </div>
                <div className="text-xs text-gray-500">
                  Avg: {(agent.avgContribution * 100).toFixed(3)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Market Events & Interventions */}
      {(stressEvents.length > 0 || interventionEffects.circuitBreakerTriggered > 0) && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Market Events & Interventions
          </h3>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-orange-50 rounded border border-orange-200">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-orange-600" />
                <span className="text-xs font-medium text-orange-700">Stress Events</span>
              </div>
              <div className="text-lg font-bold text-orange-600">{stressEvents.length}</div>
            </div>
            
            <div className="p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Circuit Breakers</span>
              </div>
              <div className="text-lg font-bold text-blue-600">{interventionEffects.circuitBreakerTriggered}</div>
            </div>
          </div>
          
          {stressEvents.length > 0 && (
            <div className="max-h-20 overflow-y-auto space-y-1">
              {stressEvents.slice(-3).map((event, idx) => (
                <div key={idx} className="flex items-center justify-between p-1 text-xs bg-white rounded border">
                  <Badge variant="outline" className="text-xs">
                    {event.type}
                  </Badge>
                  <span className="font-medium">
                    {event.magnitude > 0 ? '+' : ''}{(event.magnitude * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VolatilityAnalytics;
