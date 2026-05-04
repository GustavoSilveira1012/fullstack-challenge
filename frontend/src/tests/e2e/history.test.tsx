import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryPage } from '../../pages/HistoryPage';
import { gameService } from '../../services/gameService';

// Mock the game service
vi.mock('../../services/gameService');

// Mock React Router hooks
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/history' }),
}));

/**
 * E2E Tests for HistoryPage component
 * Requirement 13.5: Write E2E tests for history and verification
 */

describe('History Page', () => {
  const mockBetHistory = {
    data: [
      {
        id: 'bet-123',
        roundId: 'round-456',
        playerId: 'player-789',
        amount: 10000, // R$ 100.00
        state: 'WON' as const,
        cashedOutAt: 2.5,
        payout: 25000, // R$ 250.00
        createdAt: new Date().toISOString()
      },
      {
        id: 'bet-124',
        roundId: 'round-457',
        playerId: 'player-789',
        amount: 5000, // R$ 50.00
        state: 'LOST' as const,
        cashedOutAt: null,
        payout: null,
        createdAt: new Date().toISOString()
      }
    ],
    page: 1,
    pageSize: 20,
    total: 2,
    totalPages: 1
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (gameService.getPlayerBetHistory as any).mockResolvedValue(mockBetHistory);
  });

  it('should display bet history page with filters', async () => {
    render(<HistoryPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Bet History')).toBeInTheDocument();
    });

    // Check page title and description
    expect(screen.getByText('Bet History')).toBeInTheDocument();
    expect(screen.getByText(/View and analyze your betting history/)).toBeInTheDocument();

    // Check filters section
    expect(screen.getByText('Filters & Sorting')).toBeInTheDocument();
    expect(screen.getByDisplayValue('all')).toBeInTheDocument(); // Status filter
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument(); // Min amount
    expect(screen.getByPlaceholderText('1000.00')).toBeInTheDocument(); // Max amount
  });

  it('should display summary statistics', async () => {
    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Bets')).toBeInTheDocument();
    });

    // Check summary cards
    expect(screen.getByText('Total Bets')).toBeInTheDocument();
    expect(screen.getByText('Won')).toBeInTheDocument();
    expect(screen.getByText('Lost')).toBeInTheDocument();
    expect(screen.getByText('Net P&L')).toBeInTheDocument();
  });

  it('should display bet history table with sortable columns', async () => {
    const user = userEvent.setup();
    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Date')).toBeInTheDocument();
    });

    // Check table headers
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Round ID')).toBeInTheDocument();
    expect(screen.getByText('Bet Amount')).toBeInTheDocument();
    expect(screen.getByText('Multiplier')).toBeInTheDocument();
    expect(screen.getByText('Payout')).toBeInTheDocument();
    expect(screen.getByText('Profit/Loss')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Test sorting by clicking on sortable columns
    const dateHeader = screen.getByText('Date');
    await user.click(dateHeader);
    expect(dateHeader.textContent).toContain('↑');
  });

  it('should filter bets by status', async () => {
    const user = userEvent.setup();
    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('all')).toBeInTheDocument();
    });

    // Select "Won" filter
    const statusSelect = screen.getByDisplayValue('all');
    await user.selectOptions(statusSelect, 'WON');
    
    expect(statusSelect).toHaveValue('WON');
  });

  it('should filter bets by amount range', async () => {
    const user = userEvent.setup();
    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    });

    // Set minimum amount filter
    const minAmountInput = screen.getByPlaceholderText('0.00');
    await user.type(minAmountInput, '10.00');
    
    // Set maximum amount filter
    const maxAmountInput = screen.getByPlaceholderText('1000.00');
    await user.type(maxAmountInput, '100.00');
    
    expect(minAmountInput).toHaveValue('10.00');
    expect(maxAmountInput).toHaveValue('100.00');
  });

  it('should clear all filters', async () => {
    const user = userEvent.setup();
    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('all')).toBeInTheDocument();
    });

    // Apply some filters
    const statusSelect = screen.getByDisplayValue('all');
    await user.selectOptions(statusSelect, 'WON');
    
    const minAmountInput = screen.getByPlaceholderText('0.00');
    await user.type(minAmountInput, '10.00');
    
    // Clear filters
    const clearButton = screen.getByText('Clear Filters');
    await user.click(clearButton);
    
    // Check that filters are reset
    expect(statusSelect).toHaveValue('all');
    expect(minAmountInput).toHaveValue('');
  });

  it('should open bet details modal', async () => {
    const user = userEvent.setup();
    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Details')).toBeInTheDocument();
    });
    
    // Click details button
    const detailsButton = screen.getByText('Details');
    await user.click(detailsButton);
    
    // Check modal is open
    expect(screen.getByText('Bet Details')).toBeInTheDocument();
    expect(screen.getByText('bet-123')).toBeInTheDocument();
    
    // Close modal
    const closeButton = screen.getByText('✕');
    await user.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Bet Details')).not.toBeInTheDocument();
    });
  });

  it('should handle empty bet history', async () => {
    (gameService.getPlayerBetHistory as any).mockResolvedValue({
      data: [],
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0
    });

    render(<HistoryPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No bets found matching your filters.')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    (gameService.getPlayerBetHistory as any).mockRejectedValue(new Error('Internal server error'));

    render(<HistoryPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Internal server error')).toBeInTheDocument();
    });
  });

  it('should refresh bet history', async () => {
    const user = userEvent.setup();
    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByText('Refresh');
    await user.click(refreshButton);
    
    // Verify API was called again
    expect(gameService.getPlayerBetHistory).toHaveBeenCalledTimes(2);
  });
});