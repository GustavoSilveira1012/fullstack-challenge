import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BetStatus } from '../BetStatus';
import { useGameStore } from '@store/gameStore';

// Mock dependencies
vi.mock('@store/gameStore');

const mockUseGameStore = vi.mocked(useGameStore);

describe('BetStatus', () => {
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

  const mockWonBet = {
    id: 'bet-2',
    roundId: 'round-2',
    playerId: 'player-1',
    amount: 1000, // R$ 10.00
    state: 'WON' as const,
    cashedOutAt: 2.5,
    payout: 2500, // R$ 25.00
    createdAt: '2023-01-01T00:00:00Z',
  };

  const mockLostBet = {
    id: 'bet-3',
    roundId: 'round-3',
    playerId: 'player-1',
    amount: 1000, // R$ 10.00
    state: 'LOST' as const,
    cashedOutAt: null,
    payout: null,
    createdAt: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when no bet and round is BETTING', () => {
    mockUseGameStore.mockReturnValue({
      playerBet: null,
      roundState: 'BETTING',
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

    const { container } = render(<BetStatus />);
    expect(container.firstChild).toBeNull();
  });

  it('renders placeholder when no bet during non-betting phase', () => {
    mockUseGameStore.mockReturnValue({
      playerBet: null,
      roundState: 'RUNNING',
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

    render(<BetStatus />);

    expect(screen.getByText('Bet Status')).toBeInTheDocument();
    expect(screen.getByText('No Active Bet')).toBeInTheDocument();
    expect(screen.getByText('Place a bet to see your status here')).toBeInTheDocument();
  });

  it('displays active bet during BETTING phase', () => {
    mockUseGameStore.mockReturnValue({
      playerBet: mockActiveBet,
      roundState: 'BETTING',
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

    render(<BetStatus />);

    expect(screen.getByText('Bet Status')).toBeInTheDocument();
    expect(screen.getByText('Bet Placed')).toBeInTheDocument();
    expect(screen.getByText('Bet Amount:')).toBeInTheDocument();
    expect(screen.getByText('R$ 10,00')).toBeInTheDocument();
    
    // Should not show potential payout during betting phase
    expect(screen.queryByText('Potential Payout:')).not.toBeInTheDocument();
    expect(screen.queryByText('Current Multiplier:')).not.toBeInTheDocument();
  });

  it('displays active bet with potential payout during RUNNING phase', () => {
    mockUseGameStore.mockReturnValue({
      playerBet: mockActiveBet,
      roundState: 'RUNNING',
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

    render(<BetStatus />);

    expect(screen.getByText('Bet Status')).toBeInTheDocument();
    expect(screen.getByText('Bet Active')).toBeInTheDocument();
    expect(screen.getByText('Bet Amount:')).toBeInTheDocument();
    expect(screen.getByText('R$ 10,00')).toBeInTheDocument();
    expect(screen.getByText('Potential Payout:')).toBeInTheDocument();
    expect(screen.getByText('R$ 25,00')).toBeInTheDocument(); // 1000 * 2.5 = 2500 centavos
    expect(screen.getByText('Current Multiplier:')).toBeInTheDocument();
    expect(screen.getByText('2.50x')).toBeInTheDocument();
  });

  it('displays won bet with final payout and profit', () => {
    mockUseGameStore.mockReturnValue({
      playerBet: mockWonBet,
      roundState: 'CRASHED',
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

    render(<BetStatus />);

    expect(screen.getByText('Bet Status')).toBeInTheDocument();
    expect(screen.getByText('Bet Won')).toBeInTheDocument();
    expect(screen.getByText('Bet Amount:')).toBeInTheDocument();
    expect(screen.getByText('R$ 10,00')).toBeInTheDocument();
    expect(screen.getByText('Cashed Out At:')).toBeInTheDocument();
    expect(screen.getByText('2.50x')).toBeInTheDocument();
    expect(screen.getByText('Final Payout:')).toBeInTheDocument();
    expect(screen.getByText('R$ 25,00')).toBeInTheDocument();
    expect(screen.getByText('Profit:')).toBeInTheDocument();
    expect(screen.getByText('+R$ 15,00')).toBeInTheDocument(); // 2500 - 1000 = 1500 centavos
  });

  it('displays lost bet with loss amount', () => {
    mockUseGameStore.mockReturnValue({
      playerBet: mockLostBet,
      roundState: 'CRASHED',
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

    render(<BetStatus />);

    expect(screen.getByText('Bet Status')).toBeInTheDocument();
    expect(screen.getByText('Bet Lost')).toBeInTheDocument();
    expect(screen.getByText('Bet Amount:')).toBeInTheDocument();
    expect(screen.getByText('R$ 10,00')).toBeInTheDocument();
    expect(screen.getByText('Loss:')).toBeInTheDocument();
    expect(screen.getByText('-R$ 10,00')).toBeInTheDocument();
  });

  it('uses correct badge variants for different bet states', () => {
    // Test active bet during running phase (success variant)
    mockUseGameStore.mockReturnValue({
      playerBet: mockActiveBet,
      roundState: 'RUNNING',
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

    const { rerender } = render(<BetStatus />);
    let badge = screen.getByText('Bet Active');
    expect(badge.closest('.bg-green-100')).toBeInTheDocument(); // Success variant

    // Test active bet during betting phase (warning variant)
    mockUseGameStore.mockReturnValue({
      playerBet: mockActiveBet,
      roundState: 'BETTING',
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

    rerender(<BetStatus />);
    badge = screen.getByText('Bet Placed');
    expect(badge.closest('.bg-yellow-100')).toBeInTheDocument(); // Warning variant

    // Test won bet (success variant)
    mockUseGameStore.mockReturnValue({
      playerBet: mockWonBet,
      roundState: 'CRASHED',
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

    rerender(<BetStatus />);
    badge = screen.getByText('Bet Won');
    expect(badge.closest('.bg-green-100')).toBeInTheDocument(); // Success variant

    // Test lost bet (danger variant)
    mockUseGameStore.mockReturnValue({
      playerBet: mockLostBet,
      roundState: 'CRASHED',
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

    rerender(<BetStatus />);
    badge = screen.getByText('Bet Lost');
    expect(badge.closest('.bg-red-100')).toBeInTheDocument(); // Danger variant
  });

  it('updates potential payout when multiplier changes', () => {
    const { rerender } = render(<BetStatus />);

    // Initial state with 2.0x multiplier
    mockUseGameStore.mockReturnValue({
      playerBet: mockActiveBet,
      roundState: 'RUNNING',
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

    rerender(<BetStatus />);
    expect(screen.getByText('R$ 20,00')).toBeInTheDocument(); // 1000 * 2.0 = 2000 centavos

    // Update to 3.5x multiplier
    mockUseGameStore.mockReturnValue({
      playerBet: mockActiveBet,
      roundState: 'RUNNING',
      currentMultiplier: 3.5,
      currentRound: null,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    rerender(<BetStatus />);
    expect(screen.getByText('R$ 35,00')).toBeInTheDocument(); // 1000 * 3.5 = 3500 centavos
    expect(screen.getByText('3.50x')).toBeInTheDocument();
  });

  it('handles edge case with zero payout', () => {
    const betWithZeroPayout = {
      ...mockWonBet,
      payout: 0,
    };

    mockUseGameStore.mockReturnValue({
      playerBet: betWithZeroPayout,
      roundState: 'CRASHED',
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

    render(<BetStatus />);

    expect(screen.getByText('Final Payout:')).toBeInTheDocument();
    expect(screen.getByText('R$ 0,00')).toBeInTheDocument();
    expect(screen.getByText('Profit:')).toBeInTheDocument();
    expect(screen.getByText('-R$ 10,00')).toBeInTheDocument(); // 0 - 1000 = -1000 centavos
  });

  it('applies custom className', () => {
    mockUseGameStore.mockReturnValue({
      playerBet: mockActiveBet,
      roundState: 'RUNNING',
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

    render(<BetStatus className="custom-class" />);

    const container = screen.getByText('Bet Status').closest('.custom-class');
    expect(container).toBeInTheDocument();
  });
});