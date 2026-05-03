import { describe, it, expect } from 'bun:test';
import { Money, InvalidMoneyError, NegativeMoneyError } from '../../../../src/domain/value-objects/money';
import { Multiplier } from '../../../../src/domain/value-objects/multiplier';

describe('Money Value Object', () => {
  describe('fromCentavos', () => {
    it('should create Money from valid centavos', () => {
      const result = Money.fromCentavos(100n);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toCentavos()).toBe(100n);
      }
    });

    it('should reject negative centavos', () => {
      const result = Money.fromCentavos(-100n);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidMoneyError);
      }
    });

    it('should accept zero', () => {
      const result = Money.fromCentavos(0n);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toCentavos()).toBe(0n);
      }
    });
  });

  describe('zero', () => {
    it('should create Money with zero value', () => {
      const money = Money.zero();
      expect(money.toCentavos()).toBe(0n);
    });
  });

  describe('add', () => {
    it('should add two Money instances', () => {
      const m1Result = Money.fromCentavos(100n);
      const m2Result = Money.fromCentavos(50n);

      if (m1Result.ok && m2Result.ok) {
        const sum = m1Result.value.add(m2Result.value);
        expect(sum.toCentavos()).toBe(150n);
      }
    });
  });

  describe('subtract', () => {
    it('should subtract two Money instances', () => {
      const m1Result = Money.fromCentavos(100n);
      const m2Result = Money.fromCentavos(30n);

      if (m1Result.ok && m2Result.ok) {
        const result = m1Result.value.subtract(m2Result.value);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.toCentavos()).toBe(70n);
        }
      }
    });

    it('should reject subtraction resulting in negative', () => {
      const m1Result = Money.fromCentavos(30n);
      const m2Result = Money.fromCentavos(100n);

      if (m1Result.ok && m2Result.ok) {
        const result = m1Result.value.subtract(m2Result.value);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeInstanceOf(NegativeMoneyError);
        }
      }
    });
  });

  describe('multiplyBy', () => {
    it('should multiply Money by a multiplier', () => {
      const moneyResult = Money.fromCentavos(100n);
      if (moneyResult.ok) {
        const result = moneyResult.value.multiplyBy(2.5);
        expect(result.toCentavos()).toBe(250n);
      }
    });

    it('should round down to nearest centavo', () => {
      const moneyResult = Money.fromCentavos(100n);
      if (moneyResult.ok) {
        const result = moneyResult.value.multiplyBy(1.555);
        expect(result.toCentavos()).toBe(155n);
      }
    });
  });

  describe('equals', () => {
    it('should return true for equal amounts', () => {
      const m1Result = Money.fromCentavos(100n);
      const m2Result = Money.fromCentavos(100n);

      if (m1Result.ok && m2Result.ok) {
        expect(m1Result.value.equals(m2Result.value)).toBe(true);
      }
    });

    it('should return false for different amounts', () => {
      const m1Result = Money.fromCentavos(100n);
      const m2Result = Money.fromCentavos(50n);

      if (m1Result.ok && m2Result.ok) {
        expect(m1Result.value.equals(m2Result.value)).toBe(false);
      }
    });
  });

  describe('isGreaterThanOrEqual', () => {
    it('should return true when greater', () => {
      const m1Result = Money.fromCentavos(100n);
      const m2Result = Money.fromCentavos(50n);

      if (m1Result.ok && m2Result.ok) {
        expect(m1Result.value.isGreaterThanOrEqual(m2Result.value)).toBe(true);
      }
    });

    it('should return true when equal', () => {
      const m1Result = Money.fromCentavos(100n);
      const m2Result = Money.fromCentavos(100n);

      if (m1Result.ok && m2Result.ok) {
        expect(m1Result.value.isGreaterThanOrEqual(m2Result.value)).toBe(true);
      }
    });

    it('should return false when less', () => {
      const m1Result = Money.fromCentavos(50n);
      const m2Result = Money.fromCentavos(100n);

      if (m1Result.ok && m2Result.ok) {
        expect(m1Result.value.isGreaterThanOrEqual(m2Result.value)).toBe(false);
      }
    });
  });

  describe('toDecimal', () => {
    it('should convert to decimal string', () => {
      const result = Money.fromCentavos(12345n);
      if (result.ok) {
        expect(result.value.toDecimal()).toBe('123.45');
      }
    });

    it('should pad cents with zero', () => {
      const result = Money.fromCentavos(100n);
      if (result.ok) {
        expect(result.value.toDecimal()).toBe('1.00');
      }
    });
  });
});
