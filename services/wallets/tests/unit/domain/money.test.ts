import { describe, it, expect } from 'bun:test';
import { Money, InvalidMoneyError, NegativeMoneyError } from '../../../src/domain/money';

describe('Money Value Object', () => {
  describe('fromCentavos()', () => {
    it('should create Money instance with valid non-negative value', () => {
      const result = Money.fromCentavos(100n);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toCentavos()).toBe(100n);
      }
    });

    it('should create Money instance with zero value', () => {
      const result = Money.fromCentavos(0n);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toCentavos()).toBe(0n);
      }
    });

    it('should reject negative values', () => {
      const result = Money.fromCentavos(-100n);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidMoneyError);
        expect(result.error.message).toBe('Money value cannot be negative');
      }
    });

    it('should reject negative one', () => {
      const result = Money.fromCentavos(-1n);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidMoneyError);
        expect(result.error.message).toBe('Money value cannot be negative');
        expect(result.error.name).toBe('InvalidMoneyError');
      }
    });

    it('should handle large bigint values without precision loss', () => {
      const largeCentavos = 999999999999999999n;
      const result = Money.fromCentavos(largeCentavos);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toCentavos()).toBe(largeCentavos);
      }
    });

    it('should handle values beyond Number.MAX_SAFE_INTEGER', () => {
      // Number.MAX_SAFE_INTEGER is 9007199254740991
      const beyondMaxSafeInt = 9007199254740992n;
      const result = Money.fromCentavos(beyondMaxSafeInt);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toCentavos()).toBe(beyondMaxSafeInt);
      }
    });

    it('should handle extremely large bigint values', () => {
      // Test with a value much larger than Number.MAX_SAFE_INTEGER
      const extremelyLarge = 999999999999999999999999999n;
      const result = Money.fromCentavos(extremelyLarge);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toCentavos()).toBe(extremelyLarge);
      }
    });
  });

  describe('zero()', () => {
    it('should create Money instance with zero centavos', () => {
      const money = Money.zero();

      expect(money.toCentavos()).toBe(0n);
    });

    it('should return same value as fromCentavos(0n)', () => {
      const zero1 = Money.zero();
      const zero2Result = Money.fromCentavos(0n);

      expect(zero2Result.ok).toBe(true);
      if (zero2Result.ok) {
        expect(zero1.equals(zero2Result.value)).toBe(true);
      }
    });
  });

  describe('add()', () => {
    it('should add two Money instances correctly', () => {
      const money1Result = Money.fromCentavos(100n);
      const money2Result = Money.fromCentavos(50n);

      expect(money1Result.ok).toBe(true);
      expect(money2Result.ok).toBe(true);

      if (money1Result.ok && money2Result.ok) {
        const sum = money1Result.value.add(money2Result.value);
        expect(sum.toCentavos()).toBe(150n);
      }
    });

    it('should add zero correctly', () => {
      const moneyResult = Money.fromCentavos(100n);
      const zero = Money.zero();

      expect(moneyResult.ok).toBe(true);

      if (moneyResult.ok) {
        const sum = moneyResult.value.add(zero);
        expect(sum.toCentavos()).toBe(100n);
      }
    });

    it('should handle large additions without precision loss', () => {
      const money1Result = Money.fromCentavos(999999999999999999n);
      const money2Result = Money.fromCentavos(1n);

      expect(money1Result.ok).toBe(true);
      expect(money2Result.ok).toBe(true);

      if (money1Result.ok && money2Result.ok) {
        const sum = money1Result.value.add(money2Result.value);
        expect(sum.toCentavos()).toBe(1000000000000000000n);
      }
    });
  });

  describe('subtract()', () => {
    it('should subtract two Money instances correctly when result is positive', () => {
      const money1Result = Money.fromCentavos(100n);
      const money2Result = Money.fromCentavos(50n);

      expect(money1Result.ok).toBe(true);
      expect(money2Result.ok).toBe(true);

      if (money1Result.ok && money2Result.ok) {
        const difference = money1Result.value.subtract(money2Result.value);
        expect(difference.ok).toBe(true);
        if (difference.ok) {
          expect(difference.value.toCentavos()).toBe(50n);
        }
      }
    });

    it('should subtract to zero correctly', () => {
      const moneyResult = Money.fromCentavos(100n);

      expect(moneyResult.ok).toBe(true);

      if (moneyResult.ok) {
        const difference = moneyResult.value.subtract(moneyResult.value);
        expect(difference.ok).toBe(true);
        if (difference.ok) {
          expect(difference.value.toCentavos()).toBe(0n);
        }
      }
    });

    it('should return error when result would be negative', () => {
      const money1Result = Money.fromCentavos(50n);
      const money2Result = Money.fromCentavos(100n);

      expect(money1Result.ok).toBe(true);
      expect(money2Result.ok).toBe(true);

      if (money1Result.ok && money2Result.ok) {
        const difference = money1Result.value.subtract(money2Result.value);
        expect(difference.ok).toBe(false);
        if (!difference.ok) {
          expect(difference.error).toBeInstanceOf(NegativeMoneyError);
          expect(difference.error.message).toContain('result would be negative');
          expect(difference.error.name).toBe('NegativeMoneyError');
        }
      }
    });

    it('should return error with detailed message for negative result', () => {
      const money1Result = Money.fromCentavos(50n);
      const money2Result = Money.fromCentavos(100n);

      expect(money1Result.ok).toBe(true);
      expect(money2Result.ok).toBe(true);

      if (money1Result.ok && money2Result.ok) {
        const difference = money1Result.value.subtract(money2Result.value);
        expect(difference.ok).toBe(false);
        if (!difference.ok) {
          expect(difference.error.message).toBe('Cannot subtract 100 from 50: result would be negative');
        }
      }
    });

    it('should handle large subtractions without precision loss', () => {
      const money1Result = Money.fromCentavos(1000000000000000000n);
      const money2Result = Money.fromCentavos(1n);

      expect(money1Result.ok).toBe(true);
      expect(money2Result.ok).toBe(true);

      if (money1Result.ok && money2Result.ok) {
        const difference = money1Result.value.subtract(money2Result.value);
        expect(difference.ok).toBe(true);
        if (difference.ok) {
          expect(difference.value.toCentavos()).toBe(999999999999999999n);
        }
      }
    });

    it('should handle boundary case: subtract 1 from 1', () => {
      const money1Result = Money.fromCentavos(1n);
      const money2Result = Money.fromCentavos(1n);

      expect(money1Result.ok).toBe(true);
      expect(money2Result.ok).toBe(true);

      if (money1Result.ok && money2Result.ok) {
        const difference = money1Result.value.subtract(money2Result.value);
        expect(difference.ok).toBe(true);
        if (difference.ok) {
          expect(difference.value.toCentavos()).toBe(0n);
        }
      }
    });
  });

  describe('isGreaterThanOrEqual()', () => {
    it('should return true when first value is greater', () => {
      const money1Result = Money.fromCentavos(100n);
      const money2Result = Money.fromCentavos(50n);

      expect(money1Result.ok).toBe(true);
      expect(money2Result.ok).toBe(true);

      if (money1Result.ok && money2Result.ok) {
        expect(money1Result.value.isGreaterThanOrEqual(money2Result.value)).toBe(true);
      }
    });

    it('should return true when values are equal', () => {
      const money1Result = Money.fromCentavos(100n);
      const money2Result = Money.fromCentavos(100n);

      expect(money1Result.ok).toBe(true);
      expect(money2Result.ok).toBe(true);

      if (money1Result.ok && money2Result.ok) {
        expect(money1Result.value.isGreaterThanOrEqual(money2Result.value)).toBe(true);
      }
    });

    it('should return false when first value is less', () => {
      const money1Result = Money.fromCentavos(50n);
      const money2Result = Money.fromCentavos(100n);

      expect(money1Result.ok).toBe(true);
      expect(money2Result.ok).toBe(true);

      if (money1Result.ok && money2Result.ok) {
        expect(money1Result.value.isGreaterThanOrEqual(money2Result.value)).toBe(false);
      }
    });
  });

  describe('equals()', () => {
    it('should return true for equal values', () => {
      const money1Result = Money.fromCentavos(100n);
      const money2Result = Money.fromCentavos(100n);

      expect(money1Result.ok).toBe(true);
      expect(money2Result.ok).toBe(true);

      if (money1Result.ok && money2Result.ok) {
        expect(money1Result.value.equals(money2Result.value)).toBe(true);
      }
    });

    it('should return false for different values', () => {
      const money1Result = Money.fromCentavos(100n);
      const money2Result = Money.fromCentavos(50n);

      expect(money1Result.ok).toBe(true);
      expect(money2Result.ok).toBe(true);

      if (money1Result.ok && money2Result.ok) {
        expect(money1Result.value.equals(money2Result.value)).toBe(false);
      }
    });

    it('should return true for zero values', () => {
      const zero1 = Money.zero();
      const zero2 = Money.zero();

      expect(zero1.equals(zero2)).toBe(true);
    });

    it('should return true when comparing same instance', () => {
      const moneyResult = Money.fromCentavos(100n);

      expect(moneyResult.ok).toBe(true);

      if (moneyResult.ok) {
        expect(moneyResult.value.equals(moneyResult.value)).toBe(true);
      }
    });

    it('should return true for large equal values', () => {
      const large = 999999999999999999n;
      const money1Result = Money.fromCentavos(large);
      const money2Result = Money.fromCentavos(large);

      expect(money1Result.ok).toBe(true);
      expect(money2Result.ok).toBe(true);

      if (money1Result.ok && money2Result.ok) {
        expect(money1Result.value.equals(money2Result.value)).toBe(true);
      }
    });
  });

  describe('toCentavos()', () => {
    it('should return the exact centavos value', () => {
      const centavos = 12345n;
      const result = Money.fromCentavos(centavos);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toCentavos()).toBe(centavos);
      }
    });
  });

  describe('immutability', () => {
    it('should not modify original Money instance when adding', () => {
      const money1Result = Money.fromCentavos(100n);
      const money2Result = Money.fromCentavos(50n);

      expect(money1Result.ok).toBe(true);
      expect(money2Result.ok).toBe(true);

      if (money1Result.ok && money2Result.ok) {
        const originalValue = money1Result.value.toCentavos();
        money1Result.value.add(money2Result.value);
        expect(money1Result.value.toCentavos()).toBe(originalValue);
      }
    });

    it('should not modify original Money instance when subtracting', () => {
      const money1Result = Money.fromCentavos(100n);
      const money2Result = Money.fromCentavos(50n);

      expect(money1Result.ok).toBe(true);
      expect(money2Result.ok).toBe(true);

      if (money1Result.ok && money2Result.ok) {
        const originalValue = money1Result.value.toCentavos();
        money1Result.value.subtract(money2Result.value);
        expect(money1Result.value.toCentavos()).toBe(originalValue);
      }
    });
  });
});
