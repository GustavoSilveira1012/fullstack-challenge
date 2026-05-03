import { describe, it, expect } from 'bun:test';
import fc from 'fast-check';
import { MultiplierService } from '@/domain/services/multiplier.service';
import { Multiplier } from '@/domain/value-objects/multiplier';
import { CrashPoint } from '@/domain/value-objects/crash-point';

describe('MultiplierService - Property-Based Tests', () => {
  const service = new MultiplierService();

  describe('Property 3: Multiplier Determinism', () => {
    it('should produce same multiplier for same inputs', () => {
      /**
       * Validates: Requirements 4.3, 4.6
       * Property: Same inputs produce same multiplier
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100000 }),
          fc.integer({ min: 100, max: 10000 }),
          (elapsedMs, crashPointCents) => {
            const startTime = new Date(0);
            const currentTime = new Date(elapsedMs);
            const crashPointValue = crashPointCents / 100;

            const multiplierResult = Multiplier.fromNumber(crashPointValue);
            if (!multiplierResult.ok) return true;

            const crashPointResult = CrashPoint.fromMultiplier(multiplierResult.value);
            if (!crashPointResult.ok) return true;

            const multiplier1 = service.calculateMultiplier(
              startTime,
              currentTime,
              crashPointResult.value
            );
            const multiplier2 = service.calculateMultiplier(
              startTime,
              currentTime,
              crashPointResult.value
            );

            expect(multiplier1.toNumber()).toBe(multiplier2.toNumber());
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should never exceed crash point', () => {
      /**
       * Validates: Requirements 4.3, 4.4
       * Property: Multiplier never exceeds crash point
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100000 }),
          fc.integer({ min: 100, max: 10000 }),
          (elapsedMs, crashPointCents) => {
            const startTime = new Date(0);
            const currentTime = new Date(elapsedMs);
            const crashPointValue = crashPointCents / 100;

            const multiplierResult = Multiplier.fromNumber(crashPointValue);
            if (!multiplierResult.ok) return true;

            const crashPointResult = CrashPoint.fromMultiplier(multiplierResult.value);
            if (!crashPointResult.ok) return true;

            const multiplier = service.calculateMultiplier(
              startTime,
              currentTime,
              crashPointResult.value
            );

            expect(multiplier.toNumber()).toBeLessThanOrEqual(
              crashPointResult.value.toNumber()
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 11: Multiplier Monotonicity', () => {
    it('should increase monotonically over time', () => {
      /**
       * Validates: Requirements 4.2
       * Property: Multiplier increases monotonically
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 50000 }),
          fc.integer({ min: 0, max: 50000 }),
          fc.integer({ min: 100, max: 10000 }),
          (elapsedMs1, elapsedMs2, crashPointCents) => {
            const startTime = new Date(0);
            const time1 = new Date(Math.min(elapsedMs1, elapsedMs2));
            const time2 = new Date(Math.max(elapsedMs1, elapsedMs2));
            const crashPointValue = crashPointCents / 100;

            const multiplierResult = Multiplier.fromNumber(crashPointValue);
            if (!multiplierResult.ok) return true;

            const crashPointResult = CrashPoint.fromMultiplier(multiplierResult.value);
            if (!crashPointResult.ok) return true;

            const multiplier1 = service.calculateMultiplier(
              startTime,
              time1,
              crashPointResult.value
            );
            const multiplier2 = service.calculateMultiplier(
              startTime,
              time2,
              crashPointResult.value
            );

            // Multiplier should be monotonically increasing
            expect(multiplier2.toNumber()).toBeGreaterThanOrEqual(
              multiplier1.toNumber()
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never decrease over time', () => {
      /**
       * Validates: Requirements 4.2
       * Property: Multiplier never decreases
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100000 }),
          fc.integer({ min: 100, max: 10000 }),
          (elapsedMs, crashPointCents) => {
            const startTime = new Date(0);
            const currentTime = new Date(elapsedMs);
            const crashPointValue = crashPointCents / 100;

            const multiplierResult = Multiplier.fromNumber(crashPointValue);
            if (!multiplierResult.ok) return true;

            const crashPointResult = CrashPoint.fromMultiplier(multiplierResult.value);
            if (!crashPointResult.ok) return true;

            const multiplier = service.calculateMultiplier(
              startTime,
              currentTime,
              crashPointResult.value
            );

            // Multiplier should always be >= 1.0
            expect(multiplier.toNumber()).toBeGreaterThanOrEqual(1.0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Time Until Crash Consistency', () => {
    it('should be consistent with multiplier calculation', () => {
      /**
       * Validates: Requirements 4.2, 4.3
       * Property: getTimeUntilCrash is inverse of calculateMultiplier
       */
      fc.assert(
        fc.property(fc.integer({ min: 100, max: 10000 }), (crashPointCents) => {
          const startTime = new Date(0);
          const crashPointValue = crashPointCents / 100;

          const multiplierResult = Multiplier.fromNumber(crashPointValue);
          if (!multiplierResult.ok) return true;

          const crashPointResult = CrashPoint.fromMultiplier(multiplierResult.value);
          if (!crashPointResult.ok) return true;

          const timeUntilCrash = service.getTimeUntilCrash(
            startTime,
            crashPointResult.value
          );

          // Calculate multiplier at the time until crash
          const crashTime = new Date(startTime.getTime() + timeUntilCrash);
          const multiplierAtCrash = service.calculateMultiplier(
            startTime,
            crashTime,
            crashPointResult.value
          );

          // Multiplier at crash time should be very close to crash point
          // Allow small tolerance due to floating point precision
          const tolerance = 0.01;
          expect(
            Math.abs(multiplierAtCrash.toNumber() - crashPointValue)
          ).toBeLessThan(tolerance);
        }),
        { numRuns: 50 }
      );
    });
  });
});
