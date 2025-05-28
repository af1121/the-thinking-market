import React, { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import OrderBook from './OrderBook';
import PriceChart from './PriceChart';
import AgentControls from './AgentControls';
import SimulationControls from './SimulationControls';
import MetricsPanel from './MetricsPanel';
import MarketInterventions from './MarketInterventions';
import TabSection from './TabSection';
import VolatilityAnalytics from './VolatilityAnalytics';
import RayIntegration from './RayIntegration';
import { AgentType, MetricsData, SimulationState, VolatilityAnalytics as AnalyticsType, MarketEventType, SimulationParameters } from '@/lib/types';
import { SimulationEngine } from '@/lib/simulationEngine';
import { toast } from 'sonner';

const Simulation: React.FC = () => {
  // Create simulation engine instance
  const [engine] = useState(() => new SimulationEngine());
  const [state, setState] = useState<SimulationState>(engine.getState());
  const [activeTab, setActiveTab] = useState('market');

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
  
  // Achievements state to track events and milestones
  const [achievements, setAchievements] = useState({
    marketMakerUnlocked: false,
    volumeThreshold: false,
    stressEventsHandled: 0,
    stablePeriodLength: 0
  });

  // Function to update the UI state
  const updateState = useCallback(() => {
    const simulationState = engine.getState();
    setState(simulationState);
    
    const newMetrics = engine.getMetrics();
    setMetrics(newMetrics);
    
    const newAnalytics = engine.getAnalytics();
    setAnalytics(newAnalytics);
    
    // Track achievements
    if (newMetrics.tradingVolume > 100 && !achievements.volumeThreshold) {
      setAchievements(prev => ({ ...prev, volumeThreshold: true }));
      toast.success("Achievement: Volume Threshold Reached!", {
        description: "Your market now has significant trading volume."
      });
    }
    
    // Track stable periods
    if (newMetrics.volatility < 0.02) {
      setAchievements(prev => ({ 
        ...prev, 
        stablePeriodLength: prev.stablePeriodLength + 1 
      }));
      
      if (achievements.stablePeriodLength === 100) {
        toast.success("Achievement: Market Stability!", {
          description: "You've maintained a stable market for a long period."
        });
      }
    } else {
      setAchievements(prev => ({ ...prev, stablePeriodLength: 0 }));
    }
    
    // New stress events
    if (newAnalytics.stressEvents.length > analytics.stressEvents.length) {
      const newEvents = newAnalytics.stressEvents.length - analytics.stressEvents.length;
      setAchievements(prev => ({ 
        ...prev, 
        stressEventsHandled: prev.stressEventsHandled + newEvents 
      }));
      
      if (achievements.stressEventsHandled === 5) {
        toast.success("Achievement: Crisis Manager!", {
          description: "You've successfully handled multiple market crises."
        });
      }
    }
    
    // Circuit breaker trigger notifications
    if (newAnalytics.interventionEffects.circuitBreakerTriggered > 
        analytics.interventionEffects.circuitBreakerTriggered) {
      toast.info("Circuit Breaker Triggered", {
        description: "Trading has been temporarily halted to prevent excessive volatility."
      });
    }
    
  }, [engine, achievements, analytics.stressEvents.length, analytics.interventionEffects.circuitBreakerTriggered]);

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
    toast("Market simulation started!", {
      description: "Agents will now trade based on their strategies."
    });
  }, [engine, updateState]);

  const handleStop = useCallback(() => {
    engine.stop();
    updateState();
    toast("Market simulation paused!", {
      description: "Trading has been halted. Resume to continue."
    });
  }, [engine, updateState]);

  const handleReset = useCallback(() => {
    engine.reset();
    updateState();
    toast("Market simulation reset!", {
      description: "All market data has been reset to initial values."
    });
  }, [engine, updateState]);

  const handleAddAgent = useCallback((type: AgentType) => {
    engine.addAgent(type);
    updateState();
    
    // Market maker achievement
    if (type === AgentType.MARKET_MAKER && !achievements.marketMakerUnlocked) {
      setAchievements(prev => ({ ...prev, marketMakerUnlocked: true }));
      toast.success("Achievement: Market Maker Unlocked!", {
        description: "You've added liquidity to your market."
      });
    }
    
    const agentNames = {
      [AgentType.MARKET_MAKER]: "Market Maker",
      [AgentType.MOMENTUM_TRADER]: "Momentum Trader",
      [AgentType.FUNDAMENTAL_TRADER]: "Fundamental Trader",
      [AgentType.NOISE_TRADER]: "Noise Trader"
    };
    
    toast(`${agentNames[type]} added to the market!`, {
      description: "This agent will now participate in trading."
    });
    
  }, [engine, updateState, achievements.marketMakerUnlocked]);

  const handleRemoveAgent = useCallback((id: string) => {
    engine.removeAgent(id);
    updateState();
    toast("Agent removed from the market!");
  }, [engine, updateState]);

  const handleToggleAgent = useCallback((id: string) => {
    engine.toggleAgentActive(id);
    updateState();
  }, [engine, updateState]);

  const handleUpdateParameters = useCallback((params: Partial<SimulationParameters>) => {
    engine.updateParameters(params);
    updateState();
    toast("Simulation parameters updated!");
  }, [engine, updateState]);

  const handleSpeedChange = useCallback((speed: number) => {
    engine.setSpeed(speed);
    updateState();
    toast(`Simulation speed set to ${speed.toFixed(1)}x`);
  }, [engine, updateState]);

  const handleInjectEvent = useCallback((eventType: MarketEventType, magnitude: number) => {
    engine.injectMarketEvent(eventType, magnitude);
    updateState();
    
    const eventMessages = {
      [MarketEventType.NEWS]: magnitude > 0 ? "Positive news has impacted the market!" : "Negative news has impacted the market!",
      [MarketEventType.LIQUIDITY_SHOCK]: "A liquidity shock has hit the market!",
      [MarketEventType.PRICE_SHOCK]: "A sudden price spike has occurred!",
      [MarketEventType.VOLATILITY_SPIKE]: "Market volatility has suddenly increased!",
      [MarketEventType.FLASH_CRASH]: "A flash crash is occurring in the market!"
    };
    
    toast.warning(eventMessages[eventType], {
      description: "See how agents respond to this market event."
    });
    
  }, [engine, updateState]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        running={state.running}
        onStart={handleStart}
        onStop={handleStop}
        onReset={handleReset}
      />
      
      <main className="flex-1 p-6 space-y-6 animate-fade-in">
        <MetricsPanel 
          metrics={metrics}
          currentPrice={state.market.currentPrice}
        />
        
        <TabSection 
          activeTab={activeTab}
          analytics={analytics}
          onTabChange={setActiveTab}
        >
          {activeTab === 'market' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-6">
                <PriceChart 
                  trades={state.market.trades} 
                  fundamentalValue={state.market.fundamentalValue}
                  height={300}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <SimulationControls 
                      parameters={state.parameters}
                      speed={state.speed}
                      onUpdateParameters={handleUpdateParameters}
                      onSpeedChange={handleSpeedChange}
                      onInjectEvent={handleInjectEvent}
                    />
                    
                    <MarketInterventions
                      parameters={state.parameters}
                      circuitBreakerActive={state.circuitBreakerActive}
                      onUpdateParameters={handleUpdateParameters}
                    />
                  </div>
                  
                  <AgentControls 
                    agents={state.agents}
                    onAddAgent={handleAddAgent}
                    onRemoveAgent={handleRemoveAgent}
                    onToggleAgent={handleToggleAgent}
                  />
                </div>
              </div>
              
              <div className="lg:col-span-2">
                <OrderBook orderBook={state.market.orderBook} />
              </div>
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <VolatilityAnalytics analytics={analytics} />
          )}
          
          {activeTab === 'ray_abm' && (
            <RayIntegration />
          )}
        </TabSection>
      </main>
      
      <footer className="p-4 border-t border-border/40 text-center text-sm text-muted-foreground animate-fade-in">
        <p className="flex items-center justify-center gap-2">
          Market Simulation • Tick: {state.tick} • Time: {new Date().toLocaleTimeString()}
          {state.circuitBreakerActive && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-ask/20 text-ask">
              Circuit Breaker Active
            </span>
          )}
          {achievements.stressEventsHandled > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary">
              Events Handled: {achievements.stressEventsHandled}
            </span>
          )}
        </p>
      </footer>
    </div>
  );
};

export default Simulation;
