import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, Card, Loading, Badge } from '../components/common';
import { gameService } from '../services/gameService';
import { PlayerBetHistoryResponse, Bet } from '../types';
import { formatCurrency, formatDate, formatMultiplier } from '../utils/formatters';

type SortField = 'createdAt' | 'amount' | 'payout';
type SortOrder = 'asc' | 'desc';
type FilterState = 'all' | 'WON' | 'LOST' | 'ACTIVE';

interface BetHistoryFilters {
  state: FilterState;
  minAmount: string;
  maxAmount: string;
  dateFrom: string;
  dateTo: string;
}

/**
 * HistoryPage component - displays detailed bet history with pagination, filtering, and sorting
 * Requirement 2.6.1: Display detailed history of player's recent bets with results
 */
export const HistoryPage: React.FC = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filters, setFilters] = useState<BetHistoryFilters>({
    state: 'all',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: '',
  });

  const pageSize = 20;

  // Fetch bet history
  const fetchBetHistory = async (currentPage: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response: PlayerBetHistoryResponse = await gameService.getPlayerBetHistory(
        currentPage,
        pageSize
      );
      setBets(response.data);
      setTotalPages(response.totalPages);
      setTotal(response.total);
      setPage(currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bet history');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort bets
  const filteredAndSortedBets = useMemo(() => {
    let filtered = [...bets];

    // Apply filters
    if (filters.state !== 'all') {
      filtered = filtered.filter(bet => bet.state === filters.state);
    }

    if (filters.minAmount) {
      const minAmount = parseFloat(filters.minAmount) * 100; // Convert to centavos
      filtered = filtered.filter(bet => bet.amount >= minAmount);
    }

    if (filters.maxAmount) {
      const maxAmount = parseFloat(filters.maxAmount) * 100; // Convert to centavos
      filtered = filtered.filter(bet => bet.amount <= maxAmount);
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(bet => new Date(bet.createdAt) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(bet => new Date(bet.createdAt) <= toDate);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'payout':
          aValue = a.payout || 0;
          bValue = b.payout || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [bets, filters, sortField, sortOrder]);

  // Handle filter changes
  const handleFilterChange = (field: keyof BetHistoryFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Handle sort changes
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      state: 'all',
      minAmount: '',
      maxAmount: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  // Get bet status badge
  const getBetStatusBadge = (bet: Bet) => {
    switch (bet.state) {
      case 'WON':
        return <Badge variant="success">Won</Badge>;
      case 'LOST':
        return <Badge variant="danger">Lost</Badge>;
      case 'ACTIVE':
        return <Badge variant="primary">Active</Badge>;
      default:
        return <Badge variant="secondary">{bet.state}</Badge>;
    }
  };

  // Calculate profit/loss
  const calculateProfitLoss = (bet: Bet): number => {
    if (bet.state === 'WON' && bet.payout) {
      return bet.payout - bet.amount;
    } else if (bet.state === 'LOST') {
      return -bet.amount;
    }
    return 0;
  };

  useEffect(() => {
    fetchBetHistory();
  }, []);

  if (loading && bets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Bet History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and analyze your betting history with detailed filters and sorting options.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Filters & Sorting
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* State Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Bets</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
                <option value="ACTIVE">Active</option>
              </select>
            </div>

            {/* Amount Range */}
            <Input
              label="Min Amount (R$)"
              type="number"
              step="0.01"
              min="0"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              placeholder="0.00"
            />

            <Input
              label="Max Amount (R$)"
              type="number"
              step="0.01"
              min="0"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              placeholder="1000.00"
            />

            {/* Date Range */}
            <Input
              label="From Date"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              label="To Date"
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => fetchBetHistory(1)}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {total}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Bets</p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredAndSortedBets.filter(bet => bet.state === 'WON').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Won</p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredAndSortedBets.filter(bet => bet.state === 'LOST').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Lost</p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(
                  filteredAndSortedBets.reduce((sum, bet) => sum + calculateProfitLoss(bet), 0)
                )}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Net P&L</p>
            </div>
          </Card>
        </div>

        {/* Bet History Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => handleSort('createdAt')}
                  >
                    Date {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Round ID
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => handleSort('amount')}
                  >
                    Bet Amount {sortField === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Multiplier
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => handleSort('payout')}
                  >
                    Payout {sortField === 'payout' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Profit/Loss
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedBets.map((bet) => {
                  const profitLoss = calculateProfitLoss(bet);
                  return (
                    <tr 
                      key={bet.id} 
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {formatDate(bet.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono text-sm">
                        {bet.roundId.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white font-semibold">
                        {formatCurrency(bet.amount)}
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {bet.cashedOutAt ? formatMultiplier(bet.cashedOutAt) : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white font-semibold">
                        {bet.payout ? formatCurrency(bet.payout) : '-'}
                      </td>
                      <td className={`py-3 px-4 font-semibold ${
                        profitLoss > 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : profitLoss < 0 
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {profitLoss !== 0 ? formatCurrency(profitLoss) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {getBetStatusBadge(bet)}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => setSelectedBet(bet)}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredAndSortedBets.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No bets found matching your filters.
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages} ({total} total bets)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="small"
                  disabled={page <= 1}
                  onClick={() => fetchBetHistory(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  disabled={page >= totalPages}
                  onClick={() => fetchBetHistory(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Bet Details Modal */}
        {selectedBet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Bet Details
                </h3>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setSelectedBet(null)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bet ID</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white">{selectedBet.id}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Round ID</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white">{selectedBet.roundId}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Date & Time</p>
                  <p className="text-gray-900 dark:text-white">{formatDate(selectedBet.createdAt)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bet Amount</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(selectedBet.amount)}
                  </p>
                </div>
                
                {selectedBet.cashedOutAt && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cashed Out At</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatMultiplier(selectedBet.cashedOutAt)}
                    </p>
                  </div>
                )}
                
                {selectedBet.payout && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Payout</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(selectedBet.payout)}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <div className="mt-1">
                    {getBetStatusBadge(selectedBet)}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Profit/Loss</p>
                  <p className={`text-lg font-semibold ${
                    calculateProfitLoss(selectedBet) > 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : calculateProfitLoss(selectedBet) < 0 
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {formatCurrency(calculateProfitLoss(selectedBet))}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;