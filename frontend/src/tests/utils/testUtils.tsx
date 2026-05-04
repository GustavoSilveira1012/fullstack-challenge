/**
 * Test Utilities
 * Provides common test utilities and wrappers for testing React components
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { vi } from 'vitest';

// Mock data for testing
export const mockAuthenticatedUser = {
  isAuthenticated: true,
  playerId: 'test-player-id',
  email: 'test@example.com',
  token: 'mock-jwt-token',
  login: vi.fn(),
  logout: vi.fn(),
  setToken: vi.fn(),
  refreshToken: vi.fn(),
};

export const mockUnauthenticatedUser = {
  isAuthenticated: false,
  playerId: null,
  email: null,
  token: null,
  login: vi.fn(),
  logout: vi.fn(),
  setToken: vi.fn(),
  refreshToken: vi.fn(),
};

export const mockTheme = {
  theme: 'light' as const,
  setTheme: vi.fn(),
};

// Test wrapper with Router
interface TestWrapperProps {
  children: React.ReactNode;
  routerProps?: MemoryRouterProps;
}

export const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children, 
  routerProps = {} 
}) => (
  <MemoryRouter {...routerProps}>
    {children}
  </MemoryRouter>
);

// Custom render function with router
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  routerProps?: MemoryRouterProps;
}

export const renderWithRouter = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { routerProps, ...renderOptions } = options;
  
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TestWrapper routerProps={routerProps}>
      {children}
    </TestWrapper>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock implementations for common hooks
export const createMockUseAuth = (authState = mockUnauthenticatedUser) => {
  return vi.fn().mockReturnValue(authState);
};

export const createMockUseTheme = (themeState = mockTheme) => {
  return vi.fn().mockReturnValue(themeState);
};

// Common test data
export const testRoutes = {
  login: '/login',
  dashboard: '/dashboard',
  profile: '/profile',
  history: '/history',
  verify: '/verify',
  authCallback: '/auth/callback',
  root: '/',
};

// Helper to create mock location objects
export const createMockLocation = (pathname: string, search = '', hash = '') => ({
  pathname,
  search,
  hash,
  state: null,
  key: 'test-key',
});

// Helper to create mock history objects
export const createMockHistory = () => ({
  length: 1,
  action: 'POP' as const,
  location: createMockLocation('/'),
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  goBack: vi.fn(),
  goForward: vi.fn(),
  block: vi.fn(),
  listen: vi.fn(),
  createHref: vi.fn(),
});

export default {
  TestWrapper,
  renderWithRouter,
  createMockUseAuth,
  createMockUseTheme,
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
  mockTheme,
  testRoutes,
  createMockLocation,
  createMockHistory,
};