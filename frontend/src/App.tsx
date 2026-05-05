import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useNotification } from '@hooks/useNotification';
import { PageTransition } from '@components/layout';
import { ThemeProvider, ErrorRecoveryProvider } from '@components/providers';
import { ErrorBoundary, NotificationContainer, SkipLinks, Loading } from '@components/common';

// Lazy load page components for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const VerifyPage = lazy(() => import('./pages/VerifyPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading while checking authentication
  if (isLoading) {
    return <Loading size="large" text="Checking authentication..." />;
  }
  
  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('User authenticated, showing protected content');
  return <>{children}</>;
};

/**
 * Public Route Component
 * Redirects to dashboard if user is already authenticated
 */
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading while checking authentication
  if (isLoading) {
    return <Loading size="large" text="Checking authentication..." />;
  }
  
  if (isAuthenticated) {
    console.log('User already authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  console.log('User not authenticated, showing public content');
  return <>{children}</>;
};

function App() {
  const { notifications, remove } = useNotification();

  // Skip links for keyboard navigation
  const skipLinks = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#game-controls', label: 'Skip to game controls' },
  ];

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ErrorRecoveryProvider>
          <Router>
            {/* Skip Links for Keyboard Navigation */}
            <SkipLinks links={skipLinks} />
            
            <div 
              className="min-h-screen bg-theme-primary text-theme-primary transition-colors duration-200"
              role="application"
              aria-label="Crash Game Application"
            >
              <PageTransition>
                <Suspense fallback={<Loading size="large" text="Loading page..." />}>
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
                    
                    <Route 
                      path="/settings" 
                      element={
                        <ProtectedRoute>
                          <SettingsPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    
                    <Route path="*" element={<Navigate to="/login" replace />} />
                  </Routes>
                </Suspense>
              </PageTransition>

              {/* Global Notification Container */}
              <NotificationContainer 
                notifications={notifications} 
                onRemove={remove} 
              />
            </div>
          </Router>
        </ErrorRecoveryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
