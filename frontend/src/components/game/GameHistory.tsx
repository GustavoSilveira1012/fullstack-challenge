import React, { useMemo, useEffect, useState } from 'react';
import { useGameStore } from '@store/gameStore';
import type { Round } from '@/types';
import { Badge } from '@components/common';
import { gameService } from '@services/gameService';

/**
 * GameHistory Component
 * Displays recent rounds with crash points and timestamps
 * Color-coded: Red (< 2x), Yellow (2-5x), Green (> 5x)
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

export const GameHistory: React.FC<GameHistoryProps> = ({ maxRounds = 20, className = '' }) => {
  const { recentRounds } = useGameStore();
  const [historyRounds, setHistoryRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch round history from API
   */
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await gameService.getRoundHistory(1, maxRounds);
        setHistoryRounds(response.data || []);
      } catch (error) {
        console.error('Failed to fetch round history:', error);
        // Fallback to store data
        setHistoryRounds(recentRounds.slice(0, maxRounds));
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [maxRounds, recentRounds]);

  /**
   * Get the rounds to display (limited by maxRounds)
   */
  const displayRounds = useMemo(() => {
    return historyRounds.length > 0 ? historyRounds : recentRounds.slice(0, maxRounds);
  }, [historyRounds, recentRounds, maxRounds]);

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
  const formatCrashPoint = (crashPoint: number | string | null): string => {
    if (crashPoint === null) return 'N/A';
    const value = typeof crashPoint === 'string' ? parseFloat(crashPoint) : crashPoint;
    return value.toFixed(2);
  };

  /**
   * Get color class based on crash point
   * Red: < 2x (low)
   * Yellow: 2-5x (medium)
   * Green: > 5x (high)
   */
  const getCrashPointColor = (crashPoint: number | string | null): string => {
    if (crashPoint === null) return 'text-gray-500';
    const value = typeof crashPoint === 'string' ? parseFloat(crashPoint) : crashPoint;
    
    if (value < 2) {
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    } else if (value < 5) {
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    } else {
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    }
  };

  if (loading) {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Rounds</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

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
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {displayRounds.map((round: any, index: number) => {
            const crashPoint = round.crashPoint || round.crash_point;
            return (
              <div
                key={round.id || index}
                className={`flex items-center justify-center p-2 rounded-lg font-bold text-sm ${getCrashPointColor(crashPoint)}`}
                title={`Round ${round.id?.substring(0, 8) || index}: ${formatCrashPoint(crashPoint)}x - ${formatTime(round.createdAt || round.created_at)}`}
                role="listitem"
              >
                {formatCrashPoint(crashPoint)}x
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GameHistory;
