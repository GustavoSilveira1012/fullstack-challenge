/**
 * Unit Tests for ProfilePage Component
 * Requirement 12.6: Write E2E tests for profile page
 * 
 * Tests the ProfilePage component functionality:
 * 1. Component renders without crashing
 * 2. User information is displayed correctly
 * 3. Theme and sound toggles work
 * 4. Statistics are calculated and displayed
 * 5. Error handling works properly
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfilePage } from '../ProfilePage';
import { useAuth } from '../../hooks/useAuth';
import { useWallet } from '../../hooks/useWallet';
import { useUIStore } from '../../store/uiStore';
import { gameService } from '../../services/gameService';

// Mock the hooks and services
vi.mock('../../hooks/useAuth');
vi.mock('../../hooks/useWallet');
vi.mock('../../store/uiStore');
vi.mock('../../services/gameService');

const mockUseAuth = vi.mocked(useAuth);
const mockUseWallet = vi.mocked(useWallet);
const mockUseUIStore = vi.mocked(useUIStore);
const mockGameService = vi.mocked(gameService);

// Mock data
const mockPlayerBetHistory = {
  data: [
    {
      id: 'bet-1',
      roundId: 'round-1',
      playerId: 'player-123',
      amount: 10000, // R$ 100.00
      state: 'WON' as const,
      cashedOutAt: 2.5,
      payout: 25000, // R$ 250.00
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'bet-2',
      roundId: 'round-2',
      playerId: 'player-123',
      amount: 5000, // R$ 50.00
      state: 'LOST' as const,
      cashedOutAt: null,
      payout: null,
      createdAt: '2024-01-15T11:00:00Z',
    },
  ],
  page: 1,
  pageSize: 1000,
  total: 2,
  totalPages: 1,
};

describe('ProfilePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      playerId: 'player-123',
      email: 'john.doe@example.com',
      token: 'test-token',
      isLoading: false,
      error: null,
      handleCallback: vi.fn(),
      performLogin: vi.fn(),
      performLogout: vi.fn(),
      refreshAccessToken: vi.fn(),
    });

    mockUseWallet.mockReturnValue({
      balance: 150000, // R$ 1,500.00
      formatBalance: (amount: number) => `R$ ${(amount / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      isLoading: false,
      error: null,
      fetchBalance: vi.fn(),
      updateBalance: vi.fn(),
    });

    mockUseUIStore.mockReturnValue({
      theme: 'light' as const,
      soundEnabled: true,
      notifications: [],
      setTheme: vi.fn(),
      toggleSound: vi.fn(),
      addNotification: vi.fn(),
      removeNotification: vi.fn(),
      clearNotifications: vi.fn(),
    });

    mockGameService.getPlayerBetHistory.mockResolvedValue(mockPlayerBetHistory);
  });

  describe('Component Rendering', () => {
    it('should render without crashing', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });
    });

    it('should display user information correctly', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Account Information')).toBeInTheDocument();
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByText('player-123')).toBeInTheDocument();
        // Check for account creation date - use a more flexible matcher
        expect(screen.getByText(/January.*2024/)).toBeInTheDocument();
      });
    });

    it('should display settings section', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Theme')).toBeInTheDocument();
        expect(screen.getByText('Sound Effects')).toBeInTheDocument();
      });
    });

    it('should display player statistics', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Player Statistics')).toBeInTheDocument();
        expect(screen.getByText('Total Bets')).toBeInTheDocument();
        expect(screen.getByText('Total Wagered')).toBeInTheDocument();
        expect(screen.getByText('Total Won')).toBeInTheDocument();
        expect(screen.getByText('Win Rate')).toBeInTheDocument();
        expect(screen.getByText('Avg Multiplier')).toBeInTheDocument();
      });
    });
  });

  describe('Theme Toggle Functionality', () => {
    it('should call setTheme when theme toggle is clicked', async () => {
      const mockSetTheme = vi.fn();
      mockUseUIStore.mockReturnValue({
        theme: 'light' as const,
        soundEnabled: true,
        notifications: [],
        setTheme: mockSetTheme,
        toggleSound: vi.fn(),
        addNotification: vi.fn(),
        removeNotification: vi.fn(),
        clearNotifications: vi.fn(),
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Light')).toBeInTheDocument();
      });

      // Find theme toggle button (first "Toggle" button)
      const toggleButtons = screen.getAllByText('Toggle');
      const themeToggleButton = toggleButtons[0];
      fireEvent.click(themeToggleButton);

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should display dark theme correctly', async () => {
      mockUseUIStore.mockReturnValue({
        theme: 'dark' as const,
        soundEnabled: true,
        notifications: [],
        setTheme: vi.fn(),
        toggleSound: vi.fn(),
        addNotification: vi.fn(),
        removeNotification: vi.fn(),
        clearNotifications: vi.fn(),
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Dark')).toBeInTheDocument();
      });
    });
  });

  describe('Sound Toggle Functionality', () => {
    it('should call toggleSound when sound toggle is clicked', async () => {
      const mockToggleSound = vi.fn();
      mockUseUIStore.mockReturnValue({
        theme: 'light' as const,
        soundEnabled: true,
        notifications: [],
        setTheme: vi.fn(),
        toggleSound: mockToggleSound,
        addNotification: vi.fn(),
        removeNotification: vi.fn(),
        clearNotifications: vi.fn(),
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('On')).toBeInTheDocument();
      });

      // Find sound toggle button (second "Toggle" button)
      const toggleButtons = screen.getAllByText('Toggle');
      const soundToggleButton = toggleButtons[1];
      fireEvent.click(soundToggleButton);

      expect(mockToggleSound).toHaveBeenCalledTimes(1);
    });

    it('should display sound off correctly', async () => {
      mockUseUIStore.mockReturnValue({
        theme: 'light' as const,
        soundEnabled: false,
        notifications: [],
        setTheme: vi.fn(),
        toggleSound: vi.fn(),
        addNotification: vi.fn(),
        removeNotification: vi.fn(),
        clearNotifications: vi.fn(),
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Off')).toBeInTheDocument();
      });
    });
  });

  describe('Statistics Functionality', () => {
    it('should calculate and display statistics correctly', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        // Check calculated statistics
        expect(screen.getByText('2')).toBeInTheDocument(); // Total bets
        expect(screen.getByText('R$ 150,00')).toBeInTheDocument(); // Total wagered (100+50)
        expect(screen.getByText('R$ 250,00')).toBeInTheDocument(); // Total won (250)
        expect(screen.getByText('50.0%')).toBeInTheDocument(); // Win rate (1/2 * 100)
        expect(screen.getByText('2.50x')).toBeInTheDocument(); // Average multiplier (2.5/1)
      });
    });

    it('should handle empty statistics gracefully', async () => {
      mockGameService.getPlayerBetHistory.mockResolvedValue({
        data: [],
        page: 1,
        pageSize: 1000,
        total: 0,
        totalPages: 0,
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Player Statistics')).toBeInTheDocument();
      });

      // Should show zero statistics
      expect(screen.getByText('0')).toBeInTheDocument(); // Total bets should be 0
    });

    it('should refresh statistics when refresh button is clicked', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Refresh Statistics')).toBeInTheDocument();
      });

      // Clear the initial call
      mockGameService.getPlayerBetHistory.mockClear();

      // Click refresh button
      const refreshButton = screen.getByText('Refresh Statistics');
      fireEvent.click(refreshButton);

      expect(mockGameService.getPlayerBetHistory).toHaveBeenCalledWith(1, 1000);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when statistics fail to load', async () => {
      mockGameService.getPlayerBetHistory.mockRejectedValue(new Error('API Error'));

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load statistics. Please try again.')).toBeInTheDocument();
      });
    });

    it('should handle missing user data gracefully', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        playerId: null,
        email: null,
        token: 'test-token',
        isLoading: false,
        error: null,
        handleCallback: vi.fn(),
        performLogin: vi.fn(),
        performLogout: vi.fn(),
        refreshAccessToken: vi.fn(),
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });

      // Should handle null values gracefully without crashing
      expect(screen.queryByText('null')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should call window.history.back when back button is clicked', async () => {
      // Mock window.history.back
      const mockHistoryBack = vi.fn();
      Object.defineProperty(window, 'history', {
        value: { back: mockHistoryBack },
        writable: true,
      });

      render(<ProfilePage />);

      await waitFor(() => {
        const backButton = screen.getByText('Back');
        expect(backButton).toBeInTheDocument();
      });

      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);

      expect(mockHistoryBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      // Make the API call hang
      mockGameService.getPlayerBetHistory.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ProfilePage />);

      // Should show loading initially - check for loading spinner
      expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        // Check for ARIA labels on buttons - there's one in header and one in profile page
        expect(screen.getAllByLabelText(/Switch to .* theme/)).toHaveLength(2); // Header + Profile page
        expect(screen.getAllByLabelText(/Turn sound .*/)).toHaveLength(1); // Only in header (profile uses different label)
      });
    });

    it('should have proper semantic structure', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        // Check for proper headings
        expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Account Information' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Player Statistics' })).toBeInTheDocument();
      });
    });
  });
});