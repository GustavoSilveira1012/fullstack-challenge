import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { Button } from '@components/common/Button';
import { Loading } from '@components/common/Loading';
import { Card } from '@components/common/Card';

/**
 * LoginPage Component
 * Requirement 2.1.1: Login page that redirects users to Keycloak for OAuth2 authentication
 * 
 * Features:
 * - Login button redirects to Keycloak login page
 * - Handles OAuth2 callback with authorization code
 * - Shows loading state during authentication
 * - Redirects to dashboard after successful authentication
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading, error, performLogin, handleCallback } = useAuth();
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  // Debug: Show current auth state
  useEffect(() => {
    const updateDebugInfo = () => {
      const authState = {
        isAuthenticated,
        isLoading,
        error,
        localStorage: {
          token: !!localStorage.getItem('token'),
          playerId: localStorage.getItem('playerId'),
          email: localStorage.getItem('email'),
          isAuthenticated: localStorage.getItem('isAuthenticated')
        },
        searchParams: {
          code: searchParams.get('code')?.substring(0, 10) + '...',
          error: searchParams.get('error')
        }
      };
      setDebugInfo(authState);
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isLoading, error, searchParams]);

  // Handle OAuth2 callback
  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth2 error:', error);
      return;
    }

    if (code && !isProcessingCallback) {
      setIsProcessingCallback(true);
      handleCallback(code).finally(() => {
        setIsProcessingCallback(false);
      });
    }
  }, [searchParams, handleCallback, isProcessingCallback]);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User is authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLoginClick = () => {
    console.log('Login button clicked');
    performLogin();
  };

  // Show loading state during authentication process
  if (isLoading || isProcessingCallback) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <Loading size="large" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
              Authenticating...
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Please wait while we log you in.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <main role="main" className="w-full max-w-md">
        <Card className="p-8">
          <div className="text-center">
            {/* Logo */}
            <div 
              className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6"
              role="img"
              aria-label="Crash Game logo"
            >
              <span className="text-2xl font-bold text-white" aria-hidden="true">🎯</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Crash Game
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Sign in to start playing and win big!
            </p>

            {/* Error Message */}
            {error && (
              <div 
                className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                role="alert"
                aria-live="assertive"
              >
                <p className="text-red-700 dark:text-red-400 text-sm">
                  {error}
                </p>
              </div>
            )}

            {/* Login Button */}
            <Button
              onClick={handleLoginClick}
              variant="primary"
              size="large"
              className="w-full mb-6"
              disabled={isLoading}
              aria-describedby="login-description"
            >
              Sign in with Keycloak
            </Button>

            <div id="login-description" className="sr-only">
              Click to authenticate using Keycloak OAuth2 and access the crash game
            </div>

            {/* Features */}
            <section aria-labelledby="features-heading">
              <h2 id="features-heading" className="sr-only">Game Features</h2>
              <ul className="text-left space-y-3" role="list">
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3" aria-hidden="true"></span>
                  Real-time multiplier gameplay
                </li>
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3" aria-hidden="true"></span>
                  Secure wallet management
                </li>
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3" aria-hidden="true"></span>
                  Provably fair gaming
                </li>
              </ul>
            </section>

            {/* Footer */}
            <footer className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                By signing in, you agree to our Terms of Service and Privacy Policy.
                Must be 18+ to play.
              </p>
              
              {/* Debug Info */}
              {import.meta.env.DEV && (
                <details className="mt-4">
                  <summary className="text-xs text-gray-400 cursor-pointer">Debug Info</summary>
                  <pre className="text-xs text-gray-400 mt-2 overflow-auto max-h-32">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                  <div className="mt-2 space-y-1">
                    <button 
                      onClick={() => {
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.reload();
                      }}
                      className="text-xs text-red-400 hover:text-red-300 block"
                    >
                      🗑️ Clear All Storage & Reload
                    </button>
                    <button 
                      onClick={() => {
                        console.log('Current localStorage:', {
                          token: localStorage.getItem('token'),
                          playerId: localStorage.getItem('playerId'),
                          email: localStorage.getItem('email'),
                          isAuthenticated: localStorage.getItem('isAuthenticated')
                        });
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 block"
                    >
                      🔍 Log Current Storage
                    </button>
                  </div>
                </details>
              )}
            </footer>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default LoginPage;