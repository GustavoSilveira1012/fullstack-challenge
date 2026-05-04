import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNotification } from '@hooks/useNotification';
import { useErrorRecovery } from '@hooks/useErrorRecovery';

interface ErrorRecoveryContextType {
  isOnline: boolean;
  isRetrying: boolean;
  lastError: Error | null;
  retryCount: number;
}

const ErrorRecoveryContext = createContext<ErrorRecoveryContextType | null>(null);

interface ErrorRecoveryProviderProps {
  children: React.ReactNode;
}

/**
 * ErrorRecoveryProvider: Provides global error recovery context
 * Requirement 3.4.1: Handle network disconnections gracefully
 * Requirement 3.4.2: Handle API errors gracefully
 */
export const ErrorRecoveryProvider: React.FC<ErrorRecoveryProviderProps> = ({ children }) => {
  const { showWarning, showInfo, showError } = useNotification();
  const { checkOnlineStatus, isRetrying, attemptCount, lastError } = useErrorRecovery();
  
  const [isOnline, setIsOnline] = useState(checkOnlineStatus());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showInfo('Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      showWarning('You are offline. Some features may not work.');
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection status periodically
    const checkConnection = async () => {
      const online = checkOnlineStatus();
      if (online !== isOnline) {
        setIsOnline(online);
        if (!online) {
          showWarning('Connection lost. Retrying...');
        }
      }
    };

    const connectionCheckInterval = setInterval(checkConnection, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectionCheckInterval);
    };
  }, [isOnline, checkOnlineStatus, showWarning, showInfo]);

  // Show retry notifications
  useEffect(() => {
    if (isRetrying && attemptCount > 1) {
      showWarning(`Retrying... (attempt ${attemptCount})`);
    }
  }, [isRetrying, attemptCount, showWarning]);

  // Show persistent error notifications
  useEffect(() => {
    if (lastError && !isRetrying) {
      showError(`Operation failed: ${lastError.message}`);
    }
  }, [lastError, isRetrying, showError]);

  const contextValue: ErrorRecoveryContextType = {
    isOnline,
    isRetrying,
    lastError,
    retryCount: attemptCount,
  };

  return (
    <ErrorRecoveryContext.Provider value={contextValue}>
      {children}
      
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                You are offline. Reconnecting...
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Retry Indicator */}
      {isRetrying && (
        <div className="fixed top-20 right-4 z-50">
          <div className="bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Retrying... ({attemptCount})
              </span>
            </div>
          </div>
        </div>
      )}
    </ErrorRecoveryContext.Provider>
  );
};

/**
 * Hook to use error recovery context
 */
export const useErrorRecoveryContext = (): ErrorRecoveryContextType => {
  const context = useContext(ErrorRecoveryContext);
  if (!context) {
    throw new Error('useErrorRecoveryContext must be used within ErrorRecoveryProvider');
  }
  return context;
};