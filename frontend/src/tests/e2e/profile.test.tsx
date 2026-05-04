/**
 * E2E Tests for Profile Page
 * Requirement 12.6: Write E2E tests for profile page
 * 
 * Tests the complete profile page functionality:
 * 1. Profile page displays user information correctly
 * 2. Player statistics are loaded and displayed
 * 3. Theme toggle functionality works
 * 4. Sound toggle functionality works
 * 5. Statistics refresh functionality
 * 6. Navigation and accessibility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProfilePage } from '../../pages/ProfilePage';
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

// Mock React Router hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

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
    {
      id: 'bet-3',
      roundId: 'round-3',
      playerId: 'player-123',
      amount: 20000, // R$ 200.00
      state: 'WON' as const,
      cashedOutAt: 1.8,
      payout: 36000, // R$ 360.00
      createdAt: '2024-01-15T12:00:00Z',
    },
  ],
  page: 1,
  pageSize: 1000,
  total: 3,
  totalPages: 1,
};

describe('Profile Page E2E Tests', () => {
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

  describe('Profile Page Display', () => {
    it('should display user information correctly', async () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });

      // Check page title
      expect(screen.getByText('Profile')).toBeInTheDocument();

      // Check user information section
      expect(screen.getByText('Account Information')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('player-123')).toBeInTheDocument();
      expect(screen.getByText('January 15, 2024')).toBeInTheDocument(); // Mock account creation date
      expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument(); // Current balance
    });

    it('should display player statistics correctly', async () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      // Wait for statistics to load
      await waitFor(() => {
        expect(screen.getByText('Player Statistics')).toBeInTheDocument();
      });

      // Check calculated statistics
      expect(screen.getByText('3')).toBeInTheDocument(); // Total bets
      expect(screen.getByText('R$ 350,00')).toBeInTheDocument(); // Total wagered (100+50+200)
      expect(screen.getByText('R$ 610,00')).toBeInTheDocument(); // Total won (250+360)
      expect(screen.getByText('66.7%')).toBeInTheDocument(); // Win rate (2/3 * 100)
      expect(screen.getByText('2.15x')).toBeInTheDocument(); // Average multiplier ((2.5+1.8)/2)

      // Check statistic labels
      expect(screen.getByText('Total Bets')).toBeInTheDocument();
      expect(screen.getByText('Total Wagered')).toBeInTheDocument();
      expect(screen.getByText('Total Won')).toBeInTheDocument();
      expect(screen.getByText('Win Rate')).toBeInTheDocument();
      expect(screen.getByText('Avg Multiplier')).toBeInTheDocument();
    });

    it('should display settings section with theme and sound toggles', async () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Check theme toggle
      expect(screen.getByText('Theme')).toBeInTheDocument();
      expect(screen.getByText('Choose your preferred theme')).toBeInTheDocument();
      expect(screen.getByText('Light')).toBeInTheDocument();

      // Check sound toggle
      expect(screen.getByText('Sound Effects')).toBeInTheDocument();
      expect(screen.getByText('Enable or disable game sounds')).toBeInTheDocument();
      expect(screen.getByText('On')).toBeInTheDocument();
    });

    it('should handle empty statistics gracefully', async () => {
      mockGameService.getPlayerBetHistory.mockResolvedValue({
        data: [],
        page: 1,
        pageSize: 1000,
        total: 0,
        totalPages: 0,
      });

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No betting history available yet.')).toBeInTheDocument();
      });
    });
  });

  describe('Theme Toggle Functionality', () => {
    it('should toggle theme from light to dark', async () => {
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

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Light')).toBeInTheDocument();
      });

      // Find and click theme toggle button
      const themeToggleButtons = screen.getAllByText('Toggle');
      const themeToggleButton = themeToggleButtons[0]; // First toggle is theme
      fireEvent.click(themeToggleButton);

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should toggle theme from dark to light', async () => {
      const mockSetTheme = vi.fn();
      mockUseUIStore.mockReturnValue({
        theme: 'dark' as const,
        soundEnabled: true,
        notifications: [],
        setTheme: mockSetTheme,
        toggleSound: vi.fn(),
        addNotification: vi.fn(),
        removeNotification: vi.fn(),
        clearNotifications: vi.fn(),
      });

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Dark')).toBeInTheDocument();
      });

      // Find and click theme toggle button
      const themeToggleButtons = screen.getAllByText('Toggle');
      const themeToggleButton = themeToggleButtons[0]; // First toggle is theme
      fireEvent.click(themeToggleButton);

      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('should display correct theme icon based on current theme', async () => {
      const { rerender } = render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      // Light theme should show moon icon (for switching to dark)
      await waitFor(() => {
        const moonIcon = screen.getByLabelText('Switch to dark theme');
        expect(moonIcon).toBeInTheDocument();
      });

      // Switch to dark theme
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

      rerender(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      // Dark theme should show sun icon (for switching to light)
      await waitFor(() => {
        const sunIcon = screen.getByLabelText('Switch to light theme');
        expect(sunIcon).toBeInTheDocument();
      });
    });
  });

  describe('Sound Toggle Functionality', () => {
    it('should toggle sound from on to off', async () => {
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

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('On')).toBeInTheDocument();
      });

      // Find and click sound toggle button
      const soundToggleButtons = screen.getAllByText('Toggle');
      const soundToggleButton = soundToggleButtons[1]; // Second toggle is sound
      fireEvent.click(soundToggleButton);

      expect(mockToggleSound).toHaveBeenCalledTimes(1);
    });

    it('should display correct sound status and icon', async () => {
      const { rerender } = render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      // Sound enabled should show "On" badge and sound icon
      await waitFor(() => {
        expect(screen.getByText('On')).toBeInTheDocument();
        const soundOnIcon = screen.getByLabelText('Turn sound off');
        expect(soundOnIcon).toBeInTheDocument();
      });

      // Switch to sound disabled
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

      rerender(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      // Sound disabled should show "Off" badge and muted icon
      await waitFor(() => {
        expect(screen.getByText('Off')).toBeInTheDocument();
        const soundOffIcon = screen.getByLabelText('Turn sound on');
        expect(soundOffIcon).toBeInTheDocument();
      });
    });
  });

  describe('Statistics Refresh Functionality', () => {
    it('should refresh statistics when refresh button is clicked', async () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

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

    it('should handle statistics loading error', async () => {
      mockGameService.getPlayerBetHistory.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load statistics. Please try again.')).toBeInTheDocument();
      });
    });

    it('should show loading state during statistics refresh', async () => {
      // Make the API call hang
      mockGameService.getPlayerBetHistory.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      // Should show loading initially
      expect(screen.getByText('Loading')).toBeInTheDocument();
    });
  });

  describe('Navigation and Accessibility', () => {
    it('should have accessible form labels and ARIA attributes', async () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for proper labels
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('Player ID')).toBeInTheDocument();
        expect(screen.getByText('Account Created')).toBeInTheDocument();
        expect(screen.getByText('Current Balance')).toBeInTheDocument();

        // Check for ARIA labels on buttons
        expect(screen.getByLabelText(/Switch to .* theme/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Turn sound .*/)).toBeInTheDocument();
      });
    });

    it('should navigate back when back button is clicked', async () => {
      // Mock window.history.back
      const mockHistoryBack = vi.fn();
      Object.defineProperty(window, 'history', {
        value: { back: mockHistoryBack },
        writable: true,
      });

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      await waitFor(() => {
        const backButton = screen.getByText('Back');
        expect(backButton).toBeInTheDocument();
      });

      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);

      expect(mockHistoryBack).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard navigable', async () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      await waitFor(() => {
        const backButton = screen.getByText('Back');
        expect(backButton).toBeInTheDocument();
      });

      // Test tab navigation
      const backButton = screen.getByText('Back');
      const themeToggleButtons = screen.getAllByText('Toggle');
      const refreshButton = screen.getByText('Refresh Statistics');

      // All interactive elements should be focusable
      expect(backButton).toHaveAttribute('tabIndex', '0');
      themeToggleButtons.forEach(button => {
        expect(button).toHaveAttribute('tabIndex', '0');
      });
      expect(refreshButton).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Responsive Design', () => {
    it('should display correctly on mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });

      // Check that layout adapts (grid should stack on mobile)
      const profileContainer = screen.getByText('Profile').closest('main');
      expect(profileContainer).toHaveClass('max-w-4xl', 'mx-auto', 'px-4');
    });

    it('should display correctly on tablet viewport', async () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });

      // Layout should use tablet-optimized spacing
      const profileContainer = screen.getByText('Profile').closest('main');
      expect(profileContainer).toHaveClass('sm:px-6');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when statistics fail to load', async () => {
      mockGameService.getPlayerBetHistory.mockRejectedValue(
        new Error('Network error')
      );

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load statistics. Please try again.')).toBeInTheDocument();
      });

      // Error should be dismissible and retryable
      const refreshButton = screen.getByText('Refresh Statistics');
      expect(refreshButton).toBeInTheDocument();
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

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });

      // Should handle null values gracefully
      expect(screen.queryByText('null')).not.toBeInTheDocument();
    });
  });
});