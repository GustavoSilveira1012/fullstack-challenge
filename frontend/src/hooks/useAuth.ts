import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@store/authStore';
import { authService } from '@services/authService';
import { useUIStore } from '@store/uiStore';

/**
 * useAuth Hook: Manages authentication logic
 * Requirement 2.1.1, 2.1.3: Authentication and logout functionality
 */
export const useAuth = () => {
  const { isAuthenticated, playerId, email, token, logout, setToken } = useAuthStore();
  const { addNotification } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize auth state from localStorage on mount
   */
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedPlayerId = localStorage.getItem('playerId');
    const storedEmail = localStorage.getItem('email');

    if (storedToken && storedPlayerId && storedEmail) {
      // Check if token is expired
      if (!authService.isTokenExpired(storedToken)) {
        setToken(storedToken);
      } else {
        // Token expired, clear auth state
        logout();
      }
    }
  }, [setToken, logout]);

  /**
   * Handle OAuth2 callback after Keycloak redirects back
   */
  const handleCallback = useCallback(
    async (code: string) => {
      setIsLoading(true);
      setError(null);

      try {
        await authService.handleCallback(code);
        addNotification({
          type: 'success',
          message: 'Successfully logged in',
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
        addNotification({
          type: 'error',
          message: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [addNotification]
  );

  /**
   * Perform login redirect to Keycloak
   */
  const performLogin = useCallback(() => {
    try {
      authService.login();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
    }
  }, [addNotification]);

  /**
   * Perform logout
   */
  const performLogout = useCallback(() => {
    try {
      authService.logout();
      addNotification({
        type: 'success',
        message: 'Successfully logged out',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
    }
  }, [addNotification]);

  /**
   * Refresh access token if expired
   */
  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = sessionStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const tokenResponse = await authService.refreshToken(refreshToken);
      setToken(tokenResponse.access_token);
      sessionStorage.setItem('refresh_token', tokenResponse.refresh_token);

      return tokenResponse.access_token;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Token refresh failed';
      setError(errorMessage);
      // If refresh fails, logout user
      performLogout();
      throw err;
    }
  }, [setToken, performLogout]);

  return {
    // State
    isAuthenticated,
    playerId,
    email,
    token,
    isLoading,
    error,

    // Actions
    handleCallback,
    performLogin,
    performLogout,
    refreshAccessToken,
  };
};
