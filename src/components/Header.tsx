
import React from 'react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  running: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

const Header: React.FC<HeaderProps> = ({ running, onStart, onStop, onReset }) => {
  return (
    <header className="w-full glass py-4 px-6 border-b border-border/40 flex items-center justify-between animate-fade-in">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-light tracking-tight">
          <span className="font-normal">Financial Market</span> Simulation
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {!running ? (
          <Button
            className="bg-primary/90 hover:bg-primary transition-all"
            onClick={onStart}
          >
            Start Simulation
          </Button>
        ) : (
          <Button
            variant="outline"
            className="border-border/60 hover:bg-secondary transition-all"
            onClick={onStop}
          >
            Pause Simulation
          </Button>
        )}
        <Button
          variant="ghost"
          className="hover:bg-secondary transition-all"
          onClick={onReset}
        >
          Reset
        </Button>
      </div>
    </header>
  );
};

export default Header;
