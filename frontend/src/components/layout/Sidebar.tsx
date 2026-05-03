import React, { useEffect, useState } from 'react';
import { useGame } from '@hooks/useGame';
import { Card } from '@components/common/Card';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Sidebar component with navigation and game history
 * Requirement 2.2.4: Display list of recent rounds
 * Requirement 2.6.1: Display player bet history
 * Features:
 * - Navigation menu
 * - Game history display
 * - Recent rounds list
 * - Player statistics
 * - Responsive (collapsible on mobile)
 * - WCAG AA accessibility compliance
 */
export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { fetchRoundHistory } = useGame();
  const [recentRounds, setRecentRounds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadRecentRounds = async () => {
      try {
        setIsLoading(true);
        const history = await fetchRoundHistory(1, 10);
        setRecentRounds(history.data || []);
      } catch (error) {
        console.error('Failed to load recent rounds:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadRecentRounds();
    }
  }, [isOpen, fetchRoundHistory]);

  const formatCrashPoint = (crashPoint: number | null): string => {
    if (crashPoint === null) return 'N/A';
    return `${crashPoint.toFixed(2)}x`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative
          top-0 right-0 bottom-0
          w-80 md:w-64
          bg-white dark:bg-gray-800
          border-l border-gray-200 dark:border-gray-700
          shadow-lg md:shadow-none
          transform transition-transform duration-300 ease-in-out
          z-40
          ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          overflow-y-auto
        `}
        role="complementary"
        aria-label="Game history and statistics"
      >
        <div className="p-4 md:p-6">
          {/* Close Button (Mobile) */}
          <div className="flex items-center justify-between mb-6 md:hidden">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Game History
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close sidebar"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Desktop Title */}
          <h2 className="hidden md:block text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Game History
          </h2>

          {/* Recent Rounds Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Recent Rounds
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : recentRounds.length > 0 ? (
              <div className="space-y-2">
                {recentRounds.map((round) => (
                  <Card
                    key={round.id}
                    className="p-3 cursor-pointer hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {round.id.slice(0, 8)}...
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCrashPoint(round.crashPoint)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(round.createdAt)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {round.playerCount} players
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                No recent rounds
              </p>
            )}
          </div>

          {/* Statistics Section */}
          <div className="mt-8 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Statistics
            </h3>

            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Rounds
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {recentRounds.length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Avg. Crash Point
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {recentRounds.length > 0
                    ? (
                        recentRounds.reduce((sum, r) => sum + (r.crashPoint || 0), 0) /
                        recentRounds.length
                      ).toFixed(2)
                    : '0.00'}
                  x
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Wagered
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  R$ {(
                    recentRounds.reduce((sum, r) => sum + (r.totalWagered || 0), 0) / 100
                  ).toFixed(2)}
                </span>
              </div>
            </Card>
          </div>

          {/* Navigation Section */}
          <div className="mt-8 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
              Navigation
            </h3>

            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={onClose}
            >
              Dashboard
            </button>

            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={onClose}
            >
              Bet History
            </button>

            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={onClose}
            >
              Verify Fairness
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
