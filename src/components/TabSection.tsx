import React, { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import VolatilityAnalytics from './VolatilityAnalytics';
import { VolatilityAnalytics as AnalyticsType } from '@/lib/types';

interface TabSectionProps {
  activeTab?: string;
  analytics: AnalyticsType;
  onTabChange?: (tab: string) => void;
  className?: string;
  children?: ReactNode;
}

const TabSection: React.FC<TabSectionProps> = ({
  activeTab = 'market',
  analytics,
  onTabChange,
  className = '',
  children
}) => {
  const handleTabChange = (value: string) => {
    if (onTabChange) {
      onTabChange(value);
    }
  };

  return (
    <Tabs
      defaultValue={activeTab}
      className={`w-full ${className}`}
      onValueChange={handleTabChange}
    >
      <TabsList className="mb-4">
        <TabsTrigger value="market">Market Overview</TabsTrigger>
        <TabsTrigger value="analytics">Volatility Analytics</TabsTrigger>
      </TabsList>
      
      <TabsContent value="market" className="space-y-6">
        {children}
      </TabsContent>
      
      <TabsContent value="analytics" className="space-y-6">
        <VolatilityAnalytics 
          analytics={analytics}
          height={500}
        />
      </TabsContent>
    </Tabs>
  );
};

export default TabSection; 