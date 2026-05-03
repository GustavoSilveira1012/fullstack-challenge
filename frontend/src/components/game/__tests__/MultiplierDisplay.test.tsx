import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MultiplierDisplay } from '../MultiplierDisplay';
import { useGameStore } from '@store/gameStore';

// Mock the game store
vi.mock('@store/gameStore', () => ({
  useGameStore: vi.fn(),
}));

describe('MultiplierDisplay Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render multiplier with 2 decimal places', () => {
      (useGameStore as any).mockReturnValue({
        currentMultiplier: 1.23,
        roundState: 'RUNNING',
      });

      render(<MultiplierDisplay />);
      expect(screen.getByText(/1\.23/)).toBeInTheDocument();
      expect(screen.getByText('x')).toBeInTheDocument();
    });

    it('should render LIVE badge during RUNNING phase', () => {
      (useGameStore as any).mockReturnValue({
        currentMultiplier: 1.5,
        roundState: 'RUNNING',
      });

      render(<MultiplierDisplay />);
      expect(screen.getByText('LIVE')).toBeInTheDocument();
    });

    it('should not render LIVE badge during BETTING phase', () => {
      (useGameStore as any).mockReturnValue({
        currentMultiplier: 1.0,
        roundState: 'BETTING',
      });

      render(<MultiplierDisplay />);
      expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
    });

    it('should render CRASHED status when round is crashed', () => {
      (useGameStore as any).mockReturnValue({
        currentMultiplier: 2.45,
        roundState: 'CRASHED',
      });

      render(<MultiplierDisplay />);
      expect(screen.getByText('CRASHED')).toBeInTheDocument();
    });

    it('should render waiting message during BETTING phase', () => {
      (useGameStore as any).mockReturnValue({
        currentMultiplier: 1.0,
        roundState: 'BETTING',
      });

      render(<MultiplierDisplay />);
      expect(screen.getByText(/Waiting for next round/)).toBeInTheDocument();
    });
  });

  describe('Color Coding', () => {
    it('should use green color for low multiplier (< 2.0)', () => {
      (useGameStore as any).mockReturnValue({
        currentMultiplier: 1.5,
        roundState: 'RUNNING',
      });

      const { container } = render(<MultiplierDisplay />);
      const multiplierElement = container.querySelector('.text-green-500');
      expect(multiplierElement).toBeInTheDocument();
    });

    it('should use yellow color for medium multiplier (2.0 - 5.0)', () => {
      (useGameStore as any).mockReturnValue({
        currentMultiplier: 3.5,
        roundState: 'RUNNING',
      });

      const { container } = render(<MultiplierDisplay />);
      const multiplierElement = container.querySelector('.text-yellow-500');
      expect(multiplierElement).toBeInTheDocument();
    });

    it('should use red color for high multiplier (> 5.0)', () => {
      (useGameStore as any).mockReturnValue({
        currentMultiplier: 10.5,
        roundState: 'RUNNING',
      });

      const { container } = render(<MultiplierDisplay />);
      const multiplierElement = container.querySelector('.text-red-500');
      expect(multiplierElement).toBeInTheDocument();
    });

    it('should use red color when crashed', () => {
      (useGameStore as any).mockReturnValue({
        currentMultiplier: 2.45,
        roundState: 'CRASHED',
      });

      const { container } = render(<MultiplierDisplay />);
      const multiplierElement = container.querySelector('.text-red-600');
      expect(multiplierElement).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      (useGameStore as any).mockReturnValue({
        currentMultiplier: 1.23,
        roundState: 'RUNNING',
      });

      render(<MultiplierDisplay />);
      const region = screen.getByRole('region', { name: /current multiplier display/i });
      expect(region).toBeInTheDocument();
    });

    it('should have aria-live polite for real-time updates', () => {
      (useGameStore as any).mockReturnValue({
        currentMultiplier: 1.23,
        roundState: 'RUNNING',
      });

      render(<MultiplierDisplay />);
      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-atomic true for atomic updates', () => {
      (useGameStore as any).mockReturnValue({
        currentMultiplier: 1.23,
        roundState: 'RUNNING',
      });

      render(<MultiplierDisplay />);
      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Formatting', () => {
    it('should format multiplier with exactly 2 decimal places', () => {
      (useGameStore as any).mockReturnValue({
        currentMultiplier: 1.5,
        roundState: 'RUNNING',
      });

      render(<MultiplierDisplay />);
      expect(screen.getByText(/1\.50/)).toBeInTheDocument();
    });

    it('should handle large multipliers', () => {
      (useGameStore as any).mockReturnValue({
        currentMultiplier: 999.99,
        roundState: 'RUNNING',
      });

      render(<MultiplierDisplay />);
      expect(screen.getByText(/999\.99/)).toBeInTheDocument();
    });

    it('should handle multiplier of exactly 1.00', () => {
      (useGameStore as any).mockReturnValue({
        currentMultiplier: 1.0,
        roundState: 'BETTING',
      });

      render(<MultiplierDisplay />);
      expect(screen.getByText(/1\.00/)).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should accept custom className', () => {
      (useGameStore as any).mockReturnValue({
        currentMultiplier: 1.23,
        roundState: 'RUNNING',
      });

      const { container } = render(<MultiplierDisplay className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
