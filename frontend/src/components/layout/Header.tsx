import React, { useState } from 'react';
import { useAuth } from '@hooks/useAuth';
import { useWallet } from '@hooks/useWallet';
import { useUIStore } from '@store/uiStore';
import { ThemeToggle } from '@components/common/ThemeToggle';
import { SoundToggle } from '@components/common/SoundToggle';

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
  const { soundEnabled, toggleSound } = useUIStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    performLogout();
    onLogout?.();
    setIsMenuOpen(false);
  };

  const handleThemeToggle = () => {
    onThemeToggle?.();
  };

  const handleSoundToggle = () => {
    toggleSound();
    onSoundToggle?.();
  };

  return (
    <header 
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2" role="img" aria-label="Crash Game Logo">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg" aria-hidden="true">C</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
              Crash Game
            </h1>
          </div>

          {/* Center - Balance Display */}
          <div className="flex-1 flex justify-center">
            <div 
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
              role="status"
              aria-label={`Current wallet balance: ${formatBalance(balance)}`}
              aria-live="polite"
            >
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
          <nav className="flex items-center gap-2 sm:gap-4" role="navigation" aria-label="User controls">
            {/* Theme Toggle */}
            <ThemeToggle size="md" />

            {/* Sound Toggle */}
            <SoundToggle size="medium" />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="User account menu"
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
                id="user-menu-button"
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
                  aria-labelledby="user-menu-button"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsMenuOpen(false);
                    }
                  }}
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
                      window.location.href = '/profile';
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                    role="menuitem"
                    tabIndex={0}
                  >
                    Profile
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                    role="menuitem"
                    tabIndex={0}
                  >
                    Settings
                  </button>

                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 focus:outline-none focus:bg-red-50 dark:focus:bg-red-900/20"
                      role="menuitem"
                      tabIndex={0}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};
