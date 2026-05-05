import { useEffect, useCallback } from 'react';
import { useGameStore } from '@store/gameStore';
import { useWalletStore } from '@store/walletStore';
import { useNotification } from '@hooks/useNotification';
import { useSound } from '@hooks/useSound';

/**
 * useGameLogic Hook
 * Manages game state changes and automatic wallet updates
 */
export const useGameLogic = () => {
  const { roundState, playerBet, setPlayerBet, currentMultiplier } = useGameStore();
  const { updateBalance } = useWalletStore();
  const { showError, showWarning } = useNotification();
  const { playSound } = useSound();

  /**
   * Format currency for display (centavos to reais)
   */
  const formatCurrency = useCallback((centavos: number): string => {
    const validCentavos = typeof centavos === 'number' && !isNaN(centavos) ? centavos : 0;
    const reais = (validCentavos / 100).toFixed(2);
    const formatted = parseFloat(reais).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `R$ ${formatted}`;
  }, []);

  /**
   * Handle round crash - process bet results
   */
  const handleRoundCrash = useCallback(async (crashMultiplier: number) => {
    if (!playerBet || playerBet.state !== 'ACTIVE') return;

    console.log('[GameLogic] Processing round crash:', {
      crashMultiplier,
      playerBet,
      cashedOut: playerBet.cashedOutAt !== null
    });

    try {
      if (playerBet.cashedOutAt !== null) {
        // Player already cashed out - they won
        console.log('[GameLogic] Player already cashed out at:', playerBet.cashedOutAt);
        return;
      }

      // Player didn't cash out in time - they lost
      const lostAmount = playerBet.amount;

      // Update player bet state to LOST
      setPlayerBet({
        ...playerBet,
        state: 'LOST',
        payout: 0
      });

      // Deduct the bet amount from wallet (it was already deducted when bet was placed)
      // No need to deduct again, just show notification

      // Play crash sound
      await playSound('crash');

      // Show loss notification
      showWarning(
        `Round crashed at ${crashMultiplier.toFixed(2)}x! ` +
        `Lost: ${formatCurrency(lostAmount)}`
      );

      console.log('[GameLogic] Player lost bet:', {
        amount: lostAmount,
        crashMultiplier
      });

    } catch (error) {
      console.error('[GameLogic] Error processing round crash:', error);
      showError('Error processing round result');
    }
  }, [playerBet, setPlayerBet, playSound, showWarning, showError, formatCurrency]);

  /**
   * Handle round state changes
   */
  useEffect(() => {
    if (roundState === 'CRASHED' && playerBet && playerBet.state === 'ACTIVE') {
      // Round crashed, process the result
      handleRoundCrash(currentMultiplier);
    }
  }, [roundState, playerBet, currentMultiplier, handleRoundCrash]);

  /**
   * Handle new round start - reset player bet if previous round ended
   */
  useEffect(() => {
    if (roundState === 'BETTING' && playerBet && playerBet.state !== 'ACTIVE') {
      // New round started and previous bet is finished, clear it
      console.log('[GameLogic] New round started, clearing previous bet');
      setPlayerBet(null);
    }
  }, [roundState, playerBet, setPlayerBet]);

  return {
    formatCurrency,
    handleRoundCrash
  };
};