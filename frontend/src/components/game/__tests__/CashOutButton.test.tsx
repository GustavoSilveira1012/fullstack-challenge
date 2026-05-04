import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CashOutButton } from '../CashOutButton';
import { useGameStore } from '@store/gameStore';
import { useNotification } from '@hooks/useNotification';
import { gameService } from '@services/gameService';

// Mock dependencies
vi.mock('@store/gameStore');
vi.mock('@hooks/useNotification');
vi.mock('@services/gameService');

const mockUseGameStore = vi.mocked(useGameStore);
const mockUseNotification = vi.mocked(useNotification);
const mockGameService = vi.mocked(gameService);

describe('CashOutButton', () => {
  const mockAddNotification = vi.fn();
  const mockOnCashOut = vi.fn();

  const mockActiveBet = {
    id: 'bet-1',
    roundId: 'round-1',
    playerId: 'player-1',
    amount: 1000, // R$ 10.00
    state: 'ACTIVE' as const,
    cashedOutAt: null,
    payout: null,
    createdAt: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
      removeNotification: vi.fn(),
      notifications: [],
    });
  });

  it('does not render when no active bet', () => {
    mockUseGameStore.mockReturnValue({
      roundState: 'RUNNING',
      playerBet: null,
      currentMultiplier: 2.5,
      currentRound: null,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    const { container } = render(<CashOutButton />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render when bet is not active', () => {
    mockUseGameStore.mockReturnValue({
      roundState: 'RUNNING',
      playerBet: { ...mockActiveBet, state: 'WON' },
      currentMultiplier: 2.5,
      currentRound: null,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    const { container } = render(<CashOutButton />);
    expect(container.firstChild).toBeNull();
  });

  it('renders with correct potential payout calculation', () => {
    mockUseGameStore.mockReturnValue({
      roundState: 'RUNNING',
      playerBet: mockActiveBet,
      currentMultiplier: 2.5,
      currentRound: null,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    render(<CashOutButton />);

    // Potential payout should be 1000 * 2.5 = 2500 centavos = R$ 25.00
    expect(screen.getByText('R$ 25,00')).toBeInTheDocument();
    expect(screen.getByText('at 2.50x')).toBeInTheDocument();
    expect(screen.getByText('CASH OUT: R$ 25,00')).toBeInTheDocument();
    expect(screen.getByText('Bet: R$ 10,00')).toBeInTheDocument();
  });

  it('enables cash out button during RUNNING phase with active bet', () => {
    mockUseGameStore.mockReturnValue({
      roundState: 'RUNNING',
      playerBet: mockActiveBet,
      currentMultiplier: 1.5,
      currentRound: null,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    render(<CashOutButton />);

    const button = screen.getByRole('button', { name: /cash out bet for/i });
    expect(button).toBeEnabled();
    expect(button).toHaveClass('animate-pulse');
  });

  it('disables cash out button during BETTING phase', () => {
    mockUseGameStore.mockReturnValue({
      roundState: 'BETTING',
      playerBet: mockActiveBet,
      currentMultiplier: 1.0,
      currentRound: null,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    render(<CashOutButton />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Round not active')).toBeInTheDocument();
  });

  it('disables cash out button during CRASHED phase', () => {
    mockUseGameStore.mockReturnValue({
      roundState: 'CRASHED',
      playerBet: mockActiveBet,
      currentMultiplier: 2.5,
      currentRound: null,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    render(<CashOutButton />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Round not active')).toBeInTheDocument();
  });

  it('handles successful cash out', async () => {
    const user = userEvent.setup();
    
    mockUseGameStore.mockReturnValue({
      roundState: 'RUNNING',
      playerBet: mockActiveBet,
      currentMultiplier: 2.0,
      currentRound: null,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    mockGameService.cashOut.mockResolvedValue({
      success: true,
      data: {
        multiplier: 2.0,
        payout: 2000,
      },
    });

    render(<CashOutButton onCashOut={mockOnCashOut} />);

    const button = screen.getByRole('button', { name: /cash out bet for/i });
    await user.click(button);

    await waitFor(() => {
      expect(mockGameService.cashOut).toHaveBeenCalled();
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'success',
        message: 'Cashed out at 2.00x for R$ 20,00',
      });
      expect(mockOnCashOut).toHaveBeenCalledWith(2.0, 2000);
    });
  });

  it('handles cash out error', async () => {
    const user = userEvent.setup();
    
    mockUseGameStore.mockReturnValue({
      roundState: 'RUNNING',
      playerBet: mockActiveBet,
      currentMultiplier: 2.0,
      currentRound: null,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    mockGameService.cashOut.mockRejectedValue(new Error('Round already crashed'));

    render(<CashOutButton />);

    const button = screen.getByRole('button', { name: /cash out bet for/i });
    await user.click(button);

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Round already crashed',
      });
    });
  });

  it('shows loading state during cash out', async () => {
    const user = userEvent.setup();
    
    mockUseGameStore.mockReturnValue({
      roundState: 'RUNNING',
      playerBet: mockActiveBet,
      currentMultiplier: 2.0,
      currentRound: null,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    // Mock a delayed response
    mockGameService.cashOut.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: { multiplier: 2.0, payout: 2000 },
      }), 100))
    );

    render(<CashOutButton />);

    const button = screen.getByRole('button', { name: /cash out bet for/i });
    await user.click(button);

    // Should show loading state
    expect(screen.getByText('Cashing Out...')).toBeInTheDocument();
    expect(button).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText(/CASH OUT:/)).toBeInTheDocument();
    });
  });

  it('updates potential payout when multiplier changes', () => {
    const { rerender } = render(<CashOutButton />);

    // Initial state with 2.0x multiplier
    mockUseGameStore.mockReturnValue({
      roundState: 'RUNNING',
      playerBet: mockActiveBet,
      currentMultiplier: 2.0,
      currentRound: null,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    rerender(<CashOutButton />);
    expect(screen.getByText('R$ 20,00')).toBeInTheDocument(); // 1000 * 2.0 = 2000 centavos

    // Update to 3.0x multiplier
    mockUseGameStore.mockReturnValue({
      roundState: 'RUNNING',
      playerBet: mockActiveBet,
      currentMultiplier: 3.0,
      currentRound: null,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    rerender(<CashOutButton />);
    expect(screen.getByText('R$ 30,00')).toBeInTheDocument(); // 1000 * 3.0 = 3000 centavos
  });

  it('has proper accessibility attributes', () => {
    mockUseGameStore.mockReturnValue({
      roundState: 'RUNNING',
      playerBet: mockActiveBet,
      currentMultiplier: 2.5,
      currentRound: null,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    render(<CashOutButton />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Cash out bet for R$ 25,00 at 2.50x multiplier');
  });

  it('handles API response without data', async () => {
    const user = userEvent.setup();
    
    mockUseGameStore.mockReturnValue({
      roundState: 'RUNNING',
      playerBet: mockActiveBet,
      currentMultiplier: 2.0,
      currentRound: null,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    mockGameService.cashOut.mockResolvedValue({
      success: false,
      message: 'Cash out failed',
    });

    render(<CashOutButton />);

    const button = screen.getByRole('button', { name: /cash out bet for/i });
    await user.click(button);

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Cash out failed',
      });
    });
  });
});