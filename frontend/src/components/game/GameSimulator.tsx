import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@components/common/Button';
import { useGameStore } from '@store/gameStore';

/**
 * GameSimulator Component
 * Simulates game rounds for testing purposes
 */
export const GameSimulator: React.FC = () => {
  const { 
    roundState, 
    currentMultiplier, 
    setRoundState, 
    setMultiplier, 
    setCurrentRound 
  } = useGameStore();
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  /**
   * Start a new round simulation
   */
  const startRound = useCallback(() => {
    if (roundState !== 'BETTING') return;

    console.log('[Simulator] Starting new round');
    
    // Create a mock round
    setCurrentRound({
      id: `round-${Date.now()}`,
      state: 'RUNNING',
      crashPoint: null,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      crashedAt: null,
      playerCount: 1,
      totalWagered: 0
    });

    setRoundState('RUNNING');
    setMultiplier(1.0);
    setIsSimulating(true);

    // Random crash point between 1.5x and 10x (matching backend minimum)
    const crashPoint = 1.5 + Math.random() * 8.5;
    let currentMultiplier = 1.0;

    // Simulate multiplier increase
    const interval = setInterval(() => {
      currentMultiplier += 0.01;
      
      if (currentMultiplier >= crashPoint) {
        // Crash the round
        console.log('[Simulator] Round crashed at', currentMultiplier.toFixed(2));
        setMultiplier(currentMultiplier);
        setRoundState('CRASHED');
        setIsSimulating(false);
        clearInterval(interval);
        
        // Start new betting phase after 3 seconds
        setTimeout(() => {
          console.log('[Simulator] Starting new betting phase');
          setRoundState('BETTING');
          setMultiplier(1.0);
          setCurrentRound(null as any);
        }, 3000);
      } else {
        setMultiplier(currentMultiplier);
      }
    }, 100); // Update every 100ms

    setIntervalId(interval);
  }, [roundState, setRoundState, setMultiplier, setCurrentRound]);

  /**
   * Stop simulation
   */
  const stopSimulation = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsSimulating(false);
    setRoundState('BETTING');
    setMultiplier(1.0);
  }, [intervalId, setRoundState, setMultiplier]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Game Simulator
      </h3>
      
      <div className="space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div>Round State: <span className="font-semibold">{roundState}</span></div>
          <div>Multiplier: <span className="font-semibold">{(typeof currentMultiplier === 'number' && !isNaN(currentMultiplier) ? currentMultiplier : 1.0).toFixed(2)}x</span></div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={startRound}
            disabled={roundState !== 'BETTING' || isSimulating}
            variant="primary"
            size="small"
          >
            Start Round
          </Button>
          
          <Button
            onClick={stopSimulation}
            disabled={!isSimulating}
            variant="secondary"
            size="small"
          >
            Stop Simulation
          </Button>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          Use this to test betting and cash out functionality
        </div>
      </div>
    </div>
  );
};

export default GameSimulator;