import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveActivity } from '../LiveActivity';
import { useGameStore } from '@store/gameStore';
import { Round } from '@types/index';

// Mock the game store
vi.mock('@store/gameStore', () => ({
  useGameStore: vi.fn(),
}));

// Mock the Card component
vi.mock('@components/common', () => ({
  Card: ({ children, className, role, ...props }: any) => (
    <div className={className} role={role} {...props}>
      {children}
    </div>
  ),
}));

describe('LiveActivity Component', () => {
  const mockRound: Round = {
    id: 'round-1',
    state: 'RUNNING',
    crashPoint: null,
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    crashedAt: null,
    playerCount: 5,
    totalWagered: 50000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render component with title', () => {
      (useGameStore as any).mockReturnValue({
        currentRound: mockRound,
        roundState: 'RUNNING',
      });

      render(<LiveActivity />);
      expect(screen.getByText('Live Activity')).toBeInTheDocument();
    });

    it('should render player count and total wagered', () => {
      (useGameStore as any).mockReturnValue({
        currentRound: mockRound,
        roundState: 'RUNNING',
      });

      render(<LiveActivity />);
      expect(screen.getByText('Players Betting')).toBeInTheDocument();
      expect(screen.getByText('Total Wagered')).toBeInTheDocument();
    });

    it('should render LIVE indicator during RUNNING phase', () => {
      (useGameStore as any).mockReturnValue({
        currentRound: mockRound,
        roundState: 'RUNNING',
      });

      render(<LiveActivity />);
      expect(screen.getByText('LIVE')).toBeInTheDocument();
    });

    it('should not render LIVE indicator during BETTING phase', () => {
      (useGameStore as any).mockReturnValue({
        currentRound: mockRound,
        roundState: 'BETTING',
      });

      render(<LiveActivity />);
      expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
    });
  });

  describe('Player Count Display', () => {
    it('should display player count', () => {
      (useGameStore as any).mockReturnValue({
        currentRound: mockRound,
        roundState: 'RUNNING',
      });

      render(<LiveActivity />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should display "player" for single player', () => {
      const singlePlayerRound = { ...mockRound, playerCount: 1 };
      (useGameStore as any).mockReturnValue({
        currentRound: singlePlayerRound,
        roundState: 'RUNNING',
      });

      render(<LiveActivity />);
      expect(screen.getByText('player')).toBeInTheDocument();
    });

    it('should display "players" for multiple players', () => {
      (useGameStore as any).mockReturnValue({
        currentRound: mockRound,
        roundState: 'RUNNING',
      });

      render(<LiveActivity />);
      expect(screen.getByText('players')).toBeInTheDocument();
    });

    it('should display 0 players when no round', () => {
      (useGameStore as any).mockReturnValue({
        currentRound: null,
        roundState: 'BETTING',
      });

      render(<LiveActivity />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Total Wagered Display', () => {
    it('should format total wagered as currency', () => {
      (useGameStore as any).mockReturnValue({
        currentRound: mockRound,
        roundState: 'RUNNING',
      });

      render(<LiveActivity />);
      expect(screen.getByText('R$ 500,00')).toBeInTheDocument();
    });

    it('should display 0 when no round', () => {
      (useGameStore as any).mockReturnValue({
        currentRound: null,
        roundState: 'BETTING',
      });

      render(<LiveActivity />);
      expect(screen.getByText('R$ 0,00')).toBeInTheDocument();
    });

    it('should format large amounts with thousand separators', () => {
      const largeRound = { ...mockRound, totalWagered: 1000000 };
      (useGameStore as any).mockReturnValue({
        currentRound: largeRound,
        roundState: 'RUNNING',
      });

      render(<LiveActivity />);
      expect(screen.getByText('R$ 10.000,00')).toBeInTheDocument();
    });
  });

  describe('Status Messages', () => {
    it('should display waiting message during BETTING phase', () => {
      (useGameStore as any).mockReturnValue({
        currentRound: mockRound,
        roundState: 'BETTING',
      });

      render(<LiveActivity />);
      expect(screen.getByText(/Waiting for round to start/)).toBeInTheDocument();
    });

    it('should display ended message during CRASHED phase', () => {
      (useGameStore as any).mockReturnValue({
        currentRound: mockRound,
        roundState: 'CRASHED',
      });

      render(<LiveActivity />);
      expect(screen.getByText(/Round has ended/)).toBeInTheDocument();
    });

    it('should not display status message during RUNNING phase', () => {
      (useGameStore as any).mockReturnValue({
        currentRound: mockRound,
        roundState: 'RUNNING',
      });

      render(<LiveActivity />);
      expect(screen.queryByText(/Waiting for round to start/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Round has ended/)).not.toBeInTheDocument();
    });
  });

  describe('Average Bet Calculation', () => {
    it('should display average bet when players > 0', () => {
      (useGameStore as any).mockReturnValue({
        currentRound: mockRound,
        roundState: 'RUNNING',
      });

      render(<LiveActivity />);
      // Average bet = 50000 / 5 = 10000 centavos = R$ 100,00
      expect(screen.getByText('R$ 100,00')).toBeInTheDocument();
    });

    it('should not display average bet when no players', () => {
      const noPlayersRound = { ...mockRound, playerCount: 0 };
      (useGameStore as any).mockReturnValue({
        currentRound: noPlayersRound,
        roundState: 'RUNNING',
      });

      render(<LiveActivity />);
      const averageBetLabel = screen.queryByText('Average Bet');
      expect(averageBetLabel).not.toBeInTheDocument();
    });

    it('should calculate average bet correctly with different amounts', () => {
      const customRound = { ...mockRound, playerCount: 10, totalWagered: 100000 };
      (useGameStore as any).mockReturnValue({
        currentRound: customRound,
        roundState: 'RUNNING',
      });

      render(<LiveActivity />);
      // Average bet = 100000 / 10 = 10000 centavos = R$ 100,00
      expect(screen.getByText('R$ 100,00')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      (useGameStore as any).mockReturnValue({
        currentRound: mockRound,
        roundState: 'RUNNING',
      });

      render(<LiveActivity />);
      const region = screen.getByRole('region', { name: /live game activity/i });
      expect(region).toBeInTheDocument();
    });

    it('should have aria-live polite for real-time updates', () => {
      (useGameStore as any).mockReturnValue({
        currentRound: mockRound,
        roundState: 'RUNNING',
      });

      render(<LiveActivity />);
      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Custom className', () => {
    it('should accept custom className', () => {
      (useGameStore as any).mockReturnValue({
        currentRound: mockRound,
        roundState: 'RUNNING',
      });

      const { container } = render(<LiveActivity className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Null Round Handling', () => {
    it('should handle null current round gracefully', () => {
      (useGameStore as any).mockReturnValue({
        currentRound: null,
        roundState: 'BETTING',
      });

      render(<LiveActivity />);
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('R$ 0,00')).toBeInTheDocument();
    });
  });

  describe('Live Indicator Animation', () => {
    it('should have animated pulse for LIVE indicator', () => {
      (useGameStore as any).mockReturnValue({
        currentRound: mockRound,
        roundState: 'RUNNING',
      });

      const { container } = render(<LiveActivity />);
      const pulseElement = container.querySelector('.animate-pulse');
      expect(pulseElement).toBeInTheDocument();
    });
  });
});
