
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { SimulationParameters } from '@/lib/types';
import { Slider } from '@/components/ui/slider';

interface MarketInterventionsProps {
  parameters: SimulationParameters;
  circuitBreakerActive: boolean;
  onUpdateParameters: (params: Partial<SimulationParameters>) => void;
  className?: string;
}

const MarketInterventions: React.FC<MarketInterventionsProps> = ({
  parameters,
  circuitBreakerActive,
  onUpdateParameters,
  className = ''
}) => {
  const [circuitBreakerThreshold, setCircuitBreakerThreshold] = useState(
    (parameters.circuitBreakerThreshold * 100).toString()
  );
  const [circuitBreakerDuration, setCircuitBreakerDuration] = useState(
    (parameters.circuitBreakerDuration / 1000).toString()
  );
  const [enableCircuitBreaker, setEnableCircuitBreaker] = useState(
    parameters.circuitBreakerThreshold > 0
  );

  const handleUpdateParameters = () => {
    const updatedParams: Partial<SimulationParameters> = {};
    
    // Update circuit breaker parameters
    const threshold = parseFloat(circuitBreakerThreshold) / 100;
    const duration = parseFloat(circuitBreakerDuration) * 1000;
    
    if (!isNaN(threshold) && threshold >= 0 && threshold <= 1) {
      updatedParams.circuitBreakerThreshold = enableCircuitBreaker ? threshold : 0;
    }
    
    if (!isNaN(duration) && duration >= 0) {
      updatedParams.circuitBreakerDuration = duration;
    }
    
    onUpdateParameters(updatedParams);
  };

  return (
    <Card className={`glass ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-normal">Market Interventions</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Circuit Breaker Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="circuit-breaker-toggle" className="font-medium">
              Circuit Breaker
            </Label>
            <Switch
              id="circuit-breaker-toggle"
              checked={enableCircuitBreaker}
              onCheckedChange={setEnableCircuitBreaker}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="circuit-breaker-threshold">
              Threshold (% Price Change)
            </Label>
            <div className="flex space-x-2">
              <Input
                id="circuit-breaker-threshold"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={circuitBreakerThreshold}
                onChange={(e) => setCircuitBreakerThreshold(e.target.value)}
                className="flex-1"
                disabled={!enableCircuitBreaker}
              />
              <span className="flex items-center">%</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="circuit-breaker-duration">
              Duration (seconds)
            </Label>
            <Input
              id="circuit-breaker-duration"
              type="number"
              min="0"
              step="1"
              value={circuitBreakerDuration}
              onChange={(e) => setCircuitBreakerDuration(e.target.value)}
              className="flex-1"
              disabled={!enableCircuitBreaker}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="whitespace-nowrap w-full"
            onClick={handleUpdateParameters}
          >
            Update Intervention Settings
          </Button>
        </div>
        
        {/* Circuit Breaker Status */}
        {circuitBreakerActive && (
          <div className="p-3 rounded-md border border-destructive/30 bg-destructive/10 mt-4">
            <p className="text-sm font-medium text-destructive">
              Circuit Breaker Active
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Trading has been temporarily halted due to excessive volatility
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketInterventions;
