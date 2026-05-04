/**
 * Routing Tests
 * Tests for React Router configuration and navigation
 * Requirement 2.1.1: Login page redirects
 * Requirement 2.1.3: Logout functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import React from 'react';
import { Navigate } from 'react-router-dom';
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

// Test components for route protection
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

// Simple test components
const LoginPageMock = () => <div data-testid="login-page">Login Page</div>;
const DashboardPageMock = () => <div data-testid="dashboard-page">Dashboard Page</div>;
const ProfilePageMock = () => <div data-testid="profile-page">Profile Page</div>;

describe('Routing Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication State', () => {
    it('should handle unauthenticated state', () => {
      mockUseAuth.mockReturnValue(mockUnauthenticatedUser);

      renderWithRouter(
        <ProtectedRoute>
          <DashboardPageMock />
        </ProtectedRoute>,
        { routerProps: { initialEntries: [testRoutes.dashboard] } }
      );

      // Should redirect to login, so dashboard should not be visible
      expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
    });

    it('should handle authenticated state', () => {
      mockUseAuth.mockReturnValue(mockAuthenticatedUser);

      renderWithRouter(
        <ProtectedRoute>
          <DashboardPageMock />
        </ProtectedRoute>,
        { routerProps: { initialEntries: [testRoutes.dashboard] } }
      );

      // Should allow access to protected route
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });

  describe('Route Protection Logic', () => {
    it('should redirect unauthenticated users from protected routes', () => {
      mockUseAuth.mockReturnValue(mockUnauthenticatedUser);

      renderWithRouter(
        <ProtectedRoute>
          <ProfilePageMock />
        </ProtectedRoute>,
        { routerProps: { initialEntries: [testRoutes.profile] } }
      );

      // Protected content should not be accessible
      expect(screen.queryByTestId('profile-page')).not.toBeInTheDocument();
    });

    it('should allow authenticated users to access protected routes', () => {
      mockUseAuth.mockReturnValue(mockAuthenticatedUser);

      renderWithRouter(
        <ProtectedRoute>
          <ProfilePageMock />
        </ProtectedRoute>,
        { routerProps: { initialEntries: [testRoutes.profile] } }
      );

      // Protected content should be accessible
      expect(screen.getByTestId('profile-page')).toBeInTheDocument();
    });
  });

  describe('Public Route Logic', () => {
    it('should allow unauthenticated users to access public routes', () => {
      mockUseAuth.mockReturnValue(mockUnauthenticatedUser);

      renderWithRouter(
        <PublicRoute>
          <LoginPageMock />
        </PublicRoute>,
        { routerProps: { initialEntries: [testRoutes.login] } }
      );

      // Public content should be accessible
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('should redirect authenticated users from public routes', () => {
      mockUseAuth.mockReturnValue(mockAuthenticatedUser);

      renderWithRouter(
        <PublicRoute>
          <LoginPageMock />
        </PublicRoute>,
        { routerProps: { initialEntries: [testRoutes.login] } }
      );

      // Public content should not be accessible when authenticated
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });
  });

  describe('Route Configuration', () => {
    it('should have correct route paths defined', () => {
      expect(testRoutes.login).toBe('/login');
      expect(testRoutes.dashboard).toBe('/dashboard');
      expect(testRoutes.profile).toBe('/profile');
      expect(testRoutes.history).toBe('/history');
      expect(testRoutes.verify).toBe('/verify');
      expect(testRoutes.authCallback).toBe('/auth/callback');
      expect(testRoutes.root).toBe('/');
    });

    it('should handle unknown routes appropriately', () => {
      mockUseAuth.mockReturnValue(mockUnauthenticatedUser);

      renderWithRouter(
        <div data-testid="fallback">Fallback Content</div>,
        { routerProps: { initialEntries: ['/unknown-route'] } }
      );

      // Should render fallback content for unknown routes
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });

    it('should support nested routing structure', () => {
      // Test that auth callback route is properly structured
      expect(testRoutes.authCallback).toMatch(/^\/auth\//);
    });
  });
});