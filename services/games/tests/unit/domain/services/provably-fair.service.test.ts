import { describe, it, expect } from 'bun:test';
import { ProvablyFairService } from '../../../../src/domain/services/provably-fair.service';

describe('ProvablyFairService', () => {
  const service = new ProvablyFairService();

  describe('generateServerSeed', () => {
    it('should generate a valid server seed', () => {
      const seed = service.generateServerSeed();
      expect(seed.toString()).toBeDefined();
      expect(seed.toString().length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should generate different seeds each time', () => {
      const seed1 = service.generateServerSeed();
      const seed2 = service.generateServerSeed();
      expect(seed1.toString()).not.toBe(seed2.toString());
    });
  });

  describe('hashServerSeed', () => {
    it('should hash a server seed', () => {
      const seed = service.generateServerSeed();
      const hash = service.hashServerSeed(seed);
      expect(hash.toString()).toBeDefined();
      expect(hash.toString().length).toBe(64); // SHA-256 = 64 hex chars
    });

    it('should produce deterministic hash', () => {
      const seedResult = service.generateServerSeed();
      if (seedResult) {
        const hash1 = service.hashServerSeed(seedResult);
        const hash2 = service.hashServerSeed(seedResult);
        expect(hash1.toString()).toBe(hash2.toString());
      }
    });
  });

  describe('calculateCrashPoint', () => {
    it('should calculate a crash point >= 1.00x', () => {
      const seed = service.generateServerSeed();
      const crashPoint = service.calculateCrashPoint(seed);
      expect(crashPoint.toNumber()).toBeGreaterThanOrEqual(1.0);
    });

    it('should produce deterministic crash point', () => {
      const seedResult = service.generateServerSeed();
      if (seedResult) {
        const cp1 = service.calculateCrashPoint(seedResult);
        const cp2 = service.calculateCrashPoint(seedResult);
        expect(cp1.toNumber()).toBe(cp2.toNumber());
      }
    });

    it('should support client seed', () => {
      const seed = service.generateServerSeed();
      const cp1 = service.calculateCrashPoint(seed, 'client-seed-1');
      const cp2 = service.calculateCrashPoint(seed, 'client-seed-2');
      // Different client seeds should produce different crash points
      expect(cp1.toNumber()).not.toBe(cp2.toNumber());
    });

    it('should have 2 decimal places', () => {
      const seed = service.generateServerSeed();
      const crashPoint = service.calculateCrashPoint(seed);
      const str = crashPoint.toString();
      // Remove the 'x' suffix if present
      const numStr = str.endsWith('x') ? str.slice(0, -1) : str;
      const decimalIndex = numStr.indexOf('.');
      if (decimalIndex !== -1) {
        const decimals = numStr.substring(decimalIndex + 1);
        expect(decimals.length).toBeLessThanOrEqual(2);
      }
    });
  });

  describe('verifyCrashPoint', () => {
    it('should verify a correct crash point', () => {
      const seed = service.generateServerSeed();
      const crashPoint = service.calculateCrashPoint(seed);
      const verified = service.verifyCrashPoint(seed, crashPoint);
      expect(verified).toBe(true);
    });

    it('should reject an incorrect crash point', () => {
      const seed = service.generateServerSeed();
      const crashPoint1 = service.calculateCrashPoint(seed);
      const crashPoint2 = service.calculateCrashPoint(service.generateServerSeed());
      const verified = service.verifyCrashPoint(seed, crashPoint2);
      expect(verified).toBe(false);
    });
  });
});
