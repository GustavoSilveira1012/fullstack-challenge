import React, { useMemo, useEffect } from 'react';
import { useGameStore } from '@store/gameStore';
import { useScreenReaderAnnouncement } from '@hooks/useFocusManagement';
import { formatMultiplierForScreenReader } from '@utils/accessibility';
import { CrashAnimation } from './CrashAnimation';
import { useSound } from '@hooks/useSound';

/**
 * MultiplierDisplay Component
 * Displays the current multiplier with real-time updates and color coding
 * Requirement 2.2.1: Real-time multiplier display with color coding
 * Requirement 2.2.2: LIVE badge during RUNNING phase
 */
interface MultiplierDisplayProps {
  /**
   * Optional className for custom styling
   */
  className?: string;
}

export const MultiplierDisplay: React.FC<MultiplierDisplayProps> = ({ className = '' }) => {
  const { currentMultiplier, roundState } = useGameStore();
  const { announce } = useScreenReaderAnnouncement();
  const { playSound } = useSound();

  /**
   * Determine color based on multiplier value
   * Green: 1.00 - 2.00
   * Yellow: 2.00 - 5.00
   * Red: 5.00+
   */
  const multiplierColor = useMemo(() => {
    if (currentMultiplier < 2) return 'text-green-500';
    if (currentMultiplier < 5) return 'text-yellow-500';
    return 'text-red-500';
  }, [currentMultiplier]);

  /**
   * Format multiplier with 2 decimal places
   */
  const formattedMultiplier = useMemo(() => {
    return currentMultiplier.toFixed(2);
  }, [currentMultiplier]);

  /**
   * Determine if round is live
   */
  const isLive = roundState === 'RUNNING';

  /**
   * Determine if crashed
   */
  const isCrashed = roundState === 'CRASHED';

  /**
   * Announce significant multiplier milestones to screen readers
   */
  useEffect(() => {
    if (isLive && currentMultiplier > 1) {
      const milestones = [2, 5, 10, 20, 50, 100];
      const milestone = milestones.find(m => 
        currentMultiplier >= m && currentMultiplier < m + 0.1
      );
      
      if (milestone) {
        announce(`Multiplier reached ${formatMultiplierForScreenReader(milestone)}`, 'polite');
      }
    }
  }, [currentMultiplier, isLive, announce]);

  /**
   * Announce round state changes
   */
  useEffect(() => {
    if (roundState === 'RUNNING') {
      announce('Round started, multiplier is increasing', 'assertive');
    } else if (roundState === 'CRASHED') {
      announce(`Round crashed at ${formatMultiplierForScreenReader(currentMultiplier)}`, 'assertive');
      // Play crash sound is handled by CrashAnimation component
    } else if (roundState === 'BETTING') {
      announce('New round starting, place your bets', 'polite');
    }
  }, [roundState, currentMultiplier, announce]);

  return (
    <section
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
      role="region"
      aria-labelledby="multiplier-heading"
      aria-live="polite"
      aria-atomic="false"
    >
      <h2 id="multiplier-heading" className="sr-only">
        Current Game Multiplier
      </h2>

      {/* LIVE Badge */}
      {isLive && (
        <div 
          className="flex items-center gap-2" 
          role="status" 
          aria-label="Round is currently live and active"
        >
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
            <div className="relative px-3 py-1 bg-green-600 text-white text-sm font-bold rounded-full">
              LIVE
            </div>
          </div>
        </div>
      )}

      {/* Multiplier Display */}
      <div
        className={`text-6xl md:text-7xl font-bold font-mono transition-all duration-300 ${
          isCrashed ? 'text-red-600 animate-shake' : multiplierColor
        } ${isLive ? 'animate-multiplier-glow' : ''}`}
        aria-label={`Current multiplier: ${formatMultiplierForScreenReader(currentMultiplier)}`}
        role="status"
        aria-live="assertive"
        aria-atomic="true"
      >
        <span className="sr-only">Multiplier: </span>
        {formattedMultiplier}
        <span className="text-4xl md:text-5xl" aria-hidden="true">x</span>
      </div>

      {/* Crash Animation */}
      <CrashAnimation />

      {/* Crash Status */}
      {isCrashed && (
        <div 
          className="text-2xl font-bold text-red-600 animate-bounce-in"
          role="alert"
          aria-label={`Game crashed at ${formatMultiplierForScreenReader(currentMultiplier)}`}
        >
          CRASHED
        </div>
      )}

      {/* Betting Status */}
      {roundState === 'BETTING' && (
        <div 
          className="text-lg text-gray-500 dark:text-gray-400"
          role="status"
          aria-label="Waiting for next round to start, you can place bets now"
          id="multiplier-status"
        >
          Waiting for next round...
        </div>
      )}

      {/* Additional context for screen readers */}
      <div className="sr-only" aria-live="polite">
        {isLive && `Game is running. Current multiplier is ${formatMultiplierForScreenReader(currentMultiplier)}.`}
        {isCrashed && `Game has crashed. Final multiplier was ${formatMultiplierForScreenReader(currentMultiplier)}.`}
        {roundState === 'BETTING' && 'Betting phase is active. Place your bets now.'}
      </div>
    </section>
  );
};

export default MultiplierDisplay;
