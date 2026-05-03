import { describe, it, expect } from 'bun:test';
import { MultiplierService } from '@/domain/services/multiplier.service';
import { Multiplier } from '@/domain/value-objects/multiplier';
import { CrashPoint } from '@/domain/value-objects/crash-point';

describe('MultiplierService', () => {
  const service = new MultiplierService();

  describe('calculateMultiplier', () => {
    it('should return initial multiplier at start time', () => {
      const startTime = new Date(0);
      const currentTime = new Date(0);

      const multiplierResult = Multiplier.fromNumber(2.0);
      if (!multiplierResult.ok) throw new Error('Failed to create multiplier');

      const crashPointResult = CrashPoint.fromMultiplier(multiplierResult.value);
      if (!crashPointResult.ok) throw new Error('Failed to create crash point');

      const multiplier = service.calculateMultiplier(
        startTime,
        currentTime,
        crashPointResult.value
      );

      expect(multiplier.toNumber()).toBeCloseTo(1.0, 5);
    });

    it('should increase multiplier over time', () => {
      const startTime = new Date(0);
      const currentTime1 = new Date(1000); // 1 second later
      const currentTime2 = new Date(2000); // 2 seconds later

      const multiplierResult = Multiplier.fromNumber(10.0);
      if (!multiplierResult.ok) throw new Error('Failed to create multiplier');

      const crashPointResult = CrashPoint.fromMultiplier(multiplierResult.value);
      if (!crashPointResult.ok) throw new Error('Failed to create crash point');

      const multiplier1 = service.calculateMultiplier(
        startTime,
        currentTime1,
        crashPointResult.value
      );
      const multiplier2 = service.calculateMultiplier(
        startTime,
        currentTime2,
        crashPointResult.value
      );

      expect(multiplier2.toNumber()).toBeGreaterThan(multiplier1.toNumber());
    });

    it('should cap multiplier at crash point', () => {
      const startTime = new Date(0);
      const currentTime = new Date(100000); // Long time later

      const multiplierResult = Multiplier.fromNumber(2.0);
      if (!multiplierResult.ok) throw new Error('Failed to create multiplier');

      const crashPointResult = CrashPoint.fromMultiplier(multiplierResult.value);
      if (!crashPointResult.ok) throw new Error('Failed to create crash point');

      const multiplier = service.calculateMultiplier(
        startTime,
        currentTime,
        crashPointResult.value
      );

      // Multiplier should not exceed crash point
      expect(multiplier.toNumber()).toBeLessThanOrEqual(2.0);
    });

    it('should use exponential formula correctly', () => {
      const startTime = new Date(0);
      const currentTime = new Date(10000); // 10 seconds = 10000 ms
      const elapsedMs = 10000;

      const multiplierResult = Multiplier.fromNumber(100.0);
      if (!multiplierResult.ok) throw new Error('Failed to create multiplier');

      const crashPointResult = CrashPoint.fromMultiplier(multiplierResult.value);
      if (!crashPointResult.ok) throw new Error('Failed to create crash point');

      const multiplier = service.calculateMultiplier(
        startTime,
        currentTime,
        crashPointResult.value
      );

      // Formula: e^(0.00006 * 10000) = e^0.6 ≈ 1.8221
      const expected = Math.exp(0.00006 * elapsedMs);
      expect(multiplier.toNumber()).toBeCloseTo(expected, 4);
    });

    it('should handle negative elapsed time', () => {
      const startTime = new Date(1000);
      const currentTime = new Date(0); // Before start time

      const multiplierResult = Multiplier.fromNumber(2.0);
      if (!multiplierResult.ok) throw new Error('Failed to create multiplier');

      const crashPointResult = CrashPoint.fromMultiplier(multiplierResult.value);
      if (!crashPointResult.ok) throw new Error('Failed to create crash point');

      const multiplier = service.calculateMultiplier(
        startTime,
        currentTime,
        crashPointResult.value
      );

      // Should return initial multiplier
      expect(multiplier.toNumber()).toBeCloseTo(1.0, 5);
    });

    it('should be deterministic', () => {
      const startTime = new Date(0);
      const currentTime = new Date(5000);

      const multiplierResult = Multiplier.fromNumber(5.0);
      if (!multiplierResult.ok) throw new Error('Failed to create multiplier');

      const crashPointResult = CrashPoint.fromMultiplier(multiplierResult.value);
      if (!crashPointResult.ok) throw new Error('Failed to create crash point');

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
    });
  });

  describe('getTimeUntilCrash', () => {
    it('should calculate time until crash correctly', () => {
      const startTime = new Date(0);

      const multiplierResult = Multiplier.fromNumber(2.0);
      if (!multiplierResult.ok) throw new Error('Failed to create multiplier');

      const crashPointResult = CrashPoint.fromMultiplier(multiplierResult.value);
      if (!crashPointResult.ok) throw new Error('Failed to create crash point');

      const timeUntilCrash = service.getTimeUntilCrash(
        startTime,
        crashPointResult.value
      );

      // Formula: ln(2.0) / 0.00006 ≈ 11552.45 ms
      const expected = Math.log(2.0) / 0.00006;
      expect(timeUntilCrash).toBeCloseTo(expected, 0);
    });

    it('should return 0 for crash point of 1.00x', () => {
      const startTime = new Date(0);

      const multiplierResult = Multiplier.fromNumber(1.0);
      if (!multiplierResult.ok) throw new Error('Failed to create multiplier');

      const crashPointResult = CrashPoint.fromMultiplier(multiplierResult.value);
      if (!crashPointResult.ok) throw new Error('Failed to create crash point');

      const timeUntilCrash = service.getTimeUntilCrash(
        startTime,
        crashPointResult.value
      );

      expect(timeUntilCrash).toBe(0);
    });

    it('should return positive time for crash point > 1.00x', () => {
      const startTime = new Date(0);

      const multiplierResult = Multiplier.fromNumber(5.0);
      if (!multiplierResult.ok) throw new Error('Failed to create multiplier');

      const crashPointResult = CrashPoint.fromMultiplier(multiplierResult.value);
      if (!crashPointResult.ok) throw new Error('Failed to create crash point');

      const timeUntilCrash = service.getTimeUntilCrash(
        startTime,
        crashPointResult.value
      );

      expect(timeUntilCrash).toBeGreaterThan(0);
    });

    it('should be consistent with calculateMultiplier', () => {
      const startTime = new Date(0);

      const multiplierResult = Multiplier.fromNumber(3.0);
      if (!multiplierResult.ok) throw new Error('Failed to create multiplier');

      const crashPointResult = CrashPoint.fromMultiplier(multiplierResult.value);
      if (!crashPointResult.ok) throw new Error('Failed to create crash point');

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
      expect(multiplierAtCrash.toNumber()).toBeCloseTo(3.0, 1);
    });
  });
});
