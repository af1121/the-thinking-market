import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Play, 
  Pause, 
  Square, 
  Brain, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  Settings,
  BarChart3,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

// Types for Ray ABM integration
interface EpisodeStep {
  step: number;
  action: number;
  reward: number;
  observation: number[];
  info: {
    price?: number;
    pnl?: number;
    inventory?: number;
    cash?: number;
    volatility?: number;
  };
  done: boolean;
  timestamp: string;
}

interface RaySimulationState {
  running: boolean;
  current_step: number;
  episode_data: EpisodeStep[];
  stress_mode: boolean;
}

interface MarketState {
  current_price: number;
  fundamental_value: number;
  volatility: number;
  spread: number;
  inventory: number;
  cash: number;
  pnl: number;
  step: number;
  timestamp: string;
}

interface TrainingConfig {
  algorithm: string;
  num_workers: number;
  training_iterations: number;
}

interface StressEvent {
  event_type: string;
  magnitude: number;
  duration?: number;
}

interface TrainedModel {
  name: string;
  path: string;
  created: string;
}

const RayIntegration: React.FC = () => {
  // State management
  const [backendConnected, setBackendConnected] = useState(false);
  const [simulationState, setSimulationState] = useState<RaySimulationState>({
    running: false,
    current_step: 0,
    episode_data: [],
    stress_mode: false
  });
  const [marketState, setMarketState] = useState<MarketState | null>(null);
  const [trainingInProgress, setTrainingInProgress] = useState(false);
  const [availableModels, setAvailableModels] = useState<TrainedModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  
  // Configuration state
  const [simConfig, setSimConfig] = useState({
    max_steps: 1000,
    initial_price: 100.0,
    fundamental_value: 100.0,
    rl_agent_enabled: true
  });
  
  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig>({
    algorithm: 'PPO',
    num_workers: 2,
    training_iterations: 50
  });

  const API_BASE = 'http://localhost:8000';

  // API helper functions
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API call to ${endpoint} failed:`, error);
      throw error;
    }
  };

  // Check backend connection
  const checkBackendConnection = useCallback(async () => {
    try {
      await apiCall('/health');
      setBackendConnected(true);
    } catch (error) {
      setBackendConnected(false);
    }
  }, []);

  // Load available models
  const loadAvailableModels = useCallback(async () => {
    try {
      const response = await apiCall('/models/list');
      setAvailableModels(response.models || []);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  }, []);

  // Start simulation
  const startSimulation = useCallback(async () => {
    try {
      const response = await apiCall('/simulation/start', {
        method: 'POST',
        body: JSON.stringify(simConfig),
      });
      
      setSimulationState(prev => ({ ...prev, running: true }));
      toast.success('Simulation started successfully!');
    } catch (error) {
      toast.error('Failed to start simulation');
      console.error(error);
    }
  }, [simConfig]);

  // Stop simulation
  const stopSimulation = useCallback(async () => {
    try {
      await apiCall('/simulation/stop', { method: 'POST' });
      setSimulationState(prev => ({ ...prev, running: false }));
      toast.success('Simulation stopped');
    } catch (error) {
      toast.error('Failed to stop simulation');
      console.error(error);
    }
  }, []);

  // Execute simulation step
  const executeStep = useCallback(async () => {
    try {
      const response = await apiCall('/simulation/step', { method: 'POST' });
      setSimulationState(prev => ({
        ...prev,
        current_step: response.step,
        episode_data: [...prev.episode_data, response]
      }));
    } catch (error) {
      console.error('Failed to execute step:', error);
    }
  }, []);

  // Get current market state
  const updateMarketState = useCallback(async () => {
    if (!simulationState.running) return;
    
    try {
      const response = await apiCall('/simulation/state');
      setMarketState(response);
    } catch (error) {
      console.error('Failed to get market state:', error);
    }
  }, [simulationState.running]);

  // Start training
  const startTraining = useCallback(async () => {
    try {
      setTrainingInProgress(true);
      await apiCall('/training/start', {
        method: 'POST',
        body: JSON.stringify(trainingConfig),
      });
      
      toast.success('Training started in background!');
    } catch (error) {
      toast.error('Failed to start training');
      console.error(error);
    } finally {
      setTrainingInProgress(false);
    }
  }, [trainingConfig]);

  // Load trained model
  const loadModel = useCallback(async (modelPath: string) => {
    try {
      await apiCall('/agent/load', {
        method: 'POST',
        body: JSON.stringify(modelPath),
      });
      
      setSelectedModel(modelPath);
      toast.success('Model loaded successfully!');
    } catch (error) {
      toast.error('Failed to load model');
      console.error(error);
    }
  }, []);

  // Inject stress event
  const injectStressEvent = useCallback(async (stressEvent: StressEvent) => {
    try {
      await apiCall('/simulation/stress', {
        method: 'POST',
        body: JSON.stringify(stressEvent),
      });
      
      setSimulationState(prev => ({ ...prev, stress_mode: true }));
      toast.warning(`${stressEvent.event_type} event injected!`);
    } catch (error) {
      toast.error('Failed to inject stress event');
      console.error(error);
    }
  }, []);

  // Auto-update market state
  useEffect(() => {
    if (simulationState.running) {
      const interval = setInterval(updateMarketState, 1000);
      return () => clearInterval(interval);
    }
  }, [simulationState.running, updateMarketState]);

  // Auto-execute steps when simulation is running
  useEffect(() => {
    if (simulationState.running) {
      const interval = setInterval(executeStep, 500);
      return () => clearInterval(interval);
    }
  }, [simulationState.running, executeStep]);

  // Check backend connection on mount
  useEffect(() => {
    checkBackendConnection();
    loadAvailableModels();
    
    const interval = setInterval(checkBackendConnection, 5000);
    return () => clearInterval(interval);
  }, [checkBackendConnection, loadAvailableModels]);

  // Prepare chart data
  const chartData = simulationState.episode_data.slice(-50).map((step, index) => ({
    step: step.step,
    price: step.info?.price || 0,
    reward: step.reward,
    pnl: step.info?.pnl || 0
  }));

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Alert className={backendConnected ? 'border-green-500' : 'border-red-500'}>
        <Activity className="h-4 w-4" />
        <AlertDescription>
          Ray Backend: {backendConnected ? (
            <Badge variant="default" className="ml-2">Connected</Badge>
          ) : (
            <Badge variant="destructive" className="ml-2">Disconnected</Badge>
          )}
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="simulation" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="training">RL Training</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Simulation Tab */}
        <TabsContent value="simulation" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Simulation Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Simulation Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max_steps">Max Steps</Label>
                    <Input
                      id="max_steps"
                      type="number"
                      value={simConfig.max_steps}
                      onChange={(e) => setSimConfig(prev => ({
                        ...prev,
                        max_steps: parseInt(e.target.value)
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="initial_price">Initial Price</Label>
                    <Input
                      id="initial_price"
                      type="number"
                      step="0.01"
                      value={simConfig.initial_price}
                      onChange={(e) => setSimConfig(prev => ({
                        ...prev,
                        initial_price: parseFloat(e.target.value)
                      }))}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={startSimulation}
                    disabled={!backendConnected || simulationState.running}
                    className="flex-1"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </Button>
                  <Button
                    onClick={stopSimulation}
                    disabled={!simulationState.running}
                    variant="outline"
                    className="flex-1"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </div>

                {simulationState.running && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Step: {simulationState.current_step}</span>
                      <span>Progress: {((simulationState.current_step / simConfig.max_steps) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(simulationState.current_step / simConfig.max_steps) * 100} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Market State */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Market State
                </CardTitle>
              </CardHeader>
              <CardContent>
                {marketState ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <div className="font-mono text-lg">${marketState.current_price.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">PnL:</span>
                      <div className={`font-mono text-lg ${marketState.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${marketState.pnl.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Volatility:</span>
                      <div className="font-mono">{(marketState.volatility * 100).toFixed(2)}%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Inventory:</span>
                      <div className="font-mono">{marketState.inventory}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No market data available</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stress Testing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Stress Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  onClick={() => injectStressEvent({ event_type: 'flash_crash', magnitude: 0.1 })}
                  disabled={!simulationState.running}
                  variant="destructive"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Flash Crash
                </Button>
                <Button
                  onClick={() => injectStressEvent({ event_type: 'volatility_spike', magnitude: 2.0 })}
                  disabled={!simulationState.running}
                  variant="outline"
                >
                  High Volatility
                </Button>
                <Button
                  onClick={() => injectStressEvent({ event_type: 'liquidity_shock', magnitude: 1.5 })}
                  disabled={!simulationState.running}
                  variant="outline"
                >
                  Liquidity Crisis
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Real-time Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="step" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="price" stroke="#8884d8" name="Price" />
                    <Line type="monotone" dataKey="pnl" stroke="#82ca9d" name="PnL" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                RL Agent Training
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="algorithm">Algorithm</Label>
                  <Select
                    value={trainingConfig.algorithm}
                    onValueChange={(value) => setTrainingConfig(prev => ({ ...prev, algorithm: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PPO">PPO</SelectItem>
                      <SelectItem value="DQN">DQN</SelectItem>
                      <SelectItem value="SAC">SAC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="num_workers">Workers</Label>
                  <Input
                    id="num_workers"
                    type="number"
                    min="1"
                    max="8"
                    value={trainingConfig.num_workers}
                    onChange={(e) => setTrainingConfig(prev => ({
                      ...prev,
                      num_workers: parseInt(e.target.value)
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="training_iterations">Iterations</Label>
                  <Input
                    id="training_iterations"
                    type="number"
                    min="10"
                    max="1000"
                    value={trainingConfig.training_iterations}
                    onChange={(e) => setTrainingConfig(prev => ({
                      ...prev,
                      training_iterations: parseInt(e.target.value)
                    }))}
                  />
                </div>
              </div>

              <Button
                onClick={startTraining}
                disabled={!backendConnected || trainingInProgress}
                className="w-full"
              >
                <Brain className="w-4 h-4 mr-2" />
                {trainingInProgress ? 'Training in Progress...' : 'Start Training'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Models</CardTitle>
            </CardHeader>
            <CardContent>
              {availableModels.length > 0 ? (
                <div className="space-y-2">
                  {availableModels.map((model, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Created: {new Date(model.created).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        onClick={() => loadModel(model.path)}
                        disabled={selectedModel === model.path}
                        size="sm"
                      >
                        {selectedModel === model.path ? 'Loaded' : 'Load'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">No trained models available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {simulationState.episode_data.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">Total Steps:</span>
                    <div className="font-mono text-lg">{simulationState.episode_data.length}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Average Reward:</span>
                    <div className="font-mono text-lg">
                      {(simulationState.episode_data.reduce((sum, step) => sum + step.reward, 0) / simulationState.episode_data.length).toFixed(4)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">No analytics data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RayIntegration; 