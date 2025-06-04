import React, { useState, useEffect } from 'react';
import Simulation from '@/components/Simulation';
import ResearchJourney from '@/components/ResearchJourney';

const Index = () => {
  const [journeyCompleted, setJourneyCompleted] = useState(false);

  // Check if user has already completed the journey (localStorage)
  useEffect(() => {
    const completed = localStorage.getItem('research-journey-completed');
    if (completed === 'true') {
      setJourneyCompleted(true);
    }
  }, []);

  const handleJourneyComplete = () => {
    setJourneyCompleted(true);
    localStorage.setItem('research-journey-completed', 'true');
  };

  const resetJourney = () => {
    setJourneyCompleted(false);
    localStorage.removeItem('research-journey-completed');
  };

  return (
    <>
      {!journeyCompleted ? (
        <ResearchJourney onComplete={handleJourneyComplete} />
      ) : (
        <>
          <Simulation />
          {/* Hidden reset button for development - remove in production */}
          <button
            onClick={resetJourney}
            className="fixed bottom-4 left-4 px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded opacity-50 hover:opacity-100 transition-opacity z-50"
            title="Reset Research Journey (Dev Only)"
          >
            🔄 Reset Journey
          </button>
        </>
      )}
    </>
  );
};

export default Index;
