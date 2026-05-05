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
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Initialize auth state from localStorage on mount
   */
  useEffect(() => {
    if (isInitialized) return; // Prevent multiple initializations

    const initializeAuth = () => {
      console.log('Starting auth initialization...');
      
      // Check if we're currently processing a callback
      const isProcessingCallback = sessionStorage.getItem('processing_callback') === 'true';
      if (isProcessingCallback) {
        console.log('Callback processing in progress, skipping auth initialization');
        // Wait a bit and try again
        setTimeout(() => {
          if (!isInitialized) {
            initializeAuth();
          }
        }, 500);
        return;
      }
      
      const storedToken = localStorage.getItem('token');
      const storedPlayerId = localStorage.getItem('playerId');
      const storedEmail = localStorage.getItem('email');
      const storedIsAuthenticated = localStorage.getItem('isAuthenticated');

      console.log('Initializing auth state:', {
        hasToken: !!storedToken,
        hasPlayerId: !!storedPlayerId,
        hasEmail: !!storedEmail,
        isAuthenticated: storedIsAuthenticated
      });

      // If we have all required auth data
      if (storedToken && storedPlayerId && storedEmail && storedIsAuthenticated === 'true') {
        try {
          // For real tokens, check expiration
          if (!authService.isTokenExpired(storedToken)) {
            console.log('Restoring auth state from localStorage (valid token)');
            const authStore = useAuthStore.getState();
            authStore.login(storedToken, storedPlayerId, storedEmail);
            setIsInitialized(true);
            return;
          } else {
            console.log('Token expired, clearing auth state');
          }
        } catch (error) {
          console.error('Error checking token expiration:', error);
          console.log('Error checking token, clearing auth state');
        }
      } else {
        console.log('Missing auth data in localStorage');
      }
      
      // Token expired, invalid, or missing - clear auth state
      console.log('Clearing auth state');
      logout();
      setIsInitialized(true);
    };

    initializeAuth();
  }, [logout, isInitialized]);

  /**
   * Handle OAuth2 callback after Keycloak redirects back
   */
  const handleCallback = useCallback(
    async (code: string) => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('useAuth.handleCallback: Starting callback processing');
        await authService.handleCallback(code);
        
        // Force a re-check of auth state after successful callback
        console.log('useAuth.handleCallback: Callback successful, checking auth state');
        const authState = useAuthStore.getState();
        console.log('useAuth.handleCallback: Current auth state:', {
          isAuthenticated: authState.isAuthenticated,
          hasToken: !!authState.token,
          playerId: authState.playerId
        });
        
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
  const performLogin = useCallback(async () => {
    try {
      console.log('useAuth.performLogin: Starting login process');
      setIsLoading(true);
      await authService.login();
    } catch (err) {
      console.error('useAuth.performLogin: Login failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  /**
   * Perform logout
   */
  const performLogout = useCallback(() => {
    try {
      console.log('useAuth.performLogout: Starting logout process');
      
      // Clear auth store
      logout();
      
      // Clear all storage to ensure clean state
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('All storage cleared');
      
      // Always use Keycloak logout for real sessions
      try {
        authService.logout();
      } catch (error) {
        console.warn('Keycloak logout failed, redirecting to login anyway');
        window.location.href = '/login';
      }
      
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
      
      // Force redirect to login even if logout failed
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }
  }, [logout, addNotification]);

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
    isLoading: isLoading || !isInitialized,
    error,

    // Actions
    handleCallback,
    performLogin,
    performLogout,
    refreshAccessToken,
  };
};
