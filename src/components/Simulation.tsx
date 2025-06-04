import React, { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import OrderBook from './OrderBook';
import PriceChart from './PriceChart';
import AgentControls from './AgentControls';
import SimulationControls from './SimulationControls';
import MetricsPanel from './MetricsPanel';
import MarketInterventions from './MarketInterventions';
import VolatilityAnalytics from './VolatilityAnalytics';
import { AgentType, MetricsData, SimulationState, VolatilityAnalytics as AnalyticsType, MarketEventType, SimulationParameters } from '@/lib/types';
import { SimulationEngine } from '@/lib/simulationEngine';
import { rlAgentService, type RLAgentInfo } from '@/services/rlAgentService';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  TrendingUp, 
  Users, 
  Brain, 
  Settings, 
  Zap, 
  BarChart3, 
  Plus, 
  Minus, 
  Bot,
  Activity,
  Target,
  AlertTriangle,
  Info,
  Download,
  Upload,
  Copy,
  FlaskConical,
  BookOpen
} from 'lucide-react';
import ControlPanel from './ControlPanel';

const Simulation: React.FC = () => {
  // Create simulation engine instance
  const [engine] = useState(() => new SimulationEngine());
  const [state, setState] = useState<SimulationState>(engine.getState());

  // Dummy RL Agent state - changed to support multiple agents
  const [rlAgents, setRlAgents] = useState<Array<{
    id: string;
    active: boolean;
    hyperparameters: {
      learningRate: number;
      batchSize: number;
      networkLayers: number[];
      explorationRate: number;
      discountFactor: number;
      strategy: 'momentum' | 'mean_reversion' | 'adaptive';
    };
    performance: {
      totalReturn: number;
      winRate: number;
      tradesExecuted: number;
    };
  }>>([]);

  // Metrics state
  const [metrics, setMetrics] = useState<MetricsData>({
    volatility: 0,
    spreadAverage: null,
    tradingVolume: 0,
    orderBookDepth: 0,
    fundamentalDeviation: 0,
    priceImpact: 0,
    volatilityByAgentType: {
      [AgentType.MARKET_MAKER]: 0,
      [AgentType.MOMENTUM_TRADER]: 0,
      [AgentType.FUNDAMENTAL_TRADER]: 0,
      [AgentType.NOISE_TRADER]: 0
    }
  });

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsType>({
    volatilityTimeSeries: [],
    agentContribution: {
      [AgentType.MARKET_MAKER]: [],
      [AgentType.MOMENTUM_TRADER]: [],
      [AgentType.FUNDAMENTAL_TRADER]: [],
      [AgentType.NOISE_TRADER]: []
    },
    stressEvents: [],
    interventionEffects: {
      circuitBreakerTriggered: 0,
      avgVolatilityReduction: 0
    }
  });
  
  // Trading session state
  const [sessionStats, setSessionStats] = useState({
    startTime: Date.now(),
    totalTrades: 0,
    profitLoss: 0,
    bestPrice: 0,
    worstPrice: 0,
    avgVolatility: 0
  });

  // Function to update the UI state
  const updateState = useCallback(() => {
    const simulationState = engine.getState();
    setState(simulationState);
    
    const newMetrics = engine.getMetrics();
    setMetrics(newMetrics);
    
    const newAnalytics = engine.getAnalytics();
    setAnalytics(newAnalytics);
    
    // Update session stats with actual trade count from simulation
    setSessionStats(prev => ({
      ...prev,
      totalTrades: simulationState.market.trades.length,
      bestPrice: Math.max(prev.bestPrice, simulationState.market.currentPrice || prev.bestPrice),
      worstPrice: prev.worstPrice === 0 ? (simulationState.market.currentPrice || 0) : Math.min(prev.worstPrice, simulationState.market.currentPrice || prev.worstPrice),
      avgVolatility: newMetrics.volatility
    }));
    
    // Update RL agents performance based on market activity
    setRlAgents(prev => prev.map(agent => {
      if (!agent.active) return agent;
      
      const recentTrades = simulationState.market.trades.slice(-10);
      const avgPrice = recentTrades.length > 0 ? 
        recentTrades.reduce((sum, trade) => sum + trade.price, 0) / recentTrades.length : 
        simulationState.market.currentPrice;
      
      return {
        ...agent,
        performance: {
          totalReturn: (avgPrice - 100) / 100, // Simulate performance based on price movement
          winRate: Math.min(0.8, Math.max(0.2, agent.performance.winRate + (Math.random() - 0.5) * 0.01)),
          tradesExecuted: agent.performance.tradesExecuted + (recentTrades.length > agent.performance.tradesExecuted ? 1 : 0)
        }
      };
    }));
    
    // Circuit breaker trigger notifications
    if (newAnalytics.interventionEffects.circuitBreakerTriggered > 
        analytics.interventionEffects.circuitBreakerTriggered) {
      toast.info("⚡ Circuit Breaker Activated", {
        description: "Trading halted to prevent excessive volatility."
      });
    }
    
  }, [engine, analytics.interventionEffects.circuitBreakerTriggered]);

  // Set up a periodic update interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      updateState();
    }, 100); // Update UI 10 times per second

    return () => clearInterval(intervalId);
  }, [updateState]);

  // Control functions
  const handleStart = useCallback(() => {
    engine.start();
    updateState();
    toast("🟢 Market Started!", {
      description: "Agents are now actively trading in your market."
    });
  }, [engine, updateState]);

  const handleStop = useCallback(() => {
    engine.stop();
    updateState();
    toast("⏸️ Market Paused!", {
      description: "Trading activity has been temporarily halted."
    });
  }, [engine, updateState]);

  const handleReset = useCallback(() => {
    engine.reset();
    updateState();
    
    // Reset all RL agents
    setRlAgents([]);
    
    setSessionStats({
      startTime: Date.now(),
      totalTrades: 0,
      profitLoss: 0,
      bestPrice: 0,
      worstPrice: 0,
      avgVolatility: 0
    });
    
    toast("🔄 Market Reset!", {
      description: "Starting fresh with a new trading session. All agents deactivated."
    });
  }, [engine, updateState]);

  const handleAddAgent = useCallback((type: AgentType) => {
    engine.addAgent(type);
    updateState();
    
    const agentNames = {
      [AgentType.MARKET_MAKER]: "Market Maker",
      [AgentType.MOMENTUM_TRADER]: "Momentum Trader",
      [AgentType.FUNDAMENTAL_TRADER]: "Fundamental Trader",
      [AgentType.NOISE_TRADER]: "Noise Trader"
    };
    
    toast(`✅ ${agentNames[type]} Joined!`, {
      description: "New trading agent is now participating in the market."
    });
    
  }, [engine, updateState]);

  const handleRemoveAgent = useCallback((id: string) => {
    engine.removeAgent(id);
    updateState();
    toast("❌ Agent Removed", {
      description: "Trading agent has left the market."
    });
  }, [engine, updateState]);

  const handleToggleAgent = useCallback((id: string) => {
    engine.toggleAgentActive(id);
    updateState();
  }, [engine, updateState]);

  // RL Agent management - updated for multiple agents
  const handleAddRLAgent = useCallback(() => {
    const newAgent = {
      id: `rl_agent_${Date.now()}`,
      active: true,
      hyperparameters: {
        learningRate: 0.00005,
        batchSize: 64,
        networkLayers: [512, 256, 128],
        explorationRate: 0.1,
        discountFactor: 0.99,
        strategy: 'adaptive' as 'momentum' | 'mean_reversion' | 'adaptive'
      },
      performance: {
        totalReturn: 0,
        winRate: 0.5,
        tradesExecuted: 0
      }
    };
    
    setRlAgents(prev => [...prev, newAgent]);
    
    toast("🧠 RL Agent Added!", {
      description: `New ${newAgent.hyperparameters.strategy} strategy agent is now trading with simulated AI behavior.`
    });
  }, []);

  const handleRemoveRLAgent = useCallback((agentId: string) => {
    setRlAgents(prev => prev.filter(agent => agent.id !== agentId));
    
    toast("🔴 RL Agent Removed", {
      description: "AI agent has been removed from the market."
    });
  }, []);

  const handleToggleRLAgent = useCallback((agentId: string) => {
    setRlAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, active: !agent.active }
        : agent
    ));
  }, []);

  const handleUpdateRLHyperparameters = useCallback((agentId: string, newHyperparameters: Partial<typeof rlAgents[0]['hyperparameters']>) => {
    setRlAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? {
            ...agent,
            hyperparameters: {
              ...agent.hyperparameters,
              ...newHyperparameters
            }
          }
        : agent
    ));
    
    toast("⚙️ RL Hyperparameters Updated!", {
      description: "AI agent configuration has been modified."
    });
  }, []);

  const handleUpdateParameters = useCallback((params: Partial<SimulationParameters>) => {
    engine.updateParameters(params);
    updateState();
    toast("⚙️ Parameters Updated!", {
      description: "Market configuration has been modified."
    });
  }, [engine, updateState]);

  const handleSpeedChange = useCallback((speed: number) => {
    engine.setSpeed(speed);
    updateState();
    toast(`⚡ Speed: ${speed.toFixed(1)}x`, {
      description: "Simulation speed has been adjusted."
    });
  }, [engine, updateState]);

  const handleInjectEvent = useCallback((eventType: MarketEventType, magnitude: number) => {
    engine.injectMarketEvent(eventType, magnitude);
    updateState();
    
    const eventMessages = {
      [MarketEventType.NEWS]: magnitude > 0 ? "📈 Positive News Impact!" : "📉 Negative News Impact!",
      [MarketEventType.LIQUIDITY_SHOCK]: "💥 Liquidity Shock Event!",
      [MarketEventType.PRICE_SHOCK]: "⚡ Sudden Price Movement!",
      [MarketEventType.VOLATILITY_SPIKE]: "🌊 Volatility Surge!",
      [MarketEventType.FLASH_CRASH]: "💥 Flash Crash Event!"
    };
    
    toast.warning(eventMessages[eventType], {
      description: "Watch how your agents respond to this market event."
    });
    
  }, [engine, updateState]);

  const sessionDuration = Math.floor((Date.now() - sessionStats.startTime) / 1000);
  const sessionMinutes = Math.floor(sessionDuration / 60);
  const sessionSeconds = sessionDuration % 60;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Brain className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Live Market Simulation</h1>
                <p className="text-sm text-gray-600">Interactive AI Trading Environment</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right text-sm">
                <div className="font-medium text-gray-900">Session: {sessionMinutes}:{sessionSeconds.toString().padStart(2, '0')}</div>
                <div className="text-gray-600">Tick: {state.tick}</div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={state.running ? handleStop : handleStart}
                  variant={state.running ? "outline" : "default"}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  {state.running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>{state.running ? "Pause" : "Start"}</span>
                </Button>
                
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-1 p-6 space-y-6">
        {/* RL Agent Disclaimer & Research Context */}
        <Alert className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-2">
              <div className="font-semibold">Important Notice: Demonstration Platform</div>
              <div className="text-sm">
                <strong>RL Agents are Simulated:</strong> This platform demonstrates the research methodology and findings from the thesis. 
                The "RL agents" shown are rule-based simulations that approximate the behavior patterns observed in the actual study.
              </div>
              <div className="text-sm">
                <strong>Research Purpose:</strong> Use this platform to understand the experimental design, replicate the methodology, 
                or extend the research with your own parameters. The actual Ray-RLlib training system is not included in this demo.
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Session Stats & Achievements */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{state.market.trades.length}</div>
                  <div className="text-sm text-gray-600">Total Trades</div>
                  {state.market.trades.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Recent: {state.market.trades.slice(-10).length} in last 10
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">${state.market.currentPrice.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Current Price</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">{state.agents.length + rlAgents.filter(agent => agent.active).length}</div>
                  <div className="text-sm text-gray-600">Active Agents</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">{(metrics.volatility * 100).toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Volatility</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <ControlPanel
          agents={state.agents}
          rlAgents={rlAgents}
          onAddAgent={handleAddAgent}
          onRemoveAgent={handleRemoveAgent}
          onToggleAgent={handleToggleAgent}
          onAddRLAgent={handleAddRLAgent}
          onRemoveRLAgent={handleRemoveRLAgent}
          onToggleRLAgent={handleToggleRLAgent}
          onUpdateRLHyperparameters={handleUpdateRLHyperparameters}
          parameters={state.parameters}
          speed={state.speed}
          circuitBreakerActive={state.circuitBreakerActive}
          onUpdateParameters={handleUpdateParameters}
          onSpeedChange={handleSpeedChange}
          onInjectEvent={handleInjectEvent}
        />
        
        {/* Demo Notice */}
        <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <Bot className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">🤖 Demo Mode: AI Agents Simulated</div>
                <div className="text-sm mt-1">
                  RL agents show simulated performance data for demonstration purposes. 
                  In production, these would be real trained neural networks making live trading decisions.
                </div>
              </div>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 ml-4">
                DEMO
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
        
        {/* Main Simulation Interface */}
        <Tabs defaultValue="trading" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trading" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live Trading
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Market Analytics
            </TabsTrigger>
          </TabsList>

          {/* Live Trading Tab */}
          <TabsContent value="trading" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Main Trading Interface */}
              <div className="xl:col-span-3 space-y-6">
                {/* Price Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Live Price Chart</span>
                      <Badge variant="outline">{state.market.trades.length} trades</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PriceChart 
                      trades={state.market.trades} 
                      fundamentalValue={state.market.fundamentalValue}
                      height={350}
                    />
                  </CardContent>
                </Card>
              </div>
              
              {/* Order Book */}
              <div className="xl:col-span-1">
                <Card className="h-fit">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Order Book</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <OrderBook orderBook={state.market.orderBook} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Market Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Overview Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Market Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <MetricsPanel 
                    metrics={metrics}
                    currentPrice={state.market.currentPrice}
                    totalTrades={state.market.trades.length}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Volatility Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <VolatilityAnalytics 
                    analytics={analytics} 
                    height={200}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Agent Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Traditional Agents</span>
                      <Badge variant="outline">{state.agents.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">RL Agents</span>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {rlAgents.filter(agent => agent.active).length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-sm">Total Active</span>
                      <Badge>{state.agents.length + rlAgents.filter(agent => agent.active).length}</Badge>
                    </div>
                    
                    {/* Agent Type Breakdown */}
                    <div className="mt-4 space-y-2">
                      <div className="text-xs font-medium text-gray-700 mb-2">Traditional Agents by Type:</div>
                      {Object.values(AgentType).map(type => {
                        const count = state.agents.filter(agent => agent.type === type).length;
                        if (count === 0) return null;
                        return (
                          <div key={type} className="flex justify-between items-center text-xs">
                            <span className="text-gray-600">{type.replace('_', ' ')}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Agent Performance Comparison */}
            {(state.agents.length > 0 || rlAgents.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5" />
                    <span>Unified Agent Performance Comparison</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Performance Comparison Table */}
                    <div>
                      <h4 className="font-medium mb-4 text-gray-700">Performance Metrics Comparison</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-3">Agent</th>
                              <th className="text-left py-2 px-3">Type</th>
                              <th className="text-right py-2 px-3">Total Return</th>
                              <th className="text-right py-2 px-3">Win Rate</th>
                              <th className="text-right py-2 px-3">Trades</th>
                              <th className="text-right py-2 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Traditional Agents */}
                            {state.agents.map((agent) => {
                              const agentTrades = state.market.trades.filter(
                                trade => trade.buyAgentId === agent.id || trade.sellAgentId === agent.id
                              );
                              
                              let position = 0;
                              const initialCash = 10000;
                              let currentCash = initialCash;
                              
                              agentTrades.forEach(trade => {
                                if (trade.buyAgentId === agent.id) {
                                  position += trade.quantity;
                                  currentCash -= trade.price * trade.quantity;
                                } else {
                                  position -= trade.quantity;
                                  currentCash += trade.price * trade.quantity;
                                }
                              });
                              
                              const currentValue = currentCash + (position * state.market.currentPrice);
                              const totalReturn = ((currentValue - initialCash) / initialCash) * 100;
                              
                              let profitableTrades = 0;
                              let buyPrice = 0;
                              let hasBuyPosition = false;
                              
                              agentTrades.forEach(trade => {
                                if (trade.buyAgentId === agent.id) {
                                  buyPrice = trade.price;
                                  hasBuyPosition = true;
                                } else if (trade.sellAgentId === agent.id && hasBuyPosition) {
                                  if (trade.price > buyPrice) {
                                    profitableTrades++;
                                  }
                                  hasBuyPosition = false;
                                }
                              });
                              
                              const winRate = agentTrades.length > 0 ? (profitableTrades / Math.max(1, Math.floor(agentTrades.length / 2))) * 100 : 0;
                              
                              return (
                                <tr key={agent.id} className="border-b hover:bg-gray-50">
                                  <td className="py-2 px-3">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      <span className="font-medium">{agent.type.replace('_', ' ')}</span>
                                    </div>
                                  </td>
                                  <td className="py-2 px-3 text-gray-600">Traditional</td>
                                  <td className="py-2 px-3 text-right font-medium">
                                    <span className={totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-right">{winRate.toFixed(1)}%</td>
                                  <td className="py-2 px-3 text-right">{agentTrades.length}</td>
                                  <td className="py-2 px-3 text-right">
                                    <span className={`px-2 py-1 rounded-full text-xs ${agent.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                      {agent.active ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                            
                            {/* RL Agents */}
                            {rlAgents.filter(agent => agent.active).map((agent) => (
                              <tr key={agent.id} className="border-b hover:bg-purple-50">
                                <td className="py-2 px-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    <span className="font-medium">{agent.hyperparameters.strategy.replace('_', ' ')} RL</span>
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-purple-600">RL Agent</td>
                                <td className="py-2 px-3 text-right font-medium">
                                  <span className={agent.performance.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {agent.performance.totalReturn >= 0 ? '+' : ''}{(agent.performance.totalReturn * 100).toFixed(2)}%
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right">{(agent.performance.winRate * 100).toFixed(1)}%</td>
                                <td className="py-2 px-3 text-right">{agent.performance.tradesExecuted}</td>
                                <td className="py-2 px-3 text-right">
                                  <span className={`px-2 py-1 rounded-full text-xs ${agent.active ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {agent.active ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Performance Summary */}
                    {(state.agents.length > 0 && rlAgents.length > 0) && (
                      <div>
                        <h4 className="font-medium mb-4 text-gray-700">Performance Summary</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <h5 className="font-medium text-blue-800 mb-2">Traditional Agents</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-blue-700">Active Agents:</span>
                                <span className="font-medium">{state.agents.filter(a => a.active).length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700">Total Trades:</span>
                                <span className="font-medium">
                                  {state.agents.reduce((total, agent) => {
                                    return total + state.market.trades.filter(
                                      trade => trade.buyAgentId === agent.id || trade.sellAgentId === agent.id
                                    ).length;
                                  }, 0)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700">Avg Return:</span>
                                <span className="font-medium">
                                  {state.agents.length > 0 ? (
                                    state.agents.reduce((total, agent) => {
                                      const agentTrades = state.market.trades.filter(
                                        trade => trade.buyAgentId === agent.id || trade.sellAgentId === agent.id
                                      );
                                      let position = 0;
                                      let currentCash = 10000;
                                      agentTrades.forEach(trade => {
                                        if (trade.buyAgentId === agent.id) {
                                          position += trade.quantity;
                                          currentCash -= trade.price * trade.quantity;
                                        } else {
                                          position -= trade.quantity;
                                          currentCash += trade.price * trade.quantity;
                                        }
                                      });
                                      const currentValue = currentCash + (position * state.market.currentPrice);
                                      return total + ((currentValue - 10000) / 10000) * 100;
                                    }, 0) / state.agents.length
                                  ).toFixed(2) : '0.00'}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <h5 className="font-medium text-purple-800 mb-2">RL Agents</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-purple-700">Active Agents:</span>
                                <span className="font-medium">{rlAgents.filter(agent => agent.active).length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-700">Best Performance:</span>
                                <span className="font-medium">
                                  {rlAgents.length > 0 ? 
                                    `${Math.max(...rlAgents.map(a => a.performance.totalReturn * 100)).toFixed(2)}%` : 
                                    '0.00%'
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-700">Avg Return:</span>
                                <span className="font-medium">
                                  {rlAgents.filter(a => a.active).length > 0 ? (
                                    rlAgents
                                      .filter(a => a.active)
                                      .reduce((total, agent) => total + agent.performance.totalReturn, 0) / 
                                    rlAgents.filter(a => a.active).length * 100
                                  ).toFixed(2) : '0.00'}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Market Impact Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Price Impact by Agent Type</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Traditional Agents Impact */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Traditional Agents</span>
                        <span className="text-sm text-gray-600">
                          {((state.agents.length / (state.agents.length + rlAgents.filter(agent => agent.active).length)) * 100).toFixed(1)}% of agents
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="h-3 bg-blue-500 rounded-full"
                          style={{ width: `${(state.agents.length / (state.agents.length + rlAgents.filter(agent => agent.active).length)) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* RL Agents Impact */}
                    {rlAgents.filter(agent => agent.active).length > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">RL Agents</span>
                          <span className="text-sm text-gray-600">
                            {(rlAgents.filter(a => a.active).reduce((sum, agent) => 
                              sum + Math.abs(agent.performance.totalReturn), 0) * 10).toFixed(2)}% impact
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="h-3 bg-purple-500 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(10, rlAgents.filter(a => a.active).length * 15))}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Volatility Contribution */}
                    <div className="mt-6">
                      <h5 className="font-medium text-sm mb-3">Volatility Contribution</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Market Makers</span>
                          <span className="font-medium">
                            -{(metrics.volatilityByAgentType[AgentType.MARKET_MAKER] * 100).toFixed(3)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Momentum Traders</span>
                          <span className="font-medium">
                            +{(metrics.volatilityByAgentType[AgentType.MOMENTUM_TRADER] * 100).toFixed(3)}
                          </span>
                        </div>
                        {rlAgents.filter(agent => agent.active).length > 0 && (
                          <div className="flex justify-between text-xs">
                            <span>RL Agents</span>
                            <div className="space-y-1">
                              {rlAgents.filter(agent => agent.active).map((agent, index) => (
                                <div key={agent.id} className="font-medium text-purple-600">
                                  {agent.performance.totalReturn > 0 ? '+' : ''}
                                  {(agent.performance.totalReturn * 0.1).toFixed(3)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Trading Activity Heatmap</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 mb-3">Activity levels over time</div>
                    
                    {/* Time-based activity visualization */}
                    <div className="grid grid-cols-12 gap-1">
                      {Array.from({ length: 60 }, (_, i) => {
                        // Calculate real activity for this time period
                        const recentTrades = state.market.trades.slice(-60);
                        const tradesInPeriod = recentTrades.filter((_, index) => Math.floor(index / (recentTrades.length / 60)) === i).length;
                        const maxTrades = Math.max(1, Math.max(...Array.from({ length: 60 }, (_, j) => 
                          recentTrades.filter((_, index) => Math.floor(index / (recentTrades.length / 60)) === j).length
                        )));
                        const intensity = tradesInPeriod / maxTrades;
                        
                        return (
                          <div
                            key={i}
                            className="h-4 rounded-sm"
                            style={{
                              backgroundColor: `rgba(59, 130, 246, ${Math.max(0.2, intensity * 0.8 + 0.2)})`
                            }}
                            title={`Period ${i + 1}: ${tradesInPeriod} trades`}
                          />
                        );
                      })}
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Low Activity</span>
                      <span>High Activity</span>
                    </div>

                    {/* Agent-specific activity */}
                    <div className="mt-6">
                      <h5 className="font-medium text-sm mb-3">Current Activity by Agent</h5>
                      <div className="space-y-2">
                        {state.agents.slice(0, 3).map((agent, index) => {
                          const agentTrades = state.market.trades.filter(
                            trade => trade.buyAgentId === agent.id || trade.sellAgentId === agent.id
                          );
                          const recentActivity = agentTrades.slice(-10);
                          
                          return (
                            <div key={agent.id} className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-xs flex-1">{agent.type.replace('_', ' ')}</span>
                              <div className="flex space-x-1">
                                {Array.from({ length: 10 }, (_, i) => {
                                  const hasActivity = i < recentActivity.length;
                                  return (
                                    <div
                                      key={i}
                                      className="w-1 h-3 bg-blue-200 rounded-sm"
                                      style={{
                                        backgroundColor: hasActivity ? '#3b82f6' : '#e5e7eb'
                                      }}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        
                        {rlAgents.filter(agent => agent.active).map((agent, index) => {
                          const activityLevel = Math.floor(agent.performance.winRate * 10);
                          
                          return (
                            <div key={agent.id} className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-purple-500" />
                              <span className="text-xs flex-1">{agent.hyperparameters.strategy.replace('_', ' ')} RL {index + 1}</span>
                              <div className="flex space-x-1">
                                {Array.from({ length: 10 }, (_, i) => {
                                  const isActive = i < activityLevel;
                                  return (
                                    <div
                                      key={i}
                                      className="w-1 h-3 rounded-sm"
                                      style={{
                                        backgroundColor: isActive ? '#8b5cf6' : '#e5e7eb'
                                      }}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="p-4 border-t border-gray-200 bg-white">
        <div className="space-y-3">
          {/* Main Footer Info */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Market Simulation Platform</span>
              <span>•</span>
              <span>Session: {sessionMinutes}:{sessionSeconds.toString().padStart(2, '0')}</span>
              <span>•</span>
              <span>Tick: {state.tick}</span>
              <span>•</span>
              <span>Trades: {state.market.trades.length.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {rlAgents.filter(agent => agent.active).length > 0 && (
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                  {rlAgents.filter(agent => agent.active).length} RL Agent{rlAgents.filter(agent => agent.active).length > 1 ? 's' : ''} Active
                </Badge>
              )}
              {state.circuitBreakerActive && (
                <Badge variant="destructive" className="text-xs">
                  Circuit Breaker Active
                </Badge>
              )}
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                Demo Mode
              </Badge>
              <span className="text-xs">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Research Disclaimer */}
          <div className="text-xs text-gray-500 border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  <span><strong>Research Demo:</strong> RL agents are simulated approximations</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-3 w-3 text-blue-500" />
                  <span>Based on multi-agent RL trading thesis research</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FlaskConical className="h-3 w-3 text-purple-500" />
                  <span>Interactive Demo Platform</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 text-xs">
                <button className="text-blue-600 hover:text-blue-800 underline">
                  View Methodology
                </button>
                <button className="text-purple-600 hover:text-purple-800 underline">
                  Research Paper
                </button>
                <button className="text-green-600 hover:text-green-800 underline">
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Simulation;
