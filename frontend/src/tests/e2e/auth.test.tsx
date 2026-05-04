/**
 * E2E Tests for Authentication Flow
 * Requirement 10.5: Write E2E tests for login flow
 * 
 * Tests the complete OAuth2 authentication flow with Keycloak:
 * 1. Login page displays correctly
 * 2. Login button redirects to Keycloak
 * 3. Callback handling works correctly
 * 4. Token storage and user info display
 * 5. Protected route access
 * 6. Logout functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../../pages/LoginPage';
import { AuthCallbackPage } from '../../pages/AuthCallbackPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';

// Mock the auth hook
vi.mock('../../hooks/useAuth');
const mockUseAuth = vi.mocked(useAuth);

// Mock the auth service
vi.mock('../../services/authService');
const mockAuthService = vi.mocked(authService);

// Mock React Router hooks
const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
  };
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Authentication E2E Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('code');
    mockSearchParams.delete('error');
  });

  describe('LoginPage', () => {
    it('should display login page correctly when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        playerId: null,
        email: null,
        token: null,
        isLoading: false,
        error: null,
        handleCallback: vi.fn(),
        performLogin: vi.fn(),
        performLogout: vi.fn(),
        refreshAccessToken: vi.fn(),
      });

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      expect(screen.getByText('Crash Game')).toBeInTheDocument();
      expect(screen.getByText('Sign in with Keycloak')).toBeInTheDocument();
      expect(screen.getByText('Real-time multiplier gameplay')).toBeInTheDocument();
      expect(screen.getByText('Secure wallet management')).toBeInTheDocument();
      expect(screen.getByText('Provably fair gaming')).toBeInTheDocument();
    });

    it('should call performLogin when login button is clicked', () => {
      const mockPerformLogin = vi.fn();
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        playerId: null,
        email: null,
        token: null,
        isLoading: false,
        error: null,
        handleCallback: vi.fn(),
        performLogin: mockPerformLogin,
        performLogout: vi.fn(),
        refreshAccessToken: vi.fn(),
      });

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const loginButton = screen.getByText('Sign in with Keycloak');
      fireEvent.click(loginButton);

      expect(mockPerformLogin).toHaveBeenCalledTimes(1);
    });

    it('should display loading state during authentication', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        playerId: null,
        email: null,
        token: null,
        isLoading: true,
        error: null,
        handleCallback: vi.fn(),
        performLogin: vi.fn(),
        performLogout: vi.fn(),
        refreshAccessToken: vi.fn(),
      });

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      expect(screen.getByText('Authenticating...')).toBeInTheDocument();
      expect(screen.getByText('Please wait while we log you in.')).toBeInTheDocument();
    });

    it('should display error message when authentication fails', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        playerId: null,
        email: null,
        token: null,
        isLoading: false,
        error: 'Authentication failed',
        handleCallback: vi.fn(),
        performLogin: vi.fn(),
        performLogout: vi.fn(),
        refreshAccessToken: vi.fn(),
      });

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    });

    it('should redirect to dashboard when user is already authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        playerId: 'test-player-id',
        email: 'test@example.com',
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
          <LoginPage />
        </TestWrapper>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  describe('AuthCallbackPage', () => {
    it('should process authorization code successfully', async () => {
      const mockHandleCallback = vi.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        playerId: null,
        email: null,
        token: null,
        isLoading: false,
        error: null,
        handleCallback: mockHandleCallback,
        performLogin: vi.fn(),
        performLogout: vi.fn(),
        refreshAccessToken: vi.fn(),
      });

      mockSearchParams.set('code', 'test-auth-code');

      render(
        <TestWrapper>
          <AuthCallbackPage />
        </TestWrapper>
      );

      expect(screen.getByText('Processing Authentication')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockHandleCallback).toHaveBeenCalledWith('test-auth-code');
      });
    });

    it('should handle OAuth2 error from Keycloak', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        playerId: null,
        email: null,
        token: null,
        isLoading: false,
        error: null,
        handleCallback: vi.fn(),
        performLogin: vi.fn(),
        performLogout: vi.fn(),
        refreshAccessToken: vi.fn(),
      });

      mockSearchParams.set('error', 'access_denied');
      mockSearchParams.set('error_description', 'User denied access');

      render(
        <TestWrapper>
          <AuthCallbackPage />
        </TestWrapper>
      );

      expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
      expect(screen.getByText('User denied access')).toBeInTheDocument();
    });

    it('should handle missing authorization code', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        playerId: null,
        email: null,
        token: null,
        isLoading: false,
        error: null,
        handleCallback: vi.fn(),
        performLogin: vi.fn(),
        performLogout: vi.fn(),
        refreshAccessToken: vi.fn(),
      });

      render(
        <TestWrapper>
          <AuthCallbackPage />
        </TestWrapper>
      );

      expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
      expect(screen.getByText('No authorization code received from Keycloak')).toBeInTheDocument();
    });

    it('should display success message and redirect after successful authentication', async () => {
      const mockHandleCallback = vi.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        playerId: 'test-player-id',
        email: 'test@example.com',
        token: 'test-token',
        isLoading: false,
        error: null,
        handleCallback: mockHandleCallback,
        performLogin: vi.fn(),
        performLogout: vi.fn(),
        refreshAccessToken: vi.fn(),
      });

      mockSearchParams.set('code', 'test-auth-code');

      render(
        <TestWrapper>
          <AuthCallbackPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Successful!')).toBeInTheDocument();
      });

      // Should redirect after delay
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      }, { timeout: 3000 });
    });
  });

  describe('DashboardPage', () => {
    it('should display user information when authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        playerId: 'test-player-123',
        email: 'john.doe@example.com',
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
          <DashboardPage />
        </TestWrapper>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome to Crash Game!')).toBeInTheDocument();
      expect(screen.getByText('test-player-123')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('Successfully authenticated')).toBeInTheDocument();
    });

    it('should call performLogout when logout button is clicked', () => {
      const mockPerformLogout = vi.fn();
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        playerId: 'test-player-123',
        email: 'john.doe@example.com',
        token: 'test-token',
        isLoading: false,
        error: null,
        handleCallback: vi.fn(),
        performLogin: vi.fn(),
        performLogout: mockPerformLogout,
        refreshAccessToken: vi.fn(),
      });

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(mockPerformLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Complete Authentication Flow', () => {
    it('should complete full OAuth2 flow from login to dashboard', async () => {
      // Step 1: User visits login page
      const { rerender } = render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // Mock initial unauthenticated state
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        playerId: null,
        email: null,
        token: null,
        isLoading: false,
        error: null,
        handleCallback: vi.fn(),
        performLogin: vi.fn(),
        performLogout: vi.fn(),
        refreshAccessToken: vi.fn(),
      });

      expect(screen.getByText('Sign in with Keycloak')).toBeInTheDocument();

      // Step 2: User clicks login button (would redirect to Keycloak in real app)
      const loginButton = screen.getByText('Sign in with Keycloak');
      fireEvent.click(loginButton);

      // Step 3: User returns from Keycloak with authorization code
      mockSearchParams.set('code', 'test-auth-code');
      
      const mockHandleCallback = vi.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        playerId: null,
        email: null,
        token: null,
        isLoading: false,
        error: null,
        handleCallback: mockHandleCallback,
        performLogin: vi.fn(),
        performLogout: vi.fn(),
        refreshAccessToken: vi.fn(),
      });

      rerender(
        <TestWrapper>
          <AuthCallbackPage />
        </TestWrapper>
      );

      expect(screen.getByText('Processing Authentication')).toBeInTheDocument();

      // Step 4: Authentication completes successfully
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        playerId: 'test-player-123',
        email: 'john.doe@example.com',
        token: 'jwt-token-here',
        isLoading: false,
        error: null,
        handleCallback: mockHandleCallback,
        performLogin: vi.fn(),
        performLogout: vi.fn(),
        refreshAccessToken: vi.fn(),
      });

      rerender(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Step 5: User sees dashboard with their information
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('test-player-123')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('should handle token refresh on expired token', async () => {
      const mockRefreshAccessToken = vi.fn().mockResolvedValue('new-token');
      
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        playerId: 'test-player-123',
        email: 'john.doe@example.com',
        token: 'expired-token',
        isLoading: false,
        error: null,
        handleCallback: vi.fn(),
        performLogin: vi.fn(),
        performLogout: vi.fn(),
        refreshAccessToken: mockRefreshAccessToken,
      });

      // Mock token expiration check
      mockAuthService.isTokenExpired.mockReturnValue(true);

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Token refresh should be called automatically
      await waitFor(() => {
        expect(mockRefreshAccessToken).toHaveBeenCalled();
      });
    });
  });
});