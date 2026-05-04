import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ThemeProvider } from '../ThemeProvider';
import { useUIStore } from '@store/uiStore';

// Mock the UI store
vi.mock('@store/uiStore');

const mockUseUIStore = vi.mocked(useUIStore);

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Mock document methods
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
Object.defineProperty(document, 'addEventListener', {
  value: mockAddEventListener,
});
Object.defineProperty(document, 'removeEventListener', {
  value: mockRemoveEventListener,
});

describe('ThemeProvider', () => {
  const mockSetTheme = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset document.documentElement.classList
    document.documentElement.className = '';
    
    // Mock querySelector to return mock elements
    vi.spyOn(document, 'querySelector').mockImplementation((selector) => {
      if (selector === 'meta[name="theme-color"]') {
        return { setAttribute: vi.fn() } as any;
      }
      if (selector === 'meta[name="apple-mobile-web-app-status-bar-style"]') {
        return { setAttribute: vi.fn() } as any;
      }
      if (selector === 'meta[name="msapplication-navbutton-color"]') {
        return { setAttribute: vi.fn() } as any;
      }
      return null;
    });
    
    // Mock matchMedia
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    });
    
    // Mock localStorage
    localStorageMock.getItem.mockReturnValue(null);
    
    // Mock UI store
    mockUseUIStore.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      soundEnabled: true,
      notifications: [],
      toggleSound: vi.fn(),
      addNotification: vi.fn(),
      removeNotification: vi.fn(),
      clearNotifications: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Theme Application', () => {
    it('should apply light theme class to document root', () => {
      render(
        <ThemeProvider>
          <div>Test content</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should apply dark theme class to document root', () => {
      mockUseUIStore.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        soundEnabled: true,
        notifications: [],
        toggleSound: vi.fn(),
        addNotification: vi.fn(),
        removeNotification: vi.fn(),
        clearNotifications: vi.fn(),
      });

      render(
        <ThemeProvider>
          <div>Test content</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should update meta theme-color for light theme', () => {
      const mockSetAttribute = vi.fn();
      vi.spyOn(document, 'querySelector').mockImplementation((selector) => {
        if (selector === 'meta[name="theme-color"]') {
          return { setAttribute: mockSetAttribute } as any;
        }
        return { setAttribute: vi.fn() } as any;
      });

      render(
        <ThemeProvider>
          <div>Test content</div>
        </ThemeProvider>
      );

      expect(mockSetAttribute).toHaveBeenCalledWith('content', '#ffffff');
    });

    it('should update meta theme-color for dark theme', () => {
      const mockSetAttribute = vi.fn();
      vi.spyOn(document, 'querySelector').mockImplementation((selector) => {
        if (selector === 'meta[name="theme-color"]') {
          return { setAttribute: mockSetAttribute } as any;
        }
        return { setAttribute: vi.fn() } as any;
      });

      mockUseUIStore.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        soundEnabled: true,
        notifications: [],
        toggleSound: vi.fn(),
        addNotification: vi.fn(),
        removeNotification: vi.fn(),
        clearNotifications: vi.fn(),
      });

      render(
        <ThemeProvider>
          <div>Test content</div>
        </ThemeProvider>
      );

      expect(mockSetAttribute).toHaveBeenCalledWith('content', '#0f172a');
    });
  });

  describe('Theme Initialization', () => {
    it('should use saved theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider>
          <div>Test content</div>
        </ThemeProvider>
      );

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should use system preference when no saved theme', () => {
      localStorageMock.getItem.mockReturnValue(null);
      mockMatchMedia.mockReturnValue({
        matches: true, // Prefers dark
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      });

      render(
        <ThemeProvider>
          <div>Test content</div>
        </ThemeProvider>
      );

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should fallback to light theme on error', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      render(
        <ThemeProvider>
          <div>Test content</div>
        </ThemeProvider>
      );

      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });
  });

  describe('System Theme Detection', () => {
    it('should listen for system theme changes', () => {
      const mockAddEventListener = vi.fn();
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: mockAddEventListener,
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      });

      render(
        <ThemeProvider>
          <div>Test content</div>
        </ThemeProvider>
      );

      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should handle system theme change when no saved preference', () => {
      localStorageMock.getItem.mockReturnValue(null);
      let changeHandler: (e: MediaQueryListEvent) => void;
      
      const mockAddEventListener = vi.fn((event, handler) => {
        if (event === 'change') {
          changeHandler = handler;
        }
      });

      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: mockAddEventListener,
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      });

      render(
        <ThemeProvider>
          <div>Test content</div>
        </ThemeProvider>
      );

      // Simulate system theme change to dark
      act(() => {
        changeHandler!({ matches: true } as MediaQueryListEvent);
      });

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should not change theme on system change when user has saved preference', () => {
      localStorageMock.getItem.mockReturnValue('light');
      let changeHandler: (e: MediaQueryListEvent) => void;
      
      const mockAddEventListener = vi.fn((event, handler) => {
        if (event === 'change') {
          changeHandler = handler;
        }
      });

      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: mockAddEventListener,
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      });

      render(
        <ThemeProvider>
          <div>Test content</div>
        </ThemeProvider>
      );

      // Clear previous calls
      mockSetTheme.mockClear();

      // Simulate system theme change to dark
      act(() => {
        changeHandler!({ matches: true } as MediaQueryListEvent);
      });

      // Should not change theme because user has saved preference
      expect(mockSetTheme).not.toHaveBeenCalled();
    });
  });

  describe('Cross-Tab Synchronization', () => {
    it('should listen for storage events', () => {
      const mockAddEventListener = vi.fn();
      Object.defineProperty(window, 'addEventListener', {
        value: mockAddEventListener,
      });

      render(
        <ThemeProvider>
          <div>Test content</div>
        </ThemeProvider>
      );

      expect(mockAddEventListener).toHaveBeenCalledWith('storage', expect.any(Function));
    });

    it('should sync theme on storage change', () => {
      let storageHandler: (e: StorageEvent) => void;
      
      const mockAddEventListener = vi.fn((event, handler) => {
        if (event === 'storage') {
          storageHandler = handler;
        }
      });

      Object.defineProperty(window, 'addEventListener', {
        value: mockAddEventListener,
      });

      render(
        <ThemeProvider>
          <div>Test content</div>
        </ThemeProvider>
      );

      // Clear previous calls
      mockSetTheme.mockClear();

      // Simulate storage change
      act(() => {
        storageHandler!({
          key: 'theme',
          newValue: 'dark',
        } as StorageEvent);
      });

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should not sync theme on storage change for different key', () => {
      let storageHandler: (e: StorageEvent) => void;
      
      const mockAddEventListener = vi.fn((event, handler) => {
        if (event === 'storage') {
          storageHandler = handler;
        }
      });

      Object.defineProperty(window, 'addEventListener', {
        value: mockAddEventListener,
      });

      render(
        <ThemeProvider>
          <div>Test content</div>
        </ThemeProvider>
      );

      // Clear previous calls
      mockSetTheme.mockClear();

      // Simulate storage change for different key
      act(() => {
        storageHandler!({
          key: 'otherKey',
          newValue: 'dark',
        } as StorageEvent);
      });

      expect(mockSetTheme).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const mockRemoveEventListener = vi.fn();
      
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: mockRemoveEventListener,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      });

      const { unmount } = render(
        <ThemeProvider>
          <div>Test content</div>
        </ThemeProvider>
      );

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('Fallback for Older Browsers', () => {
    it('should use addListener/removeListener for older browsers', () => {
      const mockAddListener = vi.fn();
      const mockRemoveListener = vi.fn();
      
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: undefined, // Simulate older browser
        removeEventListener: undefined,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
      });

      const { unmount } = render(
        <ThemeProvider>
          <div>Test content</div>
        </ThemeProvider>
      );

      expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function));

      unmount();

      expect(mockRemoveListener).toHaveBeenCalledWith(expect.any(Function));
    });
  });
});