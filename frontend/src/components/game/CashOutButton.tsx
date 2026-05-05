import React, { useCallback, useState } from 'react';
import { LoadingButton } from '@components/common/Loading';
import { useGameStore } from '@store/gameStore';
import { useWallet } from '@hooks/useWallet';
import { gameService } from '@services/gameService';
import { useNotification } from '@hooks/useNotification';
import { useSound } from '@hooks/useSound';

/**
 * CashOutButton Component
 * Allows players to cash out their active bet during the RUNNING phase
 */
interface CashOutButtonProps {
  currentMultiplier: number;
  className?: string;
}

export const CashOutButton: React.FC<CashOutButtonProps> = ({ 
  currentMultiplier, 
  className = '' 
}) => {
  const { roundState, playerBet, setPlayerBet } = useGameStore();
  const { addPayout, formatBalance } = useWallet();
  const { showSuccess, showError } = useNotification();
  const { playSound } = useSound();
  const [isCashingOut, setIsCashingOut] = useState(false);

  /**
   * Format currency for display (centavos to reais)
   */
  const formatCurrency = useCallback((centavos: number): string => {
    return formatBalance(centavos);
  }, [formatBalance]);

  /**
   * Calculate potential payout based on current multiplier
   */
  const calculatePayout = useCallback(() => {
    if (!playerBet) return 0;
    return Math.floor(playerBet.amount * currentMultiplier);
  }, [playerBet, currentMultiplier]);

  /**
   * Handle cash out action
   */
  const handleCashOut = useCallback(async () => {
    if (!playerBet || roundState !== 'RUNNING') return;

    setIsCashingOut(true);

    try {
      console.log('[CashOut] Attempting to cash out bet:', playerBet.id);
      
      const response = await gameService.cashOut();
      
      console.log('[CashOut] Cash out response:', response);

      if (response.success) {
        const payout = response.payout;
        const profit = payout - playerBet.amount;

        // Update wallet balance with profit
        addPayout(profit);

        // Update player bet state
        setPlayerBet({
          ...playerBet,
          state: 'WON',
          cashedOutAt: response.multiplier,
          payout: payout
        });

        // Play cash out sound
        await playSound('cash-out');

        // Show success notification
        showSuccess(
          `Cashed out at ${response.multiplier.toFixed(2)}x! ` +
          `Payout: ${formatCurrency(payout)} ` +
          `(Profit: ${formatCurrency(profit)})`
        );

        console.log('[CashOut] Successfully cashed out:', {
          multiplier: response.multiplier,
          payout,
          profit
        });
      } else {
        throw new Error('Cash out failed');
      }
    } catch (error: any) {
      console.error('[CashOut] Cash out error:', error);
      const errorMessage = error?.message || error?.data?.message || 'Failed to cash out';
      showError(errorMessage);
    } finally {
      setIsCashingOut(false);
    }
  }, [playerBet, roundState, addPayout, setPlayerBet, playSound, showSuccess, showError, formatCurrency]);

  // Don't show button if no active bet or not in RUNNING phase
  if (!playerBet || playerBet.state !== 'ACTIVE' || roundState !== 'RUNNING') {
    return null;
  }

  const potentialPayout = calculatePayout();
  const potentialProfit = potentialPayout - playerBet.amount;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg ${className}`}>
      <div className="text-center space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Active Bet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bet Amount: {formatCurrency(playerBet.amount)}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
            {(typeof currentMultiplier === 'number' && !isNaN(currentMultiplier) ? currentMultiplier : 1.0).toFixed(2)}x
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Current Multiplier
          </div>
          <div className="space-y-1">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(potentialPayout)}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              Profit: {formatCurrency(potentialProfit)}
            </div>
          </div>
        </div>

        <LoadingButton
          onClick={handleCashOut}
          loading={isCashingOut}
          loadingText="Cashing Out..."
          variant="primary"
          size="large"
          className="w-full bg-green-600 hover:bg-green-700 focus:ring-green-500"
          disabled={isCashingOut}
        >
          Cash Out
        </LoadingButton>
      </div>
    </div>
  );
};

export default CashOutButton;