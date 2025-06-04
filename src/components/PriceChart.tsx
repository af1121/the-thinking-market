import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, AreaChart, Area, ComposedChart } from 'recharts';
import { Trade } from '@/lib/types';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  Shield, 
  Target,
  BarChart3,
  Zap,
  LineChart as LineChartIcon
} from 'lucide-react';
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
  const [showFundamental, setShowFundamental] = useState(true);

  // Enhanced data processing with moving averages and technical indicators
  const chartData = useMemo(() => {
    if (trades.length === 0) return [];
    
    // Take last 2000 trades for the chart - increased from 1000 to 2000
    const recentTrades = trades.slice(-2000);
    
    return recentTrades.map((trade, index) => {
      // Calculate moving averages
      const shortWindow = 5;
      const longWindow = 10;
      
      const shortStartIndex = Math.max(0, index - shortWindow + 1);
      const longStartIndex = Math.max(0, index - longWindow + 1);
      
      const shortWindow_trades = recentTrades.slice(shortStartIndex, index + 1);
      const longWindow_trades = recentTrades.slice(longStartIndex, index + 1);
      
      const shortMA = shortWindow_trades.reduce((sum, t) => sum + t.price, 0) / shortWindow_trades.length;
      const longMA = longWindow_trades.reduce((sum, t) => sum + t.price, 0) / longWindow_trades.length;
      
      // Calculate price momentum
      const momentumWindow = 3;
      const momentumStartIndex = Math.max(0, index - momentumWindow);
      const momentum = index >= momentumWindow ? 
        ((trade.price - recentTrades[momentumStartIndex].price) / recentTrades[momentumStartIndex].price) * 100 : 0;
      
      return {
        index,
        price: trade.price,
        shortMA,
        longMA,
        momentum,
        volume: trade.quantity,
        time: trade.timestamp,
        timeFormatted: new Date(trade.timestamp).toLocaleTimeString(),
        deviation: Math.abs(trade.price - fundamentalValue) / fundamentalValue * 100
      };
    });
  }, [trades, fundamentalValue]);

  // Calculate enhanced price statistics
  const priceStats = useMemo(() => {
    if (chartData.length === 0) return null;
    
    const prices = chartData.map(d => d.price);
    const volumes = chartData.map(d => d.volume);
    const deviations = chartData.map(d => d.deviation);
    
    const currentPrice = prices[prices.length - 1];
    const previousPrice = prices.length > 1 ? prices[prices.length - 2] : currentPrice;
    const change = currentPrice - previousPrice;
    const changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;
    
    // Calculate price volatility
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const volatility = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    
    // Calculate trend strength
    const recentPrices = prices.slice(-10);
    const previousPrices = prices.slice(-20, -10);
    const recentAvg = recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length;
    const previousAvg = previousPrices.length > 0 ? previousPrices.reduce((sum, p) => sum + p, 0) / previousPrices.length : recentAvg;
    const trendStrength = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
    
    return {
      current: currentPrice,
      change,
      changePercent,
      min: Math.min(...prices),
      max: Math.max(...prices),
      avgVolume: volumes.reduce((sum, v) => sum + v, 0) / volumes.length,
      volatility: volatility * 100,
      trendStrength,
      avgDeviation: deviations.reduce((sum, d) => sum + d, 0) / deviations.length,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  }, [chartData]);

  // Calculate Y-axis domain with better padding and minimum 10 dollar range
  const priceDomain = useMemo(() => {
    if (chartData.length === 0) return [95, 105];
    
    const prices = chartData.map(d => d.price);
    const shortMAs = chartData.map(d => d.shortMA);
    const longMAs = chartData.map(d => d.longMA);
    const allValues = [...prices, ...shortMAs, ...longMAs, fundamentalValue];
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min;
    const padding = Math.max(range * 0.05, 0.1);
    
    // Calculate initial domain with padding
    let domainMin = min - padding;
    let domainMax = max + padding;
    
    // Ensure minimum 10 dollar range
    const currentRange = domainMax - domainMin;
    if (currentRange < 10) {
      const additionalRange = 10 - currentRange;
      const halfAdditional = additionalRange / 2;
      domainMin -= halfAdditional;
      domainMax += halfAdditional;
    }
    
    return [domainMin, domainMax];
  }, [chartData, fundamentalValue]);

  // Risk assessment based on volatility and deviation
  const getRiskLevel = (volatility: number, deviation: number) => {
    const riskScore = volatility + deviation;
    if (riskScore > 3) return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
    if (riskScore > 1.5) return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
  };

  const riskAssessment = priceStats ? getRiskLevel(priceStats.volatility, priceStats.avgDeviation) : 
    { level: 'Unknown', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Price Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-lg border ${riskAssessment.bgColor} ${riskAssessment.borderColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${riskAssessment.color}`} />
              <span className="text-sm font-medium text-gray-700">Price Risk</span>
            </div>
            <Badge variant="outline" className={`${riskAssessment.color} border-current`}>
              {riskAssessment.level}
            </Badge>
          </div>
          <div className={`text-lg font-bold mt-1 ${riskAssessment.color}`}>
            {priceStats ? `${priceStats.volatility.toFixed(2)}%` : 'N/A'}
          </div>
        </div>
        
        <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Trend</span>
            </div>
            {priceStats && priceStats.trendStrength > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : priceStats && priceStats.trendStrength < 0 ? (
              <TrendingDown className="w-4 h-4 text-red-500" />
            ) : (
              <Activity className="w-4 h-4 text-gray-500" />
            )}
          </div>
          <div className={`text-lg font-bold mt-1 ${
            priceStats && priceStats.trendStrength > 0 ? 'text-green-600' : 
            priceStats && priceStats.trendStrength < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {priceStats ? `${priceStats.trendStrength > 0 ? '+' : ''}${priceStats.trendStrength.toFixed(1)}%` : 'N/A'}
          </div>
        </div>
      </div>
      
      {/* Enhanced Price Chart */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Price Trends & Moving Averages
        </h3>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <XAxis 
              dataKey="index"
              type="number"
              domain={[0, 'dataMax']}
              tick={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              domain={priceDomain}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              width={60}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                name === 'price' ? `$${value.toFixed(3)}` : 
                name === 'shortMA' ? `$${value.toFixed(3)}` :
                name === 'longMA' ? `$${value.toFixed(3)}` : `${value.toFixed(2)}%`,
                name === 'price' ? 'Current Price' : 
                name === 'shortMA' ? 'Short MA (5)' :
                name === 'longMA' ? 'Long MA (10)' : 'Momentum'
              ]}
              labelFormatter={(label: number) => {
                const dataPoint = chartData[label];
                return dataPoint ? dataPoint.timeFormatted : '';
              }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
                fontSize: '12px'
              }}
            />
            {showFundamental && (
              <Line 
                type="monotone" 
                dataKey={() => fundamentalValue}
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3"
                strokeOpacity={0.7}
                dot={false}
                name="Fundamental"
              />
            )}
            <Area 
              type="monotone" 
              dataKey="price" 
              fill="hsl(var(--primary))" 
              fillOpacity={0.1}
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Legend />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Price Statistics */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className="text-center p-2 bg-gray-50 rounded border transition-all duration-300 hover:shadow-md">
          <div className="font-medium text-gray-600">Current</div>
          <div className={`font-bold transition-colors duration-500 ${
            priceStats?.direction === 'up' ? 'text-green-600' : 
            priceStats?.direction === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            ${priceStats?.current.toFixed(3) || 'N/A'}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded border transition-all duration-300 hover:shadow-md">
          <div className="font-medium text-gray-600">Volatility</div>
          <div className="font-bold text-purple-600 transition-all duration-300">
            {priceStats?.volatility.toFixed(2) || '0.00'}%
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded border transition-all duration-300 hover:shadow-md">
          <div className="font-medium text-gray-600">High</div>
          <div className="font-bold text-red-600 transition-all duration-300">
            ${priceStats?.max.toFixed(3) || 'N/A'}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded border transition-all duration-300 hover:shadow-md">
          <div className="font-medium text-gray-600">Low</div>
          <div className="font-bold text-green-600 transition-all duration-300">
            ${priceStats?.min.toFixed(3) || 'N/A'}
          </div>
        </div>
      </div>
      
      {/* Technical Analysis */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <LineChartIcon className="w-4 h-4" />
          Technical Analysis
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                priceStats && priceStats.volatility > 2 ? 'bg-red-500' : 
                priceStats && priceStats.volatility > 1 ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
              <span className="text-sm font-medium">Price Volatility</span>
              <Badge variant="outline" className="text-xs">
                {priceStats && priceStats.volatility > 2 ? 'High' : 
                 priceStats && priceStats.volatility > 1 ? 'Medium' : 'Low'}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold">
                {priceStats?.volatility.toFixed(3) || '0.000'}%
              </div>
              <div className="text-xs text-gray-500">
                Avg Vol: {priceStats?.volatility.toFixed(3) || '0.000'}%
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                priceStats && priceStats.avgDeviation > 2 ? 'bg-red-500' : 
                priceStats && priceStats.avgDeviation > 1 ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
              <span className="text-sm font-medium">Fundamental Deviation</span>
              <Badge variant="outline" className="text-xs">
                {priceStats && priceStats.avgDeviation > 2 ? 'High' : 
                 priceStats && priceStats.avgDeviation > 1 ? 'Medium' : 'Low'}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold">
                {priceStats?.avgDeviation.toFixed(3) || '0.000'}%
              </div>
              <div className="text-xs text-gray-500">
                From: ${fundamentalValue.toFixed(2)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                priceStats && Math.abs(priceStats.trendStrength) > 1 ? 'bg-blue-500' : 'bg-gray-500'
              }`} />
              <span className="text-sm font-medium">Trend Strength</span>
              <Badge variant="outline" className="text-xs">
                {priceStats && Math.abs(priceStats.trendStrength) > 1 ? 'Strong' : 'Weak'}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold">
                {priceStats ? `${priceStats.trendStrength > 0 ? '+' : ''}${priceStats.trendStrength.toFixed(3)}%` : '0.000%'}
              </div>
              <div className="text-xs text-gray-500">
                10-period trend
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Market Events & Alerts */}
      {priceStats && (priceStats.volatility > 3 || priceStats.avgDeviation > 3) && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Market Alerts
          </h3>
          
          <div className="grid grid-cols-2 gap-2">
            {priceStats.volatility > 3 && (
              <div className="p-2 bg-orange-50 rounded border border-orange-200">
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-orange-600" />
                  <span className="text-xs font-medium text-orange-700">High Volatility</span>
                </div>
                <div className="text-lg font-bold text-orange-600">{priceStats.volatility.toFixed(2)}%</div>
              </div>
            )}
            
            {priceStats.avgDeviation > 3 && (
              <div className="p-2 bg-red-50 rounded border border-red-200">
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-red-600" />
                  <span className="text-xs font-medium text-red-700">Price Deviation</span>
                </div>
                <div className="text-lg font-bold text-red-600">{priceStats.avgDeviation.toFixed(2)}%</div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Trade Count Info */}
      <div className="text-center text-xs text-gray-500 transition-all duration-300">
        Showing last {chartData.length} trades of {trades.length} total
        {priceStats && (
          <span className="ml-2">• Avg Volume: {priceStats.avgVolume.toFixed(0)} units</span>
        )}
      </div>
    </div>
  );
};

export default PriceChart;
