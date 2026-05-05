import { useCallback, useEffect, useState } from 'react';
import { useWalletStore } from '@store/walletStore';
import { walletService } from '@services/walletService';
import { useUIStore } from '@store/uiStore';

/**
 * useWallet Hook: Manages wallet and balance logic
 * Requirement 2.1.2: Display wallet balance
 */
export const useWallet = () => {
  const { balance, lastBetAmount, setBalance, setLastBetAmount, updateBalance } = useWalletStore();
  const { addNotification } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch wallet balance on mount
   */
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setIsLoading(true);
        console.log('[useWallet] Fetching balance from API...');
        const amount = await walletService.getBalanceAmount();
        console.log('[useWallet] Balance fetched from API:', amount);
        console.log('[useWallet] Setting balance in store...');
        setBalance(amount);
        console.log('[useWallet] Balance set in store, current balance:', amount);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wallet balance';
        console.error('[useWallet] Error fetching balance:', err);
        setError(errorMessage);
        addNotification({
          type: 'error',
          message: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [setBalance, addNotification]);

  /**
   * Refresh wallet balance
   */
  const refreshBalance = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const amount = await walletService.getBalanceAmount();
      setBalance(amount);

      return amount;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh wallet balance';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setBalance, addNotification]);

  /**
   * Update balance after bet placement
   */
  const deductBetAmount = useCallback(
    (amount: number) => {
      updateBalance(-amount);
      setLastBetAmount(amount);
    },
    [updateBalance, setLastBetAmount]
  );

  /**
   * Update balance after cash out
   */
  const addPayout = useCallback(
    (payout: number) => {
      updateBalance(payout);
    },
    [updateBalance]
  );

  /**
   * Format balance for display
   */
  const formatBalance = useCallback((amount: number = balance): string => {
    const reais = Math.floor(amount / 100);
    const centavos = amount % 100;
    return `R$ ${reais.toLocaleString('pt-BR')},${centavos.toString().padStart(2, '0')}`;
  }, [balance]);

  /**
   * Validate bet amount
   */
  const validateBetAmount = useCallback(
    (amount: number): { valid: boolean; error?: string } => {
      const MIN_BET = 100; // R$ 1.00
      const MAX_BET = 100000; // R$ 1.000,00

      if (amount < MIN_BET) {
        return {
          valid: false,
          error: `Minimum bet is R$ ${(MIN_BET / 100).toFixed(2)}`,
        };
      }

      if (amount > MAX_BET) {
        return {
          valid: false,
          error: `Maximum bet is R$ ${(MAX_BET / 100).toFixed(2)}`,
        };
      }

      if (amount > balance) {
        return {
          valid: false,
          error: `Insufficient balance. You have R$ ${formatBalance(balance)}, but need R$ ${formatBalance(amount)}`,
        };
      }

      return { valid: true };
    },
    [balance, formatBalance]
  );

  /**
   * Calculate quick bet amounts
   */
  const calculateQuickBet = useCallback(
    (multiplier: number): number => {
      const amount = Math.floor(lastBetAmount * multiplier);
      return Math.min(amount, balance); // Don't exceed balance
    },
    [lastBetAmount, balance]
  );

  /**
   * Get maximum bet amount
   */
  const getMaxBetAmount = useCallback((): number => {
    const MAX_BET = 100000; // R$ 1.000,00
    return Math.min(balance, MAX_BET);
  }, [balance]);

  return {
    // State
    balance,
    lastBetAmount,
    isLoading,
    error,

    // Actions
    refreshBalance,
    deductBetAmount,
    addPayout,
    formatBalance,
    validateBetAmount,
    calculateQuickBet,
    getMaxBetAmount,
  };
};
