import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BetForm } from '../BetForm';
import { useGameStore } from '@store/gameStore';
import { useWalletStore } from '@store/walletStore';
import { useNotification } from '@hooks/useNotification';
import { gameService } from '@services/gameService';

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
const mockGameService = vi.mocked(gameService);

describe('BetForm', () => {
  const mockAddNotification = vi.fn();
  const mockShowSuccess = vi.fn();
  const mockShowError = vi.fn();
  const mockSetLastBetAmount = vi.fn();
  const mockOnBetPlaced = vi.fn();

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
      balance: 10000, // R$ 100.00
      lastBetAmount: 1000, // R$ 10.00
      setBalance: vi.fn(),
      setLastBetAmount: mockSetLastBetAmount,
      updateBalance: vi.fn(),
    });

    mockUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
      removeNotification: vi.fn(),
      notifications: [],
      showSuccess: mockShowSuccess,
      showError: mockShowError,
    });
  });

  it('renders bet form with all elements', () => {
    render(<BetForm />);

    expect(screen.getByText('Place Your Bet')).toBeInTheDocument();
    expect(screen.getByLabelText('Enter bet amount in reais')).toBeInTheDocument();
    expect(screen.getByText('Quick Bet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /place bet/i })).toBeInTheDocument();
    expect(screen.getByText('Balance: R$ 100,00')).toBeInTheDocument();
  });

  it('displays quick bet buttons with correct labels', () => {
    render(<BetForm />);

    expect(screen.getByRole('button', { name: /repeat last bet/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /double last bet/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /five times last bet/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /maximum bet/i })).toBeInTheDocument();
  });

  it('validates minimum bet amount', async () => {
    const user = userEvent.setup();
    render(<BetForm />);

    const input = screen.getByLabelText('Enter bet amount in reais');
    await user.type(input, '0,50'); // Below minimum

    expect(screen.getByText('Minimum bet is R$ 1,00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /place bet/i })).toBeDisabled();
  });

  it('validates maximum bet amount', async () => {
    const user = userEvent.setup();
    render(<BetForm />);

    const input = screen.getByLabelText('Enter bet amount in reais');
    await user.type(input, '1500,00'); // Above maximum

    expect(screen.getByText('Maximum bet is R$ 1.000,00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /place bet/i })).toBeDisabled();
  });

  it('validates insufficient balance', async () => {
    const user = userEvent.setup();
    
    // Mock insufficient balance
    mockUseWalletStore.mockReturnValue({
      balance: 500, // R$ 5.00
      lastBetAmount: 1000,
      setBalance: vi.fn(),
      setLastBetAmount: mockSetLastBetAmount,
      updateBalance: vi.fn(),
    });

    render(<BetForm />);

    const input = screen.getByLabelText('Enter bet amount in reais');
    await user.type(input, '10,00'); // More than balance

    expect(screen.getByText('Insufficient balance. You have R$ 5,00, but need R$ 10,00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /place bet/i })).toBeDisabled();
  });

  it('disables form during RUNNING phase', () => {
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

  it('handles quick bet buttons correctly', async () => {
    const user = userEvent.setup();
    render(<BetForm />);

    // Test 1x button
    await user.click(screen.getByRole('button', { name: /repeat last bet/i }));
    expect(screen.getByDisplayValue('10,00')).toBeInTheDocument();

    // Clear input
    const input = screen.getByLabelText('Enter bet amount in reais');
    await user.clear(input);

    // Test 2x button
    await user.click(screen.getByRole('button', { name: /double last bet/i }));
    expect(screen.getByDisplayValue('20,00')).toBeInTheDocument();

    // Clear input
    await user.clear(input);

    // Test 5x button
    await user.click(screen.getByRole('button', { name: /five times last bet/i }));
    expect(screen.getByDisplayValue('50,00')).toBeInTheDocument();

    // Clear input
    await user.clear(input);

    // Test Max button
    await user.click(screen.getByRole('button', { name: /maximum bet/i }));
    expect(screen.getByDisplayValue('100,00')).toBeInTheDocument(); // Balance is R$ 100.00
  });

  it('places bet successfully', async () => {
    const user = userEvent.setup();
    
    mockGameService.placeBet.mockResolvedValue({
      success: true,
      data: {
        id: 'bet-1',
        roundId: 'round-1',
        playerId: 'player-1',
        amount: 1000,
        state: 'ACTIVE',
        cashedOutAt: null,
        payout: null,
        createdAt: '2023-01-01T00:00:00Z',
      },
    });

    render(<BetForm onBetPlaced={mockOnBetPlaced} />);

    const input = screen.getByLabelText('Enter bet amount in reais');
    await user.type(input, '10,00');

    const submitButton = screen.getByRole('button', { name: /place bet/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockGameService.placeBet).toHaveBeenCalledWith(1000);
      expect(mockSetLastBetAmount).toHaveBeenCalledWith(1000);
      expect(mockShowSuccess).toHaveBeenCalledWith('Bet placed: R$ 10,00');
      expect(mockOnBetPlaced).toHaveBeenCalledWith(1000);
    });

    // Input should be cleared after successful bet
    expect(input).toHaveValue('');
  });

  it('handles bet placement error', async () => {
    const user = userEvent.setup();
    
    mockGameService.placeBet.mockRejectedValue(new Error('Insufficient balance'));

    render(<BetForm />);

    const input = screen.getByLabelText('Enter bet amount in reais');
    await user.type(input, '10,00');

    const submitButton = screen.getByRole('button', { name: /place bet/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('Insufficient balance');
    });
  });

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

  it('disables quick bet buttons when no last bet amount', () => {
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

  it('shows loading state during bet placement', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed response
    mockGameService.placeBet.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: {
          id: 'bet-1',
          roundId: 'round-1',
          playerId: 'player-1',
          amount: 1000,
          state: 'ACTIVE',
          cashedOutAt: null,
          payout: null,
          createdAt: '2023-01-01T00:00:00Z',
        },
      }), 100))
    );

    render(<BetForm />);

    const input = screen.getByLabelText('Enter bet amount in reais');
    await user.type(input, '10,00');

    const submitButton = screen.getByRole('button', { name: /place bet/i });
    await user.click(submitButton);

    // Should show loading state
    expect(screen.getByText('Placing Bet...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText('Place Bet')).toBeInTheDocument();
    });
  });

  describe('API Integration - Currency Conversion', () => {
    it('sends correct centavos amount to API when user enters "10,00"', async () => {
      const user = userEvent.setup();
      
      mockGameService.placeBet.mockResolvedValue({
        success: true,
        data: {
          id: 'bet-1',
          roundId: 'round-1',
          playerId: 'player-1',
          amount: 1000,
          state: 'ACTIVE',
          cashedOutAt: null,
          payout: null,
          createdAt: '2023-01-01T00:00:00Z',
        },
      });

      render(<BetForm />);

      const input = screen.getByLabelText('Enter bet amount in reais');
      await user.type(input, '10,00');

      const submitButton = screen.getByRole('button', { name: /place bet/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Verify API receives 1000 centavos (not 10)
        expect(mockGameService.placeBet).toHaveBeenCalledWith(1000);
      });
    });

    it('sends correct centavos amount to API when user enters "50,00"', async () => {
      const user = userEvent.setup();
      
      mockGameService.placeBet.mockResolvedValue({
        success: true,
        data: {
          id: 'bet-1',
          roundId: 'round-1',
          playerId: 'player-1',
          amount: 5000,
          state: 'ACTIVE',
          cashedOutAt: null,
          payout: null,
          createdAt: '2023-01-01T00:00:00Z',
        },
      });

      render(<BetForm />);

      const input = screen.getByLabelText('Enter bet amount in reais');
      await user.type(input, '50,00');

      const submitButton = screen.getByRole('button', { name: /place bet/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Verify API receives 5000 centavos (not 50)
        expect(mockGameService.placeBet).toHaveBeenCalledWith(5000);
      });
    });

    it('sends correct centavos amount to API when user enters "100,00"', async () => {
      const user = userEvent.setup();
      
      mockGameService.placeBet.mockResolvedValue({
        success: true,
        data: {
          id: 'bet-1',
          roundId: 'round-1',
          playerId: 'player-1',
          amount: 10000,
          state: 'ACTIVE',
          cashedOutAt: null,
          payout: null,
          createdAt: '2023-01-01T00:00:00Z',
        },
      });

      render(<BetForm />);

      const input = screen.getByLabelText('Enter bet amount in reais');
      await user.type(input, '100,00');

      const submitButton = screen.getByRole('button', { name: /place bet/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Verify API receives 10000 centavos (not 100)
        expect(mockGameService.placeBet).toHaveBeenCalledWith(10000);
      });
    });

    it('sends correct centavos amount to API when user enters "1,00" (minimum bet)', async () => {
      const user = userEvent.setup();
      
      mockGameService.placeBet.mockResolvedValue({
        success: true,
        data: {
          id: 'bet-1',
          roundId: 'round-1',
          playerId: 'player-1',
          amount: 100,
          state: 'ACTIVE',
          cashedOutAt: null,
          payout: null,
          createdAt: '2023-01-01T00:00:00Z',
        },
      });

      render(<BetForm />);

      const input = screen.getByLabelText('Enter bet amount in reais');
      await user.type(input, '1,00');

      const submitButton = screen.getByRole('button', { name: /place bet/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Verify API receives 100 centavos (not 1)
        expect(mockGameService.placeBet).toHaveBeenCalledWith(100);
      });
    });

    it('sends correct centavos amount to API with decimal values', async () => {
      const user = userEvent.setup();
      
      mockGameService.placeBet.mockResolvedValue({
        success: true,
        data: {
          id: 'bet-1',
          roundId: 'round-1',
          playerId: 'player-1',
          amount: 1550,
          state: 'ACTIVE',
          cashedOutAt: null,
          payout: null,
          createdAt: '2023-01-01T00:00:00Z',
        },
      });

      render(<BetForm />);

      const input = screen.getByLabelText('Enter bet amount in reais');
      await user.type(input, '15,50');

      const submitButton = screen.getByRole('button', { name: /place bet/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Verify API receives 1550 centavos (not 15.5)
        expect(mockGameService.placeBet).toHaveBeenCalledWith(1550);
      });
    });

    it('bet placement succeeds with correct centavos amounts', async () => {
      const user = userEvent.setup();
      
      mockGameService.placeBet.mockResolvedValue({
        success: true,
        data: {
          id: 'bet-1',
          roundId: 'round-1',
          playerId: 'player-1',
          amount: 1000,
          state: 'ACTIVE',
          cashedOutAt: null,
          payout: null,
          createdAt: '2023-01-01T00:00:00Z',
        },
      });

      render(<BetForm onBetPlaced={mockOnBetPlaced} />);

      const input = screen.getByLabelText('Enter bet amount in reais');
      await user.type(input, '10,00');

      const submitButton = screen.getByRole('button', { name: /place bet/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Verify API call was successful
        expect(mockGameService.placeBet).toHaveBeenCalledWith(1000);
        // Verify success notification
        expect(mockShowSuccess).toHaveBeenCalledWith('Bet placed: R$ 10,00');
        // Verify callback was called with centavos
        expect(mockOnBetPlaced).toHaveBeenCalledWith(1000);
        // Verify last bet amount was updated with centavos
        expect(mockSetLastBetAmount).toHaveBeenCalledWith(1000);
      });
    });
  });
});
