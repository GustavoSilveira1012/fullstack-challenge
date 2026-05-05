import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useAuthStore } from '@store/authStore';
import { Loading } from '@components/common/Loading';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';

/**
 * AuthCallbackPage Component
 * Requirement 2.1.1: Handle callback and token storage
 * 
 * This page handles the OAuth2 callback from Keycloak after user authentication.
 * It processes the authorization code and exchanges it for tokens.
 */
export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleCallback, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [hasProcessed, setHasProcessed] = useState(false);
  useEffect(() => {
    const processCallback = async () => {
      // Prevent duplicate processing
      if (hasProcessed || status !== 'processing') {
        console.log('Callback already processed, skipping...');
        return;
      }

      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      console.log('Processing callback with:', { code: code?.substring(0, 10) + '...', error });

      // Mark as processed immediately to prevent duplicates
      setHasProcessed(true);

      // Handle OAuth2 errors
      if (error) {
        console.error('OAuth2 error:', error, errorDescription);
        setStatus('error');
        setErrorMessage(errorDescription || `Authentication error: ${error}`);
        return;
      }

      // Handle missing authorization code
      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code received from Keycloak');
        return;
      }

      try {
        console.log('Processing auth code...');
        // Process the authorization code
        await handleCallback(code);
        console.log('Auth successful, preparing redirect...');
        setStatus('success');
        
        // Wait longer and verify auth state before redirecting
        setTimeout(() => {
          // Check both the hook state and localStorage directly
          const hookState = useAuthStore.getState();
          const isAuthenticatedInStorage = localStorage.getItem('isAuthenticated') === 'true';
          const hasTokenInStorage = !!localStorage.getItem('token');
          
          console.log('Pre-redirect auth check:', {
            hookAuthenticated: hookState.isAuthenticated,
            storageAuthenticated: isAuthenticatedInStorage,
            hasToken: hasTokenInStorage,
            playerId: hookState.playerId || localStorage.getItem('playerId')
          });
          
          // If localStorage has auth but hook doesn't, force a reload to reinitialize
          if (isAuthenticatedInStorage && hasTokenInStorage && !hookState.isAuthenticated) {
            console.log('Auth state mismatch detected, reloading to reinitialize...');
            window.location.href = '/dashboard';
            return;
          }
          
          console.log('Redirecting to dashboard...');
          navigate('/dashboard', { replace: true });
        }, 2000); // Reduced to 2 seconds
      } catch (err) {
        console.error('Auth callback failed:', err);
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    processCallback();
  }, [searchParams, handleCallback, navigate, hasProcessed, status]);

  // Redirect if already authenticated (shouldn't happen, but safety check)
  useEffect(() => {
    if (isAuthenticated && status === 'success') {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, status, navigate]);

  const handleRetryLogin = () => {
    navigate('/login', { replace: true });
  };

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="text-center">
            <Loading size="large" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
              Processing Authentication
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Please wait while we complete your login...
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Login Successful!
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Redirecting you to the dashboard...
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Authentication Failed
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400 mb-6">
              {errorMessage}
            </p>
            <Button
              onClick={handleRetryLogin}
              variant="primary"
              size="medium"
            >
              Try Again
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <Card className="w-full max-w-md p-8">
        {renderContent()}
      </Card>
    </div>
  );
};

export default AuthCallbackPage;