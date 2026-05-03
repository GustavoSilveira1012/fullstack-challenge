import { describe, it, expect } from 'bun:test';
import { Money, InvalidMoneyError, NegativeMoneyError } from '@/domain/value-objects/money';

describe('Money Value Object', () => {
  describe('fromCentavos', () => {
    it('should create Money with valid positive amount', () => {
      const result = Money.fromCentavos(100n);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toCentavos()).toBe(100n);
      }
    });

    it('should create Money with zero amount', () => {
      const result = Money.fromCentavos(0n);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toCentavos()).toBe(0n);
      }
    });

    it('should reject negative amount', () => {
      const result = Money.fromCentavos(-100n);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidMoneyError);
        expect(result.error.message).toContain('cannot be negative');
      }
    });

    it('should handle large bigint values', () => {
      const largeAmount = BigInt('9223372036854775807'); // Max safe bigint
      const result = Money.fromCentavos(largeAmount);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toCentavos()).toBe(largeAmount);
      }
    });
  });

  describe('zero', () => {
    it('should create Money with zero value', () => {
      const money = Money.zero();
      expect(money.toCentavos()).toBe(0n);
    });

    it('should equal another zero Money', () => {
      const money1 = Money.zero();
      const money2 = Money.zero();
      expect(money1.equals(money2)).toBe(true);
    });
  });

  describe('add', () => {
    it('should add two Money instances correctly', () => {
      const result1 = Money.fromCentavos(100n);
      const result2 = Money.fromCentavos(50n);
      if (result1.ok && result2.ok) {
        const sum = result1.value.add(result2.value);
        expect(sum.toCentavos()).toBe(150n);
      }
    });

    it('should add zero to Money', () => {
      const result = Money.fromCentavos(100n);
      if (result.ok) {
        const sum = result.value.add(Money.zero());
        expect(sum.toCentavos()).toBe(100n);
      }
    });

    it('should handle large sums', () => {
      const large1 = BigInt('9000000000000000000');
      const large2 = BigInt('200000000000000000');
      const result1 = Money.fromCentavos(large1);
      const result2 = Money.fromCentavos(large2);
      if (result1.ok && result2.ok) {
        const sum = result1.value.add(result2.value);
        expect(sum.toCentavos()).toBe(large1 + large2);
      }
    });
  });

  describe('subtract', () => {
    it('should subtract Money correctly when result is positive', () => {
      const result1 = Money.fromCentavos(100n);
      const result2 = Money.fromCentavos(30n);
      if (result1.ok && result2.ok) {
        const diff = result1.value.subtract(result2.value);
        expect(diff.ok).toBe(true);
        if (diff.ok) {
          expect(diff.value.toCentavos()).toBe(70n);
        }
      }
    });

    it('should return zero when subtracting equal amounts', () => {
      const result1 = Money.fromCentavos(100n);
      const result2 = Money.fromCentavos(100n);
      if (result1.ok && result2.ok) {
        const diff = result1.value.subtract(result2.value);
        expect(diff.ok).toBe(true);
        if (diff.ok) {
          expect(diff.value.toCentavos()).toBe(0n);
        }
      }
    });

    it('should reject subtraction resulting in negative', () => {
      const result1 = Money.fromCentavos(50n);
      const result2 = Money.fromCentavos(100n);
      if (result1.ok && result2.ok) {
        const diff = result1.value.subtract(result2.value);
        expect(diff.ok).toBe(false);
        if (!diff.ok) {
          expect(diff.error).toBeInstanceOf(NegativeMoneyError);
        }
      }
    });
  });

  describe('multiplyBy', () => {
    it('should multiply Money by Multiplier correctly', () => {
      const result = Money.fromCentavos(100n); // 1.00
      if (result.ok) {
        const product = result.value.multiplyBy(2.5); // 1.00 * 2.5 = 2.50
        expect(product.toCentavos()).toBe(250n);
      }
    });

    it('should round down to nearest centavo', () => {
      const result = Money.fromCentavos(100n); // 1.00
      if (result.ok) {
        const product = result.value.multiplyBy(1.333); // 1.00 * 1.333 = 1.333 -> 1.33
        expect(product.toCentavos()).toBe(133n);
      }
    });

    it('should multiply by 1.0 (identity)', () => {
      const result = Money.fromCentavos(100n);
      if (result.ok) {
        const product = result.value.multiplyBy(1.0);
        expect(product.toCentavos()).toBe(100n);
      }
    });

    it('should multiply by zero', () => {
      const result = Money.fromCentavos(100n);
      if (result.ok) {
        const product = result.value.multiplyBy(0.0);
        expect(product.toCentavos()).toBe(0n);
      }
    });

    it('should handle large multipliers', () => {
      const result = Money.fromCentavos(100n); // 1.00
      if (result.ok) {
        const product = result.value.multiplyBy(100.5); // 1.00 * 100.5 = 100.50
        expect(product.toCentavos()).toBe(10050n);
      }
    });
  });

  describe('isGreaterThanOrEqual', () => {
    it('should return true when equal', () => {
      const result1 = Money.fromCentavos(100n);
      const result2 = Money.fromCentavos(100n);
      if (result1.ok && result2.ok) {
        expect(result1.value.isGreaterThanOrEqual(result2.value)).toBe(true);
      }
    });

    it('should return true when greater', () => {
      const result1 = Money.fromCentavos(150n);
      const result2 = Money.fromCentavos(100n);
      if (result1.ok && result2.ok) {
        expect(result1.value.isGreaterThanOrEqual(result2.value)).toBe(true);
      }
    });

    it('should return false when less', () => {
      const result1 = Money.fromCentavos(50n);
      const result2 = Money.fromCentavos(100n);
      if (result1.ok && result2.ok) {
        expect(result1.value.isGreaterThanOrEqual(result2.value)).toBe(false);
      }
    });
  });

  describe('equals', () => {
    it('should return true for equal amounts', () => {
      const result1 = Money.fromCentavos(100n);
      const result2 = Money.fromCentavos(100n);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });

    it('should return false for different amounts', () => {
      const result1 = Money.fromCentavos(100n);
      const result2 = Money.fromCentavos(101n);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });

    it('should return true for zero equals zero', () => {
      const money1 = Money.zero();
      const money2 = Money.zero();
      expect(money1.equals(money2)).toBe(true);
    });
  });

  describe('toCentavos', () => {
    it('should return the centavos value', () => {
      const result = Money.fromCentavos(12345n);
      if (result.ok) {
        expect(result.value.toCentavos()).toBe(12345n);
      }
    });
  });

  describe('toDecimal', () => {
    it('should format as decimal string', () => {
      const result = Money.fromCentavos(10050n); // 100.50
      if (result.ok) {
        expect(result.value.toDecimal()).toBe('100.50');
      }
    });

    it('should format zero correctly', () => {
      const money = Money.zero();
      expect(money.toDecimal()).toBe('0.00');
    });

    it('should format single digit cents with leading zero', () => {
      const result = Money.fromCentavos(105n); // 1.05
      if (result.ok) {
        expect(result.value.toDecimal()).toBe('1.05');
      }
    });

    it('should format amounts without cents', () => {
      const result = Money.fromCentavos(10000n); // 100.00
      if (result.ok) {
        expect(result.value.toDecimal()).toBe('100.00');
      }
    });
  });
});
