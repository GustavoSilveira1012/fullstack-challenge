/**
 * CrashAnimation Component
 * Displays visual crash animation when round crashes
 * Requirements: 2.2.3 - Crash animation when round crashes
 */

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@store/gameStore';
import { useSound } from '@hooks/useSound';

interface CrashAnimationProps {
  /**
   * Optional className for custom styling
   */
  className?: string;
  /**
   * Duration of the crash animation in milliseconds
   */
  duration?: number;
  /**
   * Callback when animation completes
   */
  onAnimationComplete?: () => void;
}

export const CrashAnimation: React.FC<CrashAnimationProps> = ({
  className = '',
  duration = 2000,
  onAnimationComplete,
}) => {
  const { roundState, currentMultiplier } = useGameStore();
  const { playSound } = useSound();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  /**
   * Trigger crash animation when round crashes
   */
  useEffect(() => {
    if (roundState === 'CRASHED') {
      setIsAnimating(true);
      setShowParticles(true);
      
      // Play crash sound
      playSound('crash');

      // End animation after duration
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setShowParticles(false);
        onAnimationComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      setShowParticles(false);
    }
  }, [roundState, duration, playSound, onAnimationComplete]);

  // Don't render if not animating
  if (!isAnimating) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-50 ${className}`}
      role="presentation"
      aria-hidden="true"
    >
      {/* Screen Flash Effect */}
      <div
        className={`
          absolute inset-0 bg-red-500 
          ${isAnimating ? 'animate-flash' : 'opacity-0'}
        `}
      />

      {/* Crash Text Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`
            text-6xl md:text-8xl font-bold text-red-600 
            ${isAnimating ? 'animate-shake animate-crashPulse' : 'opacity-0'}
          `}
        >
          CRASHED!
        </div>
      </div>

      {/* Multiplier Display */}
      <div className="absolute inset-0 flex items-center justify-center mt-20">
        <div
          className={`
            text-3xl md:text-4xl font-bold text-red-500 font-mono
            ${isAnimating ? 'animate-bounce-in' : 'opacity-0'}
          `}
        >
          {currentMultiplier.toFixed(2)}x
        </div>
      </div>

      {/* Particle Effects */}
      {showParticles && (
        <div className="absolute inset-0 overflow-hidden">
          {/* Particle 1 */}
          <div
            className="absolute top-1/2 left-1/2 w-4 h-4 bg-red-500 rounded-full animate-particle-0"
            style={{ transform: 'translate(-50%, -50%)' }}
          />
          {/* Particle 2 */}
          <div
            className="absolute top-1/2 left-1/2 w-3 h-3 bg-orange-500 rounded-full animate-particle-1"
            style={{ transform: 'translate(-50%, -50%)', animationDelay: '0.1s' }}
          />
          {/* Particle 3 */}
          <div
            className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-500 rounded-full animate-particle-2"
            style={{ transform: 'translate(-50%, -50%)', animationDelay: '0.2s' }}
          />
          {/* Particle 4 */}
          <div
            className="absolute top-1/2 left-1/2 w-3 h-3 bg-red-400 rounded-full animate-particle-3"
            style={{ transform: 'translate(-50%, -50%)', animationDelay: '0.15s' }}
          />
          {/* Additional particles for more dramatic effect */}
          <div
            className="absolute top-1/2 left-1/2 w-2 h-2 bg-orange-400 rounded-full"
            style={{ 
              transform: 'translate(-50%, -50%)',
              animation: 'particle-0 1.5s ease-out forwards',
              animationDelay: '0.3s'
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-1 h-1 bg-yellow-400 rounded-full"
            style={{ 
              transform: 'translate(-50%, -50%)',
              animation: 'particle-1 1.5s ease-out forwards',
              animationDelay: '0.4s'
            }}
          />
        </div>
      )}

      {/* Radial Shockwave Effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`
            w-32 h-32 border-4 border-red-500 rounded-full
            ${isAnimating ? 'animate-ping' : 'opacity-0'}
          `}
          style={{ animationDuration: '1s' }}
        />
      </div>

      {/* Secondary Shockwave */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`
            w-64 h-64 border-2 border-red-400 rounded-full
            ${isAnimating ? 'animate-ping' : 'opacity-0'}
          `}
          style={{ animationDuration: '1.5s', animationDelay: '0.2s' }}
        />
      </div>

      {/* Screen Reader Announcement */}
      <div className="sr-only" role="alert" aria-live="assertive">
        {isAnimating && `Game crashed at ${currentMultiplier.toFixed(2)}x multiplier`}
      </div>
    </div>
  );
};

export default CrashAnimation;