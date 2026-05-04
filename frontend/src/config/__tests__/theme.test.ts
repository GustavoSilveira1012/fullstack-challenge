import { describe, it, expect } from 'vitest';
import { themeColors, shadows, animations, breakpoints, zIndex, spacing, typography, sizes } from '../theme';
import { getContrastRatio, meetsWCAGAA } from '@utils/colorContrast';

describe('Theme Configuration', () => {
  describe('Color Contrast Compliance', () => {
    describe('Light Theme', () => {
      const light = themeColors.light;

      it('should have WCAG AA compliant text colors on primary background', () => {
        expect(meetsWCAGAA(light.text.primary, light.bg.primary)).toBe(true);
        expect(meetsWCAGAA(light.text.secondary, light.bg.primary)).toBe(true);
        expect(meetsWCAGAA(light.text.muted, light.bg.primary)).toBe(true);
      });

      it('should have WCAG AA compliant text colors on secondary background', () => {
        expect(meetsWCAGAA(light.text.primary, light.bg.secondary)).toBe(true);
        expect(meetsWCAGAA(light.text.secondary, light.bg.secondary)).toBe(true);
      });

      it('should have WCAG AA compliant interactive colors with white text', () => {
        expect(meetsWCAGAA('#ffffff', light.interactive.primary)).toBe(true);
        expect(meetsWCAGAA('#ffffff', light.interactive.danger)).toBe(true);
        expect(meetsWCAGAA('#ffffff', light.interactive.success)).toBe(true);
        expect(meetsWCAGAA('#ffffff', light.interactive.warning)).toBe(true);
      });

      it('should have sufficient contrast for game colors on backgrounds', () => {
        // Multiplier colors should be visible on both light backgrounds
        expect(getContrastRatio(light.game.multiplierLow, light.bg.primary)).toBeGreaterThanOrEqual(3);
        expect(getContrastRatio(light.game.multiplierMedium, light.bg.primary)).toBeGreaterThanOrEqual(3);
        expect(getContrastRatio(light.game.multiplierHigh, light.bg.primary)).toBeGreaterThanOrEqual(3);
      });
    });

    describe('Dark Theme', () => {
      const dark = themeColors.dark;

      it('should have WCAG AA compliant text colors on primary background', () => {
        expect(meetsWCAGAA(dark.text.primary, dark.bg.primary)).toBe(true);
        expect(meetsWCAGAA(dark.text.secondary, dark.bg.primary)).toBe(true);
        expect(meetsWCAGAA(dark.text.muted, dark.bg.primary)).toBe(true);
      });

      it('should have WCAG AA compliant text colors on secondary background', () => {
        expect(meetsWCAGAA(dark.text.primary, dark.bg.secondary)).toBe(true);
        expect(meetsWCAGAA(dark.text.secondary, dark.bg.secondary)).toBe(true);
      });

      it('should have WCAG AA compliant interactive colors with white text', () => {
        expect(meetsWCAGAA('#ffffff', dark.interactive.primary)).toBe(true);
        expect(meetsWCAGAA('#ffffff', dark.interactive.danger)).toBe(true);
        expect(meetsWCAGAA('#ffffff', dark.interactive.success)).toBe(true);
        expect(meetsWCAGAA('#ffffff', dark.interactive.warning)).toBe(true);
      });

      it('should have sufficient contrast for game colors on backgrounds', () => {
        // Multiplier colors should be visible on dark backgrounds
        expect(getContrastRatio(dark.game.multiplierLow, dark.bg.primary)).toBeGreaterThanOrEqual(3);
        expect(getContrastRatio(dark.game.multiplierMedium, dark.bg.primary)).toBeGreaterThanOrEqual(3);
        expect(getContrastRatio(dark.game.multiplierHigh, dark.bg.primary)).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('Theme Structure', () => {
    it('should have consistent structure between light and dark themes', () => {
      const lightKeys = Object.keys(themeColors.light);
      const darkKeys = Object.keys(themeColors.dark);
      
      expect(lightKeys).toEqual(darkKeys);
      
      // Check nested structure consistency
      lightKeys.forEach(key => {
        const lightSubKeys = Object.keys(themeColors.light[key as keyof typeof themeColors.light]);
        const darkSubKeys = Object.keys(themeColors.dark[key as keyof typeof themeColors.dark]);
        expect(lightSubKeys).toEqual(darkSubKeys);
      });
    });

    it('should have all required color categories', () => {
      const requiredCategories = ['bg', 'text', 'border', 'interactive', 'status', 'game'];
      
      requiredCategories.forEach(category => {
        expect(themeColors.light).toHaveProperty(category);
        expect(themeColors.dark).toHaveProperty(category);
      });
    });
  });

  describe('Shadows Configuration', () => {
    it('should have consistent shadow sizes for both themes', () => {
      const lightSizes = Object.keys(shadows.light);
      const darkSizes = Object.keys(shadows.dark);
      
      expect(lightSizes).toEqual(darkSizes);
      expect(lightSizes).toEqual(['sm', 'md', 'lg', 'xl']);
    });

    it('should have valid CSS shadow values', () => {
      Object.values(shadows.light).forEach(shadow => {
        expect(shadow).toMatch(/^[\d\s\w\(\)\/\.,#-]+$/);
      });
      
      Object.values(shadows.dark).forEach(shadow => {
        expect(shadow).toMatch(/^[\d\s\w\(\)\/\.,#-]+$/);
      });
    });
  });

  describe('Animations Configuration', () => {
    it('should have valid duration values', () => {
      Object.values(animations.duration).forEach(duration => {
        expect(duration).toMatch(/^\d+ms$/);
      });
    });

    it('should have valid easing functions', () => {
      Object.values(animations.easing).forEach(easing => {
        expect(easing).toMatch(/^(linear|cubic-bezier\([\d\.,\s]+\))$/);
      });
    });
  });

  describe('Breakpoints Configuration', () => {
    it('should have valid CSS unit values', () => {
      Object.values(breakpoints).forEach(breakpoint => {
        expect(breakpoint).toMatch(/^\d+px$/);
      });
    });

    it('should have breakpoints in ascending order', () => {
      const values = Object.values(breakpoints).map(bp => parseInt(bp));
      const sorted = [...values].sort((a, b) => a - b);
      expect(values).toEqual(sorted);
    });
  });

  describe('Z-Index Configuration', () => {
    it('should have proper z-index hierarchy', () => {
      expect(zIndex.hide).toBe(-1);
      expect(zIndex.base).toBe(0);
      expect(typeof zIndex.docked).toBe('number');
      expect(zIndex.modal > zIndex.overlay).toBe(true);
      expect(zIndex.toast > zIndex.modal).toBe(true);
    });
  });

  describe('Spacing Configuration', () => {
    it('should have valid CSS unit values', () => {
      Object.values(spacing).forEach(space => {
        if (space !== '0') {
          expect(space).toMatch(/^[\d\.]+rem$|^1px$/);
        }
      });
    });
  });

  describe('Typography Configuration', () => {
    it('should have valid font size configurations', () => {
      Object.values(typography.fontSize).forEach(config => {
        expect(Array.isArray(config)).toBe(true);
        expect(config).toHaveLength(2);
        expect(config[0]).toMatch(/^[\d\.]+rem$/);
        expect(config[1]).toHaveProperty('lineHeight');
      });
    });

    it('should have valid font weight values', () => {
      Object.values(typography.fontWeight).forEach(weight => {
        expect(weight).toMatch(/^\d{3}$/);
      });
    });
  });

  describe('Component Sizes Configuration', () => {
    it('should have consistent size variants', () => {
      const buttonSizes = Object.keys(sizes.button);
      const inputSizes = Object.keys(sizes.input);
      
      // Input should have at least the common sizes
      ['sm', 'md', 'lg'].forEach(size => {
        expect(buttonSizes).toContain(size);
        expect(inputSizes).toContain(size);
      });
    });

    it('should have valid CSS properties in size configurations', () => {
      Object.values(sizes.button).forEach(config => {
        expect(config).toHaveProperty('padding');
        expect(config).toHaveProperty('fontSize');
        expect(config).toHaveProperty('borderRadius');
      });
    });
  });

  describe('Color Accessibility Edge Cases', () => {
    it('should handle edge cases for multiplier colors', () => {
      const light = themeColors.light;
      const dark = themeColors.dark;
      
      // Test multiplier colors against various backgrounds
      const backgrounds = [
        light.bg.primary, light.bg.secondary, light.bg.tertiary,
        dark.bg.primary, dark.bg.secondary, dark.bg.tertiary
      ];
      
      const multiplierColors = [
        light.game.multiplierLow, light.game.multiplierMedium, light.game.multiplierHigh
      ];
      
      backgrounds.forEach(bg => {
        multiplierColors.forEach(color => {
          const ratio = getContrastRatio(color, bg);
          // Should have at least 3:1 ratio for large text/graphics
          expect(ratio).toBeGreaterThanOrEqual(3);
        });
      });
    });

    it('should ensure status colors are distinguishable', () => {
      const statusColors = [
        themeColors.light.status.success,
        themeColors.light.status.warning,
        themeColors.light.status.danger,
        themeColors.light.status.info
      ];
      
      // Each status color should be sufficiently different from others
      for (let i = 0; i < statusColors.length; i++) {
        for (let j = i + 1; j < statusColors.length; j++) {
          const ratio = getContrastRatio(statusColors[i], statusColors[j]);
          // Status colors should be distinguishable (at least 1.5:1 ratio)
          expect(ratio).toBeGreaterThanOrEqual(1.5);
        }
      }
    });
  });
});