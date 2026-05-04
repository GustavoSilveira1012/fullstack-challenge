/**
 * Color Contrast Utilities
 * Ensures WCAG AA compliance for all color combinations
 */

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 guidelines
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    throw new Error('Invalid hex color format');
  }
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if color combination meets WCAG AA standard (4.5:1)
 */
export function meetsWCAGAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5;
}

/**
 * Check if color combination meets WCAG AAA standard (7:1)
 */
export function meetsWCAGAAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 7;
}

/**
 * WCAG AA compliant color combinations for our theme
 */
export const colorCombinations = {
  light: {
    // Primary text on light backgrounds
    primaryText: '#0f172a', // slate-900
    secondaryText: '#475569', // slate-600
    mutedText: '#64748b', // slate-500
    
    // Backgrounds
    primaryBg: '#ffffff', // white
    secondaryBg: '#f8fafc', // slate-50
    tertiaryBg: '#f1f5f9', // slate-100
    
    // Interactive elements
    primaryButton: '#1d4ed8', // blue-700
    primaryButtonHover: '#1e40af', // blue-800
    dangerButton: '#dc2626', // red-600
    successButton: '#059669', // emerald-600
    
    // Borders
    border: '#e2e8f0', // slate-200
    borderLight: '#f1f5f9', // slate-100
  },
  dark: {
    // Primary text on dark backgrounds
    primaryText: '#f8fafc', // slate-50
    secondaryText: '#cbd5e1', // slate-300
    mutedText: '#94a3b8', // slate-400
    
    // Backgrounds
    primaryBg: '#0f172a', // slate-900
    secondaryBg: '#1e293b', // slate-800
    tertiaryBg: '#334155', // slate-700
    
    // Interactive elements
    primaryButton: '#3b82f6', // blue-500
    primaryButtonHover: '#2563eb', // blue-600
    dangerButton: '#ef4444', // red-500
    successButton: '#10b981', // emerald-500
    
    // Borders
    border: '#334155', // slate-700
    borderLight: '#475569', // slate-600
  }
};

/**
 * Validate all theme color combinations for WCAG AA compliance
 */
export function validateThemeContrast(): { 
  light: Record<string, boolean>; 
  dark: Record<string, boolean>; 
} {
  const results = {
    light: {} as Record<string, boolean>,
    dark: {} as Record<string, boolean>
  };
  
  // Light theme validation
  const light = colorCombinations.light;
  results.light = {
    'primaryText/primaryBg': meetsWCAGAA(light.primaryText, light.primaryBg),
    'primaryText/secondaryBg': meetsWCAGAA(light.primaryText, light.secondaryBg),
    'secondaryText/primaryBg': meetsWCAGAA(light.secondaryText, light.primaryBg),
    'secondaryText/secondaryBg': meetsWCAGAA(light.secondaryText, light.secondaryBg),
    'mutedText/primaryBg': meetsWCAGAA(light.mutedText, light.primaryBg),
    'primaryButton/white': meetsWCAGAA('#ffffff', light.primaryButton),
    'dangerButton/white': meetsWCAGAA('#ffffff', light.dangerButton),
    'successButton/white': meetsWCAGAA('#ffffff', light.successButton),
  };
  
  // Dark theme validation
  const dark = colorCombinations.dark;
  results.dark = {
    'primaryText/primaryBg': meetsWCAGAA(dark.primaryText, dark.primaryBg),
    'primaryText/secondaryBg': meetsWCAGAA(dark.primaryText, dark.secondaryBg),
    'secondaryText/primaryBg': meetsWCAGAA(dark.secondaryText, dark.primaryBg),
    'secondaryText/secondaryBg': meetsWCAGAA(dark.secondaryText, dark.secondaryBg),
    'mutedText/primaryBg': meetsWCAGAA(dark.mutedText, dark.primaryBg),
    'primaryButton/white': meetsWCAGAA('#ffffff', dark.primaryButton),
    'dangerButton/white': meetsWCAGAA('#ffffff', dark.dangerButton),
    'successButton/white': meetsWCAGAA('#ffffff', dark.successButton),
  };
  
  return results;
}

/**
 * Get appropriate text color for a given background
 */
export function getTextColorForBackground(backgroundColor: string, theme: 'light' | 'dark'): string {
  const colors = colorCombinations[theme];
  
  // Test contrast with different text colors
  const textOptions = [colors.primaryText, colors.secondaryText, colors.mutedText];
  
  for (const textColor of textOptions) {
    if (meetsWCAGAA(textColor, backgroundColor)) {
      return textColor;
    }
  }
  
  // Fallback to primary text color
  return colors.primaryText;
}