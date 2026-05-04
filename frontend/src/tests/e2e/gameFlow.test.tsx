import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MultiplierDisplay } from '../../components/game/MultiplierDisplay';
import { BetForm } from '../../components/game/BetForm';
import { CashOutButton } from '../../components/game/CashOutButton';
import { useGameStore } from '../../store/gameStore';
import { useWalletStore } from '../../store/walletStore';
import { gameService } from '../../services/gameService';

// Mock services
vi.mock('../../services/gameService');
vi.mock('../../hooks/useNotification', () => ({
  useNotification: () => ({
    addNotification: vi.fn(),
  }),
}));

const mockGameService = vi.mocked(gameService);

describe('Game Flow E2E Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Reset stores to initial state
    useGameStore.setState({
      currentRound: null,
      currentMultiplier: 1.0,
      roundState: 'BETTING',
      playerBet: null,
      recentRounds: [],
    });

    useWalletStore.setState({
      balance: 50000, // R$ 500.00
      lastBetAmount: 0,
    });

    // Mock game service responses
    mockGameService.placeBet.mockResolvedValue({
      success: true,
      data: {
        id: 'bet-123',
        amount: 1000,
        state: 'ACTIVE',
        playerId: 'player-123',
        roundId: 'round-123',
      },
    });

    mockGameService.cashOut.mockResolvedValue({
      success: true,
      data: {
        multiplier: 2.5,
        payout: 2500,
      },
    });
  });

  describe('Multiplier Display Component', () => {
    it('should display current multiplier correctly', () => {
      render(<MultiplierDisplay />);
      
      // Should show initial multiplier
      expect(screen.getByText('1.00x')).toBeInTheDocument();
      expect(screen.getByText('Waiting for next round...')).toBeInTheDocument();
    });

    it('should show LIVE badge during RUNNING phase', () => {
      // Set running state
      useGameStore.setState({
        roundState: 'RUNNING',
        currentMultiplier: 1.5,
      });

      render(<MultiplierDisplay />);
      
      expect(screen.getByText('LIVE')).toBeInTheDocument();
      expect(screen.getByText('1.50x')).toBeInTheDocument();
    });

    it('should show CRASHED state when round crashes', () => {
      // Set crashed state
      useGameStore.setState({
        roundState: 'CRASHED',
        currentMultiplier: 2.34,
      });

      render(<MultiplierDisplay />);
      
      expect(screen.getByText('CRASHED')).toBeInTheDocument();
      expect(screen.getByText('2.34x')).toBeInTheDocument();
    });

    it('should apply correct color coding based on multiplier value', () => {
      // Test low multiplier (green)
      useGameStore.setState({
        roundState: 'RUNNING',
        currentMultiplier: 1.5,
      });

      const { rerender } = render(<MultiplierDisplay />);
      
      let multiplierElement = screen.getByText('1.50x');
      expect(multiplierElement).toHaveClass('text-green-500');

      // Test medium multiplier (yellow)
      useGameStore.setState({
        currentMultiplier: 3.0,
      });

      rerender(<MultiplierDisplay />);
      multiplierElement = screen.getByText('3.00x');
      expect(multiplierElement).toHaveClass('text-yellow-500');

      // Test high multiplier (red)
      useGameStore.setState({
        currentMultiplier: 7.5,
      });

      rerender(<MultiplierDisplay />);
      multiplierElement = screen.getByText('7.50x');
      expect(multiplierElement).toHaveClass('text-red-500');
    });
  });

  describe('Bet Form Component', () => {
    it('should allow bet placement during betting phase', async () => {
      render(
        <MemoryRouter>
          <BetForm />
        </MemoryRouter>
      );

      const betInput = screen.getByLabelText('Bet amount in reais');
      const placeBetButton = screen.getByRole('button', { name: 'Place Bet' });

      // Enter bet amount
      await user.type(betInput, '10,00');
      
      // Place bet
      await user.click(placeBetButton);

      // Verify service was called
      await waitFor(() => {
        expect(mockGameService.placeBet).toHaveBeenCalledWith(1000);
      });
    });

    it('should validate minimum bet amount', async () => {
      render(
        <MemoryRouter>
          <BetForm />
        </MemoryRouter>
      );

      const betInput = screen.getByLabelText('Bet amount in reais');
      const placeBetButton = screen.getByRole('button', { name: 'Place Bet' });

      // Enter amount below minimum
      await user.type(betInput, '0,50');

      await waitFor(() => {
        expect(screen.getByText('Minimum bet is R$ 1,00')).toBeInTheDocument();
        expect(placeBetButton).toBeDisabled();
      });
    });

    it('should validate maximum bet amount', async () => {
      render(
        <MemoryRouter>
          <BetForm />
        </MemoryRouter>
      );

      const betInput = screen.getByLabelText('Bet amount in reais');
      const placeBetButton = screen.getByRole('button', { name: 'Place Bet' });

      // Enter amount above maximum
      await user.type(betInput, '1500,00');

      await waitFor(() => {
        expect(screen.getByText('Maximum bet is R$ 1.000,00')).toBeInTheDocument();
        expect(placeBetButton).toBeDisabled();
      });
    });

    it('should validate insufficient balance', async () => {
      render(
        <MemoryRouter>
          <BetForm />
        </MemoryRouter>
      );

      const betInput = screen.getByLabelText('Bet amount in reais');
      const placeBetButton = screen.getByRole('button', { name: 'Place Bet' });

      // Enter amount above balance
      await user.type(betInput, '600,00');

      await waitFor(() => {
        expect(screen.getByText(/Insufficient balance/)).toBeInTheDocument();
        expect(placeBetButton).toBeDisabled();
      });
    });

    it('should disable betting during RUNNING phase', () => {
      // Set running state
      useGameStore.setState({
        roundState: 'RUNNING',
      });

      render(
        <MemoryRouter>
          <BetForm />
        </MemoryRouter>
      );

      const placeBetButton = screen.getByRole('button', { name: 'Place Bet' });
      expect(placeBetButton).toBeDisabled();
      expect(screen.getByText('Betting is closed for this round')).toBeInTheDocument();
    });

    it('should handle quick bet buttons', async () => {
      // Set last bet amount
      useWalletStore.setState({
        lastBetAmount: 1000, // R$ 10.00
      });

      render(
        <MemoryRouter>
          <BetForm />
        </MemoryRouter>
      );

      const betInput = screen.getByLabelText('Bet amount in reais');
      const maxButton = screen.getByRole('button', { name: /max/i });

      // Click max button
      await user.click(maxButton);

      // Should set to maximum allowed (balance or max bet limit)
      await waitFor(() => {
        expect(betInput).toHaveValue('500,00'); // Balance is R$ 500.00
      });
    });
  });

  describe('Cash Out Button Component', () => {
    it('should not render when no active bet', () => {
      render(<CashOutButton />);
      
      // Should not render anything
      expect(screen.queryByText(/CASH OUT/)).not.toBeInTheDocument();
    });

    it('should render with correct payout when bet is active', () => {
      // Set active bet
      useGameStore.setState({
        roundState: 'RUNNING',
        currentMultiplier: 2.0,
        playerBet: {
          id: 'bet-123',
          amount: 1000, // R$ 10.00
          state: 'ACTIVE',
          playerId: 'player-123',
          roundId: 'round-123',
        },
      });

      render(<CashOutButton />);
      
      expect(screen.getByText(/CASH OUT/)).toBeInTheDocument();
      expect(screen.getByText('R$ 20,00')).toBeInTheDocument(); // 1000 * 2.0 / 100
      expect(screen.getByText('at 2.00x')).toBeInTheDocument();
    });

    it('should handle cash out action', async () => {
      // Set active bet
      useGameStore.setState({
        roundState: 'RUNNING',
        currentMultiplier: 2.5,
        playerBet: {
          id: 'bet-123',
          amount: 1000,
          state: 'ACTIVE',
          playerId: 'player-123',
          roundId: 'round-123',
        },
      });

      render(<CashOutButton />);
      
      const cashOutButton = screen.getByText(/CASH OUT/);
      await user.click(cashOutButton);

      // Verify service was called
      await waitFor(() => {
        expect(mockGameService.cashOut).toHaveBeenCalled();
      });
    });

    it('should be disabled during betting phase', () => {
      // Set active bet but in betting phase
      useGameStore.setState({
        roundState: 'BETTING',
        currentMultiplier: 1.0,
        playerBet: {
          id: 'bet-123',
          amount: 1000,
          state: 'ACTIVE',
          playerId: 'player-123',
          roundId: 'round-123',
        },
      });

      render(<CashOutButton />);
      
      const cashOutButton = screen.getByText(/CASH OUT/);
      expect(cashOutButton).toBeDisabled();
    });

    it('should update payout in real-time as multiplier changes', () => {
      // Set active bet
      useGameStore.setState({
        roundState: 'RUNNING',
        currentMultiplier: 1.5,
        playerBet: {
          id: 'bet-123',
          amount: 1000, // R$ 10.00
          state: 'ACTIVE',
          playerId: 'player-123',
          roundId: 'round-123',
        },
      });

      const { rerender } = render(<CashOutButton />);
      
      // Initial payout
      expect(screen.getByText('R$ 15,00')).toBeInTheDocument(); // 1000 * 1.5 / 100

      // Update multiplier
      useGameStore.setState({
        currentMultiplier: 3.0,
      });

      rerender(<CashOutButton />);
      
      // Updated payout
      expect(screen.getByText('R$ 30,00')).toBeInTheDocument(); // 1000 * 3.0 / 100
    });
  });

  describe('Complete Game Flow Integration', () => {
    it('should handle complete betting and cash out flow', async () => {
      const TestGameFlow = () => (
        <MemoryRouter>
          <div>
            <MultiplierDisplay />
            <BetForm />
            <CashOutButton />
          </div>
        </MemoryRouter>
      );

      render(<TestGameFlow />);

      // 1. Initial state - betting phase
      expect(screen.getByText('1.00x')).toBeInTheDocument();
      expect(screen.getByText('Waiting for next round...')).toBeInTheDocument();

      // 2. Place a bet
      const betInput = screen.getByLabelText('Bet amount in reais');
      const placeBetButton = screen.getByRole('button', { name: 'Place Bet' });

      await user.type(betInput, '10,00');
      await user.click(placeBetButton);

      // Verify bet was placed
      await waitFor(() => {
        expect(mockGameService.placeBet).toHaveBeenCalledWith(1000);
      });

      // 3. Simulate round starting with active bet
      useGameStore.setState({
        roundState: 'RUNNING',
        currentMultiplier: 1.5,
        playerBet: {
          id: 'bet-123',
          amount: 1000,
          state: 'ACTIVE',
          playerId: 'player-123',
          roundId: 'round-123',
        },
      });

      // 4. Verify UI updates for running phase
      await waitFor(() => {
        expect(screen.getByText('LIVE')).toBeInTheDocument();
        expect(screen.getByText('1.50x')).toBeInTheDocument();
        expect(screen.getByText(/CASH OUT/)).toBeInTheDocument();
        expect(screen.getByText('R$ 15,00')).toBeInTheDocument(); // Potential payout
      });

      // 5. Simulate multiplier increase
      useGameStore.setState({
        currentMultiplier: 2.5,
      });

      // 6. Verify payout updates
      await waitFor(() => {
        expect(screen.getByText('2.50x')).toBeInTheDocument();
        expect(screen.getByText('R$ 25,00')).toBeInTheDocument(); // Updated payout
      });

      // 7. Cash out
      const cashOutButton = screen.getByText(/CASH OUT/);
      await user.click(cashOutButton);

      // Verify cash out was called
      await waitFor(() => {
        expect(mockGameService.cashOut).toHaveBeenCalled();
      });

      // 8. Simulate round crash
      useGameStore.setState({
        roundState: 'CRASHED',
        playerBet: null,
      });

      // 9. Verify crash state
      await waitFor(() => {
        expect(screen.getByText('CRASHED')).toBeInTheDocument();
        expect(screen.queryByText(/CASH OUT/)).not.toBeInTheDocument();
      });
    });

    it('should handle bet loss scenario', async () => {
      const TestGameFlow = () => (
        <MemoryRouter>
          <div>
            <MultiplierDisplay />
            <BetForm />
            <CashOutButton />
          </div>
        </MemoryRouter>
      );

      render(<TestGameFlow />);

      // 1. Place a bet
      const betInput = screen.getByLabelText('Bet amount in reais');
      const placeBetButton = screen.getByRole('button', { name: 'Place Bet' });

      await user.type(betInput, '20,00');
      await user.click(placeBetButton);

      await waitFor(() => {
        expect(mockGameService.placeBet).toHaveBeenCalledWith(2000);
      });

      // 2. Simulate round starting with active bet
      useGameStore.setState({
        roundState: 'RUNNING',
        currentMultiplier: 1.8,
        playerBet: {
          id: 'bet-456',
          amount: 2000,
          state: 'ACTIVE',
          playerId: 'player-123',
          roundId: 'round-456',
        },
      });

      // 3. Verify cash out button is available
      await waitFor(() => {
        expect(screen.getByText(/CASH OUT/)).toBeInTheDocument();
        expect(screen.getByText('R$ 36,00')).toBeInTheDocument(); // 2000 * 1.8 / 100
      });

      // 4. Simulate round crash before cash out
      useGameStore.setState({
        roundState: 'CRASHED',
        currentMultiplier: 1.8,
        playerBet: null, // Bet is lost
      });

      // 5. Verify crash state and no cash out button
      await waitFor(() => {
        expect(screen.getByText('CRASHED')).toBeInTheDocument();
        expect(screen.queryByText(/CASH OUT/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design Tests', () => {
    it('should render components with responsive classes', () => {
      render(
        <MemoryRouter>
          <div>
            <MultiplierDisplay />
            <BetForm />
          </div>
        </MemoryRouter>
      );

      // Check for responsive text sizing in multiplier
      const multiplierElement = screen.getByText('1.00x');
      expect(multiplierElement).toHaveClass('text-6xl', 'md:text-7xl');

      // Check for responsive grid in bet form
      const quickBetContainer = screen.getByText('1x').closest('.grid');
      expect(quickBetContainer).toHaveClass('grid-cols-4');
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <MemoryRouter>
          <div>
            <MultiplierDisplay />
            <BetForm />
          </div>
        </MemoryRouter>
      );

      // Check ARIA labels
      expect(screen.getByLabelText('Bet amount in reais')).toBeInTheDocument();
      expect(screen.getByLabelText(/Current multiplier/)).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /Current multiplier display/ })).toBeInTheDocument();

      // Check button accessibility
      expect(screen.getByRole('button', { name: 'Place Bet' })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(
        <MemoryRouter>
          <BetForm />
        </MemoryRouter>
      );

      const betInput = screen.getByLabelText('Bet amount in reais');
      
      // Tab to input
      await user.tab();
      expect(betInput).toHaveFocus();

      // Enter amount and submit with Enter key
      await user.type(betInput, '15,00');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockGameService.placeBet).toHaveBeenCalledWith(1500);
      });
    });
  });
});