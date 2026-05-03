import { describe, it, expect } from 'bun:test';
import { Multiplier, InvalidMultiplierError } from '@/domain/value-objects/multiplier';

describe('Multiplier Value Object', () => {
  describe('fromNumber', () => {
    it('should create Multiplier with valid value >= 1.00', () => {
      const result = Multiplier.fromNumber(1.0);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toNumber()).toBe(1.0);
      }
    });

    it('should create Multiplier with value > 1.00', () => {
      const result = Multiplier.fromNumber(2.5);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toNumber()).toBe(2.5);
      }
    });

    it('should reject value < 1.00', () => {
      const result = Multiplier.fromNumber(0.99);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidMultiplierError);
        expect(result.error.message).toContain('at least 1.00x');
      }
    });

    it('should reject zero', () => {
      const result = Multiplier.fromNumber(0.0);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidMultiplierError);
      }
    });

    it('should reject negative value', () => {
      const result = Multiplier.fromNumber(-1.5);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidMultiplierError);
      }
    });

    it('should handle large multipliers', () => {
      const result = Multiplier.fromNumber(1000.0);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toNumber()).toBe(1000.0);
      }
    });

    it('should handle precise decimal values', () => {
      const result = Multiplier.fromNumber(1.337);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toNumber()).toBe(1.337);
      }
    });
  });

  describe('initial', () => {
    it('should create initial Multiplier with 1.00x', () => {
      const multiplier = Multiplier.initial();
      expect(multiplier.toNumber()).toBe(1.0);
    });

    it('should equal another 1.00x Multiplier', () => {
      const initial = Multiplier.initial();
      const result = Multiplier.fromNumber(1.0);
      if (result.ok) {
        expect(initial.equals(result.value)).toBe(true);
      }
    });
  });

  describe('isGreaterThanOrEqual', () => {
    it('should return true when equal', () => {
      const result1 = Multiplier.fromNumber(2.0);
      const result2 = Multiplier.fromNumber(2.0);
      if (result1.ok && result2.ok) {
        expect(result1.value.isGreaterThanOrEqual(result2.value)).toBe(true);
      }
    });

    it('should return true when greater', () => {
      const result1 = Multiplier.fromNumber(3.0);
      const result2 = Multiplier.fromNumber(2.0);
      if (result1.ok && result2.ok) {
        expect(result1.value.isGreaterThanOrEqual(result2.value)).toBe(true);
      }
    });

    it('should return false when less', () => {
      const result1 = Multiplier.fromNumber(1.5);
      const result2 = Multiplier.fromNumber(2.0);
      if (result1.ok && result2.ok) {
        expect(result1.value.isGreaterThanOrEqual(result2.value)).toBe(false);
      }
    });

    it('should handle minimum value comparison', () => {
      const result1 = Multiplier.fromNumber(1.0);
      const result2 = Multiplier.fromNumber(1.0);
      if (result1.ok && result2.ok) {
        expect(result1.value.isGreaterThanOrEqual(result2.value)).toBe(true);
      }
    });
  });

  describe('equals', () => {
    it('should return true for equal values', () => {
      const result1 = Multiplier.fromNumber(2.5);
      const result2 = Multiplier.fromNumber(2.5);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });

    it('should return false for different values', () => {
      const result1 = Multiplier.fromNumber(2.5);
      const result2 = Multiplier.fromNumber(2.6);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });

    it('should use epsilon for floating point comparison', () => {
      // Values very close due to floating point precision
      // Using values that are actually different but within epsilon
      const result1 = Multiplier.fromNumber(1.5);
      const result2 = Multiplier.fromNumber(1.5 + 1e-10);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });

    it('should return true for initial multipliers', () => {
      const initial1 = Multiplier.initial();
      const initial2 = Multiplier.initial();
      expect(initial1.equals(initial2)).toBe(true);
    });
  });

  describe('toNumber', () => {
    it('should return the numeric value', () => {
      const result = Multiplier.fromNumber(3.75);
      if (result.ok) {
        expect(result.value.toNumber()).toBe(3.75);
      }
    });
  });

  describe('toString', () => {
    it('should format as string with x suffix', () => {
      const result = Multiplier.fromNumber(1.5);
      if (result.ok) {
        expect(result.value.toString()).toBe('1.50x');
      }
    });

    it('should format initial multiplier', () => {
      const initial = Multiplier.initial();
      expect(initial.toString()).toBe('1.00x');
    });

    it('should format large multipliers', () => {
      const result = Multiplier.fromNumber(100.5);
      if (result.ok) {
        expect(result.value.toString()).toBe('100.50x');
      }
    });

    it('should format with two decimal places', () => {
      const result = Multiplier.fromNumber(2.337);
      if (result.ok) {
        expect(result.value.toString()).toBe('2.34x');
      }
    });
  });
});
