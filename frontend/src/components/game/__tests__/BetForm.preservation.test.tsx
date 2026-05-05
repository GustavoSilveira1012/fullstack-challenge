import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BetForm } from '../BetForm';
import { useGameStore } from '@store/gameStore';
import { useWalletStore } from '@store/walletStore';
import { useNotification } from '@hooks/useNotification';

/**
 * Preservation Tests for Task 1.5
 * 
 * These tests verify that existing functionality is preserved after the
 * currency conversion fix (parseCurrency now multiplies by 100).
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10
 */

// Mock dependencies
vi.mock('@store/gameStore');
vi.mock('@store/walletStore');
vi.mock('@hooks/useNotification');
vi.mock('@services/gameService');
vi.mock('@hooks/useSound', () => ({
  useSound: () => ({
    playSound: vi.fn(),
    initializeAudio: vi.fn(),
    soundEnabled: true,
    toggleSound: vi.fn(),
  }),
}));
vi.mock('@hooks/useErrorRecovery', () => ({
  useErrorRecovery: () => ({
    withRetry: vi.fn((fn) => fn()),
    executeWhenOnline: vi.fn((fn) => fn()),
    isOnline: true,
  }),
}));

const mockUseGameStore = vi.mocked(useGameStore);
const mockUseWalletStore = vi.mocked(useWalletStore);
const mockUseNotification = vi.mocked(useNotification);

