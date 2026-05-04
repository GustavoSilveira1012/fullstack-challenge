import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrashAnimation } from '../CrashAnimation';
import { useGameStore } from '@store/gameStore';

// Mock dependencies
vi.mock('@store/gameStore');

const mockUseGameStore = vi.mocked(useGameStore);

describe('CrashAnimation', () => {
  const mockOnAnimationComplete = vi.fn();

  const mockCrashedRound = {
    id: 'round-1',
    state: 'CRASHED' as const,
    crashPoint: 2.45,
    createdAt: '2023-01-01T00:00:00Z',
    startedAt: '2023-01-01T00:01:00Z',
    crashedAt: '2023-01-01T00:02:00Z',
    playerCount: 5,
    totalWagered: 50000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('does not render when round state is not CRASHED', () => {
    mockUseGameStore.mockReturnValue({
      roundState: 'RUNNING',
      currentRound: mockCrashedRound,
      playerBet: null,
      currentMultiplier: 2.0,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    const { container } = render(<CrashAnimation />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render when no current round', () => {
    mockUseGameStore.mockReturnValue({
      roundState: 'CRASHED',
      currentRound: null,
      playerBet: null,
      currentMultiplier: 2.0,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    const { container } = render(<CrashAnimation />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render when round has no crash point', () => {
    mockUseGameStore.mockReturnValue({
      roundState: 'CRASHED',
      currentRound: { ...mockCrashedRound, crashPoint: null },
      playerBet: null,
      currentMultiplier: 2.0,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    const { container } = render(<CrashAnimation />);
    expect(container.firstChild).toBeNull();
  });

  it('renders crash animation when round crashes', () => {
    mockUseGameStore.mockReturnValue({
      roundState: 'CRASHED',
      currentRound: mockCrashedRound,
      playerBet: null,
      currentMultiplier: 2.0,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    render(<CrashAnimation />);

    expect(screen.getByText('CRASHED')).toBeInTheDocument();
    expect(screen.getByText('Crashed at')).toBeInTheDocument();
    expect(screen.getByText('2.45x')).toBeInTheDocument();
    expect(screen.getByText('Click anywhere to continue')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    mockUseGameStore.mockReturnValue({
      roundState: 'CRASHED',
      currentRound: mockCrashedRound,
      playerBet: null,
      currentMultiplier: 2.0,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    render(<CrashAnimation />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'Round crashed animation');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('auto-dismisses after default duration', () => {
    const mockCallback = vi.fn();
    
    mockUseGameStore.mockReturnValue({
      roundState: 'CRASHED',
      currentRound: mockCrashedRound,
      playerBet: null,
      currentMultiplier: 2.0,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    render(<CrashAnimation onAnimationComplete={mockCallback} />);

    expect(screen.getByText('CRASHED')).toBeInTheDocument();

    // Fast-forward time by default duration (2000ms)
    vi.advanceTimersByTime(2000);

    expect(mockCallback).toHaveBeenCalled();
  });

  it('auto-dismisses after custom duration', () => {
    const mockCallback = vi.fn();
    
    mockUseGameStore.mockReturnValue({
      roundState: 'CRASHED',
      currentRound: mockCrashedRound,
      playerBet: null,
      currentMultiplier: 2.0,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    render(<CrashAnimation duration={1000} onAnimationComplete={mockCallback} />);

    expect(screen.getByText('CRASHED')).toBeInTheDocument();

    // Fast-forward time by custom duration (1000ms)
    vi.advanceTimersByTime(1000);

    expect(mockCallback).toHaveBeenCalled();
  });

  it('dismisses when clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    mockUseGameStore.mockReturnValue({
      roundState: 'CRASHED',
      currentRound: mockCrashedRound,
      playerBet: null,
      currentMultiplier: 2.0,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    render(<CrashAnimation onAnimationComplete={mockOnAnimationComplete} />);

    const dialog = screen.getByRole('dialog');
    await user.click(dialog);

    expect(mockOnAnimationComplete).toHaveBeenCalled();
  });

  it('formats multiplier correctly', () => {
    const testCases = [
      { crashPoint: 1.0, expected: '1.00x' },
      { crashPoint: 2.5, expected: '2.50x' },
      { crashPoint: 10.123, expected: '10.12x' },
      { crashPoint: 100.999, expected: '101.00x' },
    ];

    testCases.forEach(({ crashPoint, expected }) => {
      mockUseGameStore.mockReturnValue({
        roundState: 'CRASHED',
        currentRound: { ...mockCrashedRound, crashPoint },
        playerBet: null,
        currentMultiplier: 2.0,
        recentRounds: [],
        setCurrentRound: vi.fn(),
        setMultiplier: vi.fn(),
        setRoundState: vi.fn(),
        setPlayerBet: vi.fn(),
        addRecentRound: vi.fn(),
        reset: vi.fn(),
      });

      const { rerender } = render(<CrashAnimation />);
      expect(screen.getByText(expected)).toBeInTheDocument();
      rerender(<div />); // Clear for next test
    });
  });

  it('applies custom className', () => {
    mockUseGameStore.mockReturnValue({
      roundState: 'CRASHED',
      currentRound: mockCrashedRound,
      playerBet: null,
      currentMultiplier: 2.0,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    render(<CrashAnimation className="custom-class" />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('custom-class');
  });

  it('renders particle effects', () => {
    mockUseGameStore.mockReturnValue({
      roundState: 'CRASHED',
      currentRound: mockCrashedRound,
      playerBet: null,
      currentMultiplier: 2.0,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    render(<CrashAnimation />);

    // Check for particle elements (there should be 8 particles)
    const particles = document.querySelectorAll('.animate-particle-0, .animate-particle-1, .animate-particle-2, .animate-particle-3');
    expect(particles.length).toBe(8);
  });

  it('renders explosion effect elements', () => {
    mockUseGameStore.mockReturnValue({
      roundState: 'CRASHED',
      currentRound: mockCrashedRound,
      playerBet: null,
      currentMultiplier: 2.0,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    render(<CrashAnimation />);

    // Check for explosion effect elements
    const pingElement = document.querySelector('.animate-ping');
    const pulseElement = document.querySelector('.animate-pulse');
    
    expect(pingElement).toBeInTheDocument();
    expect(pulseElement).toBeInTheDocument();
  });

  it('renders screen flash effect', () => {
    mockUseGameStore.mockReturnValue({
      roundState: 'CRASHED',
      currentRound: mockCrashedRound,
      playerBet: null,
      currentMultiplier: 2.0,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    render(<CrashAnimation />);

    const flashElement = document.querySelector('.animate-flash');
    expect(flashElement).toBeInTheDocument();
  });

  it('cleans up timer on unmount', () => {
    const mockCallback = vi.fn();
    
    mockUseGameStore.mockReturnValue({
      roundState: 'CRASHED',
      currentRound: mockCrashedRound,
      playerBet: null,
      currentMultiplier: 2.0,
      recentRounds: [],
      setCurrentRound: vi.fn(),
      setMultiplier: vi.fn(),
      setRoundState: vi.fn(),
      setPlayerBet: vi.fn(),
      addRecentRound: vi.fn(),
      reset: vi.fn(),
    });

    const { unmount } = render(<CrashAnimation onAnimationComplete={mockCallback} />);

    expect(screen.getByText('CRASHED')).toBeInTheDocument();

    // Unmount before timer completes
    unmount();

    // Fast-forward time
    vi.advanceTimersByTime(2000);

    // Callback should not be called after unmount
    expect(mockCallback).not.toHaveBeenCalled();
  });
});