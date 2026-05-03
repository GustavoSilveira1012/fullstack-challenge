import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWallet } from '../useWallet';
import { useWalletStore } from '@store/walletStore';
import * as walletService from '@services/walletService';

/**
 * useWallet Hook Unit Tests
 * Requirement 2.1.2: Display wallet balance
 * Validates: Requirements 2.1.2
 */
describe('useWallet Hook', () => {
  beforeEach(() => {
    useWalletStore.setState({
      balance: 0,
      lastBetAmount: 0,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial wallet state', () => {
      const { result } = renderHook(() => useWallet());

      expect(result.current.balance).toBe(0);
      expect(result.current.lastBetAmount).toBe(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should have all required actions', () => {
      const { result } = renderHook(() => useWallet());

      expect(typeof result.current.refreshBalance).toBe('function');
      expect(typeof result.current.deductBetAmount).toBe('function');
      expect(typeof result.current.addPayout).toBe('function');
      expect(typeof result.current.formatBalance).toBe('function');
      expect(typeof result.current.validateBetAmount).toBe('function');
      expect(typeof result.current.calculateQuickBet).toBe('function');
      expect(typeof result.current.getMaxBetAmount).toBe('function');
    });
  });

  describe('Fetch Balance', () => {
    it('should fetch balance on mount', async () => {
      const getBalanceSpy = vi.spyOn(walletService.walletService, 'getBalanceAmount').mockResolvedValue(50000);

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.balance).toBe(50000);
      });

      expect(getBalanceSpy).toHaveBeenCalled();
    });

    it('should handle fetch errors', async () => {
      vi.spyOn(walletService.walletService, 'getBalanceAmount').mockRejectedValue(
        new Error('Failed to fetch balance')
      );

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch balance');
      });
    });
  });

  describe('Refresh Balance', () => {
    it('should refresh balance', async () => {
      const getBalanceSpy = vi.spyOn(walletService.walletService, 'getBalanceAmount').mockResolvedValue(75000);

      const { result } = renderHook(() => useWallet());

      let newBalance;
      await act(async () => {
        newBalance = await result.current.refreshBalance();
      });

      expect(getBalanceSpy).toHaveBeenCalled();
      expect(newBalance).toBe(75000);
      expect(result.current.balance).toBe(75000);
    });

    it('should handle refresh errors', async () => {
      vi.spyOn(walletService.walletService, 'getBalanceAmount').mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useWallet());

      await act(async () => {
        try {
          await result.current.refreshBalance();
        } catch (err) {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Network error');
    });
  });

  describe('Deduct Bet Amount', () => {
    it('should deduct bet amount from balance', () => {
      useWalletStore.setState({ balance: 50000 });

      const { result } = renderHook(() => useWallet());

      act(() => {
        result.current.deductBetAmount(10000);
      });

      expect(result.current.balance).toBe(40000);
      expect(result.current.lastBetAmount).toBe(10000);
    });

    it('should not allow balance to go below zero', () => {
      useWalletStore.setState({ balance: 5000 });

      const { result } = renderHook(() => useWallet());

      act(() => {
        result.current.deductBetAmount(10000);
      });

      expect(result.current.balance).toBe(0);
    });
  });

  describe('Add Payout', () => {
    it('should add payout to balance', () => {
      useWalletStore.setState({ balance: 40000 });

      const { result } = renderHook(() => useWallet());

      act(() => {
        result.current.addPayout(25000);
      });

      expect(result.current.balance).toBe(65000);
    });

    it('should handle multiple payouts', () => {
      useWalletStore.setState({ balance: 50000 });

      const { result } = renderHook(() => useWallet());

      act(() => {
        result.current.addPayout(10000);
        result.current.addPayout(15000);
        result.current.addPayout(5000);
      });

      expect(result.current.balance).toBe(80000);
    });
  });

  describe('Format Balance', () => {
    it('should format balance correctly', () => {
      const { result } = renderHook(() => useWallet());

      expect(result.current.formatBalance(100)).toBe('R$ 1,00');
      expect(result.current.formatBalance(1000)).toBe('R$ 10,00');
      expect(result.current.formatBalance(100000)).toBe('R$ 1.000,00');
      expect(result.current.formatBalance(1234567)).toBe('R$ 12.345,67');
    });

    it('should format current balance when no amount provided', () => {
      useWalletStore.setState({ balance: 50000 });

      const { result } = renderHook(() => useWallet());

      expect(result.current.formatBalance()).toBe('R$ 500,00');
    });

    it('should handle zero balance', () => {
      const { result } = renderHook(() => useWallet());

      expect(result.current.formatBalance(0)).toBe('R$ 0,00');
    });

    it('should handle large amounts', () => {
      const { result } = renderHook(() => useWallet());

      expect(result.current.formatBalance(999999999)).toBe('R$ 9.999.999,99');
    });
  });

  describe('Validate Bet Amount', () => {
    it('should validate minimum bet', () => {
      useWalletStore.setState({ balance: 50000 });

      const { result } = renderHook(() => useWallet());

      const validation = result.current.validateBetAmount(50);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Minimum bet');
    });

    it('should validate maximum bet', () => {
      useWalletStore.setState({ balance: 200000 });

      const { result } = renderHook(() => useWallet());

      const validation = result.current.validateBetAmount(150000);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Maximum bet');
    });

    it('should validate insufficient balance', () => {
      useWalletStore.setState({ balance: 5000 });

      const { result } = renderHook(() => useWallet());

      const validation = result.current.validateBetAmount(10000);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Insufficient balance');
    });

    it('should validate valid bet amounts', () => {
      useWalletStore.setState({ balance: 50000 });

      const { result } = renderHook(() => useWallet());

      const validAmounts = [100, 1000, 10000, 50000, 100000];

      validAmounts.forEach((amount) => {
        const validation = result.current.validateBetAmount(amount);
        expect(validation.valid).toBe(true);
      });
    });

    it('should validate edge cases', () => {
      useWalletStore.setState({ balance: 100000 });

      const { result } = renderHook(() => useWallet());

      // Minimum valid bet
      expect(result.current.validateBetAmount(100).valid).toBe(true);

      // Maximum valid bet
      expect(result.current.validateBetAmount(100000).valid).toBe(true);

      // Just below minimum
      expect(result.current.validateBetAmount(99).valid).toBe(false);

      // Just above maximum
      expect(result.current.validateBetAmount(100001).valid).toBe(false);
    });
  });

  describe('Calculate Quick Bet', () => {
    it('should calculate 1x quick bet', () => {
      useWalletStore.setState({ lastBetAmount: 10000, balance: 50000 });

      const { result } = renderHook(() => useWallet());

      expect(result.current.calculateQuickBet(1)).toBe(10000);
    });

    it('should calculate 2x quick bet', () => {
      useWalletStore.setState({ lastBetAmount: 10000, balance: 50000 });

      const { result } = renderHook(() => useWallet());

      expect(result.current.calculateQuickBet(2)).toBe(20000);
    });

    it('should calculate 5x quick bet', () => {
      useWalletStore.setState({ lastBetAmount: 10000, balance: 50000 });

      const { result } = renderHook(() => useWallet());

      expect(result.current.calculateQuickBet(5)).toBe(50000);
    });

    it('should not exceed balance', () => {
      useWalletStore.setState({ lastBetAmount: 10000, balance: 15000 });

      const { result } = renderHook(() => useWallet());

      expect(result.current.calculateQuickBet(5)).toBe(15000);
    });

    it('should handle zero last bet amount', () => {
      useWalletStore.setState({ lastBetAmount: 0, balance: 50000 });

      const { result } = renderHook(() => useWallet());

      expect(result.current.calculateQuickBet(2)).toBe(0);
    });
  });

  describe('Get Max Bet Amount', () => {
    it('should return maximum allowed bet', () => {
      useWalletStore.setState({ balance: 200000 });

      const { result } = renderHook(() => useWallet());

      expect(result.current.getMaxBetAmount()).toBe(100000);
    });

    it('should return balance if less than maximum', () => {
      useWalletStore.setState({ balance: 50000 });

      const { result } = renderHook(() => useWallet());

      expect(result.current.getMaxBetAmount()).toBe(50000);
    });

    it('should return zero if balance is zero', () => {
      useWalletStore.setState({ balance: 0 });

      const { result } = renderHook(() => useWallet());

      expect(result.current.getMaxBetAmount()).toBe(0);
    });
  });

  describe('Balance Operations Sequence', () => {
    it('should handle bet placement and cash out sequence', () => {
      useWalletStore.setState({ balance: 50000 });

      const { result } = renderHook(() => useWallet());

      // Place bet
      act(() => {
        result.current.deductBetAmount(10000);
      });
      expect(result.current.balance).toBe(40000);

      // Cash out with payout
      act(() => {
        result.current.addPayout(25000);
      });
      expect(result.current.balance).toBe(65000);
    });

    it('should handle multiple bets', () => {
      useWalletStore.setState({ balance: 100000 });

      const { result } = renderHook(() => useWallet());

      // First bet
      act(() => {
        result.current.deductBetAmount(10000);
      });
      expect(result.current.balance).toBe(90000);

      // Second bet
      act(() => {
        result.current.deductBetAmount(20000);
      });
      expect(result.current.balance).toBe(70000);

      // First payout
      act(() => {
        result.current.addPayout(15000);
      });
      expect(result.current.balance).toBe(85000);
    });
  });

  describe('Error Handling', () => {
    it('should clear error on successful refresh', async () => {
      vi.spyOn(walletService.walletService, 'getBalanceAmount').mockRejectedValueOnce(
        new Error('First attempt failed')
      );

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.error).toBe('First attempt failed');
      });

      // Now succeed
      vi.spyOn(walletService.walletService, 'getBalanceAmount').mockResolvedValueOnce(50000);

      await act(async () => {
        await result.current.refreshBalance();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
