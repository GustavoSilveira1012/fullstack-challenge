import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlayerStats } from '../PlayerStats';

// Mock the Card component
vi.mock('@components/common', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

describe('PlayerStats Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all stat cards', () => {
      render(
        <PlayerStats
          totalBets={10}
          totalWagered={100000}
          totalWon={150000}
          averageMultiplier={1.5}
        />
      );

      expect(screen.getByText('Total Bets')).toBeInTheDocument();
      expect(screen.getByText('Total Wagered')).toBeInTheDocument();
      expect(screen.getByText('Total Won')).toBeInTheDocument();
      expect(screen.getByText('Win Rate')).toBeInTheDocument();
      expect(screen.getByText('Avg Multiplier')).toBeInTheDocument();
      expect(screen.getByText('Profit/Loss')).toBeInTheDocument();
    });

    it('should display total bets count', () => {
      render(
        <PlayerStats
          totalBets={25}
          totalWagered={100000}
          totalWon={150000}
          averageMultiplier={1.5}
        />
      );

      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency with BRL symbol and 2 decimal places', () => {
      render(
        <PlayerStats
          totalBets={10}
          totalWagered={100000}
          totalWon={150000}
          averageMultiplier={1.5}
        />
      );

      expect(screen.getByText('R$ 1.000,00')).toBeInTheDocument(); // totalWagered
      expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument(); // totalWon
    });

    it('should format small amounts correctly', () => {
      render(
        <PlayerStats
          totalBets={1}
          totalWagered={100}
          totalWon={150}
          averageMultiplier={1.5}
        />
      );

      expect(screen.getByText('R$ 1,00')).toBeInTheDocument();
      expect(screen.getByText('R$ 1,50')).toBeInTheDocument();
    });

    it('should format large amounts with thousand separators', () => {
      render(
        <PlayerStats
          totalBets={100}
          totalWagered={10000000}
          totalWon={15000000}
          averageMultiplier={1.5}
        />
      );

      expect(screen.getByText('R$ 100.000,00')).toBeInTheDocument();
      expect(screen.getByText('R$ 150.000,00')).toBeInTheDocument();
    });
  });

  describe('Win Rate Calculation', () => {
    it('should calculate win rate correctly', () => {
      render(
        <PlayerStats
          totalBets={10}
          totalWagered={100000}
          totalWon={150000}
          averageMultiplier={1.5}
        />
      );

      // Win rate = (totalWon / totalWagered) * 100 = (150000 / 100000) * 100 = 150%
      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('should display 0% win rate when no bets', () => {
      render(
        <PlayerStats
          totalBets={0}
          totalWagered={0}
          totalWon={0}
          averageMultiplier={0}
        />
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should display 0% win rate when no wins', () => {
      render(
        <PlayerStats
          totalBets={10}
          totalWagered={100000}
          totalWon={0}
          averageMultiplier={0}
        />
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should display 100% win rate when all bets won', () => {
      render(
        <PlayerStats
          totalBets={10}
          totalWagered={100000}
          totalWon={100000}
          averageMultiplier={1.0}
        />
      );

      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Profit/Loss Calculation', () => {
    it('should calculate profit correctly', () => {
      render(
        <PlayerStats
          totalBets={10}
          totalWagered={100000}
          totalWon={150000}
          averageMultiplier={1.5}
        />
      );

      // Profit = totalWon - totalWagered = 150000 - 100000 = 50000
      expect(screen.getByText('R$ 500,00')).toBeInTheDocument();
    });

    it('should calculate loss correctly', () => {
      render(
        <PlayerStats
          totalBets={10}
          totalWagered={100000}
          totalWon={50000}
          averageMultiplier={0.5}
        />
      );

      // Loss = totalWon - totalWagered = 50000 - 100000 = -50000
      expect(screen.getByText('R$ -500,00')).toBeInTheDocument();
    });

    it('should display break-even as positive', () => {
      render(
        <PlayerStats
          totalBets={10}
          totalWagered={100000}
          totalWon={100000}
          averageMultiplier={1.0}
        />
      );

      expect(screen.getByText('R$ 0,00')).toBeInTheDocument();
    });

    it('should show + sign for positive profit', () => {
      render(
        <PlayerStats
          totalBets={10}
          totalWagered={100000}
          totalWon={150000}
          averageMultiplier={1.5}
        />
      );

      const profitElement = screen.getByText('+R$ 500,00');
      expect(profitElement).toBeInTheDocument();
    });

    it('should show - sign for negative profit', () => {
      render(
        <PlayerStats
          totalBets={10}
          totalWagered={100000}
          totalWon={50000}
          averageMultiplier={0.5}
        />
      );

      const lossElement = screen.getByText('R$ -500,00');
      expect(lossElement).toBeInTheDocument();
    });
  });

  describe('Average Multiplier', () => {
    it('should display average multiplier with 2 decimal places', () => {
      render(
        <PlayerStats
          totalBets={10}
          totalWagered={100000}
          totalWon={150000}
          averageMultiplier={1.5}
        />
      );

      expect(screen.getByText('1.50x')).toBeInTheDocument();
    });

    it('should display 0.00x when no average multiplier', () => {
      render(
        <PlayerStats
          totalBets={0}
          totalWagered={0}
          totalWon={0}
          averageMultiplier={0}
        />
      );

      expect(screen.getByText('0.00x')).toBeInTheDocument();
    });

    it('should handle large multipliers', () => {
      render(
        <PlayerStats
          totalBets={10}
          totalWagered={100000}
          totalWon={500000}
          averageMultiplier={5.5}
        />
      );

      expect(screen.getByText('5.50x')).toBeInTheDocument();
    });
  });

  describe('Color Coding', () => {
    it('should show green color for positive profit', () => {
      const { container } = render(
        <PlayerStats
          totalBets={10}
          totalWagered={100000}
          totalWon={150000}
          averageMultiplier={1.5}
        />
      );

      const profitElement = container.querySelector('.text-green-600');
      expect(profitElement).toBeInTheDocument();
    });

    it('should show red color for negative profit', () => {
      const { container } = render(
        <PlayerStats
          totalBets={10}
          totalWagered={100000}
          totalWon={50000}
          averageMultiplier={0.5}
        />
      );

      const lossElement = container.querySelector('.text-red-600');
      expect(lossElement).toBeInTheDocument();
    });

    it('should show green color for total won', () => {
      const { container } = render(
        <PlayerStats
          totalBets={10}
          totalWagered={100000}
          totalWon={150000}
          averageMultiplier={1.5}
        />
      );

      const wonElements = container.querySelectorAll('.text-green-600');
      expect(wonElements.length).toBeGreaterThan(0);
    });
  });

  describe('Custom className', () => {
    it('should accept custom className', () => {
      const { container } = render(
        <PlayerStats
          totalBets={10}
          totalWagered={100000}
          totalWon={150000}
          averageMultiplier={1.5}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Responsive Layout', () => {
    it('should render grid layout', () => {
      const { container } = render(
        <PlayerStats
          totalBets={10}
          totalWagered={100000}
          totalWon={150000}
          averageMultiplier={1.5}
        />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });
  });
});
