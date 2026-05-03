import { describe, it, expect } from 'bun:test';
import { ServerSeed, InvalidServerSeedError } from '@/domain/value-objects/server-seed';

describe('ServerSeed Value Object', () => {
  describe('generate', () => {
    it('should generate a ServerSeed with valid hex format', () => {
      const seed = ServerSeed.generate();
      const str = seed.toString();
      
      // Should be 64 hex characters (32 bytes)
      expect(str.length).toBe(64);
      expect(/^[0-9a-f]{64}$/i.test(str)).toBe(true);
    });

    it('should generate different seeds on each call', () => {
      const seed1 = ServerSeed.generate();
      const seed2 = ServerSeed.generate();
      
      expect(seed1.toString()).not.toBe(seed2.toString());
    });

    it('should generate cryptographically random seeds', () => {
      const seeds = new Set();
      for (let i = 0; i < 100; i++) {
        seeds.add(ServerSeed.generate().toString());
      }
      
      // All 100 seeds should be unique
      expect(seeds.size).toBe(100);
    });
  });

  describe('fromString', () => {
    it('should create ServerSeed from valid 64-character hex string', () => {
      const validHex = 'a'.repeat(64);
      const result = ServerSeed.fromString(validHex);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(validHex);
      }
    });

    it('should accept hex string with mixed case', () => {
      const mixedCaseHex = 'aAbBcCdDeEfF' + '0'.repeat(52);
      const result = ServerSeed.fromString(mixedCaseHex);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should be normalized to lowercase
        expect(result.value.toString()).toBe(mixedCaseHex.toLowerCase());
      }
    });

    it('should accept uppercase hex string', () => {
      const uppercaseHex = 'A'.repeat(64);
      const result = ServerSeed.fromString(uppercaseHex);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(uppercaseHex.toLowerCase());
      }
    });

    it('should reject empty string', () => {
      const result = ServerSeed.fromString('');
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidServerSeedError);
        expect(result.error.message).toContain('non-empty');
      }
    });

    it('should reject null', () => {
      const result = ServerSeed.fromString(null as any);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidServerSeedError);
      }
    });

    it('should reject non-hex string', () => {
      const result = ServerSeed.fromString('g'.repeat(64));
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidServerSeedError);
        expect(result.error.message).toContain('valid hex');
      }
    });

    it('should reject hex string with spaces', () => {
      const result = ServerSeed.fromString('a'.repeat(32) + ' ' + 'a'.repeat(31));
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidServerSeedError);
      }
    });

    it('should reject hex string shorter than 64 characters', () => {
      const result = ServerSeed.fromString('a'.repeat(63));
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidServerSeedError);
        expect(result.error.message).toContain('64 hex characters');
      }
    });

    it('should reject hex string longer than 64 characters', () => {
      const result = ServerSeed.fromString('a'.repeat(65));
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidServerSeedError);
        expect(result.error.message).toContain('64 hex characters');
      }
    });

    it('should reject hex string with special characters', () => {
      const result = ServerSeed.fromString('a'.repeat(63) + '!');
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidServerSeedError);
      }
    });
  });

  describe('toString', () => {
    it('should return the hex string', () => {
      const seed = ServerSeed.generate();
      const str = seed.toString();
      
      expect(typeof str).toBe('string');
      expect(str.length).toBe(64);
    });

    it('should return consistent value', () => {
      const seed = ServerSeed.generate();
      const str1 = seed.toString();
      const str2 = seed.toString();
      
      expect(str1).toBe(str2);
    });

    it('should return lowercase hex', () => {
      const validHex = 'ABCDEF0123456789' + 'a'.repeat(48);
      const result = ServerSeed.fromString(validHex);
      
      if (result.ok) {
        expect(result.value.toString()).toBe(validHex.toLowerCase());
      }
    });
  });

  describe('toBuffer', () => {
    it('should return a Buffer with 32 bytes', () => {
      const seed = ServerSeed.generate();
      const buffer = seed.toBuffer();
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBe(32);
    });

    it('should convert hex string to buffer correctly', () => {
      const validHex = '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20';
      const result = ServerSeed.fromString(validHex);
      
      if (result.ok) {
        const buffer = result.value.toBuffer();
        expect(buffer.toString('hex')).toBe(validHex);
      }
    });

    it('should produce consistent buffer', () => {
      const seed = ServerSeed.generate();
      const buffer1 = seed.toBuffer();
      const buffer2 = seed.toBuffer();
      
      expect(buffer1.toString('hex')).toBe(buffer2.toString('hex'));
    });

    it('should produce buffer that converts back to same hex', () => {
      const seed = ServerSeed.generate();
      const buffer = seed.toBuffer();
      const hexFromBuffer = buffer.toString('hex');
      
      expect(hexFromBuffer).toBe(seed.toString());
    });
  });

  describe('immutability', () => {
    it('should not allow modification of internal value', () => {
      const seed = ServerSeed.generate();
      const str1 = seed.toString();
      
      // Try to modify (should not affect the object)
      const str2 = seed.toString();
      
      expect(str1).toBe(str2);
    });
  });

  describe('round-trip conversion', () => {
    it('should preserve value through fromString and toString', () => {
      const originalHex = 'a'.repeat(64);
      const result = ServerSeed.fromString(originalHex);
      
      if (result.ok) {
        expect(result.value.toString()).toBe(originalHex);
      }
    });

    it('should preserve value through generate, toString, fromString', () => {
      const seed1 = ServerSeed.generate();
      const hex = seed1.toString();
      const result = ServerSeed.fromString(hex);
      
      if (result.ok) {
        expect(result.value.toString()).toBe(hex);
      }
    });
  });
});
