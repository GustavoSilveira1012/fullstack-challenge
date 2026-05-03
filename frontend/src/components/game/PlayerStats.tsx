import React, { useMemo } from 'react';
import { Card } from '@components/common';

/**
 * PlayerStats Component
 * Displays player statistics (total bets, wagered, won, win rate, average multiplier)
 * Requirement 2.6.2: Player statistics display
 */
interface PlayerStatsProps {
  /**
   * Total number of bets placed
   */
  totalBets: number;
  /**
   * Total amount wagered (in centavos)
   */
  totalWagered: number;
  /**
   * Total amount won (in centavos)
   */
  totalWon: number;
  /**
   * Average multiplier cashed out at
   */
  averageMultiplier?: number;
  /**
   * Optional className for custom styling
   */
  className?: string;
}

export const PlayerStats: React.FC<PlayerStatsProps> = ({
  totalBets,
  totalWagered,
  totalWon,
  averageMultiplier = 0,
  className = '',
}) => {
  /**
   * Calculate win rate percentage
   * Win rate is calculated as: (totalWon / totalWagered) * 100
   * This represents the return on investment percentage
   */
  const winRate = useMemo(() => {
    if (totalBets === 0 || totalWagered === 0) return 0;
    return Math.round((totalWon / totalWagered) * 100);
  }, [totalBets, totalWagered, totalWon]);

  /**
   * Calculate profit/loss
   */
  const profitLoss = useMemo(() => {
    return totalWon - totalWagered;
  }, [totalWon, totalWagered]);

  /**
   * Format currency (centavos to BRL)
   */
  const formatCurrency = (centavos: number): string => {
    const reais = centavos / 100;
    return `R$ ${reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  /**
   * Determine profit/loss color
   */
  const profitColor = profitLoss >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {/* Total Bets */}
      <Card className="p-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bets</span>
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{totalBets}</span>
        </div>
      </Card>

      {/* Total Wagered */}
      <Card className="p-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Wagered
          </span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalWagered)}
          </span>
        </div>
      </Card>

      {/* Total Won */}
      <Card className="p-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Won</span>
          <span className="text-2xl font-bold text-green-600">{formatCurrency(totalWon)}</span>
        </div>
      </Card>

      {/* Win Rate */}
      <Card className="p-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Win Rate</span>
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{winRate}%</span>
        </div>
      </Card>

      {/* Average Multiplier */}
      <Card className="p-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Avg Multiplier
          </span>
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {averageMultiplier.toFixed(2)}x
          </span>
        </div>
      </Card>

      {/* Profit/Loss */}
      <Card className="p-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Profit/Loss
          </span>
          <span className={`text-2xl font-bold ${profitColor}`}>
            {profitLoss >= 0 ? '+' : ''}
            {formatCurrency(profitLoss)}
          </span>
        </div>
      </Card>
    </div>
  );
};

export default PlayerStats;
