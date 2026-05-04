/**
 * Sound Service Tests
 * Tests for the sound service functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { soundService, SoundType } from '../soundService';

// Mock HTMLAudioElement
class MockAudio {
  src = '';
  volume = 0.5;
  currentTime = 0;
  readyState = 4; // HAVE_ENOUGH_DATA
  preload = 'auto';
  
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  load = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}

// Mock AudioContext
class MockAudioContext {
  state = 'running';
  createBuffer = vi.fn();
  createBufferSource = vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
  }));
  resume = vi.fn().mockResolvedValue(undefined);
  get destination() {
    return {};
  }
}

describe('SoundService', () => {
  beforeEach(() => {
    // Mock Audio constructor
    global.Audio = vi.fn().mockImplementation(() => new MockAudio()) as any;
    
    // Mock AudioContext
    global.AudioContext = vi.fn().mockImplementation(() => new MockAudioContext()) as any;
    (global as any).webkitAudioContext = global.AudioContext;
    
    // Reset sound service state
    soundService.setEnabled(true);
    soundService.setVolume(0.5);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Sound Playback', () => {
    it('should play sound when enabled', async () => {
      const mockAudio = new MockAudio();
      global.Audio = vi.fn().mockReturnValue(mockAudio);
      
      await soundService.playSound('bet-placed');
      
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it('should not play sound when disabled', async () => {
      const mockAudio = new MockAudio();
      global.Audio = vi.fn().mockReturnValue(mockAudio);
      
      soundService.setEnabled(false);
      await soundService.playSound('bet-placed');
      
      expect(mockAudio.play).not.toHaveBeenCalled();
    });

    it('should handle play errors gracefully', async () => {
      const mockAudio = new MockAudio();
      mockAudio.play = vi.fn().mockRejectedValue(new DOMException('NotAllowedError'));
      global.Audio = vi.fn().mockReturnValue(mockAudio);
      
      // Should not throw
      await expect(soundService.playSound('crash')).resolves.toBeUndefined();
    });
  });

  describe('Volume Control', () => {
    it('should set volume correctly', () => {
      soundService.setVolume(0.8);
      expect(soundService.getVolume()).toBe(0.8);
    });

    it('should clamp volume between 0 and 1', () => {
      soundService.setVolume(1.5);
      expect(soundService.getVolume()).toBe(1);
      
      soundService.setVolume(-0.5);
      expect(soundService.getVolume()).toBe(0);
    });
  });

  describe('Enable/Disable', () => {
    it('should enable and disable sound', () => {
      soundService.setEnabled(false);
      expect(soundService.getEnabled()).toBe(false);
      
      soundService.setEnabled(true);
      expect(soundService.getEnabled()).toBe(true);
    });
  });

  describe('Audio Context Initialization', () => {
    it('should initialize audio context', async () => {
      const mockContext = new MockAudioContext();
      global.AudioContext = vi.fn().mockReturnValue(mockContext);
      
      await soundService.initializeAudioContext();
      
      expect(global.AudioContext).toHaveBeenCalled();
    });

    it('should handle audio context errors gracefully', async () => {
      global.AudioContext = vi.fn().mockImplementation(() => {
        throw new Error('AudioContext not supported');
      });
      
      // Should not throw
      await expect(soundService.initializeAudioContext()).resolves.toBeUndefined();
    });
  });

  describe('Sound Types', () => {
    const soundTypes: SoundType[] = ['bet-placed', 'cash-out', 'crash'];
    
    soundTypes.forEach(soundType => {
      it(`should handle ${soundType} sound`, async () => {
        const mockAudio = new MockAudio();
        global.Audio = vi.fn().mockReturnValue(mockAudio);
        
        await soundService.playSound(soundType);
        
        expect(global.Audio).toHaveBeenCalledWith(`/sounds/${soundType}.mp3`);
      });
    });
  });
});