describe('BetForm - Preservation Tests (Task 1.5)', () => {
  const mockSetLastBetAmount = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default store states
    mockUseGameStore.mockReturnValue({
      roundState: 'BETTING',
      playerBet: null,
      currentRound: null,
      currentMultiplier: 1.0,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    mockUseWalletStore.mockReturnValue({
      balance: 10000, // R$ 100.00 in centavos
      lastBetAmount: 1000, // R$ 10.00 in centavos
      setBalance: vi.fn(),
      setLastBetAmount: mockSetLastBetAmount,
      updateBalance: vi.fn(),
    });

    mockUseNotification.mockReturnValue({
      addNotification: vi.fn(),
      removeNotification: vi.fn(),
      notifications: [],
      showSuccess: vi.fn(),
      showError: vi.fn(),
    });
  });

  describe('Requirement 3.8: formatCurrency still converts centavos to reais for display', () => {
    it('displays balance in reais format (centavos / 100)', () => {
      render(<BetForm />);
      
      // Balance of 10000 centavos should display as R$ 100,00
      expect(screen.getByText(/Balance:/)).toBeInTheDocument();
      expect(screen.getByText(/R\$ 100,00/)).toBeInTheDocument();
    });

    it('displays balance correctly for different centavos values', () => {
      // Test with 5000 centavos (R$ 50.00)
      mockUseWalletStore.mockReturnValue({
        balance: 5000,
        lastBetAmount: 1000,
        setBalance: vi.fn(),
        setLastBetAmount: mockSetLastBetAmount,
        updateBalance: vi.fn(),
      });

      render(<BetForm />);
      expect(screen.getByText(/R\$ 50,00/)).toBeInTheDocument();
    });

    it('displays balance correctly for minimum value', () => {
      // Test with 100 centavos (R$ 1.00)
      mockUseWalletStore.mockReturnValue({
        balance: 100,
        lastBetAmount: 100,
        setBalance: vi.fn(),
        setLastBetAmount: mockSetLastBetAmount,
        updateBalance: vi.fn(),
      });

      render(<BetForm />);
      // Use more specific selector since "R$ 1,00" appears in multiple places
      expect(screen.getByLabelText(/Available balance: R\$ 1,00/)).toBeInTheDocument();
    });
  });

  describe('Requirement 3.7: Quick bet buttons still work correctly', () => {
    it('1x button populates bet amount correctly', async () => {
      const user = userEvent.setup();
      render(<BetForm />);

      // lastBetAmount is 1000 centavos (R$ 10.00)
      await user.click(screen.getByRole('button', { name: /repeat last bet/i }));
      
      // Should display as R$ 10,00 in the input
      expect(screen.getByDisplayValue('10,00')).toBeInTheDocument();
    });

    it('2x button populates bet amount correctly', async () => {
      const user = userEvent.setup();
      render(<BetForm />);

      // lastBetAmount is 1000 centavos, 2x = 2000 centavos (R$ 20.00)
      await user.click(screen.getByRole('button', { name: /double last bet/i }));
      
      // Should display as R$ 20,00 in the input
      expect(screen.getByDisplayValue('20,00')).toBeInTheDocument();
    });

    it('5x button populates bet amount correctly', async () => {
      const user = userEvent.setup();
      render(<BetForm />);

      // lastBetAmount is 1000 centavos, 5x = 5000 centavos (R$ 50.00)
      await user.click(screen.getByRole('button', { name: /five times last bet/i }));
      
      // Should display as R$ 50,00 in the input
      expect(screen.getByDisplayValue('50,00')).toBeInTheDocument();
    });

    it('Max button populates bet amount correctly', async () => {
      const user = userEvent.setup();
      render(<BetForm />);

      // balance is 10000 centavos (R$ 100.00)
      await user.click(screen.getByRole('button', { name: /maximum bet/i }));
      
      // Should display as R$ 100,00 in the input
      expect(screen.getByDisplayValue('100,00')).toBeInTheDocument();
    });

    it('quick bet buttons are disabled when no last bet amount', () => {
      mockUseWalletStore.mockReturnValue({
        balance: 10000,
        lastBetAmount: 0, // No last bet
        setBalance: vi.fn(),
        setLastBetAmount: mockSetLastBetAmount,
        updateBalance: vi.fn(),
      });

      render(<BetForm />);

      expect(screen.getByRole('button', { name: /repeat last bet/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /double last bet/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /five times last bet/i })).toBeDisabled();
    });
  });

  describe('Requirement 3.1, 3.2: Validation messages display correctly', () => {
    it('displays validation error for amount below minimum', async () => {
      const user = userEvent.setup();
      render(<BetForm />);

      const input = screen.getByLabelText('Enter bet amount in reais');
      await user.type(input, '0,50'); // Below minimum (50 centavos < 100 centavos)

      // Validation error should be displayed
      expect(screen.getByText(/Minimum bet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /place bet/i })).toBeDisabled();
    });

    it('displays validation error for amount above maximum', async () => {
      const user = userEvent.setup();
      render(<BetForm />);

      const input = screen.getByLabelText('Enter bet amount in reais');
      await user.type(input, '1500,00'); // Above maximum (150000 centavos > 100000 centavos)

      // Validation error should be displayed
      expect(screen.getByText(/Maximum bet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /place bet/i })).toBeDisabled();
    });

    it('displays validation error for insufficient balance', async () => {
      const user = userEvent.setup();
      
      // Mock insufficient balance
      mockUseWalletStore.mockReturnValue({
        balance: 500, // R$ 5.00 in centavos
        lastBetAmount: 1000,
        setBalance: vi.fn(),
        setLastBetAmount: mockSetLastBetAmount,
        updateBalance: vi.fn(),
      });

      render(<BetForm />);

      const input = screen.getByLabelText('Enter bet amount in reais');
      await user.type(input, '10,00'); // More than balance (1000 centavos > 500 centavos)

      // Validation error should be displayed
      expect(screen.getByText(/Insufficient balance/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /place bet/i })).toBeDisabled();
    });
  });

  describe('Requirement 3.5, 3.6: Form disabled states work correctly', () => {
    it('disables form when round state is not BETTING', () => {
      mockUseGameStore.mockReturnValue({
        roundState: 'RUNNING',
        playerBet: null,
        currentRound: null,
        currentMultiplier: 1.0,
        recentRounds: [],
        setCurrentRound: vi.fn(),
        setMultiplier: vi.fn(),
        setRoundState: vi.fn(),
        setPlayerBet: vi.fn(),
        addRecentRound: vi.fn(),
        reset: vi.fn(),
      });

      render(<BetForm />);

      expect(screen.getByLabelText('Enter bet amount in reais')).toBeDisabled();
      expect(screen.getByRole('button', { name: /betting is closed for this round/i })).toBeDisabled();
      expect(screen.getByText('Betting is closed for this round')).toBeInTheDocument();
    });

    it('disables form when player has active bet', () => {
      mockUseGameStore.mockReturnValue({
        roundState: 'BETTING',
        playerBet: {
          id: 'bet-1',
          roundId: 'round-1',
          playerId: 'player-1',
          amount: 1000,
          state: 'ACTIVE',
          cashedOutAt: null,
          payout: null,
          createdAt: '2023-01-01T00:00:00Z',
        },
        currentRound: null,
        currentMultiplier: 1.0,
        recentRounds: [],
        setCurrentRound: vi.fn(),
        setMultiplier: vi.fn(),
        setRoundState: vi.fn(),
        setPlayerBet: vi.fn(),
        addRecentRound: vi.fn(),
        reset: vi.fn(),
      });

      render(<BetForm />);

      expect(screen.getByLabelText('Enter bet amount in reais')).toBeDisabled();
      expect(screen.getByRole('button', { name: /you already have an active bet/i })).toBeDisabled();
      expect(screen.getByText('You already have an active bet')).toBeInTheDocument();
    });
  });

  describe('Requirement 3.4: Input sanitization still works correctly', () => {
    it('only allows numeric input with comma decimal separator', async () => {
      const user = userEvent.setup();
      render(<BetForm />);

      const input = screen.getByLabelText('Enter bet amount in reais');
      
      // Valid input
      await user.type(input, '12,34');
      expect(input).toHaveValue('12,34');

      await user.clear(input);

      // Invalid characters should be ignored
      await user.type(input, 'abc12,34def');
      expect(input).toHaveValue('12,34');
    });

    it('allows decimal point as alternative separator', async () => {
      const user = userEvent.setup();
      render(<BetForm />);

      const input = screen.getByLabelText('Enter bet amount in reais');
      
      await user.type(input, '12.34');
      expect(input).toHaveValue('12.34');
    });
  });

  describe('Summary: All preservation requirements verified', () => {
    it('verifies all key preservation requirements are met', () => {
      render(<BetForm />);

      // 3.8: formatCurrency converts centavos to reais
      expect(screen.getByText(/R\$ 100,00/)).toBeInTheDocument();

      // 3.7: Quick bet buttons are present
      expect(screen.getByRole('button', { name: /repeat last bet/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /double last bet/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /five times last bet/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /maximum bet/i })).toBeInTheDocument();

      // Balance display is correct
      expect(screen.getByText(/Balance:/)).toBeInTheDocument();

      // Form elements are present
      expect(screen.getByLabelText('Enter bet amount in reais')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /place bet/i })).toBeInTheDocument();
    });
  });
});
