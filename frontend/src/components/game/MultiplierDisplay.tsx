import React, { useMemo } from 'react';
import { useGameStore } from '@store/gameStore';

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

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
      role="region"
      aria-label="Current multiplier display"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* LIVE Badge */}
      {isLive && (
        <div className="flex items-center gap-2">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse" />
            <div className="relative px-3 py-1 bg-green-600 text-white text-sm font-bold rounded-full">
              LIVE
            </div>
          </div>
        </div>
      )}

      {/* Multiplier Display */}
      <div
        className={`text-6xl md:text-7xl font-bold font-mono transition-colors duration-200 ${
          isCrashed ? 'text-red-600' : multiplierColor
        } ${isLive ? 'animate-pulse' : ''}`}
        aria-label={`Current multiplier: ${formattedMultiplier}x`}
      >
        {formattedMultiplier}
        <span className="text-4xl md:text-5xl">x</span>
      </div>

      {/* Crash Status */}
      {isCrashed && (
        <div className="text-2xl font-bold text-red-600 animate-bounce">CRASHED</div>
      )}

      {/* Betting Status */}
      {roundState === 'BETTING' && (
        <div className="text-lg text-gray-500 dark:text-gray-400">Waiting for next round...</div>
      )}
    </div>
  );
};

export default MultiplierDisplay;
