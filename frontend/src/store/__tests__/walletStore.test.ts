import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWalletStore } from '../walletStore';

/**
 * WalletStore Unit Tests
 * Requirement 2.1.2: Display current user's wallet balance
 * Validates: Requirements 2.1.2, 2.3.5, 2.4.4
 */
describe('WalletStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useWalletStore.setState({
      balance: 0,
      lastBetAmount: 0,
    });
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useWalletStore.getState();
      expect(state.balance).toBe(0);
      expect(state.lastBetAmount).toBe(0);
    });

    it('should have setBalance action', () => {
      const state = useWalletStore.getState();
      expect(typeof state.setBalance).toBe('function');
    });

    it('should have setLastBetAmount action', () => {
      const state = useWalletStore.getState();
      expect(typeof state.setLastBetAmount).toBe('function');
    });

    it('should have updateBalance action', () => {
      const state = useWalletStore.getState();
      expect(typeof state.updateBalance).toBe('function');
    });
  });

  describe('SetBalance Action', () => {
    it('should set balance to specified value', () => {
      useWalletStore.getState().setBalance(50000);
      expect(useWalletStore.getState().balance).toBe(50000);
    });

    it('should update balance when called multiple times', () => {
      useWalletStore.getState().setBalance(50000);
      expect(useWalletStore.getState().balance).toBe(50000);

      useWalletStore.getState().setBalance(100000);
      expect(useWalletStore.getState().balance).toBe(100000);

      useWalletStore.getState().setBalance(25000);
      expect(useWalletStore.getState().balance).toBe(25000);
    });

    it('should handle zero balance', () => {
      useWalletStore.getState().setBalance(50000);
      useWalletStore.getState().setBalance(0);
      expect(useWalletStore.getState().balance).toBe(0);
    });

    it('should handle large balance values', () => {
      const largeBalance = 999999999;
      useWalletStore.getState().setBalance(largeBalance);
      expect(useWalletStore.getState().balance).toBe(largeBalance);
    });

    it('should handle minimum bet amount (100 centavos)', () => {
      useWalletStore.getState().setBalance(100);
      expect(useWalletStore.getState().balance).toBe(100);
    });

    it('should handle maximum bet amount (100000 centavos)', () => {
      useWalletStore.getState().setBalance(100000);
      expect(useWalletStore.getState().balance).toBe(100000);
    });

    it('should not affect lastBetAmount', () => {
      useWalletStore.getState().setLastBetAmount(5000);
      useWalletStore.getState().setBalance(50000);

      expect(useWalletStore.getState().balance).toBe(50000);
      expect(useWalletStore.getState().lastBetAmount).toBe(5000);
    });
  });

  describe('SetLastBetAmount Action', () => {
    it('should set last bet amount to specified value', () => {
      useWalletStore.getState().setLastBetAmount(10000);
      expect(useWalletStore.getState().lastBetAmount).toBe(10000);
    });

    it('should update last bet amount when called multiple times', () => {
      useWalletStore.getState().setLastBetAmount(10000);
      expect(useWalletStore.getState().lastBetAmount).toBe(10000);

      useWalletStore.getState().setLastBetAmount(20000);
      expect(useWalletStore.getState().lastBetAmount).toBe(20000);

      useWalletStore.getState().setLastBetAmount(5000);
      expect(useWalletStore.getState().lastBetAmount).toBe(5000);
    });

    it('should handle zero last bet amount', () => {
      useWalletStore.getState().setLastBetAmount(10000);
      useWalletStore.getState().setLastBetAmount(0);
      expect(useWalletStore.getState().lastBetAmount).toBe(0);
    });

    it('should handle minimum bet amount (100 centavos)', () => {
      useWalletStore.getState().setLastBetAmount(100);
      expect(useWalletStore.getState().lastBetAmount).toBe(100);
    });

    it('should handle maximum bet amount (100000 centavos)', () => {
      useWalletStore.getState().setLastBetAmount(100000);
      expect(useWalletStore.getState().lastBetAmount).toBe(100000);
    });

    it('should not affect balance', () => {
      useWalletStore.getState().setBalance(50000);
      useWalletStore.getState().setLastBetAmount(10000);

      expect(useWalletStore.getState().balance).toBe(50000);
      expect(useWalletStore.getState().lastBetAmount).toBe(10000);
    });
  });

  describe('UpdateBalance Action', () => {
    it('should increase balance with positive delta', () => {
      useWalletStore.getState().setBalance(50000);
      useWalletStore.getState().updateBalance(10000);
      expect(useWalletStore.getState().balance).toBe(60000);
    });

    it('should decrease balance with negative delta', () => {
      useWalletStore.getState().setBalance(50000);
      useWalletStore.getState().updateBalance(-10000);
      expect(useWalletStore.getState().balance).toBe(40000);
    });

    it('should handle zero delta', () => {
      useWalletStore.getState().setBalance(50000);
      useWalletStore.getState().updateBalance(0);
      expect(useWalletStore.getState().balance).toBe(50000);
    });

    it('should not allow balance to go below zero', () => {
      useWalletStore.getState().setBalance(50000);
      useWalletStore.getState().updateBalance(-60000);
      expect(useWalletStore.getState().balance).toBe(0);
    });

    it('should handle multiple sequential updates', () => {
      useWalletStore.getState().setBalance(50000);

      useWalletStore.getState().updateBalance(10000);
      expect(useWalletStore.getState().balance).toBe(60000);

      useWalletStore.getState().updateBalance(-5000);
      expect(useWalletStore.getState().balance).toBe(55000);

      useWalletStore.getState().updateBalance(25000);
      expect(useWalletStore.getState().balance).toBe(80000);
    });

    it('should handle large positive delta', () => {
      useWalletStore.getState().setBalance(50000);
      useWalletStore.getState().updateBalance(999999999);
      expect(useWalletStore.getState().balance).toBe(50000 + 999999999);
    });

    it('should handle large negative delta', () => {
      useWalletStore.getState().setBalance(999999999);
      useWalletStore.getState().updateBalance(-999999998);
      expect(useWalletStore.getState().balance).toBe(1);
    });

    it('should not affect lastBetAmount', () => {
      useWalletStore.getState().setBalance(50000);
      useWalletStore.getState().setLastBetAmount(5000);

      useWalletStore.getState().updateBalance(10000);

      expect(useWalletStore.getState().balance).toBe(60000);
      expect(useWalletStore.getState().lastBetAmount).toBe(5000);
    });
  });

  describe('State Immutability', () => {
    it('should not mutate state directly', () => {
      const state1 = useWalletStore.getState();
      useWalletStore.getState().setBalance(50000);
      const state2 = useWalletStore.getState();

      expect(state1).not.toBe(state2);
    });

    it('should create new state object on updateBalance', () => {
      const state1 = useWalletStore.getState();
      useWalletStore.getState().updateBalance(10000);
      const state2 = useWalletStore.getState();

      expect(state1).not.toBe(state2);
    });
  });

  describe('Realistic Betting Scenarios', () => {
    it('should handle a complete bet cycle: place bet -> cash out', () => {
      // Initial balance
      useWalletStore.getState().setBalance(100000);
      expect(useWalletStore.getState().balance).toBe(100000);

      // Place bet (deduct from balance)
      const betAmount = 10000;
      useWalletStore.getState().setLastBetAmount(betAmount);
      useWalletStore.getState().updateBalance(-betAmount);
      expect(useWalletStore.getState().balance).toBe(90000);

      // Cash out with 2x multiplier (add payout to balance)
      const payout = betAmount * 2;
      useWalletStore.getState().updateBalance(payout);
      expect(useWalletStore.getState().balance).toBe(110000);
    });

    it('should handle a complete bet cycle: place bet -> lose', () => {
      // Initial balance
      useWalletStore.getState().setBalance(100000);
      expect(useWalletStore.getState().balance).toBe(100000);

      // Place bet (deduct from balance)
      const betAmount = 10000;
      useWalletStore.getState().setLastBetAmount(betAmount);
      useWalletStore.getState().updateBalance(-betAmount);
      expect(useWalletStore.getState().balance).toBe(90000);

      // Lose bet (no payout)
      // Balance stays at 90000
      expect(useWalletStore.getState().balance).toBe(90000);
    });

    it('should handle multiple consecutive bets', () => {
      useWalletStore.getState().setBalance(100000);

      // Bet 1: Place 10000, win 2x
      useWalletStore.getState().setLastBetAmount(10000);
      useWalletStore.getState().updateBalance(-10000);
      useWalletStore.getState().updateBalance(20000);
      expect(useWalletStore.getState().balance).toBe(110000);

      // Bet 2: Place 5000, lose
      useWalletStore.getState().setLastBetAmount(5000);
      useWalletStore.getState().updateBalance(-5000);
      expect(useWalletStore.getState().balance).toBe(105000);

      // Bet 3: Place 15000, win 1.5x
      useWalletStore.getState().setLastBetAmount(15000);
      useWalletStore.getState().updateBalance(-15000);
      useWalletStore.getState().updateBalance(22500);
      expect(useWalletStore.getState().balance).toBe(112500);
    });

    it('should handle quick bet buttons (1x, 2x, 5x, Max)', () => {
      useWalletStore.getState().setBalance(100000);
      useWalletStore.getState().setLastBetAmount(10000);

      // 1x button (repeat last bet)
      expect(useWalletStore.getState().lastBetAmount).toBe(10000);

      // 2x button (double last bet)
      useWalletStore.getState().setLastBetAmount(20000);
      expect(useWalletStore.getState().lastBetAmount).toBe(20000);

      // 5x button (5x last bet)
      useWalletStore.getState().setLastBetAmount(50000);
      expect(useWalletStore.getState().lastBetAmount).toBe(50000);

      // Max button (set to max allowed)
      useWalletStore.getState().setLastBetAmount(100000);
      expect(useWalletStore.getState().lastBetAmount).toBe(100000);
    });

    it('should prevent betting more than available balance', () => {
      useWalletStore.getState().setBalance(50000);

      // Try to place bet larger than balance
      const betAmount = 60000;
      useWalletStore.getState().setLastBetAmount(betAmount);

      // Balance should not change if bet is not placed
      expect(useWalletStore.getState().balance).toBe(50000);
    });

    it('should handle edge case: balance exactly equals bet amount', () => {
      useWalletStore.getState().setBalance(10000);
      useWalletStore.getState().setLastBetAmount(10000);

      // Place all-in bet
      useWalletStore.getState().updateBalance(-10000);
      expect(useWalletStore.getState().balance).toBe(0);

      // Win 2x
      useWalletStore.getState().updateBalance(20000);
      expect(useWalletStore.getState().balance).toBe(20000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative balance being set to zero', () => {
      useWalletStore.getState().setBalance(50000);
      useWalletStore.getState().updateBalance(-100000);
      expect(useWalletStore.getState().balance).toBe(0);
    });

    it('should handle very small balance values', () => {
      useWalletStore.getState().setBalance(1);
      expect(useWalletStore.getState().balance).toBe(1);

      useWalletStore.getState().updateBalance(-1);
      expect(useWalletStore.getState().balance).toBe(0);
    });

    it('should handle fractional centavo amounts', () => {
      useWalletStore.getState().setBalance(10000.5);
      expect(useWalletStore.getState().balance).toBe(10000.5);

      useWalletStore.getState().updateBalance(5000.25);
      expect(useWalletStore.getState().balance).toBe(15000.75);
    });

    it('should handle rapid consecutive updates', () => {
      useWalletStore.getState().setBalance(100000);

      for (let i = 0; i < 100; i++) {
        useWalletStore.getState().updateBalance(-100);
      }

      expect(useWalletStore.getState().balance).toBe(90000);
    });
  });

  describe('Balance Validation Scenarios', () => {
    it('should validate minimum bet amount (100 centavos)', () => {
      useWalletStore.getState().setBalance(100);
      useWalletStore.getState().setLastBetAmount(100);

      // Should be able to place minimum bet
      expect(useWalletStore.getState().lastBetAmount).toBe(100);
      expect(useWalletStore.getState().balance).toBeGreaterThanOrEqual(100);
    });

    it('should validate maximum bet amount (100000 centavos)', () => {
      useWalletStore.getState().setBalance(100000);
      useWalletStore.getState().setLastBetAmount(100000);

      // Should be able to place maximum bet
      expect(useWalletStore.getState().lastBetAmount).toBe(100000);
      expect(useWalletStore.getState().balance).toBeGreaterThanOrEqual(100000);
    });

    it('should handle insufficient balance for bet', () => {
      useWalletStore.getState().setBalance(50000);
      useWalletStore.getState().setLastBetAmount(60000);

      // lastBetAmount can be set, but balance check should happen elsewhere
      expect(useWalletStore.getState().lastBetAmount).toBe(60000);
      expect(useWalletStore.getState().balance).toBeLessThan(60000);
    });
  });
});
