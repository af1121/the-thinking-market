
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Agent, AgentType } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from '@/components/ui/switch';

interface AgentControlsProps {
  agents: Agent[];
  onAddAgent: (type: AgentType) => void;
  onRemoveAgent: (id: string) => void;
  onToggleAgent: (id: string) => void;
  className?: string;
}

const AgentControls: React.FC<AgentControlsProps> = ({
  agents,
  onAddAgent,
  onRemoveAgent,
  onToggleAgent,
  className = ''
}) => {
  // Organize agents by type for display
  const agentsByType = agents.reduce<Record<AgentType, Agent[]>>((acc, agent) => {
    if (!acc[agent.type]) acc[agent.type] = [];
    acc[agent.type].push(agent);
    return acc;
  }, {} as Record<AgentType, Agent[]>);

  return (
    <Card className={`glass ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-normal">Trading Agents</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button 
            size="sm"
            variant="outline"
            className="border-bid/40 hover:bg-bid/10 hover:border-bid/60 transition-colors"
            onClick={() => onAddAgent(AgentType.MARKET_MAKER)}
          >
            Add Market Maker
          </Button>
          <Button 
            size="sm"
            variant="outline"
            className="border-bid/40 hover:bg-bid/10 hover:border-bid/60 transition-colors"
            onClick={() => onAddAgent(AgentType.MOMENTUM_TRADER)}
          >
            Add Momentum Trader
          </Button>
          <Button 
            size="sm"
            variant="outline"
            className="border-bid/40 hover:bg-bid/10 hover:border-bid/60 transition-colors"
            onClick={() => onAddAgent(AgentType.FUNDAMENTAL_TRADER)}
          >
            Add Fundamental Trader
          </Button>
          <Button 
            size="sm"
            variant="outline"
            className="border-bid/40 hover:bg-bid/10 hover:border-bid/60 transition-colors"
            onClick={() => onAddAgent(AgentType.NOISE_TRADER)}
          >
            Add Noise Trader
          </Button>
        </div>

        {agents.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            No agents added. Add some agents to start trading!
          </div>
        ) : (
          <div className="overflow-auto max-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cash</TableHead>
                  <TableHead>Inventory</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">
                      {agent.type}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={agent.active}
                        onCheckedChange={() => onToggleAgent(agent.id)}
                      />
                    </TableCell>
                    <TableCell>
                      ${agent.cash.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {agent.inventory > 0 ? (
                        <span className="text-bid">+{agent.inventory}</span>
                      ) : agent.inventory < 0 ? (
                        <span className="text-ask">{agent.inventory}</span>
                      ) : (
                        <span className="text-neutral">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-ask hover:text-ask/80 hover:bg-ask/10"
                        onClick={() => onRemoveAgent(agent.id)}
                      >
                        <span className="sr-only">Remove</span>
                        ✕
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentControls;
