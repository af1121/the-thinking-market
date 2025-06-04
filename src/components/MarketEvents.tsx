import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarketEventType } from '@/lib/types';
import { 
  TrendingUp, 
  TrendingDown,
  Zap, 
  AlertTriangle, 
  Waves,
  ArrowUp,
  ArrowDown,
  Flame
} from 'lucide-react';

interface MarketEventsProps {
  onInjectEvent: (type: MarketEventType, magnitude: number) => void;
}

const MarketEvents: React.FC<MarketEventsProps> = ({
  onInjectEvent
}) => {
  const marketEvents = [
    {
      type: MarketEventType.NEWS,
      magnitude: 0.05,
      label: 'Positive News',
      icon: TrendingUp,
      color: 'from-green-400 to-green-600',
      description: '+5% price impact',
      category: 'bullish'
    },
    {
      type: MarketEventType.NEWS,
      magnitude: -0.05,
      label: 'Negative News',
      icon: TrendingDown,
      color: 'from-red-400 to-red-600',
      description: '-5% price impact',
      category: 'bearish'
    },
    {
      type: MarketEventType.PRICE_SHOCK,
      magnitude: 0.1,
      label: 'Price Spike',
      icon: ArrowUp,
      color: 'from-blue-400 to-blue-600',
      description: '+10% sudden move',
      category: 'shock'
    },
    {
      type: MarketEventType.PRICE_SHOCK,
      magnitude: -0.1,
      label: 'Price Drop',
      icon: ArrowDown,
      color: 'from-purple-400 to-purple-600',
      description: '-10% sudden move',
      category: 'shock'
    },
    {
      type: MarketEventType.LIQUIDITY_SHOCK,
      magnitude: 0.5,
      label: 'Liquidity Crisis',
      icon: Waves,
      color: 'from-orange-400 to-orange-600',
      description: 'Reduced market depth',
      category: 'crisis'
    },
    {
      type: MarketEventType.VOLATILITY_SPIKE,
      magnitude: 0.3,
      label: 'Volatility Storm',
      icon: Flame,
      color: 'from-yellow-400 to-yellow-600',
      description: 'Increased uncertainty',
      category: 'volatility'
    },
    {
      type: MarketEventType.FLASH_CRASH,
      magnitude: 0.15,
      label: 'Flash Crash',
      icon: AlertTriangle,
      color: 'from-red-500 to-red-700',
      description: 'Extreme market stress',
      category: 'crisis'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Market Sentiment */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <h3 className="font-medium text-green-900">Market Sentiment</h3>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
              News Events
            </Badge>
          </div>
          
          <div className="space-y-2">
            {marketEvents.filter(event => event.category === 'bullish' || event.category === 'bearish').map((event, index) => {
              const IconComponent = event.icon;
              return (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${event.color} flex items-center justify-center text-white text-sm shadow-sm`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{event.label}</h4>
                        <p className="text-xs text-gray-600">{event.description}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => onInjectEvent(event.type, event.magnitude)}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 text-xs"
                    >
                      Inject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Price Shocks */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="h-4 w-4 text-blue-600" />
            <h3 className="font-medium text-blue-900">Price Shocks</h3>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
              Sudden Moves
            </Badge>
          </div>
          
          <div className="space-y-2">
            {marketEvents.filter(event => event.category === 'shock').map((event, index) => {
              const IconComponent = event.icon;
              return (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${event.color} flex items-center justify-center text-white text-sm shadow-sm`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{event.label}</h4>
                        <p className="text-xs text-gray-600">{event.description}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => onInjectEvent(event.type, event.magnitude)}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 text-xs"
                    >
                      Inject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Market Stress - Full Width */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <h3 className="font-medium text-red-900">Market Stress</h3>
          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
            Crisis Events
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {marketEvents.filter(event => event.category === 'crisis' || event.category === 'volatility').map((event, index) => {
            const IconComponent = event.icon;
            return (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${event.color} flex items-center justify-center text-white text-sm shadow-sm`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">{event.label}</h4>
                      <p className="text-xs text-gray-600">{event.description}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => onInjectEvent(event.type, event.magnitude)}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 text-xs"
                  >
                    Inject
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MarketEvents; 