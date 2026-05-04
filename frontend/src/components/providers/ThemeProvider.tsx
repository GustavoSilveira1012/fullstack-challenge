import React, { useEffect, ReactNode } from 'react';
import { useUIStore } from '@store/uiStore';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme Provider Component
 * Ensures proper theme initialization and system theme detection
 * Requirement 15.2: Implement dark/light theme toggle
 * Requirement 15.3: Implement theme persistence in localStorage
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    // Apply theme class to document root
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
    }

    // Update meta apple-mobile-web-app-status-bar-style
    const metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (metaStatusBar) {
      metaStatusBar.setAttribute('content', theme === 'dark' ? 'black-translucent' : 'default');
    }

    // Update meta msapplication-navbutton-color for Windows Phone
    const metaNavButton = document.querySelector('meta[name="msapplication-navbutton-color"]');
    if (metaNavButton) {
      metaNavButton.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't explicitly set a preference
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    // Add listener for system theme changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, [setTheme]);

  // Initialize theme on first load
  useEffect(() => {
    const initializeTheme = () => {
      try {
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme === 'light' || savedTheme === 'dark') {
          // Use saved theme
          setTheme(savedTheme);
        } else {
          // Detect system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const systemTheme = prefersDark ? 'dark' : 'light';
          setTheme(systemTheme);
        }
      } catch (error) {
        console.warn('Failed to initialize theme:', error);
        // Fallback to light theme
        setTheme('light');
      }
    };

    initializeTheme();
  }, [setTheme]);

  // Handle visibility change to sync theme across tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        try {
          const savedTheme = localStorage.getItem('theme');
          if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark') && savedTheme !== theme) {
            setTheme(savedTheme);
          }
        } catch (error) {
          console.warn('Failed to sync theme across tabs:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [theme, setTheme]);

  // Handle storage events to sync theme across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue && (e.newValue === 'light' || e.newValue === 'dark')) {
        if (e.newValue !== theme) {
          setTheme(e.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [theme, setTheme]);

  return <>{children}</>;
};