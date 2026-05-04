/**
 * Sound Service
 * Handles audio playback for game events with volume control and error handling
 * Requirements: 2.8.5 - Optional sound effects for important events
 */

export type SoundType = 'bet-placed' | 'cash-out' | 'crash';

interface SoundConfig {
  volume: number;
  preload: boolean;
}

class SoundService {
  private sounds: Map<SoundType, HTMLAudioElement> = new Map();
  private isEnabled: boolean = true;
  private volume: number = 0.5;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeSounds();
  }

  /**
   * Initialize all sound files
   */
  private initializeSounds(): void {
    const soundConfigs: Record<SoundType, SoundConfig> = {
      'bet-placed': { volume: 0.6, preload: true },
      'cash-out': { volume: 0.7, preload: true },
      'crash': { volume: 0.8, preload: true },
    };

    Object.entries(soundConfigs).forEach(([soundType, config]) => {
      try {
        const audio = new Audio(`/sounds/${soundType}.mp3`);
        audio.volume = config.volume * this.volume;
        audio.preload = config.preload ? 'auto' : 'none';
        
        // Handle loading errors gracefully
        audio.addEventListener('error', (e) => {
          console.warn(`Failed to load sound: ${soundType}`, e);
        });

        // Prevent audio from blocking page load
        audio.addEventListener('canplaythrough', () => {
          // Sound is ready to play
        });

        this.sounds.set(soundType as SoundType, audio);
      } catch (error) {
        console.warn(`Failed to initialize sound: ${soundType}`, error);
      }
    });

    this.isInitialized = true;
  }

  /**
   * Play a sound effect
   */
  async playSound(soundType: SoundType): Promise<void> {
    if (!this.isEnabled || !this.isInitialized) {
      return;
    }

    const audio = this.sounds.get(soundType);
    if (!audio) {
      console.warn(`Sound not found: ${soundType}`);
      return;
    }

    try {
      // Reset audio to beginning
      audio.currentTime = 0;
      
      // Play the sound
      const playPromise = audio.play();
      
      // Handle browsers that return a promise
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (error) {
      // Handle autoplay restrictions gracefully
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        console.info(`Autoplay prevented for sound: ${soundType}. User interaction required.`);
      } else {
        console.warn(`Failed to play sound: ${soundType}`, error);
      }
    }
  }

  /**
   * Enable or disable sound effects
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Get current enabled state
   */
  getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Set master volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // Update volume for all loaded sounds
    this.sounds.forEach((audio) => {
      const baseVolume = this.getBaseVolume(audio);
      audio.volume = baseVolume * this.volume;
    });
  }

  /**
   * Get current master volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Get base volume for a specific audio element
   */
  private getBaseVolume(audio: HTMLAudioElement): number {
    // Default base volumes for different sound types
    const src = audio.src;
    if (src.includes('bet-placed')) return 0.6;
    if (src.includes('cash-out')) return 0.7;
    if (src.includes('crash')) return 0.8;
    return 0.5;
  }

  /**
   * Preload all sounds (call after user interaction)
   */
  async preloadSounds(): Promise<void> {
    const loadPromises = Array.from(this.sounds.values()).map(audio => {
      return new Promise<void>((resolve) => {
        if (audio.readyState >= 2) {
          // Already loaded
          resolve();
        } else {
          const onLoad = () => {
            audio.removeEventListener('canplaythrough', onLoad);
            audio.removeEventListener('error', onError);
            resolve();
          };
          
          const onError = () => {
            audio.removeEventListener('canplaythrough', onLoad);
            audio.removeEventListener('error', onError);
            resolve(); // Resolve anyway to not block
          };
          
          audio.addEventListener('canplaythrough', onLoad);
          audio.addEventListener('error', onError);
          
          // Trigger load
          audio.load();
        }
      });
    });

    await Promise.all(loadPromises);
  }

  /**
   * Initialize audio context after user interaction (required for autoplay)
   */
  async initializeAudioContext(): Promise<void> {
    try {
      // Create a silent audio context to unlock autoplay
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Play a silent sound to unlock audio
      const buffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
      
      await this.preloadSounds();
    } catch (error) {
      console.warn('Failed to initialize audio context:', error);
    }
  }

  /**
   * Dispose of all audio resources
   */
  dispose(): void {
    this.sounds.forEach((audio) => {
      audio.pause();
      audio.src = '';
      audio.load();
    });
    this.sounds.clear();
    this.isInitialized = false;
  }
}

// Create singleton instance
export const soundService = new SoundService();

// Export convenience functions
export const playBetPlacedSound = () => soundService.playSound('bet-placed');
export const playCashOutSound = () => soundService.playSound('cash-out');
export const playCrashSound = () => soundService.playSound('crash');

export default soundService;