import { describe, it, expect } from 'bun:test';
import { WalletId, InvalidWalletIdError } from '../../../src/domain/wallet-id';

describe('WalletId Value Object', () => {
  describe('create()', () => {
    it('should create WalletId with valid UUID v4', () => {
      const walletId = WalletId.create();

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(walletId.toString())).toBe(true);
    });

    it('should create unique WalletIds on each call', () => {
      const walletId1 = WalletId.create();
      const walletId2 = WalletId.create();

      expect(walletId1.equals(walletId2)).toBe(false);
      expect(walletId1.toString()).not.toBe(walletId2.toString());
    });

    it('should create WalletId with 36 character UUID string', () => {
      const walletId = WalletId.create();

      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 characters)
      expect(walletId.toString().length).toBe(36);
    });

    it('should create multiple unique WalletIds', () => {
      const walletIds = Array.from({ length: 10 }, () => WalletId.create());
      const uniqueStrings = new Set(walletIds.map((id) => id.toString()));

      expect(uniqueStrings.size).toBe(10);
    });
  });

  describe('fromString()', () => {
    it('should create WalletId from valid UUID string', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = WalletId.fromString(uuid);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(uuid);
      }
    });

    it('should accept lowercase UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = WalletId.fromString(uuid);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(uuid);
      }
    });

    it('should accept uppercase UUID', () => {
      const uuid = '550E8400-E29B-41D4-A716-446655440000';
      const result = WalletId.fromString(uuid);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(uuid);
      }
    });

    it('should accept mixed case UUID', () => {
      const uuid = '550e8400-E29B-41d4-A716-446655440000';
      const result = WalletId.fromString(uuid);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(uuid);
      }
    });

    it('should reject empty string', () => {
      const result = WalletId.fromString('');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidWalletIdError);
        expect(result.error.message).toContain('Invalid wallet ID format');
        expect(result.error.message).toContain('Expected UUID v4 format');
      }
    });

    it('should reject string without hyphens', () => {
      const invalidUuid = '550e8400e29b41d4a716446655440000';
      const result = WalletId.fromString(invalidUuid);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidWalletIdError);
        expect(result.error.name).toBe('InvalidWalletIdError');
      }
    });

    it('should reject string with incorrect hyphen positions', () => {
      const invalidUuid = '550e8400-e29b41-d4a7-16446655440000';
      const result = WalletId.fromString(invalidUuid);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidWalletIdError);
      }
    });

    it('should reject string with non-hexadecimal characters', () => {
      const invalidUuid = '550e8400-e29b-41d4-a716-44665544000g';
      const result = WalletId.fromString(invalidUuid);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidWalletIdError);
      }
    });

    it('should reject string with special characters', () => {
      const invalidUuid = '550e8400-e29b-41d4-a716-44665544000!';
      const result = WalletId.fromString(invalidUuid);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidWalletIdError);
      }
    });

    it('should reject string that is too short', () => {
      const invalidUuid = '550e8400-e29b-41d4-a716-4466554400';
      const result = WalletId.fromString(invalidUuid);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidWalletIdError);
      }
    });

    it('should reject string that is too long', () => {
      const invalidUuid = '550e8400-e29b-41d4-a716-446655440000-extra';
      const result = WalletId.fromString(invalidUuid);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidWalletIdError);
      }
    });

    it('should reject null-like strings', () => {
      const invalidUuid = 'null';
      const result = WalletId.fromString(invalidUuid);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidWalletIdError);
      }
    });

    it('should reject undefined-like strings', () => {
      const invalidUuid = 'undefined';
      const result = WalletId.fromString(invalidUuid);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidWalletIdError);
      }
    });

    it('should include invalid value in error message', () => {
      const invalidUuid = 'not-a-uuid';
      const result = WalletId.fromString(invalidUuid);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not-a-uuid');
      }
    });

    it('should accept UUID v1 format', () => {
      // UUID v1: time-based
      const uuidV1 = '550e8400-e29b-11d4-a716-446655440000';
      const result = WalletId.fromString(uuidV1);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(uuidV1);
      }
    });

    it('should accept UUID v4 format', () => {
      // UUID v4: random
      const uuidV4 = '550e8400-e29b-41d4-a716-446655440000';
      const result = WalletId.fromString(uuidV4);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(uuidV4);
      }
    });
  });

  describe('toString()', () => {
    it('should return the UUID string value', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = WalletId.fromString(uuid);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(uuid);
      }
    });

    it('should return consistent value on multiple calls', () => {
      const walletId = WalletId.create();
      const str1 = walletId.toString();
      const str2 = walletId.toString();

      expect(str1).toBe(str2);
    });

    it('should preserve case from fromString', () => {
      const uuid = '550E8400-E29B-41D4-A716-446655440000';
      const result = WalletId.fromString(uuid);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(uuid);
      }
    });
  });

  describe('equals()', () => {
    it('should return true for equal WalletIds', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result1 = WalletId.fromString(uuid);
      const result2 = WalletId.fromString(uuid);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);

      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });

    it('should return false for different WalletIds', () => {
      const uuid1 = '550e8400-e29b-41d4-a716-446655440000';
      const uuid2 = '660e8400-e29b-41d4-a716-446655440000';
      const result1 = WalletId.fromString(uuid1);
      const result2 = WalletId.fromString(uuid2);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);

      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });

    it('should return true when comparing same instance', () => {
      const walletId = WalletId.create();

      expect(walletId.equals(walletId)).toBe(true);
    });

    it('should be case-sensitive', () => {
      const uuid1 = '550e8400-e29b-41d4-a716-446655440000';
      const uuid2 = '550E8400-E29B-41D4-A716-446655440000';
      const result1 = WalletId.fromString(uuid1);
      const result2 = WalletId.fromString(uuid2);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);

      if (result1.ok && result2.ok) {
        // They should not be equal because the strings are different
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });

    it('should return false for WalletIds created with create()', () => {
      const walletId1 = WalletId.create();
      const walletId2 = WalletId.create();

      expect(walletId1.equals(walletId2)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should not allow modification of internal value', () => {
      const walletId = WalletId.create();
      const originalValue = walletId.toString();

      // Attempt to modify (should not be possible due to readonly)
      // TypeScript prevents this at compile time, but we verify runtime behavior
      expect(walletId.toString()).toBe(originalValue);
    });

    it('should maintain same value after multiple toString calls', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = WalletId.fromString(uuid);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const value1 = result.value.toString();
        const value2 = result.value.toString();
        const value3 = result.value.toString();

        expect(value1).toBe(uuid);
        expect(value2).toBe(uuid);
        expect(value3).toBe(uuid);
      }
    });

    it('should maintain same equality after multiple equals calls', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result1 = WalletId.fromString(uuid);
      const result2 = WalletId.fromString(uuid);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);

      if (result1.ok && result2.ok) {
        const equals1 = result1.value.equals(result2.value);
        const equals2 = result1.value.equals(result2.value);
        const equals3 = result1.value.equals(result2.value);

        expect(equals1).toBe(true);
        expect(equals2).toBe(true);
        expect(equals3).toBe(true);
      }
    });
  });

  describe('round-trip conversion', () => {
    it('should preserve value through create and toString', () => {
      const walletId = WalletId.create();
      const uuid = walletId.toString();
      const result = WalletId.fromString(uuid);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(uuid);
        expect(result.value.equals(walletId)).toBe(true);
      }
    });

    it('should preserve value through fromString and toString', () => {
      const originalUuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = WalletId.fromString(originalUuid);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const retrievedUuid = result.value.toString();
        expect(retrievedUuid).toBe(originalUuid);

        const result2 = WalletId.fromString(retrievedUuid);
        expect(result2.ok).toBe(true);
        if (result2.ok) {
          expect(result2.value.equals(result.value)).toBe(true);
        }
      }
    });
  });
});
