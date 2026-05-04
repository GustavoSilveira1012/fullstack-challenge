import React, { useState, useEffect } from 'react';
import { useAuth } from '@hooks/useAuth';
import { useWallet } from '@hooks/useWallet';
import { useUIStore } from '@store/uiStore';
import { useTheme } from '@hooks/useTheme';
import { gameService } from '@services/gameService';
import { Header } from '@components/layout/Header';
import { Button } from '@components/common/Button';
import { Card } from '@components/common/Card';
import { Loading } from '@components/common/Loading';
import { Badge } from '@components/common/Badge';
import { sanitizeText } from '@utils/security';

interface PlayerStatistics {
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  winRate: number;
  averageMultiplier: number;
}

/**
 * ProfilePage Component
 * Displays user profile information, player statistics, and settings
 * Requirements: 2.1.4, 2.6.2, 2.7.4, 2.8.5
 */
export const ProfilePage: React.FC = () => {
  const { email, playerId } = useAuth();
  const { balance, formatBalance } = useWallet();
  const { theme, setTheme, soundEnabled, toggleSound } = useUIStore();
  const [statistics, setStatistics] = useState<PlayerStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Account creation date (mock for now - would come from backend)
  const accountCreationDate = new Date('2024-01-15'); // Mock date

  useEffect(() => {
    loadPlayerStatistics();
  }, []);

  const loadPlayerStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch player bet history to calculate statistics
      const betHistory = await gameService.getPlayerBetHistory(1, 1000); // Get all bets for stats
      
      if (betHistory.data.length === 0) {
        setStatistics({
          totalBets: 0,
          totalWagered: 0,
          totalWon: 0,
          winRate: 0,
          averageMultiplier: 0,
        });
        return;
      }

      // Calculate statistics from bet history
      const totalBets = betHistory.data.length;
      const totalWagered = betHistory.data.reduce((sum, bet) => sum + bet.amount, 0);
      const wonBets = betHistory.data.filter(bet => bet.state === 'WON');
      const totalWon = wonBets.reduce((sum, bet) => sum + (bet.payout || 0), 0);
      const winRate = totalBets > 0 ? (wonBets.length / totalBets) * 100 : 0;
      
      // Calculate average multiplier for won bets
      const averageMultiplier = wonBets.length > 0 
        ? wonBets.reduce((sum, bet) => {
            const multiplier = bet.cashedOutAt || 1;
            return sum + multiplier;
          }, 0) / wonBets.length
        : 0;

      setStatistics({
        totalBets,
        totalWagered,
        totalWon,
        winRate,
        averageMultiplier,
      });
    } catch (err) {
      console.error('Failed to load player statistics:', err);
      setError('Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const handleSoundToggle = () => {
    toggleSound();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `R$ ${(amount / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Profile
            </h1>
            <Button
              variant="secondary"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Information Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Account Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {sanitizeText(email || '')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Player ID
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                    {sanitizeText(playerId || '')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Account Created
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formatDate(accountCreationDate)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Current Balance
                  </label>
                  <p className="mt-1 text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatBalance(balance)}
                  </p>
                </div>
              </div>
            </Card>

            {/* Settings Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Settings
              </h2>
              
              <div className="space-y-4">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      Theme
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Choose your preferred theme
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={theme === 'light' ? 'primary' : 'secondary'}>
                      {theme === 'light' ? 'Light' : 'Dark'}
                    </Badge>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={handleThemeToggle}
                      className="flex items-center gap-2"
                      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                    >
                      {theme === 'light' ? (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm5.657-9.193a1 1 0 00-1.414 0l-.707.707A1 1 0 005.05 6.464l.707-.707a1 1 0 001.414-1.414zM5 11a1 1 0 100-2H4a1 1 0 100 2h1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      Toggle
                    </Button>
                  </div>
                </div>

                {/* Sound Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      Sound Effects
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Enable or disable game sounds
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={soundEnabled ? 'success' : 'secondary'}>
                      {soundEnabled ? 'On' : 'Off'}
                    </Badge>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={handleSoundToggle}
                      className="flex items-center gap-2"
                      aria-label={`Turn sound ${soundEnabled ? 'off' : 'on'}`}
                    >
                      {soundEnabled ? (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816zM16.707 9.293a1 1 0 010 1.414C15.312 12.102 13.781 13 12 13a1 1 0 01-1-1 1 1 0 011-1c1.781 0 2.312-.898 3.707-2.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 9c0-4.447-3.582-8.111-8-8.111a9.996 9.996 0 00-5.189 1.497A1 1 0 004.11 4.514A8.002 8.002 0 0117.933 9a8.968 8.968 0 01-1.25 4.02l1.414 1.414a1 1 0 001.414-1.414l-14-14zM9 4a1 1 0 011 1v1a1 1 0 11-2 0V5a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      Toggle
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Player Statistics Card */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Player Statistics
            </h2>
            
            {statistics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {statistics.totalBets.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Total Bets
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(statistics.totalWagered)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Total Wagered
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(statistics.totalWon)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Total Won
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {statistics.winRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Win Rate
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {statistics.averageMultiplier.toFixed(2)}x
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Avg Multiplier
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No betting history available yet.
                </p>
              </div>
            )}
          </Card>

          {/* Refresh Statistics Button */}
          <div className="flex justify-center">
            <Button
              variant="secondary"
              onClick={loadPlayerStatistics}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh Statistics
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;