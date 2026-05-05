/**
 * Unit Tests for Provably Fair Algorithm
 */

import { describe, it, expect } from 'bun:test';
import { ProvablyFair } from '../../../src/domain/provably-fair';

describe('ProvablyFair', () => {
  describe('generateServerSeed', () => {
    it('should generate a 64-character hex string', () => {
      const seed = ProvablyFair.generateServerSeed();
      expect(seed).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(seed)).toBe(true);
    });

    it('should generate unique seeds', () => {
      const seed1 = ProvablyFair.generateServerSeed();
      const seed2 = ProvablyFair.generateServerSeed();
      expect(seed1).not.toBe(seed2);
    });
  });

  describe('hashServerSeed', () => {
    it('should generate a 64-character SHA-256 hash', () => {
      const seed = 'a'.repeat(64);
      const hash = ProvablyFair.hashServerSeed(seed);
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    });

    it('should generate consistent hashes for the same seed', () => {
      const seed = ProvablyFair.generateServerSeed();
      const hash1 = ProvablyFair.hashServerSeed(seed);
      const hash2 = ProvablyFair.hashServerSeed(seed);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different seeds', () => {
      const seed1 = 'a'.repeat(64);
      const seed2 = 'b'.repeat(64);
      const hash1 = ProvablyFair.hashServerSeed(seed1);
      const hash2 = ProvablyFair.hashServerSeed(seed2);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('calculateCrashPoint', () => {
    it('should return a crash point >= 1.00', () => {
      for (let i = 0; i < 100; i++) {
        const seed = ProvablyFair.generateServerSeed();
        const crashPoint = ProvablyFair.calculateCrashPoint(seed);
        expect(crashPoint).toBeGreaterThanOrEqual(1.00);
      }
    });

    it('should return a crash point <= 1,000,000', () => {
      for (let i = 0; i < 100; i++) {
        const seed = ProvablyFair.generateServerSeed();
        const crashPoint = ProvablyFair.calculateCrashPoint(seed);
        expect(crashPoint).toBeLessThanOrEqual(1000000);
      }
    });

    it('should return consistent crash points for the same seed', () => {
      const seed = ProvablyFair.generateServerSeed();
      const crashPoint1 = ProvablyFair.calculateCrashPoint(seed);
      const crashPoint2 = ProvablyFair.calculateCrashPoint(seed);
      expect(crashPoint1).toBe(crashPoint2);
    });

    it('should return different crash points for different seeds', () => {
      const seed1 = 'a'.repeat(64);
      const seed2 = 'b'.repeat(64);
      const crashPoint1 = ProvablyFair.calculateCrashPoint(seed1);
      const crashPoint2 = ProvablyFair.calculateCrashPoint(seed2);
      expect(crashPoint1).not.toBe(crashPoint2);
    });

    it('should handle edge case: seed starting with 00000000', () => {
      const seed = '00000000' + 'a'.repeat(56);
      const crashPoint = ProvablyFair.calculateCrashPoint(seed);
      expect(crashPoint).toBe(1.00);
    });

    it('should round to 2 decimal places', () => {
      for (let i = 0; i < 100; i++) {
        const seed = ProvablyFair.generateServerSeed();
        const crashPoint = ProvablyFair.calculateCrashPoint(seed);
        const rounded = Math.round(crashPoint * 100) / 100;
        expect(crashPoint).toBe(rounded);
      }
    });

    it('should produce a distribution favoring lower multipliers', () => {
      const crashPoints: number[] = [];
      for (let i = 0; i < 1000; i++) {
        const seed = ProvablyFair.generateServerSeed();
        crashPoints.push(ProvablyFair.calculateCrashPoint(seed));
      }

      // Most crashes should be below 100x (exponential distribution)
      const below100x = crashPoints.filter(cp => cp < 100).length;
      expect(below100x).toBeGreaterThan(700); // At least 70%

      // Some crashes should be above 10x
      const above10x = crashPoints.filter(cp => cp >= 10).length;
      expect(above10x).toBeGreaterThan(0);
    });
  });

  describe('verifyCrashPoint', () => {
    it('should verify correct crash points', () => {
      const seed = ProvablyFair.generateServerSeed();
      const crashPoint = ProvablyFair.calculateCrashPoint(seed);
      const isValid = ProvablyFair.verifyCrashPoint(seed, crashPoint);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect crash points', () => {
      const seed = ProvablyFair.generateServerSeed();
      const crashPoint = ProvablyFair.calculateCrashPoint(seed);
      const isValid = ProvablyFair.verifyCrashPoint(seed, crashPoint + 1);
      expect(isValid).toBe(false);
    });

    it('should handle small rounding differences', () => {
      const seed = ProvablyFair.generateServerSeed();
      const crashPoint = ProvablyFair.calculateCrashPoint(seed);
      // Small difference within tolerance
      const isValid = ProvablyFair.verifyCrashPoint(seed, crashPoint + 0.001);
      expect(isValid).toBe(true);
    });
  });

  describe('generateRound', () => {
    it('should generate a complete round with all fields', () => {
      const round = ProvablyFair.generateRound();
      expect(round.serverSeed).toHaveLength(64);
      expect(round.serverSeedHash).toHaveLength(64);
      expect(round.crashPoint).toBeGreaterThanOrEqual(1.00);
      expect(round.crashPoint).toBeLessThanOrEqual(1000000);
    });

    it('should generate hash that matches the seed', () => {
      const round = ProvablyFair.generateRound();
      const expectedHash = ProvablyFair.hashServerSeed(round.serverSeed);
      expect(round.serverSeedHash).toBe(expectedHash);
    });

    it('should generate crash point that matches the seed', () => {
      const round = ProvablyFair.generateRound();
      const expectedCrashPoint = ProvablyFair.calculateCrashPoint(round.serverSeed);
      expect(round.crashPoint).toBe(expectedCrashPoint);
    });

    it('should generate unique rounds', () => {
      const round1 = ProvablyFair.generateRound();
      const round2 = ProvablyFair.generateRound();
      expect(round1.serverSeed).not.toBe(round2.serverSeed);
      expect(round1.serverSeedHash).not.toBe(round2.serverSeedHash);
    });
  });

  describe('Deterministic behavior', () => {
    it('should always produce the same crash point for a known seed', () => {
      // Test with a known seed to ensure algorithm doesn't change
      const knownSeed = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      const crashPoint = ProvablyFair.calculateCrashPoint(knownSeed);
      
      // This value should be deterministic (calculated from 'aaaa...' seed)
      // The exact value depends on the algorithm, but it should never change
      expect(crashPoint).toBeGreaterThan(1.00);
      expect(crashPoint).toBeLessThan(1000000);
      
      // Verify it's always the same
      const crashPoint2 = ProvablyFair.calculateCrashPoint(knownSeed);
      expect(crashPoint).toBe(crashPoint2);
    });

    it('should produce verifiable results', () => {
      // Generate 10 rounds and verify each one
      for (let i = 0; i < 10; i++) {
        const round = ProvablyFair.generateRound();
        
        // Verify hash
        const calculatedHash = ProvablyFair.hashServerSeed(round.serverSeed);
        expect(round.serverSeedHash).toBe(calculatedHash);
        
        // Verify crash point
        const isValid = ProvablyFair.verifyCrashPoint(round.serverSeed, round.crashPoint);
        expect(isValid).toBe(true);
      }
    });
  });
});
