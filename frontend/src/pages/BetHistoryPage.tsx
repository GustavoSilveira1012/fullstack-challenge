import React, { useEffect, useState } from 'react';
import { Header } from '@components/layout/Header';
import { Card } from '@components/common';
import { gameService } from '@services/gameService';
import { useAuth } from '@hooks/useAuth';

/**
 * BetHistoryPage Component
 * Shows player's betting history with pagination
 */
export const BetHistoryPage: React.FC = () => {
  const { token } = useAuth();
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchBets = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        const response = await gameService.getPlayerBetHistory(page, 20);
        setBets(response.data || []);
        setTotal(response.total || 0);
      } catch (error) {
        console.error('Failed to fetch bet history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBets();
  }, [token, page]);

  const formatCurrency = (centavos: string): string => {
    const amount = parseInt(centavos, 10) / 100;
    return `R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  const getBetStatusColor = (state: string): string => {
    switch (state) {
      case 'CASHED_OUT':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'LOST':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Bet History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View your complete betting history
          </p>
        </div>

        <Card className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : bets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No bets yet. Start playing to see your history!
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Round ID
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Bet Amount
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Multiplier
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Payout
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bets.map((bet) => (
                      <tr
                        key={bet.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(bet.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                          {bet.roundId.substring(0, 8)}...
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(bet.amount)}
                        </td>
                        <td className="py-3 px-4 text-sm text-center text-gray-900 dark:text-white">
                          {bet.cashOutMultiplier ? `${parseFloat(bet.cashOutMultiplier).toFixed(2)}x` : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-semibold">
                          {bet.payout ? (
                            <span className="text-green-600 dark:text-green-400">
                              +{formatCurrency(bet.payout)}
                            </span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400">
                              -{formatCurrency(bet.amount)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getBetStatusColor(bet.state)}`}>
                            {bet.state}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {bets.length} of {total} bets
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={bets.length < 20}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </Card>
      </main>
    </div>
  );
};

export default BetHistoryPage;
