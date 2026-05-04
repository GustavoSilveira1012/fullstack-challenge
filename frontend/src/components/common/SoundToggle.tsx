/**
 * SoundToggle Component
 * Provides a toggle button for enabling/disabling sound effects
 * Requirements: 2.8.5 - Optional sound effects with toggle
 */

import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from './Button';
import { useSound } from '@hooks/useSound';

interface SoundToggleProps {
  /**
   * Optional className for custom styling
   */
  className?: string;
  /**
   * Show text label alongside icon
   */
  showLabel?: boolean;
  /**
   * Button size
   */
  size?: 'small' | 'medium' | 'large';
}

export const SoundToggle: React.FC<SoundToggleProps> = ({
  className = '',
  showLabel = false,
  size = 'medium',
}) => {
  const { soundEnabled, toggleSound } = useSound();

  const handleToggle = () => {
    toggleSound();
  };

  return (
    <Button
      variant={soundEnabled ? 'primary' : 'secondary'}
      size={size}
      onClick={handleToggle}
      className={`
        flex items-center gap-2
        ${className}
      `}
      aria-label={soundEnabled ? 'Disable sound effects' : 'Enable sound effects'}
      aria-pressed={soundEnabled}
      title={soundEnabled ? 'Sound On' : 'Sound Off'}
    >
      {soundEnabled ? (
        <Volume2 className="w-4 h-4" aria-hidden="true" />
      ) : (
        <VolumeX className="w-4 h-4" aria-hidden="true" />
      )}
      
      {showLabel && (
        <span className="hidden sm:inline">
          {soundEnabled ? 'Sound On' : 'Sound Off'}
        </span>
      )}
      
      {/* Screen reader only text */}
      <span className="sr-only">
        {soundEnabled ? 'Sound effects are enabled' : 'Sound effects are disabled'}
      </span>
    </Button>
  );
};

export default SoundToggle;