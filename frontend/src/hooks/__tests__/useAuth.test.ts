import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { useAuthStore } from '@store/authStore';
import * as authService from '@services/authService';

/**
 * useAuth Hook Unit Tests
 * Requirement 2.1.1, 2.1.3: Authentication and logout functionality
 * Validates: Requirements 2.1.1, 2.1.3
 */
describe('useAuth Hook', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      playerId: null,
      email: null,
      token: null,
    });
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should return initial auth state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.playerId).toBeNull();
      expect(result.current.email).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should have all required actions', () => {
      const { result } = renderHook(() => useAuth());

      expect(typeof result.current.handleCallback).toBe('function');
      expect(typeof result.current.performLogin).toBe('function');
      expect(typeof result.current.performLogout).toBe('function');
      expect(typeof result.current.refreshAccessToken).toBe('function');
    });
  });

  describe('Login Flow', () => {
    it('should call authService.login when performLogin is called', () => {
      const loginSpy = vi.spyOn(authService.authService, 'login');
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.performLogin();
      });

      expect(loginSpy).toHaveBeenCalled();
    });

    it('should handle login errors gracefully', () => {
      vi.spyOn(authService.authService, 'login').mockImplementation(() => {
        throw new Error('Login failed');
      });

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.performLogin();
      });

      expect(result.current.error).toBe('Login failed');
    });
  });

  describe('Logout Flow', () => {
    it('should call authService.logout when performLogout is called', () => {
      const logoutSpy = vi.spyOn(authService.authService, 'logout');
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.performLogout();
      });

      expect(logoutSpy).toHaveBeenCalled();
    });

    it('should clear auth state on logout', () => {
      useAuthStore.setState({
        isAuthenticated: true,
        playerId: 'player-123',
        email: 'user@example.com',
        token: 'token-123',
      });

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.performLogout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.token).toBeNull();
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token when refreshAccessToken is called', async () => {
      sessionStorage.setItem('refresh_token', 'refresh-token-123');

      const refreshSpy = vi.spyOn(authService.authService, 'refreshToken').mockResolvedValue({
        access_token: 'new-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.refreshAccessToken();
      });

      expect(refreshSpy).toHaveBeenCalledWith('refresh-token-123');
    });

    it('should handle token refresh errors', async () => {
      sessionStorage.setItem('refresh_token', 'refresh-token-123');

      vi.spyOn(authService.authService, 'refreshToken').mockRejectedValue(
        new Error('Token refresh failed')
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.refreshAccessToken();
        } catch (err) {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Token refresh failed');
    });

    it('should throw error if no refresh token available', async () => {
      sessionStorage.clear();

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.refreshAccessToken();
        } catch (err) {
          expect((err as Error).message).toContain('No refresh token');
        }
      });
    });
  });

  describe('OAuth2 Callback', () => {
    it('should handle OAuth2 callback with valid code', async () => {
      const handleCallbackSpy = vi.spyOn(authService.authService, 'handleCallback').mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleCallback('auth-code-123');
      });

      expect(handleCallbackSpy).toHaveBeenCalledWith('auth-code-123');
    });

    it('should handle callback errors', async () => {
      vi.spyOn(authService.authService, 'handleCallback').mockRejectedValue(
        new Error('Invalid authorization code')
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.handleCallback('invalid-code');
        } catch (err) {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Invalid authorization code');
    });

    it('should set isLoading during callback', async () => {
      vi.spyOn(authService.authService, 'handleCallback').mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.handleCallback('auth-code-123');
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should restore auth state from localStorage on mount', () => {
      localStorage.setItem('token', 'stored-token');
      localStorage.setItem('playerId', 'stored-player-id');
      localStorage.setItem('email', 'stored@example.com');

      const { result } = renderHook(() => useAuth());

      expect(result.current.token).toBe('stored-token');
      expect(result.current.playerId).toBe('stored-player-id');
      expect(result.current.email).toBe('stored@example.com');
    });

    it('should handle expired token from localStorage', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.test';
      localStorage.setItem('token', expiredToken);
      localStorage.setItem('playerId', 'player-id');
      localStorage.setItem('email', 'user@example.com');

      vi.spyOn(authService.authService, 'isTokenExpired').mockReturnValue(true);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should set error state on login failure', () => {
      vi.spyOn(authService.authService, 'login').mockImplementation(() => {
        throw new Error('Network error');
      });

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.performLogin();
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should clear error on successful operation', async () => {
      vi.spyOn(authService.authService, 'handleCallback').mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      // First cause an error
      vi.spyOn(authService.authService, 'login').mockImplementation(() => {
        throw new Error('Login failed');
      });

      act(() => {
        result.current.performLogin();
      });

      expect(result.current.error).toBe('Login failed');

      // Then succeed
      vi.spyOn(authService.authService, 'handleCallback').mockResolvedValue(undefined);

      await act(async () => {
        await result.current.handleCallback('valid-code');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Multiple Operations', () => {
    it('should handle sequential login and logout', async () => {
      const { result } = renderHook(() => useAuth());

      // Mock successful callback
      vi.spyOn(authService.authService, 'handleCallback').mockResolvedValue(undefined);
      useAuthStore.setState({
        isAuthenticated: true,
        token: 'token-123',
        playerId: 'player-123',
        email: 'user@example.com',
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.performLogout();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
