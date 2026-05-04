import { describe, it, expect } from 'vitest';
import { 
  getContrastRatio, 
  meetsWCAGAA, 
  meetsWCAGAAA, 
  validateThemeContrast,
  colorCombinations,
  getTextColorForBackground
} from '../colorContrast';

describe('Color Contrast Utilities', () => {
  describe('getContrastRatio', () => {
    it('should calculate correct contrast ratio for black and white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBe(21);
    });

    it('should calculate correct contrast ratio for same colors', () => {
      const ratio = getContrastRatio('#ffffff', '#ffffff');
      expect(ratio).toBe(1);
    });

    it('should handle colors without # prefix', () => {
      const ratio = getContrastRatio('000000', 'ffffff');
      expect(ratio).toBe(21);
    });

    it('should throw error for invalid hex colors', () => {
      expect(() => getContrastRatio('invalid', '#ffffff')).toThrow('Invalid hex color format');
    });
  });

  describe('WCAG Compliance', () => {
    it('should correctly identify WCAG AA compliant combinations', () => {
      // Black text on white background (21:1 ratio)
      expect(meetsWCAGAA('#000000', '#ffffff')).toBe(true);
      
      // Dark gray text on white background (should pass)
      expect(meetsWCAGAA('#333333', '#ffffff')).toBe(true);
      
      // Light gray text on white background (should fail)
      expect(meetsWCAGAA('#cccccc', '#ffffff')).toBe(false);
    });

    it('should correctly identify WCAG AAA compliant combinations', () => {
      // Black text on white background (21:1 ratio)
      expect(meetsWCAGAAA('#000000', '#ffffff')).toBe(true);
      
      // Medium contrast that passes AA but not AAA
      expect(meetsWCAGAAA('#666666', '#ffffff')).toBe(false);
    });
  });

  describe('Theme Color Validation', () => {
    it('should validate all light theme combinations meet WCAG AA', () => {
      const results = validateThemeContrast();
      
      // All light theme combinations should pass WCAG AA
      Object.entries(results.light).forEach(([combination, passes]) => {
        expect(passes).toBe(true, `Light theme combination ${combination} should meet WCAG AA`);
      });
    });

    it('should validate all dark theme combinations meet WCAG AA', () => {
      const results = validateThemeContrast();
      
      // All dark theme combinations should pass WCAG AA
      Object.entries(results.dark).forEach(([combination, passes]) => {
        expect(passes).toBe(true, `Dark theme combination ${combination} should meet WCAG AA`);
      });
    });

    it('should have proper contrast for primary text on primary background', () => {
      const lightRatio = getContrastRatio(
        colorCombinations.light.primaryText,
        colorCombinations.light.primaryBg
      );
      const darkRatio = getContrastRatio(
        colorCombinations.dark.primaryText,
        colorCombinations.dark.primaryBg
      );

      expect(lightRatio).toBeGreaterThanOrEqual(4.5);
      expect(darkRatio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have proper contrast for button text', () => {
      // Primary button with white text
      const lightPrimaryRatio = getContrastRatio('#ffffff', colorCombinations.light.primaryButton);
      const darkPrimaryRatio = getContrastRatio('#ffffff', colorCombinations.dark.primaryButton);

      expect(lightPrimaryRatio).toBeGreaterThanOrEqual(4.5);
      expect(darkPrimaryRatio).toBeGreaterThanOrEqual(4.5);

      // Danger button with white text
      const lightDangerRatio = getContrastRatio('#ffffff', colorCombinations.light.dangerButton);
      const darkDangerRatio = getContrastRatio('#ffffff', colorCombinations.dark.dangerButton);

      expect(lightDangerRatio).toBeGreaterThanOrEqual(4.5);
      expect(darkDangerRatio).toBeGreaterThanOrEqual(4.5);

      // Success button with white text
      const lightSuccessRatio = getContrastRatio('#ffffff', colorCombinations.light.successButton);
      const darkSuccessRatio = getContrastRatio('#ffffff', colorCombinations.dark.successButton);

      expect(lightSuccessRatio).toBeGreaterThanOrEqual(4.5);
      expect(darkSuccessRatio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('getTextColorForBackground', () => {
    it('should return appropriate text color for light backgrounds', () => {
      const textColor = getTextColorForBackground('#ffffff', 'light');
      expect(textColor).toBe(colorCombinations.light.primaryText);
      
      // Verify the returned color has good contrast
      const ratio = getContrastRatio(textColor, '#ffffff');
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should return appropriate text color for dark backgrounds', () => {
      const textColor = getTextColorForBackground('#000000', 'dark');
      expect(textColor).toBe(colorCombinations.dark.primaryText);
      
      // Verify the returned color has good contrast
      const ratio = getContrastRatio(textColor, '#000000');
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Multiplier Color Accessibility', () => {
    it('should ensure multiplier colors have good contrast on both themes', () => {
      const multiplierColors = {
        low: '#10b981',    // Green
        medium: '#f59e0b', // Orange
        high: '#ef4444',   // Red
      };

      // Test against light theme background
      Object.entries(multiplierColors).forEach(([level, color]) => {
        const lightRatio = getContrastRatio(color, colorCombinations.light.primaryBg);
        expect(lightRatio).toBeGreaterThanOrEqual(3, `Multiplier ${level} should have sufficient contrast on light background`);
      });

      // Test against dark theme background
      Object.entries(multiplierColors).forEach(([level, color]) => {
        const darkRatio = getContrastRatio(color, colorCombinations.dark.primaryBg);
        expect(darkRatio).toBeGreaterThanOrEqual(3, `Multiplier ${level} should have sufficient contrast on dark background`);
      });
    });
  });
});