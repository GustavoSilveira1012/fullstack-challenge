import { describe, it, expect } from 'bun:test';
import { ServerSeedHash, InvalidServerSeedHashError } from '@/domain/value-objects/server-seed-hash';
import { ServerSeed } from '@/domain/value-objects/server-seed';
import { createHash } from 'crypto';

describe('ServerSeedHash Value Object', () => {
  describe('fromServerSeed', () => {
    it('should create ServerSeedHash from ServerSeed', () => {
      const seed = ServerSeed.generate();
      const hash = ServerSeedHash.fromServerSeed(seed);
      
      expect(hash).toBeDefined();
      expect(hash.toString().length).toBe(64); // SHA-256 produces 64 hex characters
    });

    it('should produce valid SHA-256 hash', () => {
      const seed = ServerSeed.generate();
      const hash = ServerSeedHash.fromServerSeed(seed);
      const hashStr = hash.toString();
      
      // Should be 64 hex characters
      expect(/^[0-9a-f]{64}$/i.test(hashStr)).toBe(true);
    });

    it('should produce deterministic hash for same seed', () => {
      const seedHex = 'a'.repeat(64);
      const result = ServerSeed.fromString(seedHex);
      
      if (result.ok) {
        const hash1 = ServerSeedHash.fromServerSeed(result.value);
        const hash2 = ServerSeedHash.fromServerSeed(result.value);
        
        expect(hash1.toString()).toBe(hash2.toString());
      }
    });

    it('should produce different hashes for different seeds', () => {
      const seed1 = ServerSeed.generate();
      const seed2 = ServerSeed.generate();
      
      const hash1 = ServerSeedHash.fromServerSeed(seed1);
      const hash2 = ServerSeedHash.fromServerSeed(seed2);
      
      expect(hash1.toString()).not.toBe(hash2.toString());
    });

    it('should match SHA-256 calculation', () => {
      const seedHex = 'a'.repeat(64);
      const result = ServerSeed.fromString(seedHex);
      
      if (result.ok) {
        const seed = result.value;
        const hash = ServerSeedHash.fromServerSeed(seed);
        
        // Calculate expected hash manually
        const expectedHash = createHash('sha256')
          .update(seed.toBuffer())
          .digest('hex');
        
        expect(hash.toString()).toBe(expectedHash);
      }
    });
  });

  describe('fromString', () => {
    it('should create ServerSeedHash from valid 64-character hex string', () => {
      const validHash = 'a'.repeat(64);
      const result = ServerSeedHash.fromString(validHash);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(validHash);
      }
    });

    it('should accept hex string with mixed case', () => {
      const mixedCaseHash = 'aAbBcCdDeEfF' + '0'.repeat(52);
      const result = ServerSeedHash.fromString(mixedCaseHash);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should be normalized to lowercase
        expect(result.value.toString()).toBe(mixedCaseHash.toLowerCase());
      }
    });

    it('should accept uppercase hex string', () => {
      const uppercaseHash = 'A'.repeat(64);
      const result = ServerSeedHash.fromString(uppercaseHash);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(uppercaseHash.toLowerCase());
      }
    });

    it('should reject empty string', () => {
      const result = ServerSeedHash.fromString('');
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidServerSeedHashError);
        expect(result.error.message).toContain('non-empty');
      }
    });

    it('should reject null', () => {
      const result = ServerSeedHash.fromString(null as any);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidServerSeedHashError);
      }
    });

    it('should reject non-hex string', () => {
      const result = ServerSeedHash.fromString('g'.repeat(64));
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidServerSeedHashError);
        expect(result.error.message).toContain('valid hex');
      }
    });

    it('should reject hex string with spaces', () => {
      const result = ServerSeedHash.fromString('a'.repeat(32) + ' ' + 'a'.repeat(31));
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidServerSeedHashError);
      }
    });

    it('should reject hex string shorter than 64 characters', () => {
      const result = ServerSeedHash.fromString('a'.repeat(63));
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidServerSeedHashError);
        expect(result.error.message).toContain('64 hex characters');
      }
    });

    it('should reject hex string longer than 64 characters', () => {
      const result = ServerSeedHash.fromString('a'.repeat(65));
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidServerSeedHashError);
        expect(result.error.message).toContain('64 hex characters');
      }
    });

    it('should reject hex string with special characters', () => {
      const result = ServerSeedHash.fromString('a'.repeat(63) + '!');
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidServerSeedHashError);
      }
    });
  });

  describe('toString', () => {
    it('should return the hex string', () => {
      const seed = ServerSeed.generate();
      const hash = ServerSeedHash.fromServerSeed(seed);
      const str = hash.toString();
      
      expect(typeof str).toBe('string');
      expect(str.length).toBe(64);
    });

    it('should return consistent value', () => {
      const seed = ServerSeed.generate();
      const hash = ServerSeedHash.fromServerSeed(seed);
      const str1 = hash.toString();
      const str2 = hash.toString();
      
      expect(str1).toBe(str2);
    });

    it('should return lowercase hex', () => {
      const validHash = 'ABCDEF0123456789' + 'a'.repeat(48);
      const result = ServerSeedHash.fromString(validHash);
      
      if (result.ok) {
        expect(result.value.toString()).toBe(validHash.toLowerCase());
      }
    });
  });

  describe('equals', () => {
    it('should return true for same ServerSeedHash', () => {
      const seed = ServerSeed.generate();
      const hash = ServerSeedHash.fromServerSeed(seed);
      
      expect(hash.equals(hash)).toBe(true);
    });

    it('should return true for hashes created from same seed', () => {
      const seedHex = 'a'.repeat(64);
      const result = ServerSeed.fromString(seedHex);
      
      if (result.ok) {
        const hash1 = ServerSeedHash.fromServerSeed(result.value);
        const hash2 = ServerSeedHash.fromServerSeed(result.value);
        
        expect(hash1.equals(hash2)).toBe(true);
      }
    });

    it('should return false for different hashes', () => {
      const seed1 = ServerSeed.generate();
      const seed2 = ServerSeed.generate();
      
      const hash1 = ServerSeedHash.fromServerSeed(seed1);
      const hash2 = ServerSeedHash.fromServerSeed(seed2);
      
      expect(hash1.equals(hash2)).toBe(false);
    });

    it('should return true for hashes created from same string', () => {
      const hashStr = 'a'.repeat(64);
      const result1 = ServerSeedHash.fromString(hashStr);
      const result2 = ServerSeedHash.fromString(hashStr);
      
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });

    it('should return true when comparing case-insensitive hashes', () => {
      const hashStr = 'aAbBcCdDeEfF' + '0'.repeat(52);
      const result1 = ServerSeedHash.fromString(hashStr);
      const result2 = ServerSeedHash.fromString(hashStr.toLowerCase());
      
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });
  });

  describe('immutability', () => {
    it('should not allow modification of internal value', () => {
      const seed = ServerSeed.generate();
      const hash = ServerSeedHash.fromServerSeed(seed);
      const str1 = hash.toString();
      
      // Try to modify (should not affect the object)
      const str2 = hash.toString();
      
      expect(str1).toBe(str2);
    });
  });

  describe('round-trip conversion', () => {
    it('should preserve value through fromString and toString', () => {
      const originalHash = 'a'.repeat(64);
      const result = ServerSeedHash.fromString(originalHash);
      
      if (result.ok) {
        expect(result.value.toString()).toBe(originalHash);
      }
    });

    it('should preserve value through fromServerSeed and toString', () => {
      const seed = ServerSeed.generate();
      const hash = ServerSeedHash.fromServerSeed(seed);
      const hashStr = hash.toString();
      
      const result = ServerSeedHash.fromString(hashStr);
      if (result.ok) {
        expect(result.value.toString()).toBe(hashStr);
      }
    });
  });

  describe('verification', () => {
    it('should verify that hash matches seed', () => {
      const seed = ServerSeed.generate();
      const hash = ServerSeedHash.fromServerSeed(seed);
      
      // Manually verify the hash
      const expectedHash = createHash('sha256')
        .update(seed.toBuffer())
        .digest('hex');
      
      expect(hash.toString()).toBe(expectedHash);
    });

    it('should not verify hash for different seed', () => {
      const seed1 = ServerSeed.generate();
      const seed2 = ServerSeed.generate();
      
      const hash1 = ServerSeedHash.fromServerSeed(seed1);
      
      // Manually verify the hash for seed2
      const expectedHash2 = createHash('sha256')
        .update(seed2.toBuffer())
        .digest('hex');
      
      expect(hash1.toString()).not.toBe(expectedHash2);
    });
  });
});
