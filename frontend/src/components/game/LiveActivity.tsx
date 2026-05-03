import React, { useMemo } from 'react';
import { useGameStore } from '@store/gameStore';
import { Card } from '@components/common';

/**
 * LiveActivity Component
 * Displays live player activity (player count, total wagered in current round)
 * Requirement 2.2.5: Live player activity display
 */
interface LiveActivityProps {
  /**
   * Optional className for custom styling
   */
  className?: string;
}

export const LiveActivity: React.FC<LiveActivityProps> = ({ className = '' }) => {
  const { currentRound, roundState } = useGameStore();

  /**
   * Get player count from current round
   */
  const playerCount = useMemo(() => {
    return currentRound?.playerCount ?? 0;
  }, [currentRound]);

  /**
   * Get total wagered from current round
   */
  const totalWagered = useMemo(() => {
    return currentRound?.totalWagered ?? 0;
  }, [currentRound]);

  /**
   * Format currency (centavos to BRL)
   */
  const formatCurrency = (centavos: number): string => {
    const reais = centavos / 100;
    return `R$ ${reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  /**
   * Determine if round is active
   */
  const isActive = roundState === 'RUNNING';

  return (
    <Card
      className={`p-4 ${className}`}
      role="region"
      aria-label="Live game activity"
      aria-live="polite"
    >
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Activity</h3>
          {isActive && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-600">LIVE</span>
            </div>
          )}
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-2 gap-4">
          {/* Players Betting */}
          <div className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Players Betting
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {playerCount}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {playerCount === 1 ? 'player' : 'players'}
              </span>
            </div>
          </div>

          {/* Total Wagered */}
          <div className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Total Wagered
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalWagered)}
            </span>
          </div>
        </div>

        {/* Status Message */}
        {!isActive && (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
            {roundState === 'BETTING'
              ? 'Waiting for round to start...'
              : 'Round has ended. Waiting for next round...'}
          </div>
        )}

        {/* Average Bet */}
        {playerCount > 0 && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Average Bet
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(Math.floor(totalWagered / playerCount))}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LiveActivity;
