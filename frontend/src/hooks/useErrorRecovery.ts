import { useCallback, useState } from 'react';
import { useNotification } from './useNotification';

interface RetryConfig {
  maxAttempts?: number;
  delay?: number;
  backoffMultiplier?: number;
  maxDelay?: number;
}

interface ErrorRecoveryState {
  isRetrying: boolean;
  attemptCount: number;
  lastError: Error | null;
}

/**
 * useErrorRecovery Hook: Provides error recovery strategies
 * Requirement 3.4.2: Handle API errors gracefully
 * Requirement 3.4.1: Handle network disconnections gracefully
 */
export const useErrorRecovery = () => {
  const { showError, showWarning, showInfo } = useNotification();
  const [recoveryState, setRecoveryState] = useState<ErrorRecoveryState>({
    isRetrying: false,
    attemptCount: 0,
    lastError: null,
  });

  /**
   * Execute function with retry logic
   */
  const withRetry = useCallback(
    async <T>(
      fn: () => Promise<T>,
      config: RetryConfig = {}
    ): Promise<T> => {
      const {
        maxAttempts = 3,
        delay = 1000,
        backoffMultiplier = 2,
        maxDelay = 10000,
      } = config;

      let currentDelay = delay;
      let lastError: Error;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          setRecoveryState({
            isRetrying: attempt > 1,
            attemptCount: attempt,
            lastError: null,
          });

          const result = await fn();
          
          // Reset state on success
          setRecoveryState({
            isRetrying: false,
            attemptCount: 0,
            lastError: null,
          });

          // Show recovery success message if this was a retry
          if (attempt > 1) {
            showInfo('Connection restored successfully');
          }

          return result;
        } catch (error) {
          lastError = error as Error;
          
          setRecoveryState({
            isRetrying: true,
            attemptCount: attempt,
            lastError,
          });

          // If this is the last attempt, throw the error
          if (attempt === maxAttempts) {
            setRecoveryState({
              isRetrying: false,
              attemptCount: attempt,
              lastError,
            });
            throw lastError;
          }

          // Show retry notification
          if (attempt === 1) {
            showWarning(`Request failed, retrying... (${attempt}/${maxAttempts})`);
          } else {
            showWarning(`Retry ${attempt}/${maxAttempts} failed, trying again...`);
          }

          // Wait before next attempt
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          
          // Increase delay for next attempt (exponential backoff)
          currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay);
        }
      }

      throw lastError!;
    },
    [showError, showWarning, showInfo]
  );

  /**
   * Handle network errors specifically
   */
  const handleNetworkError = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      try {
        return await withRetry(fn, {
          maxAttempts: 5,
          delay: 2000,
          backoffMultiplier: 1.5,
          maxDelay: 30000,
        });
      } catch (error) {
        const networkError = error as Error;
        
        if (networkError.message.includes('NetworkError') || 
            networkError.message.includes('fetch')) {
          showError('Network connection lost. Please check your internet connection.');
        } else {
          showError('Unable to connect to server. Please try again later.');
        }
        
        throw networkError;
      }
    },
    [withRetry, showError]
  );

  /**
   * Handle API errors with specific error messages
   */
  const handleApiError = useCallback(
    (error: any) => {
      console.error('API Error:', error);

      // Handle different types of API errors
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 400:
            showError(data.message || 'Invalid request. Please check your input.');
            break;
          case 401:
            showError('Session expired. Please log in again.');
            // Redirect to login could be handled here
            break;
          case 403:
            showError('Access denied. You do not have permission for this action.');
            break;
          case 404:
            showError('Resource not found.');
            break;
          case 409:
            showError(data.message || 'Conflict occurred. Please try again.');
            break;
          case 429:
            showError('Too many requests. Please wait a moment and try again.');
            break;
          case 500:
            showError('Server error. Please try again later.');
            break;
          case 502:
          case 503:
          case 504:
            showError('Service temporarily unavailable. Please try again later.');
            break;
          default:
            showError(data.message || `Request failed with status ${status}`);
        }
      } else if (error.request) {
        // Network error
        showError('Network error. Please check your connection and try again.');
      } else {
        // Other error
        showError(error.message || 'An unexpected error occurred.');
      }
    },
    [showError]
  );

  /**
   * Graceful degradation for non-critical features
   */
  const withGracefulDegradation = useCallback(
    async <T>(
      fn: () => Promise<T>,
      fallback: T,
      errorMessage?: string
    ): Promise<T> => {
      try {
        return await fn();
      } catch (error) {
        console.warn('Non-critical operation failed, using fallback:', error);
        
        if (errorMessage) {
          showWarning(errorMessage);
        }
        
        return fallback;
      }
    },
    [showWarning]
  );

  /**
   * Check if the application is online
   */
  const checkOnlineStatus = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true; // Assume online if can't detect
  }, []);

  /**
   * Wait for network to come back online
   */
  const waitForOnline = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (checkOnlineStatus()) {
        resolve();
        return;
      }

      const handleOnline = () => {
        window.removeEventListener('online', handleOnline);
        showInfo('Connection restored');
        resolve();
      };

      window.addEventListener('online', handleOnline);
      showWarning('You are offline. Waiting for connection...');
    });
  }, [checkOnlineStatus, showInfo, showWarning]);

  /**
   * Execute function when online, wait if offline
   */
  const executeWhenOnline = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      if (!checkOnlineStatus()) {
        await waitForOnline();
      }
      return fn();
    },
    [checkOnlineStatus, waitForOnline]
  );

  return {
    // State
    ...recoveryState,

    // Recovery strategies
    withRetry,
    handleNetworkError,
    handleApiError,
    withGracefulDegradation,
    
    // Network utilities
    checkOnlineStatus,
    waitForOnline,
    executeWhenOnline,
  };
};