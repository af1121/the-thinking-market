import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SimulationParameters } from '@/lib/types';
import { Slider } from '@/components/ui/slider';
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  AlertTriangle, 
  Clock, 
  Zap, 
  Gauge,
  Timer,
  StopCircle,
  Info
} from 'lucide-react';

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

  const getThresholdSeverity = (threshold: number) => {
    if (threshold <= 5) return { color: 'text-green-600', bg: 'bg-green-100', label: 'Conservative' };
    if (threshold <= 10) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Moderate' };
    if (threshold <= 20) return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Aggressive' };
    return { color: 'text-red-600', bg: 'bg-red-100', label: 'High Risk' };
  };

  const getDurationCategory = (duration: number) => {
    if (duration <= 30) return { color: 'text-blue-600', label: 'Quick Recovery' };
    if (duration <= 60) return { color: 'text-green-600', label: 'Standard' };
    if (duration <= 120) return { color: 'text-orange-600', label: 'Extended' };
    return { color: 'text-red-600', label: 'Long Halt' };
  };

  const thresholdValue = parseFloat(circuitBreakerThreshold) || 0;
  const durationValue = parseFloat(circuitBreakerDuration) || 0;
  const thresholdSeverity = getThresholdSeverity(thresholdValue);
  const durationCategory = getDurationCategory(durationValue);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Circuit Breaker Status */}
      {circuitBreakerActive && (
        <Alert className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
          <StopCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">🚨 Circuit Breaker Activated</div>
                <div className="text-sm mt-1">Trading has been temporarily halted due to excessive volatility</div>
              </div>
              <Badge variant="destructive" className="ml-4">
                ACTIVE
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Circuit Breaker Configuration */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 mb-3">
            <Shield className="h-4 w-4 text-red-600" />
            <h3 className="font-medium text-red-900">Circuit Breaker Protection</h3>
            <Badge variant="outline" className={`${enableCircuitBreaker ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
              {enableCircuitBreaker ? 'ENABLED' : 'DISABLED'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {/* Enable/Disable Toggle */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-sm shadow-sm">
                    {enableCircuitBreaker ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <ShieldX className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">Protection Status</h4>
                    <p className="text-xs text-gray-600">Auto-halt during volatility</p>
                  </div>
                </div>
                <Switch
                  checked={enableCircuitBreaker}
                  onCheckedChange={setEnableCircuitBreaker}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
            </div>

            {/* Threshold Configuration */}
            <div className={`transition-all duration-300 ${enableCircuitBreaker ? 'opacity-100' : 'opacity-50'}`}>
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm shadow-sm">
                    <Gauge className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">Trigger Threshold</h4>
                    <p className="text-xs text-gray-600">Price movement limit</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${thresholdSeverity.bg} ${thresholdSeverity.color} border-current`}>
                    {thresholdValue.toFixed(1)}%
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <Slider
                    min={1}
                    max={50}
                    step={0.5}
                    value={[thresholdValue]}
                    onValueChange={(values) => setCircuitBreakerThreshold(values[0].toString())}
                    disabled={!enableCircuitBreaker}
                    className="w-full"
                  />
                  
                  <div className="grid grid-cols-4 gap-1">
                    {[2, 5, 10, 20].map((presetThreshold) => (
                      <Button
                        key={presetThreshold}
                        variant={Math.abs(thresholdValue - presetThreshold) < 0.1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCircuitBreakerThreshold(presetThreshold.toString())}
                        disabled={!enableCircuitBreaker}
                        className="text-xs px-2 py-1"
                      >
                        {presetThreshold}%
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Duration Configuration */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 mb-3">
            <Timer className="h-4 w-4 text-blue-600" />
            <h3 className="font-medium text-blue-900">Recovery Settings</h3>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
              {durationCategory.label}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {/* Duration Configuration */}
            <div className={`transition-all duration-300 ${enableCircuitBreaker ? 'opacity-100' : 'opacity-50'}`}>
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm shadow-sm">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">Halt Duration</h4>
                    <p className="text-xs text-gray-600">Recovery time period</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {durationValue}s
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <Slider
                    min={10}
                    max={300}
                    step={10}
                    value={[durationValue]}
                    onValueChange={(values) => setCircuitBreakerDuration(values[0].toString())}
                    disabled={!enableCircuitBreaker}
                    className="w-full"
                  />
                  
                  <div className="grid grid-cols-4 gap-1">
                    {[30, 60, 120, 300].map((presetDuration) => (
                      <Button
                        key={presetDuration}
                        variant={Math.abs(durationValue - presetDuration) < 5 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCircuitBreakerDuration(presetDuration.toString())}
                        disabled={!enableCircuitBreaker}
                        className="text-xs px-2 py-1"
                      >
                        {presetDuration}s
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Information Panel */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">How Circuit Breakers Work:</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Monitors price changes between ticks</li>
                    <li>• Halts trading when threshold exceeded</li>
                    <li>• Automatically resumes after duration</li>
                    <li>• Helps prevent market crashes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Button */}
      <div className="flex justify-center pt-2">
        <Button
          onClick={handleUpdateParameters}
          className="bg-red-600 hover:bg-red-700 text-white px-6"
          size="sm"
        >
          Apply Configuration
        </Button>
      </div>
    </div>
  );
};

export default MarketInterventions;
