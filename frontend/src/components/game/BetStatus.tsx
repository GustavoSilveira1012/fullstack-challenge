import React, { useMemo } from 'react';
import { Badge } from '@components/common/Badge';
import { useGameStore } from '@store/gameStore';

/**
 * BetStatus Component
 * Displays current bet status including amount and potential payout
 * Requirements: 2.3.5
 */
interface BetStatusProps {
  /**
   * Optional className for custom styling
   */
  className?: string;
}

export const BetStatus: React.FC<BetStatusProps> = ({ className = '' }) => {
  const { playerBet, currentMultiplier, roundState } = useGameStore();

  /**
   * Format currency in centavos to reais
   */
  const formatCurrency = (centavos: number): string => {
    const reais = (centavos / 100).toFixed(2);
    const formatted = parseFloat(reais).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `R$ ${formatted}`;
  };

  /**
   * Calculate potential payout
   */
  const potentialPayout = useMemo(() => {
    if (!playerBet || playerBet.state !== 'ACTIVE') return 0;
    return Math.floor(playerBet.amount * currentMultiplier);
  }, [playerBet, currentMultiplier]);

  /**
   * Get bet status badge variant
   */
  const getBetStatusVariant = () => {
    if (!playerBet) return 'secondary';
    
    switch (playerBet.state) {
      case 'ACTIVE':
        return roundState === 'RUNNING' ? 'success' : 'warning';
      case 'WON':
        return 'success';
      case 'LOST':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  /**
   * Get bet status text
   */
  const getBetStatusText = () => {
    if (!playerBet) return 'No Active Bet';
    
    switch (playerBet.state) {
      case 'ACTIVE':
        return roundState === 'RUNNING' ? 'Bet Active' : 'Bet Placed';
      case 'WON':
        return 'Bet Won';
      case 'LOST':
        return 'Bet Lost';
      default:
        return 'Unknown Status';
    }
  };

  // Don't render if no bet information to show
  if (!playerBet && roundState === 'BETTING') {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Bet Status
        </h4>
        <Badge variant={getBetStatusVariant()}>
          {getBetStatusText()}
        </Badge>
      </div>

      {playerBet ? (
        <div className="space-y-3">
          {/* Bet Amount */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Bet Amount:
            </span>
            <span className="font-mono font-semibold text-gray-900 dark:text-white">
              {formatCurrency(playerBet.amount)}
            </span>
          </div>

          {/* Potential Payout (only for active bets during running phase) */}
          {playerBet.state === 'ACTIVE' && roundState === 'RUNNING' && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Potential Payout:
              </span>
              <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(potentialPayout)}
              </span>
            </div>
          )}

          {/* Current Multiplier (only during running phase) */}
          {playerBet.state === 'ACTIVE' && roundState === 'RUNNING' && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Current Multiplier:
              </span>
              <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                {currentMultiplier.toFixed(2)}x
              </span>
            </div>
          )}

          {/* Final Payout (for won bets) */}
          {playerBet.state === 'WON' && playerBet.payout !== null && playerBet.cashedOutAt && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Cashed Out At:
                </span>
                <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                  {playerBet.cashedOutAt.toFixed(2)}x
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Final Payout:
                </span>
                <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(playerBet.payout)}
                </span>
              </div>
            </>
          )}

          {/* Profit/Loss */}
          {playerBet.state !== 'ACTIVE' && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {playerBet.state === 'WON' ? 'Profit:' : 'Loss:'}
                </span>
                <span className={`font-mono font-bold ${
                  playerBet.state === 'WON' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {playerBet.state === 'WON' && playerBet.payout !== null
                    ? (playerBet.payout - playerBet.amount >= 0 
                        ? `+${formatCurrency(playerBet.payout - playerBet.amount)}`
                        : `-${formatCurrency(Math.abs(playerBet.payout - playerBet.amount))}`)
                    : `-${formatCurrency(playerBet.amount)}`
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            Place a bet to see your status here
          </div>
        </div>
      )}
    </div>
  );
};

export default BetStatus;