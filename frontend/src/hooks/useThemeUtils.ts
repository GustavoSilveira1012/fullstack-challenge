import { useMemo } from 'react';
import { useUIStore } from '@store/uiStore';
import { getContrastRatio, meetsWCAGAA, colorCombinations } from '@utils/colorContrast';

/**
 * Theme utilities hook
 * Provides additional theme-related functionality beyond basic theme switching
 */
export const useThemeUtils = () => {
  const { theme } = useUIStore();

  /**
   * Get theme-appropriate colors
   */
  const colors = useMemo(() => colorCombinations[theme], [theme]);

  /**
   * Get multiplier color based on value
   */
  const getMultiplierColor = useMemo(() => {
    return (multiplier: number): string => {
      if (multiplier < 2) {
        return 'var(--color-multiplier-low)';
      } else if (multiplier < 10) {
        return 'var(--color-multiplier-medium)';
      } else {
        return 'var(--color-multiplier-high)';
      }
    };
  }, []);

  /**
   * Get multiplier CSS class based on value
   */
  const getMultiplierClass = useMemo(() => {
    return (multiplier: number): string => {
      if (multiplier < 2) {
        return 'text-multiplier-low';
      } else if (multiplier < 10) {
        return 'text-multiplier-medium';
      } else {
        return 'text-multiplier-high';
      }
    };
  }, []);

  /**
   * Get status color CSS class
   */
  const getStatusClass = useMemo(() => {
    return (status: 'success' | 'warning' | 'danger' | 'info'): string => {
      return `text-status-${status}`;
    };
  }, []);

  /**
   * Get button variant classes
   */
  const getButtonClasses = useMemo(() => {
    return (variant: 'primary' | 'secondary' | 'danger' | 'success'): string => {
      const baseClasses = 'px-4 py-2 rounded-md font-medium transition-all duration-200 focus-theme';
      return `${baseClasses} btn-theme-${variant}`;
    };
  }, []);

  /**
   * Check if current theme is dark
   */
  const isDark = useMemo(() => theme === 'dark', [theme]);

  /**
   * Get appropriate text color for a background
   */
  const getTextColor = useMemo(() => {
    return (backgroundColor: string): string => {
      // Test contrast with theme colors
      const primaryText = colors.primaryText;
      const secondaryText = colors.secondaryText;
      
      if (meetsWCAGAA(primaryText, backgroundColor)) {
        return primaryText;
      } else if (meetsWCAGAA(secondaryText, backgroundColor)) {
        return secondaryText;
      }
      
      // Fallback to high contrast
      return isDark ? '#ffffff' : '#000000';
    };
  }, [colors, isDark]);

  /**
   * Get theme-appropriate shadow class
   */
  const getShadowClass = useMemo(() => {
    return (size: 'sm' | 'md' | 'lg' = 'md'): string => {
      return `shadow-theme-${size}`;
    };
  }, []);

  /**
   * Get CSS custom property value
   */
  const getCSSVariable = useMemo(() => {
    return (property: string): string => {
      if (typeof window !== 'undefined') {
        return getComputedStyle(document.documentElement)
          .getPropertyValue(property)
          .trim();
      }
      return '';
    };
  }, []);

  /**
   * Apply theme to meta tags for mobile browsers
   */
  const updateMetaTheme = useMemo(() => {
    return () => {
      if (typeof window !== 'undefined') {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        const metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
        
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', isDark ? '#0f172a' : '#ffffff');
        }
        
        if (metaStatusBar) {
          metaStatusBar.setAttribute('content', isDark ? 'black-translucent' : 'default');
        }
      }
    };
  }, [isDark]);

  /**
   * Get theme-appropriate loading spinner color
   */
  const getSpinnerColor = useMemo(() => {
    return (): string => {
      return isDark ? '#3b82f6' : '#1d4ed8';
    };
  }, [isDark]);

  /**
   * Get theme-appropriate focus ring classes
   */
  const getFocusClasses = useMemo(() => {
    return (): string => {
      return 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900';
    };
  }, []);

  /**
   * Validate color contrast for accessibility
   */
  const validateContrast = useMemo(() => {
    return (foreground: string, background: string): {
      ratio: number;
      meetsAA: boolean;
      meetsAAA: boolean;
    } => {
      const ratio = getContrastRatio(foreground, background);
      return {
        ratio,
        meetsAA: ratio >= 4.5,
        meetsAAA: ratio >= 7,
      };
    };
  }, []);

  return {
    theme,
    isDark,
    colors,
    getMultiplierColor,
    getMultiplierClass,
    getStatusClass,
    getButtonClasses,
    getTextColor,
    getShadowClass,
    getCSSVariable,
    updateMetaTheme,
    getSpinnerColor,
    getFocusClasses,
    validateContrast,
  };
};