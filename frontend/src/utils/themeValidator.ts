/**
 * Theme Validation Utilities
 * Helps developers ensure proper theme usage and accessibility compliance
 */

import { themeColors } from '../config/theme';
import { getContrastRatio, meetsWCAGAA } from './colorContrast';

export type ThemeMode = 'light' | 'dark';
export type ColorCategory = keyof typeof themeColors.light;
export type ColorSubcategory<T extends ColorCategory> = keyof typeof themeColors.light[T];

/**
 * Validate if a color combination meets accessibility standards
 */
export function validateColorCombination(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): {
  isValid: boolean;
  ratio: number;
  recommendation?: string;
} {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = level === 'AAA' ? 7 : 4.5;
  const isValid = ratio >= requiredRatio;

  let recommendation: string | undefined;
  if (!isValid) {
    if (ratio < 3) {
      recommendation = 'Poor contrast. Consider using a different color combination.';
    } else if (ratio < 4.5) {
      recommendation = 'Acceptable for large text (18pt+) but not for normal text.';
    } else {
      recommendation = 'Meets WCAG AA but not AAA standards.';
    }
  }

  return {
    isValid,
    ratio: Math.round(ratio * 100) / 100,
    recommendation,
  };
}

/**
 * Get theme-appropriate color for a specific use case
 */
export function getThemeColor(
  theme: ThemeMode,
  category: ColorCategory,
  subcategory: string
): string {
  const colors = themeColors[theme];
  const categoryColors = colors[category] as any;
  
  if (!categoryColors || !categoryColors[subcategory]) {
    console.warn(`Theme color not found: ${theme}.${category}.${String(subcategory)}`);
    return theme === 'dark' ? '#ffffff' : '#000000'; // Fallback
  }
  
  return categoryColors[subcategory];
}

/**
 * Validate theme color usage in a component
 */
export function validateThemeUsage(
  theme: ThemeMode,
  textColor: string,
  backgroundColor: string,
  context: string = 'component'
): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check contrast ratio
  const contrastResult = validateColorCombination(textColor, backgroundColor);
  if (!contrastResult.isValid) {
    issues.push(`Poor contrast ratio (${contrastResult.ratio}:1) in ${context}`);
    if (contrastResult.recommendation) {
      suggestions.push(contrastResult.recommendation);
    }
  }
  
  // Check if colors are from theme palette
  const isTextFromTheme = isColorFromTheme(theme, textColor);
  const isBgFromTheme = isColorFromTheme(theme, backgroundColor);
  
  if (!isTextFromTheme) {
    issues.push(`Text color ${textColor} is not from theme palette in ${context}`);
    suggestions.push('Use theme colors for consistency and accessibility');
  }
  
  if (!isBgFromTheme) {
    issues.push(`Background color ${backgroundColor} is not from theme palette in ${context}`);
    suggestions.push('Use theme colors for consistency and accessibility');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
  };
}

/**
 * Check if a color exists in the theme palette
 */
export function isColorFromTheme(theme: ThemeMode, color: string): boolean {
  const colors = themeColors[theme];
  
  // Flatten all theme colors
  const allColors: string[] = [];
  
  Object.values(colors).forEach(category => {
    if (category && typeof category === 'object') {
      Object.values(category).forEach(subcategory => {
        if (typeof subcategory === 'string') {
          allColors.push(subcategory.toLowerCase());
        }
      });
    }
  });
  
  return allColors.includes(color.toLowerCase());
}

/**
 * Get recommended text color for a background
 */
export function getRecommendedTextColor(
  theme: ThemeMode,
  backgroundColor: string
): {
  color: string;
  category: string;
  contrast: number;
} {
  const colors = themeColors[theme];
  const textOptions = [
    { color: colors.text.primary, category: 'primary' },
    { color: colors.text.secondary, category: 'secondary' },
    { color: colors.text.muted, category: 'muted' },
  ];
  
  // Find the best contrast option
  let bestOption = textOptions[0];
  let bestContrast = getContrastRatio(bestOption.color, backgroundColor);
  
  textOptions.forEach(option => {
    const contrast = getContrastRatio(option.color, backgroundColor);
    if (contrast > bestContrast) {
      bestOption = option;
      bestContrast = contrast;
    }
  });
  
  return {
    color: bestOption.color,
    category: bestOption.category,
    contrast: Math.round(bestContrast * 100) / 100,
  };
}

