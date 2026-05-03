import { describe, it, expect } from 'bun:test';
import { ProvablyFairService } from '@/domain/services/provably-fair.service';
import { ServerSeed } from '@/domain/value-objects/server-seed';

describe('ProvablyFairService', () => {
  const service = new ProvablyFairService();

  describe('generateServerSeed', () => {
    it('should generate a valid server seed', () => {
      const seed = service.generateServerSeed();
      expect(seed).toBeDefined();
      expect(seed.toString().length).toBe(64); // 32 bytes = 64 hex characters
    });

    it('should generate different seeds on each call', () => {
      const seed1 = service.generateServerSeed();
      const seed2 = service.generateServerSeed();
      expect(seed1.toString()).not.toBe(seed2.toString());
    });

    it('should generate valid hex strings', () => {
      const seed = service.generateServerSeed();
      const hexRegex = /^[0-9a-f]{64}$/i;
      expect(hexRegex.test(seed.toString())).toBe(true);
    });
  });

  describe('calculateCrashPoint', () => {
    it('should calculate crash point deterministically', () => {
      const seedResult = ServerSeed.fromString(
        'a'.repeat(64)
      );
      if (!seedResult.ok) throw new Error('Failed to create seed');

      const seed = seedResult.value;
      const crashPoint1 = service.calculateCrashPoint(seed);
      const crashPoint2 = service.calculateCrashPoint(seed);

      expect(crashPoint1.toNumber()).toBe(crashPoint2.toNumber());
    });

    it('should ensure crash point is >= 1.00x', () => {
      const seed = service.generateServerSeed();
      const crashPoint = service.calculateCrashPoint(seed);
      expect(crashPoint.toNumber()).toBeGreaterThanOrEqual(1.0);
    });

    it('should calculate crash point with client seed', () => {
      const seedResult = ServerSeed.fromString(
        'b'.repeat(64)
      );
      if (!seedResult.ok) throw new Error('Failed to create seed');

      const seed = seedResult.value;
      const crashPointWithoutClient = service.calculateCrashPoint(seed);
      const crashPointWithClient = service.calculateCrashPoint(seed, 'client-seed-123');

      // Different client seeds should produce different crash points
      expect(crashPointWithClient.toNumber()).not.toBe(
        crashPointWithoutClient.toNumber()
      );
    });

    it('should produce crash point with 2 decimal places', () => {
      const seed = service.generateServerSeed();
      const crashPoint = service.calculateCrashPoint(seed);
      const value = crashPoint.toNumber();

      // Check that value has at most 2 decimal places
      const decimalPlaces = (value.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });

    it('should apply house edge', () => {
      // Generate multiple crash points and verify they're reasonable
      // With 3% house edge, the average should be lower than without
      const seeds = Array.from({ length: 10 }, () =>
        service.generateServerSeed()
      );

      const crashPoints = seeds.map((seed) =>
        service.calculateCrashPoint(seed).toNumber()
      );

      // All should be >= 1.00x
      crashPoints.forEach((cp) => {
        expect(cp).toBeGreaterThanOrEqual(1.0);
      });

      // Crash points should be reasonable (not too high)
      // With house edge, we expect most to be under 1000x
      const highCrashPoints = crashPoints.filter((cp) => cp > 1000);
      expect(highCrashPoints.length).toBeLessThan(5); // Allow some high values
    });
  });

  describe('hashServerSeed', () => {
    it('should hash server seed deterministically', () => {
      const seedResult = ServerSeed.fromString(
        'c'.repeat(64)
      );
      if (!seedResult.ok) throw new Error('Failed to create seed');

      const seed = seedResult.value;
      const hash1 = service.hashServerSeed(seed);
      const hash2 = service.hashServerSeed(seed);

      expect(hash1.toString()).toBe(hash2.toString());
    });

    it('should produce valid SHA-256 hash', () => {
      const seed = service.generateServerSeed();
      const hash = service.hashServerSeed(seed);
      const hashStr = hash.toString();

      // SHA-256 produces 64 hex characters
      expect(hashStr.length).toBe(64);
      expect(/^[0-9a-f]{64}$/i.test(hashStr)).toBe(true);
    });

    it('should produce different hashes for different seeds', () => {
      const seed1 = service.generateServerSeed();
      const seed2 = service.generateServerSeed();

      const hash1 = service.hashServerSeed(seed1);
      const hash2 = service.hashServerSeed(seed2);

      expect(hash1.toString()).not.toBe(hash2.toString());
    });
  });

  describe('verifyCrashPoint', () => {
    it('should verify correct crash point', () => {
      const seed = service.generateServerSeed();
      const crashPoint = service.calculateCrashPoint(seed);

      const isValid = service.verifyCrashPoint(seed, crashPoint);
      expect(isValid).toBe(true);
    });

    it('should verify crash point with client seed', () => {
      const seed = service.generateServerSeed();
      const clientSeed = 'test-client-seed';
      const crashPoint = service.calculateCrashPoint(seed, clientSeed);

      const isValid = service.verifyCrashPoint(seed, crashPoint, clientSeed);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect crash point', () => {
      const seed = service.generateServerSeed();
      const correctCrashPoint = service.calculateCrashPoint(seed);

      // Create a different crash point
      const wrongSeed = service.generateServerSeed();
      const wrongCrashPoint = service.calculateCrashPoint(wrongSeed);

      const isValid = service.verifyCrashPoint(seed, wrongCrashPoint);
      expect(isValid).toBe(false);
    });

    it('should reject crash point with wrong client seed', () => {
      const seed = service.generateServerSeed();
      const clientSeed1 = 'client-seed-1';
      const clientSeed2 = 'client-seed-2';

      const crashPoint = service.calculateCrashPoint(seed, clientSeed1);

      // Verify with different client seed should fail
      const isValid = service.verifyCrashPoint(seed, crashPoint, clientSeed2);
      expect(isValid).toBe(false);
    });
  });
});
