import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@components/common/Button';
import { useGameStore } from '@store/gameStore';
import { gameService } from '@services/gameService';
import { useNotification } from '@hooks/useNotification';
import { useScreenReaderAnnouncement } from '@hooks/useFocusManagement';
import { useSound } from '@hooks/useSound';
import { formatCurrencyForScreenReader, formatMultiplierForScreenReader } from '@utils/accessibility';

/**
 * CashOutButton Component
 * Prominent button for cashing out bets with payout display
 * Requirements: 2.4.1, 2.4.2
 */
interface CashOutButtonProps {
  /**
   * Optional className for custom styling
   */
  className?: string;
  /**
   * Callback when cash out is successful
   */
  onCashOut?: (multiplier: number, payout: number) => void;
}

export const CashOutButton: React.FC<CashOutButtonProps> = ({ className = '', onCashOut }) => {
  const { roundState, playerBet, currentMultiplier } = useGameStore();
  const { showSuccess, showError } = useNotification();
  const { announce } = useScreenReaderAnnouncement();
  const { playSound } = useSound();

  const [isCashingOut, setIsCashingOut] = useState(false);

  /**
   * Format currency in centavos to reais
   */
  const formatCurrency = useCallback((centavos: number): string => {
    const reais = (centavos / 100).toFixed(2);
    const formatted = parseFloat(reais).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `R$ ${formatted}`;
  }, []);

  /**
   * Calculate potential payout
   */
  const potentialPayout = useMemo(() => {
    if (!playerBet || playerBet.state !== 'ACTIVE') return 0;
    return Math.floor(playerBet.amount * currentMultiplier);
  }, [playerBet, currentMultiplier]);

  /**
   * Check if cash out is available
   */
  const canCashOut = useMemo(() => {
    return (
      roundState === 'RUNNING' &&
      playerBet &&
      playerBet.state === 'ACTIVE' &&
      !isCashingOut
    );
  }, [roundState, playerBet, isCashingOut]);

  /**
   * Announce payout updates to screen readers at significant intervals
   */
  useEffect(() => {
    if (canCashOut && potentialPayout > 0) {
      const payoutInReais = potentialPayout / 100;
      const roundedPayout = Math.floor(payoutInReais);
      
      // Announce at significant payout milestones
      const milestones = [100, 500, 1000, 5000, 10000];
      const milestone = milestones.find(m => 
        roundedPayout >= m && roundedPayout < m + 10
      );
      
      if (milestone) {
        announce(
          `Potential payout reached ${formatCurrencyForScreenReader(potentialPayout)}`, 
          'polite'
        );
      }
    }
  }, [potentialPayout, canCashOut, announce]);

  /**
   * Handle cash out
   */
  const handleCashOut = useCallback(async () => {
    if (!canCashOut || !playerBet) return;

    setIsCashingOut(true);

    try {
      const response = await gameService.cashOut();
      
      if (response.success) {
        const { multiplier, payout } = response;
        
        // Play cash out sound
        await playSound('cash-out');
        
        // Show success notification
        showSuccess(`Cashed out at ${multiplier.toFixed(2)}x for ${formatCurrency(payout)}`);

        // Call callback
        onCashOut?.(multiplier, payout);
      } else {
        throw new Error(response.message || 'Failed to cash out');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to cash out');
    } finally {
      setIsCashingOut(false);
    }
  }, [canCashOut, playerBet, formatCurrency, showSuccess, showError, onCashOut, playSound]);

  /**
   * Get button text based on state
   */
  const getButtonText = useCallback(() => {
    if (isCashingOut) {
      return 'Cashing Out...';
    }
    
    if (potentialPayout > 0) {
      return `CASH OUT: ${formatCurrency(potentialPayout)}`;
    }
    
    return 'CASH OUT';
  }, [isCashingOut, potentialPayout, formatCurrency]);

  /**
   * Get disabled reason
   */
  const getDisabledReason = useCallback(() => {
    if (roundState !== 'RUNNING') {
      return 'Round not active';
    }
    if (!playerBet) {
      return 'No active bet';
    }
    if (playerBet.state !== 'ACTIVE') {
      return 'Bet not active';
    }
    return '';
  }, [roundState, playerBet]);

  // Don't render if no active bet
  if (!playerBet || playerBet.state !== 'ACTIVE') {
    return null;
  }

  return (
    <section 
      className={`flex flex-col items-center gap-2 ${className}`}
      role="region"
      aria-labelledby="cashout-heading"
    >
      <h3 id="cashout-heading" className="sr-only">
        Cash Out Controls
      </h3>

      {/* Potential Payout Display */}
      <div className="text-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Potential Payout
        </div>
        <div 
          className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono"
          aria-label={`Potential payout: ${formatCurrencyForScreenReader(potentialPayout)}`}
          role="status"
          aria-live="polite"
        >
          {formatCurrency(potentialPayout)}
        </div>
        <div 
          className="text-sm text-gray-500 dark:text-gray-500"
          aria-label={`At current multiplier of ${formatMultiplierForScreenReader(currentMultiplier)}`}
        >
          at {currentMultiplier.toFixed(2)}x
        </div>
      </div>

      {/* Cash Out Button */}
      <Button
        variant="success"
        size="large"
        disabled={!canCashOut}
        loading={isCashingOut}
        onClick={handleCashOut}
        className={`
          min-h-[60px] px-8 py-4 text-xl font-bold
          ${canCashOut ? 'animate-cash-out-pulse bg-green-500 hover:bg-green-600 transform hover:scale-105' : ''}
          transition-all duration-200 shadow-lg hover:shadow-xl
        `}
        aria-label={
          canCashOut 
            ? `Cash out bet for ${formatCurrencyForScreenReader(potentialPayout)} at ${formatMultiplierForScreenReader(currentMultiplier)} multiplier`
            : getDisabledReason()
        }
        aria-describedby="cashout-description"
      >
        {getButtonText()}
      </Button>

      <div id="cashout-description" className="sr-only">
        {canCashOut 
          ? `Press to cash out your bet of ${formatCurrencyForScreenReader(playerBet?.amount || 0)} for a payout of ${formatCurrencyForScreenReader(potentialPayout)}`
          : getDisabledReason()
        }
      </div>

      {/* Status Message */}
      {!canCashOut && getDisabledReason() && (
        <div 
          className="text-sm text-gray-500 dark:text-gray-400 text-center"
          role="status"
          aria-live="polite"
        >
          {getDisabledReason()}
        </div>
      )}

      {/* Bet Info */}
      <div 
        className="text-xs text-gray-500 dark:text-gray-400 text-center"
        aria-label={`Original bet amount: ${formatCurrencyForScreenReader(playerBet?.amount || 0)}`}
      >
        Bet: {formatCurrency(playerBet.amount)}
      </div>

      {/* Screen reader only live updates */}
      <div className="sr-only" aria-live="assertive">
        {isCashingOut && 'Processing cash out request...'}
      </div>
    </section>
  );
};

export default CashOutButton;