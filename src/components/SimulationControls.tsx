
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { SimulationParameters } from '@/lib/types';

interface SimulationControlsProps {
  parameters: SimulationParameters;
  speed: number;
  onUpdateParameters: (params: Partial<SimulationParameters>) => void;
  onSpeedChange: (speed: number) => void;
  onInjectEvent: (type: 'news' | 'liquidity_shock' | 'price_shock', magnitude: number) => void;
  className?: string;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({
  parameters,
  speed,
  onUpdateParameters,
  onSpeedChange,
  onInjectEvent,
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

  return (
    <Card className={`glass ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-normal">Simulation Controls</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="speed">Simulation Speed: {speed.toFixed(1)}x</Label>
          <Slider 
            id="speed"
            min={0.1}
            max={5}
            step={0.1}
            value={[speed]}
            onValueChange={(values) => onSpeedChange(values[0])}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fundamental-value">Fundamental Value</Label>
          <div className="flex space-x-2">
            <Input
              id="fundamental-value"
              type="number"
              min="0"
              step="0.01"
              value={fundamentalValue}
              onChange={(e) => setFundamentalValue(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
              onClick={handleParameterUpdate}
            >
              Update
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="volatility-base">Base Volatility</Label>
          <div className="flex space-x-2">
            <Input
              id="volatility-base"
              type="number"
              min="0"
              max="1"
              step="0.001"
              value={volatilityBase}
              onChange={(e) => setVolatilityBase(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
              onClick={handleParameterUpdate}
            >
              Update
            </Button>
          </div>
        </div>

        <div className="pt-2">
          <h3 className="text-sm font-medium mb-2">Market Events</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-accent-foreground/30 hover:border-accent-foreground/60"
              onClick={() => onInjectEvent('news', 0.05)}
            >
              Positive News (+5%)
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-accent-foreground/30 hover:border-accent-foreground/60"
              onClick={() => onInjectEvent('news', -0.05)}
            >
              Negative News (-5%)
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-accent-foreground/30 hover:border-accent-foreground/60"
              onClick={() => onInjectEvent('liquidity_shock', 0.5)}
            >
              Liquidity Shock
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-accent-foreground/30 hover:border-accent-foreground/60"
              onClick={() => onInjectEvent('price_shock', 0.1)}
            >
              Price Spike (+10%)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimulationControls;
