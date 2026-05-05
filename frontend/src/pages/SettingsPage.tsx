import React, { useState } from 'react';
import { useUIStore } from '@store/uiStore';
import { Header } from '@components/layout/Header';
import { Button } from '@components/common/Button';
import { Card } from '@components/common/Card';
import { Badge } from '@components/common/Badge';
import { useNavigate } from 'react-router-dom';

/**
 * SettingsPage Component
 * User preferences and application settings
 * Requirements: 2.7.4, 2.8.5
 */
export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme, soundEnabled, toggleSound, animationSpeed, setAnimationSpeed } = useUIStore();
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const handleSoundToggle = () => {
    toggleSound();
  };

  const handleAnimationSpeedChange = (speed: 'slow' | 'normal' | 'fast') => {
    setAnimationSpeed(speed);
  };

  const handleAutoPlayToggle = () => {
    setAutoPlayEnabled(!autoPlayEnabled);
  };

  const handleNotificationsToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
            <Button
              variant="secondary"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Game
            </Button>
          </div>

          {/* Appearance Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Appearance
            </h2>
            
            <div className="space-y-6">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white">
                    Theme
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose your preferred color scheme
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={theme === 'light' ? 'primary' : 'secondary'}>
                    {theme === 'light' ? 'Light' : 'Dark'}
                  </Badge>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={handleThemeToggle}
                    className="flex items-center gap-2"
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                  >
                    {theme === 'light' ? (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
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
                    Toggle
                  </Button>
                </div>
              </div>

              {/* Animation Speed */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white">
                    Animation Speed
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Adjust the speed of game animations
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={animationSpeed === 'slow' ? 'primary' : 'secondary'}
                    size="small"
                    onClick={() => handleAnimationSpeedChange('slow')}
                  >
                    Slow
                  </Button>
                  <Button
                    variant={animationSpeed === 'normal' ? 'primary' : 'secondary'}
                    size="small"
                    onClick={() => handleAnimationSpeedChange('normal')}
                  >
                    Normal
                  </Button>
                  <Button
                    variant={animationSpeed === 'fast' ? 'primary' : 'secondary'}
                    size="small"
                    onClick={() => handleAnimationSpeedChange('fast')}
                  >
                    Fast
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Audio Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Audio
            </h2>
            
            <div className="space-y-6">
              {/* Sound Effects Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white">
                    Sound Effects
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Enable or disable game sound effects
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={soundEnabled ? 'success' : 'secondary'}>
                    {soundEnabled ? 'On' : 'Off'}
                  </Badge>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={handleSoundToggle}
                    className="flex items-center gap-2"
                    aria-label={`Turn sound ${soundEnabled ? 'off' : 'on'}`}
                  >
                    {soundEnabled ? (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816zM16.707 9.293a1 1 0 010 1.414C15.312 12.102 13.781 13 12 13a1 1 0 01-1-1 1 1 0 011-1c1.781 0 2.312-.898 3.707-2.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
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
                    Toggle
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Game Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Game Preferences
            </h2>
            
            <div className="space-y-6">
              {/* Auto Play Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white">
                    Auto Play
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Automatically place bets each round
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={autoPlayEnabled ? 'success' : 'secondary'}>
                    {autoPlayEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={handleAutoPlayToggle}
                    aria-label={`Turn auto play ${autoPlayEnabled ? 'off' : 'on'}`}
                  >
                    Toggle
                  </Button>
                </div>
              </div>

              {/* Notifications Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white">
                    Notifications
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Show notifications for game events
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={notificationsEnabled ? 'success' : 'secondary'}>
                    {notificationsEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={handleNotificationsToggle}
                    aria-label={`Turn notifications ${notificationsEnabled ? 'off' : 'on'}`}
                  >
                    Toggle
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 border-red-200 dark:border-red-800">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-6">
              Danger Zone
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white">
                    Clear Cache
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Clear all cached data and preferences
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                >
                  Clear Cache
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
