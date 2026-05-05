import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BetForm } from '../BetForm';
import { useGameStore } from '@store/gameStore';
import { useWalletStore } from '@store/walletStore';
import { gameService } from '@services/gameService';

/**
 * Integration test for BetForm validation with centavos conversion
 * Task 1.3: Verify validation logic works with centavos
 * Requirements: 3.1, 3.2, 3.3
 */

// Mock stores
vi.mock('@store/gameStore');
vi.mock('@store/walletStore');
vi.mock('@services/gameService');
vi.mock('@hooks/useNotification', () => ({
  useNotification: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));
vi.mock('@hooks/useErrorRecovery', () => ({
  useErrorRecovery: () => ({
    withRetry: vi.fn((fn) => fn()),
    executeWhenOnline: vi.fn((fn) => fn()),
  }),
}));
vi.mock('@hooks/useSound', () => ({
  useSound: () => ({
    playSound: vi.fn(),
    initializeAudio: vi.fn(),
  }),
}));

describe('BetForm Integration - Validation with Centavos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default store states
    vi.mocked(useGameStore).mockReturnValue({
      roundState: 'BETTING',
      playerBet: null,
    } as any);
    
    vi.mocked(useWalletStore).mockReturnValue({
      balance: 50000, // R$ 500.00 in centavos
      lastBetAmount: 0,
      setLastBetAmount: vi.fn(),
    } as any);
  });

  describe('Minimum bet validation (R$ 1.00 / 100 centavos)', () => {
    it('should show error for amounts below R$ 1.00', async () => {
      render(<BetForm />);
      
      const input = screen.getByLabelText(/bet amount/i);
      
      // User enters R$ 0.50 (50 centavos, below minimum)
      fireEvent.change(input, { target: { value: '0,50' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Minimum bet is R\$ 1\.00/i)).toBeInTheDocument();
      });
    });

    it('should show error for R$ 0.99', async () => {
      render(<BetForm />);
      
      const input = screen.getByLabelText(/bet amount/i);
      
      // User enters R$ 0.99 (99 centavos, below minimum)
      fireEvent.change(input, { target: { value: '0,99' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Minimum bet is R\$ 1\.00/i)).toBeInTheDocument();
      });
    });

    it('should accept R$ 1.00 (minimum)', async () => {
      render(<BetForm />);
      
      const input = screen.getByLabelText(/bet amount/i);
      
      // User enters R$ 1.00 (100 centavos, exactly minimum)
      fireEvent.change(input, { target: { value: '1,00' } });
      
      await waitFor(() => {
        expect(screen.queryByText(/Minimum bet/i)).not.toBeInTheDocument();
      });
    });

    it('should accept R$ 10.00', async () => {
      render(<BetForm />);
      
      const input = screen.getByLabelText(/bet amount/i);
      
      // User enters R$ 10.00 (1000 centavos)
      fireEvent.change(input, { target: { value: '10,00' } });
      
      await waitFor(() => {
        expect(screen.queryByText(/Minimum bet/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Maximum bet validation (R$ 1000.00 / 100000 centavos)', () => {
    it('should show error for amounts above R$ 1000.00', async () => {
      render(<BetForm />);
      
      const input = screen.getByLabelText(/bet amount/i);
      
      // User enters R$ 1001.00 (100100 centavos, above maximum)
      fireEvent.change(input, { target: { value: '1001,00' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Maximum bet is R\$ 1\.000,00/i)).toBeInTheDocument();
      });
    });

    it('should show error for R$ 2000.00', async () => {
      render(<BetForm />);
      
      const input = screen.getByLabelText(/bet amount/i);
      
      // User enters R$ 2000.00 (200000 centavos, above maximum)
      fireEvent.change(input, { target: { value: '2000,00' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Maximum bet is R\$ 1\.000,00/i)).toBeInTheDocument();
      });
    });

    it('should accept R$ 1000.00 (maximum)', async () => {
      // Set balance high enough
      vi.mocked(useWalletStore).mockReturnValue({
        balance: 100000, // R$ 1000.00 in centavos
        lastBetAmount: 0,
        setLastBetAmount: vi.fn(),
      } as any);
      
      render(<BetForm />);
      
      const input = screen.getByLabelText(/bet amount/i);
      
      // User enters R$ 1000.00 (100000 centavos, exactly maximum)
      fireEvent.change(input, { target: { value: '1000,00' } });
      
      await waitFor(() => {
        expect(screen.queryByText(/Maximum bet/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Balance validation', () => {
    it('should show error when bet exceeds balance', async () => {
      // Set balance to R$ 5.00 (500 centavos)
      vi.mocked(useWalletStore).mockReturnValue({
        balance: 500,
        lastBetAmount: 0,
        setLastBetAmount: vi.fn(),
      } as any);
      
      render(<BetForm />);
      
      const input = screen.getByLabelText(/bet amount/i);
      
      // User enters R$ 10.00 (1000 centavos, exceeds balance)
      fireEvent.change(input, { target: { value: '10,00' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Insufficient balance/i)).toBeInTheDocument();
      });
    });

    it('should accept bet equal to balance', async () => {
      // Set balance to R$ 10.00 (1000 centavos)
      vi.mocked(useWalletStore).mockReturnValue({
        balance: 1000,
        lastBetAmount: 0,
        setLastBetAmount: vi.fn(),
      } as any);
      
      render(<BetForm />);
      
      const input = screen.getByLabelText(/bet amount/i);
      
      // User enters R$ 10.00 (1000 centavos, equals balance)
      fireEvent.change(input, { target: { value: '10,00' } });
      
      await waitFor(() => {
        expect(screen.queryByText(/Insufficient balance/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error message display', () => {
    it('should display correct error message format for minimum', async () => {
      render(<BetForm />);
      
      const input = screen.getByLabelText(/bet amount/i);
      fireEvent.change(input, { target: { value: '0,50' } });
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/Minimum bet is R\$ 1\.00/i);
        expect(errorMessage).toBeInTheDocument();
        // Check for red color class (text-red-600 or text-red-400 for dark mode)
        expect(errorMessage.className).toMatch(/text-red/);
      });
    });

    it('should display correct error message format for maximum', async () => {
      render(<BetForm />);
      
      const input = screen.getByLabelText(/bet amount/i);
      fireEvent.change(input, { target: { value: '1500,00' } });
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/Maximum bet is R\$ 1\.000,00/i);
        expect(errorMessage).toBeInTheDocument();
        // Check for red color class (text-red-600 or text-red-400 for dark mode)
        expect(errorMessage.className).toMatch(/text-red/);
      });
    });

    it('should display correct error message format for insufficient balance', async () => {
      vi.mocked(useWalletStore).mockReturnValue({
        balance: 500, // R$ 5.00
        lastBetAmount: 0,
        setLastBetAmount: vi.fn(),
      } as any);
      
      render(<BetForm />);
      
      const input = screen.getByLabelText(/bet amount/i);
      fireEvent.change(input, { target: { value: '10,00' } });
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/Insufficient balance/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent('R$ 5,00'); // Current balance
        expect(errorMessage).toHaveTextContent('R$ 10,00'); // Required amount
      });
    });
  });

  describe('Decimal input handling', () => {
    it('should handle decimal inputs with comma', async () => {
      render(<BetForm />);
      
      const input = screen.getByLabelText(/bet amount/i);
      
      // User enters R$ 10.50 with comma
      fireEvent.change(input, { target: { value: '10,50' } });
      
      await waitFor(() => {
        expect(screen.queryByText(/Minimum bet/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Maximum bet/i)).not.toBeInTheDocument();
      });
    });

    it('should handle decimal inputs with period', async () => {
      render(<BetForm />);
      
      const input = screen.getByLabelText(/bet amount/i);
      
      // User enters R$ 10.50 with period
      fireEvent.change(input, { target: { value: '10.50' } });
      
      await waitFor(() => {
        expect(screen.queryByText(/Minimum bet/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Maximum bet/i)).not.toBeInTheDocument();
      });
    });
  });
});
