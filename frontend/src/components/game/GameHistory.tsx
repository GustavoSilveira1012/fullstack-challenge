import React, { useMemo } from 'react';
import { useGameStore } from '@store/gameStore';
import type { Round } from '@/types';
import { Badge } from '@components/common';

/**
 * GameHistory Component
 * Displays recent rounds with crash points and timestamps
 * Requirement 2.2.4: Recent rounds list with crash points and timestamps
 */
interface GameHistoryProps {
  /**
   * Maximum number of rounds to display
   */
  maxRounds?: number;
  /**
   * Optional className for custom styling
   */
  className?: string;
}

export const GameHistory: React.FC<GameHistoryProps> = ({ maxRounds = 10, className = '' }) => {
  const { recentRounds } = useGameStore();

  /**
   * Get the rounds to display (limited by maxRounds)
   */
  const displayRounds = useMemo(() => {
    return recentRounds.slice(0, maxRounds);
  }, [recentRounds, maxRounds]);

  /**
   * Format timestamp to readable format
   */
  const formatTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;

      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  /**
   * Format crash point with 2 decimal places
   */
  const formatCrashPoint = (crashPoint: number | null): string => {
    if (crashPoint === null) return 'N/A';
    return crashPoint.toFixed(2);
  };

  return (
    <div
      className={`flex flex-col gap-3 ${className}`}
      role="region"
      aria-label="Recent game rounds history"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Rounds</h3>

      {displayRounds.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No rounds yet. Start playing to see history.
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {displayRounds.map((round: Round) => (
            <div
              key={round.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              role="listitem"
            >
              {/* Round Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-400 truncate">
                    {round.id.substring(0, 8)}...
                  </span>
                  <Badge
                    variant={round.state === 'CRASHED' ? 'danger' : 'primary'}
                    size="small"
                  >
                    {round.state}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {formatTime(round.createdAt)}
                </div>
              </div>

              {/* Crash Point */}
              <div className="text-right ml-4">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCrashPoint(round.crashPoint)}x
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {round.playerCount} players
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameHistory;
