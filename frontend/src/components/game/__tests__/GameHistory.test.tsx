import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameHistory } from '../GameHistory';
import { useGameStore } from '@store/gameStore';
import { Round } from '@types/index';

// Mock the game store
vi.mock('@store/gameStore', () => ({
  useGameStore: vi.fn(),
}));

// Mock the Badge component
vi.mock('@components/common', () => ({
  Badge: ({ children, variant }: any) => <span data-variant={variant}>{children}</span>,
}));

describe('GameHistory Component', () => {
  const mockRounds: Round[] = [
    {
      id: 'round-1',
      state: 'CRASHED',
      crashPoint: 2.45,
      createdAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      startedAt: new Date(Date.now() - 90000).toISOString(),
      crashedAt: new Date(Date.now() - 30000).toISOString(),
      playerCount: 5,
      totalWagered: 50000,
    },
    {
      id: 'round-2',
      state: 'CRASHED',
      crashPoint: 1.5,
      createdAt: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
      startedAt: new Date(Date.now() - 150000).toISOString(),
      crashedAt: new Date(Date.now() - 90000).toISOString(),
      playerCount: 3,
      totalWagered: 30000,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render component with title', () => {
      (useGameStore as any).mockReturnValue({
        recentRounds: mockRounds,
      });

      render(<GameHistory />);
      expect(screen.getByText('Recent Rounds')).toBeInTheDocument();
    });

    it('should render empty state when no rounds', () => {
      (useGameStore as any).mockReturnValue({
        recentRounds: [],
      });

      render(<GameHistory />);
      expect(screen.getByText(/No rounds yet/)).toBeInTheDocument();
    });

    it('should render recent rounds list', () => {
      (useGameStore as any).mockReturnValue({
        recentRounds: mockRounds,
      });

      render(<GameHistory />);
      expect(screen.getByText(/round-1/)).toBeInTheDocument();
      expect(screen.getByText(/round-2/)).toBeInTheDocument();
    });

    it('should limit rounds to maxRounds prop', () => {
      const manyRounds = Array.from({ length: 20 }, (_, i) => ({
        ...mockRounds[0],
        id: `round-${i}`,
      }));

      (useGameStore as any).mockReturnValue({
        recentRounds: manyRounds,
      });

      const { container } = render(<GameHistory maxRounds={5} />);
      const items = container.querySelectorAll('[role="listitem"]');
      expect(items).toHaveLength(5);
    });
  });

  describe('Round Information Display', () => {
    it('should display crash point with 2 decimal places', () => {
      (useGameStore as any).mockReturnValue({
        recentRounds: mockRounds,
      });

      render(<GameHistory />);
      expect(screen.getByText('2.45x')).toBeInTheDocument();
      expect(screen.getByText('1.50x')).toBeInTheDocument();
    });

    it('should display player count', () => {
      (useGameStore as any).mockReturnValue({
        recentRounds: mockRounds,
      });

      render(<GameHistory />);
      expect(screen.getByText('5 players')).toBeInTheDocument();
      expect(screen.getByText('3 players')).toBeInTheDocument();
    });

    it('should display round state badge', () => {
      (useGameStore as any).mockReturnValue({
        recentRounds: mockRounds,
      });

      render(<GameHistory />);
      const badges = screen.getAllByText('CRASHED');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should display relative time', () => {
      (useGameStore as any).mockReturnValue({
        recentRounds: mockRounds,
      });

      render(<GameHistory />);
      // The first round is 1 minute ago, so it should display "1m ago"
      expect(screen.getByText(/ago/)).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    it('should display "Just now" for very recent rounds', () => {
      const recentRound: Round = {
        ...mockRounds[0],
        createdAt: new Date().toISOString(),
      };

      (useGameStore as any).mockReturnValue({
        recentRounds: [recentRound],
      });

      render(<GameHistory />);
      expect(screen.getByText('Just now')).toBeInTheDocument();
    });

    it('should display minutes ago', () => {
      const roundMinutesAgo: Round = {
        ...mockRounds[0],
        createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
      };

      (useGameStore as any).mockReturnValue({
        recentRounds: [roundMinutesAgo],
      });

      render(<GameHistory />);
      expect(screen.getByText(/5m ago/)).toBeInTheDocument();
    });

    it('should display hours ago', () => {
      const roundHoursAgo: Round = {
        ...mockRounds[0],
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      };

      (useGameStore as any).mockReturnValue({
        recentRounds: [roundHoursAgo],
      });

      render(<GameHistory />);
      expect(screen.getByText(/2h ago/)).toBeInTheDocument();
    });
  });

  describe('Crash Point Formatting', () => {
    it('should display N/A for null crash point', () => {
      const roundNoCrash: Round = {
        ...mockRounds[0],
        crashPoint: null,
      };

      (useGameStore as any).mockReturnValue({
        recentRounds: [roundNoCrash],
      });

      render(<GameHistory />);
      expect(screen.getByText('N/Ax')).toBeInTheDocument();
    });

    it('should format crash point with 2 decimal places', () => {
      const roundWithDecimal: Round = {
        ...mockRounds[0],
        crashPoint: 3.14159,
      };

      (useGameStore as any).mockReturnValue({
        recentRounds: [roundWithDecimal],
      });

      render(<GameHistory />);
      expect(screen.getByText('3.14x')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      (useGameStore as any).mockReturnValue({
        recentRounds: mockRounds,
      });

      render(<GameHistory />);
      const region = screen.getByRole('region', { name: /recent game rounds history/i });
      expect(region).toBeInTheDocument();
    });

    it('should have list items with proper roles', () => {
      (useGameStore as any).mockReturnValue({
        recentRounds: mockRounds,
      });

      const { container } = render(<GameHistory />);
      const items = container.querySelectorAll('[role="listitem"]');
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('Scrolling', () => {
    it('should have scrollable container for many rounds', () => {
      const manyRounds = Array.from({ length: 15 }, (_, i) => ({
        ...mockRounds[0],
        id: `round-${i}`,
      }));

      (useGameStore as any).mockReturnValue({
        recentRounds: manyRounds,
      });

      const { container } = render(<GameHistory />);
      const scrollContainer = container.querySelector('.max-h-96');
      expect(scrollContainer).toHaveClass('overflow-y-auto');
    });
  });

  describe('Custom className', () => {
    it('should accept custom className', () => {
      (useGameStore as any).mockReturnValue({
        recentRounds: mockRounds,
      });

      const { container } = render(<GameHistory className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
