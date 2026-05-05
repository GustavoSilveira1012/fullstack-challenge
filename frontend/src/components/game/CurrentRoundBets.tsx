import React, { useEffect, useState } from 'react';
import { Card } from '@components/common';
import { gameService } from '@services/gameService';

/**
 * CurrentRoundBets Component
 * Displays all bets placed in the current round with real-time updates
 * Shows player ID, bet amount, and status (active/cashed out/lost)
 */

interface Bet {
  playerId: string;
  amount: string;
  state: 'ACTIVE' | 'CASHED_OUT' | 'LOST';
  cashOutMultiplier?: string;
  payout?: string;
}

interface CurrentRoundBetsProps {
  className?: string;
}

export const CurrentRoundBets: React.FC<CurrentRoundBetsProps> = ({ className = '' }) => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentRound = async () => {
      try {
        const response = await gameService.getCurrentRound();
        // CurrentRoundResponse doesn't include bets array
        // This component will be updated via WebSocket in the future
        setBets([]);
      } catch (error) {
        console.error('Failed to fetch current round bets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentRound();

    // Refresh every 2 seconds
    const interval = setInterval(fetchCurrentRound, 2000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (centavos: string): string => {
    const amount = parseInt(centavos, 10) / 100;
    return `R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPlayerId = (playerId: string): string => {
    // Show first 8 characters of player ID
    return playerId.substring(0, 8);
  };

  const getBetStatusColor = (state: string): string => {
    switch (state) {
      case 'CASHED_OUT':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'LOST':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'ACTIVE':
      default:
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getBetStatusLabel = (state: string): string => {
    switch (state) {
      case 'CASHED_OUT':
        return 'Cashed Out';
      case 'LOST':
        return 'Lost';
      case 'ACTIVE':
      default:
        return 'Active';
    }
  };

  if (loading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`p-4 ${className}`}
      role="region"
      aria-label="Current round bets"
      aria-live="polite"
    >
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Current Round Bets
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {bets.length} {bets.length === 1 ? 'bet' : 'bets'}
          </span>
        </div>

        {/* Bets List */}
        {bets.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No bets placed yet
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
            {bets.map((bet, index) => (
              <div
                key={`${bet.playerId}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {/* Player Info */}
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                    {formatPlayerId(bet.playerId)}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {formatCurrency(bet.amount)}
                  </span>
                </div>

                {/* Status and Payout */}
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${getBetStatusColor(bet.state)}`}
                  >
                    {getBetStatusLabel(bet.state)}
                  </span>
                  {bet.state === 'CASHED_OUT' && bet.cashOutMultiplier && bet.payout && (
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        @ {parseFloat(bet.cashOutMultiplier).toFixed(2)}x
                      </span>
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                        +{formatCurrency(bet.payout)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default CurrentRoundBets;
