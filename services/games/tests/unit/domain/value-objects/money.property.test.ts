import { describe, it, expect } from 'bun:test';
import fc from 'fast-check';
import { Money } from '@/domain/value-objects/money';
import { Multiplier } from '@/domain/value-objects/multiplier';

describe('Money Value Object - Property-Based Tests', () => {
  describe('Property 1: Money Value Object Precision', () => {
    it('should store non-negative bigint values exactly without precision loss', () => {
      /**
       * Validates: Requirements 15.1, 15.2
       * Property: Money stores values exactly without precision loss
       */
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 1000000000 }), (centavos) => {
          const result = Money.fromCentavos(BigInt(centavos));
          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(result.value.toCentavos()).toBe(BigInt(centavos));
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should reject negative values', () => {
      /**
       * Validates: Requirements 15.1, 15.2
       * Property: Money rejects negative values
       */
      fc.assert(
        fc.property(fc.integer({ min: -1000000000, max: -1 }), (negativeCentavos) => {
          const result = Money.fromCentavos(BigInt(negativeCentavos));
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error.message).toContain('cannot be negative');
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Money Arithmetic Exactness', () => {
    it('should produce exact sum when adding Money instances', () => {
      /**
       * Validates: Requirements 15.3, 15.4
       * Property: add() produces exact sum
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 500000000 }),
          fc.integer({ min: 0, max: 500000000 }),
          (centavos1, centavos2) => {
            const result1 = Money.fromCentavos(BigInt(centavos1));
            const result2 = Money.fromCentavos(BigInt(centavos2));

            if (result1.ok && result2.ok) {
              const sum = result1.value.add(result2.value);
              expect(sum.toCentavos()).toBe(BigInt(centavos1 + centavos2));
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce exact difference when subtracting Money instances', () => {
      /**
       * Validates: Requirements 15.3, 15.4
       * Property: subtract() produces exact difference when M1 >= M2
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000000 }),
          fc.integer({ min: 0, max: 1000000000 }),
          (centavos1, centavos2) => {
            // Ensure centavos1 >= centavos2
            const larger = centavos1 >= centavos2 ? centavos1 : centavos2;
            const smaller = centavos1 >= centavos2 ? centavos2 : centavos1;

            const result1 = Money.fromCentavos(BigInt(larger));
            const result2 = Money.fromCentavos(BigInt(smaller));

            if (result1.ok && result2.ok) {
              const diff = result1.value.subtract(result2.value);
              expect(diff.ok).toBe(true);
              if (diff.ok) {
                expect(diff.value.toCentavos()).toBe(BigInt(larger - smaller));
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return error when subtracting results in negative', () => {
      /**
       * Validates: Requirements 15.3, 15.4
       * Property: subtract() returns error when M1 < M2
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000000 }),
          fc.integer({ min: 0, max: 1000000000 }),
          (centavos1, centavos2) => {
            // Ensure centavos1 < centavos2
            const smaller = centavos1 < centavos2 ? centavos1 : centavos2;
            const larger = centavos1 < centavos2 ? centavos2 : centavos1;

            // Skip if equal (would not be negative)
            if (smaller === larger) return true;

            const result1 = Money.fromCentavos(BigInt(smaller));
            const result2 = Money.fromCentavos(BigInt(larger));

            if (result1.ok && result2.ok) {
              const diff = result1.value.subtract(result2.value);
              expect(diff.ok).toBe(false);
              if (!diff.ok) {
                expect(diff.error.message).toContain('Cannot subtract');
              }
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce exact result when multiplying by Multiplier', () => {
      /**
       * Validates: Requirements 15.3, 15.4
       * Property: multiplyBy() with Multiplier produces exact result
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 100000 }),
          fc.integer({ min: 100, max: 10000 }),
          (centavos, multiplierCents) => {
            const moneyResult = Money.fromCentavos(BigInt(centavos));
            const multiplier = multiplierCents / 100;

            if (moneyResult.ok) {
              const product = moneyResult.value.multiplyBy(multiplier);

              // Verify result is exact: floor(centavos * multiplier)
              const expected = BigInt(Math.floor(centavos * multiplier));
              expect(product.toCentavos()).toBe(expected);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
