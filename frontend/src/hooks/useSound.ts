/**
 * useSound Hook
 * Provides sound management functionality with UI store integration
 * Requirements: 2.8.5 - Optional sound effects with toggle
 */

import { useCallback, useEffect } from 'react';
import { useUIStore } from '@store/uiStore';
import { soundService, SoundType } from '@services/soundService';

export interface UseSoundReturn {
  playSound: (soundType: SoundType) => Promise<void>;
  soundEnabled: boolean;
  toggleSound: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
  initializeAudio: () => Promise<void>;
}

/**
 * Custom hook for sound management
 */
export const useSound = (): UseSoundReturn => {
  const { soundEnabled, toggleSound: toggleSoundStore } = useUIStore();

  /**
   * Play a sound effect if enabled
   */
  const playSound = useCallback(async (soundType: SoundType): Promise<void> => {
    if (!soundEnabled) {
      return;
    }

    try {
      await soundService.playSound(soundType);
    } catch (error) {
      console.warn(`Failed to play sound: ${soundType}`, error);
    }
  }, [soundEnabled]);

  /**
   * Toggle sound on/off
   */
  const toggleSound = useCallback(() => {
    toggleSoundStore();
  }, [toggleSoundStore]);

  /**
   * Set sound enabled state
   */
  const setSoundEnabled = useCallback((enabled: boolean) => {
    soundService.setEnabled(enabled);
    if (!enabled) {
      toggleSoundStore();
    } else if (!soundEnabled) {
      toggleSoundStore();
    }
  }, [soundEnabled, toggleSoundStore]);

  /**
   * Set volume level
   */
  const setVolume = useCallback((volume: number) => {
    soundService.setVolume(volume);
  }, []);

  /**
   * Get current volume level
   */
  const volume = soundService.getVolume();

  /**
   * Initialize audio context (call after user interaction)
   */
  const initializeAudio = useCallback(async () => {
    try {
      await soundService.initializeAudioContext();
    } catch (error) {
      console.warn('Failed to initialize audio:', error);
    }
  }, []);

  /**
   * Sync sound service with UI store state
   */
  useEffect(() => {
    soundService.setEnabled(soundEnabled);
  }, [soundEnabled]);

  return {
    playSound,
    soundEnabled,
    toggleSound,
    setSoundEnabled,
    volume,
    setVolume,
    initializeAudio,
  };
};

export default useSound;