import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Brain, 
  Settings, 
  Zap, 
  Plus, 
  Minus, 
  Sparkles, 
  Award,
  Bot,
  Sliders
} from 'lucide-react';
import { Agent, AgentType, SimulationParameters, MarketEventType } from '@/lib/types';
import SimulationControls from './SimulationControls';
import MarketInterventions from './MarketInterventions';
import MarketEvents from './MarketEvents';

interface DummyRLAgent {
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
}

interface ControlPanelProps {
  // Agent management
  agents: Agent[];
  rlAgents: DummyRLAgent[];
  onAddAgent: (type: AgentType) => void;
  onRemoveAgent: (id: string) => void;
  onToggleAgent: (id: string) => void;
  onAddRLAgent: () => void;
  onRemoveRLAgent: (agentId: string) => void;
  onToggleRLAgent: (agentId: string) => void;
  onUpdateRLHyperparameters: (agentId: string, hyperparameters: Partial<DummyRLAgent['hyperparameters']>) => void;
  
  // Market controls
  parameters: SimulationParameters;
  speed: number;
  circuitBreakerActive: boolean;
  onUpdateParameters: (params: Partial<SimulationParameters>) => void;
  onSpeedChange: (speed: number) => void;
  onInjectEvent: (type: MarketEventType, magnitude: number) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  agents,
  rlAgents,
  onAddAgent,
  onRemoveAgent,
  onToggleAgent,
  onAddRLAgent,
  onRemoveRLAgent,
  onToggleRLAgent,
  onUpdateRLHyperparameters,
  parameters,
  speed,
  circuitBreakerActive,
  onUpdateParameters,
  onSpeedChange,
  onInjectEvent
}) => {
  const [activeTab, setActiveTab] = useState('agents');

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Control Panel</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="agents" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Agents</span>
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Market</span>
            </TabsTrigger>
            <TabsTrigger value="interventions" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Safety</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4" />
              <span>Events</span>
            </TabsTrigger>
          </TabsList>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Traditional Agents */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 mb-3">
                  <Users className="h-4 w-4 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Traditional Agents</h3>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                    {agents.filter(a => a.active).length} Active
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {[
                    {
                      type: AgentType.MARKET_MAKER,
                      name: 'Market Maker',
                      description: 'Provides liquidity',
                      icon: '🏦',
                      color: 'from-green-400 to-green-600',
                      strategy: 'Liquidity'
                    },
                    {
                      type: AgentType.MOMENTUM_TRADER,
                      name: 'Momentum Trader',
                      description: 'Follows trends',
                      icon: '📈',
                      color: 'from-orange-400 to-red-500',
                      strategy: 'Trend'
                    },
                    {
                      type: AgentType.FUNDAMENTAL_TRADER,
                      name: 'Fundamental Trader',
                      description: 'Value analysis',
                      icon: '📊',
                      color: 'from-blue-400 to-blue-600',
                      strategy: 'Value'
                    },
                    {
                      type: AgentType.NOISE_TRADER,
                      name: 'Noise Trader',
                      description: 'Random decisions',
                      icon: '🎲',
                      color: 'from-purple-400 to-purple-600',
                      strategy: 'Random'
                    }
                  ].map((agentInfo) => {
                    const agentCount = agents.filter(agent => agent.type === agentInfo.type).length;
                    const activeCount = agents.filter(agent => agent.type === agentInfo.type && agent.active).length;
                    const agentsOfType = agents.filter(agent => agent.type === agentInfo.type);
                    
                    return (
                      <div key={agentInfo.type} className="space-y-2">
                        <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${agentInfo.color} flex items-center justify-center text-white text-sm shadow-sm`}>
                                {agentInfo.icon}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 text-sm">{agentInfo.name}</h4>
                                <p className="text-xs text-gray-600">{agentInfo.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {agentCount > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {activeCount}/{agentCount}
                                </Badge>
                              )}
                              <Button
                                onClick={() => onAddAgent(agentInfo.type)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Individual agent instances */}
                        {agentsOfType.map((agent) => (
                          <div key={agent.id} className="ml-4 bg-gray-50 border border-gray-200 rounded-lg p-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${agent.active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                <span className="text-xs font-medium text-gray-700">
                                  {agentInfo.name} #{agent.id.slice(-4)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button
                                  onClick={() => onToggleAgent(agent.id)}
                                  variant="outline"
                                  size="sm"
                                  className="px-1 py-0.5 text-xs h-6"
                                >
                                  {agent.active ? 'Pause' : 'Start'}
                                </Button>
                                <Button
                                  onClick={() => onRemoveAgent(agent.id)}
                                  variant="outline"
                                  size="sm"
                                  className="px-1 py-0.5 text-xs h-6 text-red-600 border-red-300 hover:bg-red-50"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Agents */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 mb-3">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <h3 className="font-medium text-purple-900">AI Trading Agents</h3>
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                    {rlAgents.filter(agent => agent.active).length} Active
                  </Badge>
                  <Button
                    onClick={onAddRLAgent}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 text-xs ml-auto"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add RL Agent
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {rlAgents.length === 0 ? (
                    <Alert className="bg-purple-50 border-purple-200">
                      <Bot className="h-4 w-4 text-purple-600" />
                      <AlertDescription className="text-purple-800 text-sm">
                        No RL agents deployed. Click "Add RL Agent" to create a configurable AI trading agent.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    rlAgents.map((agent, index) => (
                      <div key={agent.id} className={`bg-white border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                        agent.active ? 'border-purple-300 bg-purple-50' : 'border-gray-200'
                      }`}>
                        <div className="space-y-4">
                          {/* Agent Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white shadow-sm">
                                  🤖
                                </div>
                                {agent.active && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-gray-900">RL Agent #{index + 1}</h4>
                                  <Award className="h-4 w-4 text-yellow-500" />
                                </div>
                                <p className="text-xs text-gray-600 capitalize">{agent.hyperparameters.strategy} Strategy</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => onToggleRLAgent(agent.id)}
                                variant={agent.active ? "outline" : "default"}
                                size="sm"
                                className={`px-2 py-1 text-xs ${
                                  agent.active 
                                    ? 'border-orange-300 text-orange-700 hover:bg-orange-50' 
                                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                                }`}
                              >
                                {agent.active ? 'Pause' : 'Start'}
                              </Button>
                              <Button
                                onClick={() => onRemoveRLAgent(agent.id)}
                                variant="outline"
                                size="sm"
                                className="px-2 py-1 text-xs border-red-300 text-red-700 hover:bg-red-50"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Performance Metrics */}
                          {agent.active && (
                            <div className="grid grid-cols-3 gap-3 p-3 bg-purple-100 rounded-lg">
                              <div className="text-center">
                                <div className="text-sm font-medium text-purple-900">Return</div>
                                <div className={`text-lg font-bold ${agent.performance.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {agent.performance.totalReturn >= 0 ? '+' : ''}{(agent.performance.totalReturn * 100).toFixed(1)}%
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-medium text-purple-900">Win Rate</div>
                                <div className="text-lg font-bold text-purple-700">
                                  {(agent.performance.winRate * 100).toFixed(1)}%
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-medium text-purple-900">Trades</div>
                                <div className="text-lg font-bold text-purple-700">
                                  {agent.performance.tradesExecuted}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Hyperparameters Configuration */}
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Sliders className="h-4 w-4 text-purple-600" />
                              <h5 className="font-medium text-purple-900">Hyperparameters</h5>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label htmlFor={`strategy-${agent.id}`} className="text-xs text-gray-700">Strategy</Label>
                                <Select
                                  value={agent.hyperparameters.strategy}
                                  onValueChange={(value: 'momentum' | 'mean_reversion' | 'adaptive') => 
                                    onUpdateRLHyperparameters(agent.id, { strategy: value })
                                  }
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="momentum">Momentum</SelectItem>
                                    <SelectItem value="mean_reversion">Mean Reversion</SelectItem>
                                    <SelectItem value="adaptive">Adaptive</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-1">
                                <Label htmlFor={`learningRate-${agent.id}`} className="text-xs text-gray-700">Learning Rate</Label>
                                <Input
                                  id={`learningRate-${agent.id}`}
                                  type="number"
                                  step="0.00001"
                                  min="0.00001"
                                  max="0.01"
                                  value={agent.hyperparameters.learningRate}
                                  onChange={(e) => onUpdateRLHyperparameters(agent.id, { 
                                    learningRate: parseFloat(e.target.value) || 0.00005 
                                  })}
                                  className="h-8 text-xs"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label htmlFor={`batchSize-${agent.id}`} className="text-xs text-gray-700">Batch Size</Label>
                                <Input
                                  id={`batchSize-${agent.id}`}
                                  type="number"
                                  min="16"
                                  max="512"
                                  step="16"
                                  value={agent.hyperparameters.batchSize}
                                  onChange={(e) => onUpdateRLHyperparameters(agent.id, { 
                                    batchSize: parseInt(e.target.value) || 64 
                                  })}
                                  className="h-8 text-xs"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label htmlFor={`explorationRate-${agent.id}`} className="text-xs text-gray-700">Exploration Rate</Label>
                                <Input
                                  id={`explorationRate-${agent.id}`}
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  max="1.0"
                                  value={agent.hyperparameters.explorationRate}
                                  onChange={(e) => onUpdateRLHyperparameters(agent.id, { 
                                    explorationRate: parseFloat(e.target.value) || 0.1 
                                  })}
                                  className="h-8 text-xs"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label htmlFor={`discountFactor-${agent.id}`} className="text-xs text-gray-700">Discount Factor</Label>
                                <Input
                                  id={`discountFactor-${agent.id}`}
                                  type="number"
                                  step="0.01"
                                  min="0.1"
                                  max="1.0"
                                  value={agent.hyperparameters.discountFactor}
                                  onChange={(e) => onUpdateRLHyperparameters(agent.id, { 
                                    discountFactor: parseFloat(e.target.value) || 0.99 
                                  })}
                                  className="h-8 text-xs"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs text-gray-700">Network Layers</Label>
                                <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                                  {agent.hyperparameters.networkLayers.join(' → ')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Market Controls Tab */}
          <TabsContent value="market" className="mt-4">
            <SimulationControls
              parameters={parameters}
              speed={speed}
              onUpdateParameters={onUpdateParameters}
              onSpeedChange={onSpeedChange}
            />
          </TabsContent>

          {/* Market Interventions Tab */}
          <TabsContent value="interventions" className="mt-4">
            <MarketInterventions
              parameters={parameters}
              circuitBreakerActive={circuitBreakerActive}
              onUpdateParameters={onUpdateParameters}
            />
          </TabsContent>

          {/* Market Events Tab */}
          <TabsContent value="events" className="mt-4">
            <MarketEvents
              onInjectEvent={onInjectEvent}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ControlPanel; 