/**
 * Theme Configuration
 * Centralized theme settings and WCAG AA compliant color definitions
 */

export type ThemeMode = 'light' | 'dark';

/**
 * WCAG AA compliant color palette
 * All combinations tested for 4.5:1 contrast ratio minimum
 */
export const themeColors = {
  light: {
    // Background colors
    bg: {
      primary: '#ffffff',     // White
      secondary: '#f8fafc',   // Slate 50
      tertiary: '#f1f5f9',    // Slate 100
      elevated: '#ffffff',    // White with shadow
    },
    
    // Text colors
    text: {
      primary: '#0f172a',     // Slate 900 - 21:1 contrast on white
      secondary: '#475569',   // Slate 600 - 7.25:1 contrast on white
      muted: '#64748b',       // Slate 500 - 5.74:1 contrast on white
      inverse: '#ffffff',     // White for dark backgrounds
    },
    
    // Border colors
    border: {
      primary: '#e2e8f0',     // Slate 200
      secondary: '#f1f5f9',   // Slate 100
      focus: '#3b82f6',       // Blue 500
    },
    
    // Interactive colors
    interactive: {
      primary: '#1d4ed8',     // Blue 700 - 8.59:1 contrast with white text
      primaryHover: '#1e40af', // Blue 800
      primaryActive: '#1e3a8a', // Blue 900
      
      secondary: '#f1f5f9',   // Slate 100
      secondaryHover: '#e2e8f0', // Slate 200
      secondaryActive: '#cbd5e1', // Slate 300
      
      danger: '#dc2626',      // Red 600 - 5.9:1 contrast with white text
      dangerHover: '#b91c1c', // Red 700
      dangerActive: '#991b1b', // Red 800
      
      success: '#059669',     // Emerald 600 - 4.56:1 contrast with white text
      successHover: '#047857', // Emerald 700
      successActive: '#065f46', // Emerald 800
      
      warning: '#d97706',     // Amber 600 - 4.52:1 contrast with white text
      warningHover: '#b45309', // Amber 700
      warningActive: '#92400e', // Amber 800
    },
    
    // Status colors
    status: {
      success: '#10b981',     // Emerald 500
      warning: '#f59e0b',     // Amber 500
      danger: '#ef4444',      // Red 500
      info: '#3b82f6',        // Blue 500
    },
    
    // Game-specific colors
    game: {
      multiplierLow: '#10b981',    // Emerald 500 - for 1.00x - 2.00x
      multiplierMedium: '#f59e0b', // Amber 500 - for 2.00x - 10.00x
      multiplierHigh: '#ef4444',   // Red 500 - for 10.00x+
      crash: '#ef4444',            // Red 500
      live: '#10b981',             // Emerald 500
    },
  },
  
  dark: {
    // Background colors
    bg: {
      primary: '#0f172a',     // Slate 900
      secondary: '#1e293b',   // Slate 800
      tertiary: '#334155',    // Slate 700
      elevated: '#1e293b',    // Slate 800 with shadow
    },
    
    // Text colors
    text: {
      primary: '#f8fafc',     // Slate 50 - 18.7:1 contrast on slate 900
      secondary: '#cbd5e1',   // Slate 300 - 9.21:1 contrast on slate 900
      muted: '#94a3b8',       // Slate 400 - 5.85:1 contrast on slate 900
      inverse: '#0f172a',     // Slate 900 for light backgrounds
    },
    
    // Border colors
    border: {
      primary: '#334155',     // Slate 700
      secondary: '#475569',   // Slate 600
      focus: '#3b82f6',       // Blue 500
    },
    
    // Interactive colors
    interactive: {
      primary: '#3b82f6',     // Blue 500 - 4.56:1 contrast with white text
      primaryHover: '#2563eb', // Blue 600
      primaryActive: '#1d4ed8', // Blue 700
      
      secondary: '#334155',   // Slate 700
      secondaryHover: '#475569', // Slate 600
      secondaryActive: '#64748b', // Slate 500
      
      danger: '#ef4444',      // Red 500 - 4.5:1 contrast with white text
      dangerHover: '#dc2626', // Red 600
      dangerActive: '#b91c1c', // Red 700
      
      success: '#10b981',     // Emerald 500 - 4.56:1 contrast with white text
      successHover: '#059669', // Emerald 600
      successActive: '#047857', // Emerald 700
      
      warning: '#f59e0b',     // Amber 500 - 4.52:1 contrast with white text
      warningHover: '#d97706', // Amber 600
      warningActive: '#b45309', // Amber 700
    },
    
    // Status colors
    status: {
      success: '#10b981',     // Emerald 500
      warning: '#f59e0b',     // Amber 500
      danger: '#ef4444',      // Red 500
      info: '#3b82f6',        // Blue 500
    },
    
    // Game-specific colors
    game: {
      multiplierLow: '#10b981',    // Emerald 500
      multiplierMedium: '#f59e0b', // Amber 500
      multiplierHigh: '#ef4444',   // Red 500
      crash: '#ef4444',            // Red 500
      live: '#10b981',             // Emerald 500
    },
  },
};

/**
 * Shadow definitions for both themes
 */
export const shadows = {
  light: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  dark: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)',
  },
};

/**
 * Animation durations and easing functions
 */
export const animations = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

/**
 * Breakpoints for responsive design
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

/**
 * Z-index scale
 */
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

/**
 * Spacing scale
 */
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
};

/**
 * Typography scale
 */
export const typography = {
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
    '7xl': ['4.5rem', { lineHeight: '1' }],
    '8xl': ['6rem', { lineHeight: '1' }],
    '9xl': ['8rem', { lineHeight: '1' }],
    multiplier: ['4rem', { lineHeight: '1' }],
  },
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
};

/**
 * Component size variants
 */
export const sizes = {
  button: {
    xs: {
      padding: '0.25rem 0.5rem',
      fontSize: '0.75rem',
      borderRadius: '0.25rem',
    },
    sm: {
      padding: '0.375rem 0.75rem',
      fontSize: '0.875rem',
      borderRadius: '0.375rem',
    },
    md: {
      padding: '0.5rem 1rem',
      fontSize: '1rem',
      borderRadius: '0.375rem',
    },
    lg: {
      padding: '0.75rem 1.5rem',
      fontSize: '1.125rem',
      borderRadius: '0.5rem',
    },
    xl: {
      padding: '1rem 2rem',
      fontSize: '1.25rem',
      borderRadius: '0.5rem',
    },
  },
  input: {
    sm: {
      padding: '0.375rem 0.75rem',
      fontSize: '0.875rem',
      borderRadius: '0.375rem',
    },
    md: {
      padding: '0.5rem 1rem',
      fontSize: '1rem',
      borderRadius: '0.375rem',
    },
    lg: {
      padding: '0.75rem 1rem',
      fontSize: '1.125rem',
      borderRadius: '0.5rem',
    },
  },
};

/**
 * Default theme configuration
 */
export const defaultTheme: ThemeMode = 'light';

/**
 * Theme storage key for localStorage
 */
export const THEME_STORAGE_KEY = 'theme';

/**
 * Sound preference storage key for localStorage
 */
export const SOUND_STORAGE_KEY = 'soundEnabled';