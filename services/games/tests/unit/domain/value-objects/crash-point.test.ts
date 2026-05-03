import { describe, it, expect } from 'bun:test';
import { CrashPoint } from '@/domain/value-objects/crash-point';
import { Multiplier } from '@/domain/value-objects/multiplier';

describe('CrashPoint Value Object', () => {
  describe('fromMultiplier', () => {
    it('should create CrashPoint from valid Multiplier', () => {
      const result = Multiplier.fromNumber(2.5);
      if (result.ok) {
        const crashPointResult = CrashPoint.fromMultiplier(result.value);
        expect(crashPointResult.ok).toBe(true);
        if (crashPointResult.ok) {
          expect(crashPointResult.value.toNumber()).toBe(2.5);
        }
      }
    });

    it('should create CrashPoint from minimum Multiplier (1.00x)', () => {
      const result = Multiplier.fromNumber(1.0);
      if (result.ok) {
        const crashPointResult = CrashPoint.fromMultiplier(result.value);
        expect(crashPointResult.ok).toBe(true);
        if (crashPointResult.ok) {
          expect(crashPointResult.value.toNumber()).toBe(1.0);
        }
      }
    });

    it('should create CrashPoint from large Multiplier', () => {
      const result = Multiplier.fromNumber(1000.0);
      if (result.ok) {
        const crashPointResult = CrashPoint.fromMultiplier(result.value);
        expect(crashPointResult.ok).toBe(true);
        if (crashPointResult.ok) {
          expect(crashPointResult.value.toNumber()).toBe(1000.0);
        }
      }
    });
  });

  describe('getMultiplier', () => {
    it('should return the underlying Multiplier', () => {
      const result = Multiplier.fromNumber(3.5);
      if (result.ok) {
        const crashPointResult = CrashPoint.fromMultiplier(result.value);
        if (crashPointResult.ok) {
          const multiplier = crashPointResult.value.getMultiplier();
          expect(multiplier.toNumber()).toBe(3.5);
        }
      }
    });

    it('should return Multiplier that equals original', () => {
      const result = Multiplier.fromNumber(2.37);
      if (result.ok) {
        const crashPointResult = CrashPoint.fromMultiplier(result.value);
        if (crashPointResult.ok) {
          const multiplier = crashPointResult.value.getMultiplier();
          expect(multiplier.equals(result.value)).toBe(true);
        }
      }
    });
  });

  describe('toNumber', () => {
    it('should return the numeric value', () => {
      const result = Multiplier.fromNumber(5.5);
      if (result.ok) {
        const crashPointResult = CrashPoint.fromMultiplier(result.value);
        if (crashPointResult.ok) {
          expect(crashPointResult.value.toNumber()).toBe(5.5);
        }
      }
    });

    it('should return 1.0 for minimum crash point', () => {
      const result = Multiplier.fromNumber(1.0);
      if (result.ok) {
        const crashPointResult = CrashPoint.fromMultiplier(result.value);
        if (crashPointResult.ok) {
          expect(crashPointResult.value.toNumber()).toBe(1.0);
        }
      }
    });
  });

  describe('toString', () => {
    it('should format as string with x suffix', () => {
      const result = Multiplier.fromNumber(2.5);
      if (result.ok) {
        const crashPointResult = CrashPoint.fromMultiplier(result.value);
        if (crashPointResult.ok) {
          expect(crashPointResult.value.toString()).toBe('2.50x');
        }
      }
    });

    it('should format minimum crash point', () => {
      const result = Multiplier.fromNumber(1.0);
      if (result.ok) {
        const crashPointResult = CrashPoint.fromMultiplier(result.value);
        if (crashPointResult.ok) {
          expect(crashPointResult.value.toString()).toBe('1.00x');
        }
      }
    });

    it('should format large crash point', () => {
      const result = Multiplier.fromNumber(100.5);
      if (result.ok) {
        const crashPointResult = CrashPoint.fromMultiplier(result.value);
        if (crashPointResult.ok) {
          expect(crashPointResult.value.toString()).toBe('100.50x');
        }
      }
    });
  });
});