/**
 * Generate CSS custom properties for theme colors
 */
export function generateThemeCSS(theme: ThemeMode): string {
  const colors = themeColors[theme];
  const cssVars: string[] = [];
  
  // Generate CSS custom properties
  Object.entries(colors).forEach(([category, categoryColors]) => {
    if (categoryColors && typeof categoryColors === 'object') {
      Object.entries(categoryColors).forEach(([subcategory, color]) => {
        if (typeof color === 'string') {
          cssVars.push(`  --color-${category}-${subcategory}: ${color};`);
        }
      });
    }
  });
  
  return `:root {\n${cssVars.join('\n')}\n}`;
}

/**
 * Validate multiplier color based on value
 */
export function validateMultiplierColor(
  multiplier: number,
  theme: ThemeMode
): {
  expectedColor: string;
  category: 'low' | 'medium' | 'high';
  isAppropriate: boolean;
} {
  const colors = themeColors[theme];
  let category: 'low' | 'medium' | 'high';
  let expectedColor: string;
  
  if (multiplier < 2) {
    category = 'low';
    expectedColor = colors.game.multiplierLow;
  } else if (multiplier < 10) {
    category = 'medium';
    expectedColor = colors.game.multiplierMedium;
  } else {
    category = 'high';
    expectedColor = colors.game.multiplierHigh;
  }
  
  return {
    expectedColor,
    category,
    isAppropriate: true, // Always appropriate when using theme colors
  };
}

/**
 * Get all available theme colors for a category
 */
export function getThemeColorOptions(
  theme: ThemeMode,
  category: ColorCategory
): Record<string, string> {
  const colors = themeColors[theme];
  const categoryColors = colors[category] as any;
  
  if (!categoryColors || typeof categoryColors !== 'object') {
    return {};
  }
  
  return categoryColors;
}

/**
 * Validate component accessibility
 */
export function validateComponentAccessibility(
  theme: ThemeMode,
  componentColors: {
    text?: string;
    background?: string;
    border?: string;
    focus?: string;
  },
  componentName: string = 'Component'
): {
  isAccessible: boolean;
  issues: string[];
  recommendations: string[];
  score: number; // 0-100
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  
  const { text, background, border, focus } = componentColors;
  
  // Validate text/background contrast
  if (text && background) {
    const textBgResult = validateColorCombination(text, background);
    if (!textBgResult.isValid) {
      issues.push(`${componentName}: Text/background contrast is insufficient (${textBgResult.ratio}:1)`);
      recommendations.push('Increase contrast between text and background colors');
      score -= 30;
    }
  }
  
  // Validate focus indicator
  if (focus && background) {
    const focusResult = validateColorCombination(focus, background);
    if (!focusResult.isValid) {
      issues.push(`${componentName}: Focus indicator has poor contrast (${focusResult.ratio}:1)`);
      recommendations.push('Use a more contrasting color for focus indicators');
      score -= 20;
    }
  }
  
  // Validate border visibility
  if (border && background) {
    const borderResult = validateColorCombination(border, background);
    if (borderResult.ratio < 1.5) {
      issues.push(`${componentName}: Border is barely visible (${borderResult.ratio}:1)`);
      recommendations.push('Use a more contrasting border color or increase border width');
      score -= 10;
    }
  }
  
  // Check if using theme colors
  const colorsToCheck = [text, background, border, focus].filter(Boolean) as string[];
  const nonThemeColors = colorsToCheck.filter(color => !isColorFromTheme(theme, color));
  
  if (nonThemeColors.length > 0) {
    issues.push(`${componentName}: Using non-theme colors: ${nonThemeColors.join(', ')}`);
    recommendations.push('Use theme colors for consistency and automatic dark mode support');
    score -= 15;
  }
  
  return {
    isAccessible: issues.length === 0,
    issues,
    recommendations,
    score: Math.max(0, score),
  };
}

/**
 * Development helper: Log theme validation results
 */
export function logThemeValidation(
  theme: ThemeMode,
  componentName: string,
  colors: Record<string, string>
): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  console.group(`🎨 Theme Validation: ${componentName}`);
  
  Object.entries(colors).forEach(([property, color]) => {
    const isFromTheme = isColorFromTheme(theme, color);
    console.log(
      `${property}: ${color} ${isFromTheme ? '✅' : '⚠️'}`,
      isFromTheme ? '' : '(not from theme)'
    );
  });
  
  console.groupEnd();
}