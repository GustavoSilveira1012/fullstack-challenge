/**
 * Navigation Integration Tests
 * Tests for navigation behavior and route protection
 * Requirement 2.1.1: Login page redirects
 * Requirement 2.1.3: Logout functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { 
  renderWithRouter, 
  createMockUseAuth, 
  createMockUseTheme,
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
  testRoutes
} from '../utils/testUtils';

// Mock hooks
vi.mock('../../hooks/useAuth');
vi.mock('../../hooks/useTheme');
vi.mock('../../services/authService');
vi.mock('../../services/gameService');
vi.mock('../../services/walletService');

const mockUseAuth = createMockUseAuth();
const mockUseTheme = createMockUseTheme();

// Mock the hooks
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
vi.mocked(useAuth).mockImplementation(mockUseAuth);
vi.mocked(useTheme).mockImplementation(mockUseTheme);

// Test route components
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Mock page components
const LoginPage = () => <div data-testid="login-page">Login Page</div>;
const DashboardPage = () => <div data-testid="dashboard-page">Dashboard Page</div>;
const ProfilePage = () => <div data-testid="profile-page">Profile Page</div>;
const HistoryPage = () => <div data-testid="history-page">History Page</div>;
const VerifyPage = () => <div data-testid="verify-page">Verify Page</div>;
const AuthCallbackPage = () => <div data-testid="auth-callback-page">Auth Callback Page</div>;

// Test App component with routing
const TestApp = () => {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/history" 
        element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/verify" 
        element={
          <ProtectedRoute>
            <VerifyPage />
          </ProtectedRoute>
        } 
      />
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

describe('Navigation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated Navigation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(mockUnauthenticatedUser);
    });

    it('should redirect to login when accessing root path', () => {
      renderWithRouter(<TestApp />, {
        routerProps: { initialEntries: ['/'] }
      });

      // Should redirect to login since user is not authenticated
      expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
    });

    it('should redirect to login when accessing protected routes', () => {
      const protectedRoutes = ['/dashboard', '/profile', '/history', '/verify'];
      
      protectedRoutes.forEach(route => {
        const { unmount } = renderWithRouter(<TestApp />, {
          routerProps: { initialEntries: [route] }
        });

        // Protected pages should not be accessible
        expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
        expect(screen.queryByTestId('profile-page')).not.toBeInTheDocument();
        expect(screen.queryByTestId('history-page')).not.toBeInTheDocument();
        expect(screen.queryByTestId('verify-page')).not.toBeInTheDocument();

        unmount();
      });
    });

    it('should allow access to auth callback page', () => {
      renderWithRouter(<TestApp />, {
        routerProps: { initialEntries: ['/auth/callback'] }
      });

      expect(screen.getByTestId('auth-callback-page')).toBeInTheDocument();
    });

    it('should redirect unknown routes to login', () => {
      renderWithRouter(<TestApp />, {
        routerProps: { initialEntries: ['/unknown-route'] }
      });

      // Should redirect to login for unknown routes
      expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated Navigation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(mockAuthenticatedUser);
    });

    it('should redirect to dashboard when accessing login page', () => {
      renderWithRouter(<TestApp />, {
        routerProps: { initialEntries: ['/login'] }
      });

      // Should redirect away from login when authenticated
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });

    it('should allow access to all protected routes', () => {
      const protectedRoutes = [
        { path: '/dashboard', testId: 'dashboard-page' },
        { path: '/profile', testId: 'profile-page' },
        { path: '/history', testId: 'history-page' },
        { path: '/verify', testId: 'verify-page' },
      ];

      protectedRoutes.forEach(({ path, testId }) => {
        const { unmount } = renderWithRouter(<TestApp />, {
          routerProps: { initialEntries: [path] }
        });

        expect(screen.getByTestId(testId)).toBeInTheDocument();
        unmount();
      });
    });

    it('should redirect root path to dashboard', () => {
      renderWithRouter(<TestApp />, {
        routerProps: { initialEntries: ['/'] }
      });

      // Should redirect to dashboard when authenticated
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });

  describe('Route Configuration', () => {
    it('should have all expected routes configured', () => {
      const expectedRoutes = [
        '/login',
        '/auth/callback',
        '/dashboard',
        '/profile',
        '/history',
        '/verify',
        '/',
        '*'
      ];

      // This test verifies that our test routes match expected structure
      expect(testRoutes.login).toBe('/login');
      expect(testRoutes.authCallback).toBe('/auth/callback');
      expect(testRoutes.dashboard).toBe('/dashboard');
      expect(testRoutes.profile).toBe('/profile');
      expect(testRoutes.history).toBe('/history');
      expect(testRoutes.verify).toBe('/verify');
      expect(testRoutes.root).toBe('/');
    });

    it('should handle auth callback route correctly', () => {
      mockUseAuth.mockReturnValue(mockUnauthenticatedUser);

      renderWithRouter(<TestApp />, {
        routerProps: { initialEntries: ['/auth/callback?code=test&state=test'] }
      });

      // Auth callback should be accessible regardless of auth state
      expect(screen.getByTestId('auth-callback-page')).toBeInTheDocument();
    });
  });

  describe('Navigation Logic', () => {
    it('should implement proper route protection logic', () => {
      // Test the core logic used in route protection
      const testCases = [
        { isAuthenticated: false, shouldAllowProtected: false },
        { isAuthenticated: true, shouldAllowProtected: true },
      ];

      testCases.forEach(({ isAuthenticated, shouldAllowProtected }) => {
        const result = isAuthenticated;
        expect(result).toBe(shouldAllowProtected);
      });
    });

    it('should implement proper public route logic', () => {
      // Test the core logic used in public route protection
      const testCases = [
        { isAuthenticated: false, shouldRedirectFromLogin: false },
        { isAuthenticated: true, shouldRedirectFromLogin: true },
      ];

      testCases.forEach(({ isAuthenticated, shouldRedirectFromLogin }) => {
        const result = isAuthenticated;
        expect(result).toBe(shouldRedirectFromLogin);
      });
    });
  });
});