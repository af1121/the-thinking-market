import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { SimulationParameters } from '@/lib/types';
import { 
  Gauge, 
  DollarSign, 
  Activity,
  Settings2
} from 'lucide-react';

interface SimulationControlsProps {
  parameters: SimulationParameters;
  speed: number;
  onUpdateParameters: (params: Partial<SimulationParameters>) => void;
  onSpeedChange: (speed: number) => void;
  className?: string;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({
  parameters,
  speed,
  onUpdateParameters,
  onSpeedChange,
  className = ''
}) => {
  const [fundamentalValue, setFundamentalValue] = useState(parameters.fundamentalValue.toString());
  const [volatilityBase, setVolatilityBase] = useState(parameters.volatilityBase.toString());

  const handleParameterUpdate = () => {
    const updatedParams: Partial<SimulationParameters> = {};
    
    const parsedFundamentalValue = parseFloat(fundamentalValue);
    if (!isNaN(parsedFundamentalValue) && parsedFundamentalValue > 0) {
      updatedParams.fundamentalValue = parsedFundamentalValue;
    }
    
    const parsedVolatilityBase = parseFloat(volatilityBase);
    if (!isNaN(parsedVolatilityBase) && parsedVolatilityBase >= 0 && parsedVolatilityBase <= 1) {
      updatedParams.volatilityBase = parsedVolatilityBase;
    }
    
    onUpdateParameters(updatedParams);
  };

  const getSpeedColor = (speed: number) => {
    if (speed <= 1) return 'text-green-600';
    if (speed <= 2) return 'text-yellow-600';
    if (speed <= 3) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSpeedBadgeColor = (speed: number) => {
    if (speed <= 1) return 'bg-green-100 text-green-700 border-green-300';
    if (speed <= 2) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    if (speed <= 3) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Speed Control */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 mb-3">
            <Gauge className="h-4 w-4 text-blue-600" />
            <h3 className="font-medium text-blue-900">Simulation Speed</h3>
            <Badge variant="outline" className={`${getSpeedBadgeColor(speed)} border`}>
              {speed.toFixed(1)}x
            </Badge>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm shadow-sm">
                <Gauge className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm">Speed Control</h4>
                <p className="text-xs text-gray-600">Control simulation pace</p>
              </div>
              <span className={`font-bold text-lg ${getSpeedColor(speed)}`}>
                {speed.toFixed(1)}x
              </span>
            </div>
            
            <div className="space-y-3">
              <Slider 
                min={0.1}
                max={5}
                step={0.1}
                value={[speed]}
                onValueChange={(values) => onSpeedChange(values[0])}
                className="w-full"
              />
              <div className="grid grid-cols-5 gap-1">
                {[0.5, 1.0, 2.0, 3.0, 5.0].map((presetSpeed) => (
                  <Button
                    key={presetSpeed}
                    variant={speed === presetSpeed ? "default" : "outline"}
                    size="sm"
                    onClick={() => onSpeedChange(presetSpeed)}
                    className="text-xs px-2 py-1"
                  >
                    {presetSpeed}x
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Market Parameters */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 mb-3">
            <Settings2 className="h-4 w-4 text-green-600" />
            <h3 className="font-medium text-green-900">Market Parameters</h3>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
              Live Config
            </Badge>
          </div>
          
          <div className="space-y-2">
            {/* Fundamental Value */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm shadow-sm">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">Fundamental Value</h4>
                  <p className="text-xs text-gray-600">Fair value target</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  ${parameters.fundamentalValue.toFixed(2)}
                </Badge>
              </div>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={fundamentalValue}
                  onChange={(e) => setFundamentalValue(e.target.value)}
                  className="flex-1 text-sm"
                  placeholder="Enter value..."
                />
                <Button
                  onClick={handleParameterUpdate}
                  className="bg-green-600 hover:bg-green-700 text-white px-3"
                  size="sm"
                >
                  Apply
                </Button>
              </div>
            </div>

            {/* Base Volatility */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm shadow-sm">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">Base Volatility</h4>
                  <p className="text-xs text-gray-600">Market volatility level</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {(parameters.volatilityBase * 100).toFixed(1)}%
                </Badge>
              </div>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.001"
                  value={volatilityBase}
                  onChange={(e) => setVolatilityBase(e.target.value)}
                  className="flex-1 text-sm"
                  placeholder="0.000 - 1.000"
                />
                <Button
                  onClick={handleParameterUpdate}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-3"
                  size="sm"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationControls;
