
import React, { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import OrderBook from './OrderBook';
import PriceChart from './PriceChart';
import AgentControls from './AgentControls';
import SimulationControls from './SimulationControls';
import MetricsPanel from './MetricsPanel';
import MarketInterventions from './MarketInterventions';
import VolatilityAnalytics from './VolatilityAnalytics';
import { AgentType, MetricsData, SimulationState, VolatilityAnalytics as AnalyticsType } from '@/lib/types';
import { SimulationEngine } from '@/lib/simulationEngine';

const Simulation: React.FC = () => {
  // Create simulation engine instance
  const [engine] = useState(() => new SimulationEngine());
  const [state, setState] = useState<SimulationState>(engine.getState());

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

  // Function to update the UI state
  const updateState = useCallback(() => {
    const simulationState = engine.getState();
    setState(simulationState);
    setMetrics(engine.getMetrics());
    setAnalytics(engine.getAnalytics());
  }, [engine]);

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
  }, [engine, updateState]);

  const handleStop = useCallback(() => {
    engine.stop();
    updateState();
  }, [engine, updateState]);

  const handleReset = useCallback(() => {
    engine.reset();
    updateState();
  }, [engine, updateState]);

  const handleAddAgent = useCallback((type: AgentType) => {
    engine.addAgent(type);
    updateState();
  }, [engine, updateState]);

  const handleRemoveAgent = useCallback((id: string) => {
    engine.removeAgent(id);
    updateState();
  }, [engine, updateState]);

  const handleToggleAgent = useCallback((id: string) => {
    engine.toggleAgentActive(id);
    updateState();
  }, [engine, updateState]);

  const handleUpdateParameters = useCallback((params: any) => {
    engine.updateParameters(params);
    updateState();
  }, [engine, updateState]);

  const handleSpeedChange = useCallback((speed: number) => {
    engine.setSpeed(speed);
    updateState();
  }, [engine, updateState]);

  const handleInjectEvent = useCallback((eventType: 'news' | 'liquidity_shock' | 'price_shock' | 'volatility_spike' | 'flash_crash', magnitude: number) => {
    engine.injectMarketEvent(eventType, magnitude);
    updateState();
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
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <PriceChart 
              trades={state.market.trades} 
              fundamentalValue={state.market.fundamentalValue}
              height={300}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SimulationControls 
                parameters={state.parameters}
                speed={state.speed}
                onUpdateParameters={handleUpdateParameters}
                onSpeedChange={handleSpeedChange}
                onInjectEvent={handleInjectEvent}
              />
              
              <AgentControls 
                agents={state.agents}
                onAddAgent={handleAddAgent}
                onRemoveAgent={handleRemoveAgent}
                onToggleAgent={handleToggleAgent}
              />
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <OrderBook orderBook={state.market.orderBook} />
            
            <MarketInterventions
              parameters={state.parameters}
              circuitBreakerActive={state.circuitBreakerActive}
              onUpdateParameters={handleUpdateParameters}
            />
          </div>
        </div>
        
        <VolatilityAnalytics 
          analytics={analytics}
          height={350}
        />
      </main>
      
      <footer className="p-4 border-t border-border/40 text-center text-sm text-muted-foreground animate-fade-in">
        <p>Market Simulation • Tick: {state.tick} • Time: {new Date().toLocaleTimeString()}</p>
      </footer>
    </div>
  );
};

export default Simulation;
