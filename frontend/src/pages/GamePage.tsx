import React, { useState, useCallback } from 'react';
import { MultiplierDisplay } from '@components/game/MultiplierDisplay';
import { GameInterface } from '@components/game/GameInterface';
import { GameHistory } from '@components/game/GameHistory';
import { LiveActivity } from '@components/game/LiveActivity';
import { CurrentRoundBets } from '@components/game/CurrentRoundBets';
import { Button } from '@components/common/Button';
import { useGameStore } from '@store/gameStore';
import { useNotification } from '@hooks/useNotification';

/**
 * GamePage Component
 * Main game interface with multiplier display, betting controls, and real-time updates
 * Requirements: 2.2.1, 2.2.2, 2.2.3, 2.3.3, 2.4.1, 2.4.2, 2.7.1, 2.7.2, 2.7.3
 */
interface GamePageProps {
  onSidebarToggle: () => void;
}

export const GamePage: React.FC<GamePageProps> = ({ onSidebarToggle }) => {
  const { roundState } = useGameStore();
  const { showError } = useNotification();
  const [isFullscreen, setIsFullscreen] = useState(false);

  /**
   * Toggle fullscreen mode
   */
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        showError('Fullscreen not supported');
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, [showError]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Mobile Header Controls */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Crash Game
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="small"
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen mode"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={onSidebarToggle}
            aria-label="Toggle game statistics sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Main Game Area */}
      <main 
        id="main-content"
        className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0"
        role="main"
        aria-label="Game interface"
      >
        {/* Left Column - Game Display */}
        <section 
          className="flex-1 flex flex-col gap-4 min-h-0"
          aria-labelledby="game-display-heading"
        >
          <h2 id="game-display-heading" className="sr-only">
            Game Display Area
          </h2>

          {/* Multiplier Display Area */}
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 relative overflow-hidden min-h-[300px] lg:min-h-[400px]">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5" aria-hidden="true">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600"></div>
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>

            {/* Multiplier Display */}
            <MultiplierDisplay className="relative z-10" />

            {/* Desktop Controls */}
            <div className="hidden lg:block absolute top-4 right-4">
              <div className="flex items-center gap-2" role="toolbar" aria-label="Game controls">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={toggleFullscreen}
                  aria-label="Toggle fullscreen mode"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={onSidebarToggle}
                  aria-label="Toggle game statistics sidebar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Game History */}
          <div className="lg:hidden">
            <GameHistory maxRounds={5} className="bg-white dark:bg-gray-800 rounded-lg p-4" />
          </div>
        </section>

        {/* Right Column - Controls and Info */}
        <aside 
          id="game-controls"
          className="w-full lg:w-80 xl:w-96 flex flex-col gap-4"
          role="complementary"
          aria-labelledby="game-controls-heading"
        >
          <h2 id="game-controls-heading" className="sr-only">
            Game Controls and Information
          </h2>

          {/* Game Interface (Betting and Cash Out) */}
          <GameInterface />

          {/* Live Activity */}
          <LiveActivity />

          {/* Current Round Bets */}
          <CurrentRoundBets />

          {/* Desktop Game History */}
          <div className="hidden lg:block">
            <GameHistory className="bg-white dark:bg-gray-800 rounded-lg p-4" />
          </div>
        </aside>
      </main>

      {/* Round State Indicator */}
      <footer className="px-4 pb-2">
        <div className="flex items-center justify-center">
          <div 
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              roundState === 'BETTING' 
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : roundState === 'RUNNING'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
            role="status"
            aria-live="polite"
            aria-label={`Current game state: ${
              roundState === 'BETTING' ? 'Betting phase active' :
              roundState === 'RUNNING' ? 'Round is running' :
              'Round has crashed'
            }`}
          >
            {roundState === 'BETTING' && 'Betting Phase'}
            {roundState === 'RUNNING' && 'Round Active'}
            {roundState === 'CRASHED' && 'Round Crashed'}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GamePage;