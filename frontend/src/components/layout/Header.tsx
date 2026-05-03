import React, { useState } from 'react';
import { useAuth } from '@hooks/useAuth';
import { useWallet } from '@hooks/useWallet';
import { useUIStore } from '@store/uiStore';

interface HeaderProps {
  onLogout?: () => void;
  onThemeToggle?: () => void;
  onSoundToggle?: () => void;
}

/**
 * Header component with logo, balance, and user menu
 * Requirement 2.1.2: Display wallet balance in header
 * Requirement 2.1.3: Logout functionality in header
 * Requirement 2.1.4: User profile information
 * Features:
 * - Logo/branding
 * - Wallet balance display (formatted with currency)
 * - User menu (profile, settings, logout)
 * - Theme toggle
 * - Sound toggle
 * - Responsive design
 * - WCAG AA accessibility compliance
 */
export const Header: React.FC<HeaderProps> = ({
  onLogout,
  onThemeToggle,
  onSoundToggle,
}) => {
  const { email, performLogout } = useAuth();
  const { balance, formatBalance } = useWallet();
  const { theme, setTheme, soundEnabled, toggleSound } = useUIStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    performLogout();
    onLogout?.();
    setIsMenuOpen(false);
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    onThemeToggle?.();
  };

  const handleSoundToggle = () => {
    toggleSound();
    onSoundToggle?.();
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
              Crash Game
            </h1>
          </div>

          {/* Center - Balance Display */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M8.16 2.75a.75.75 0 00-.75.75v2.5H4.5a.75.75 0 000 1.5h2.91v2.5H4.5a.75.75 0 000 1.5h2.91v2.5H4.5a.75.75 0 000 1.5h2.91v2.5a.75.75 0 001.5 0v-2.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.91a.75.75 0 000-1.5h-2.91v-2.5h2.91a.75.75 0 000-1.5h-2.91v-2.5h2.91a.75.75 0 000-1.5h-2.91V3.5a.75.75 0 00-1.5 0v2.5h-2.5V3.5a.75.75 0 00-1.5 0v2.5H8.91V3.5a.75.75 0 00-.75-.75z" />
              </svg>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatBalance(balance)}
              </span>
            </div>
          </div>

          {/* Right - Controls and Menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle */}
            <button
              onClick={handleThemeToggle}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm5.657-9.193a1 1 0 00-1.414 0l-.707.707A1 1 0 005.05 6.464l.707-.707a1 1 0 001.414-1.414zM5 11a1 1 0 100-2H4a1 1 0 100 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={handleSoundToggle}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Sound ${soundEnabled ? 'on' : 'off'}`}
            >
              {soundEnabled ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M9 2a1 1 0 000 2v8a1 1 0 001 1h1a1 1 0 100-2v-3.135A9.038 9.038 0 007.618 4.42A9.006 9.006 0 002.39 10h5.55a1 1 0 100-2H4.009A7 7 0 1113.71 4.3a1 1 0 00-1.52 1.053A5.002 5.002 0 009 2z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 9c0-4.447-3.582-8.111-8-8.111a9.996 9.996 0 00-5.189 1.497A1 1 0 004.11 4.514A8.002 8.002 0 0117.933 9a8.968 8.968 0 01-1.25 4.02l1.414 1.414a1 1 0 001.414-1.414l-14-14zM9 4a1 1 0 011 1v1a1 1 0 11-2 0V5a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="User menu"
                aria-expanded={isMenuOpen}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-40"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Signed in as</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {email}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    role="menuitem"
                  >
                    Profile
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    role="menuitem"
                  >
                    Settings
                  </button>

                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                      role="menuitem"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
