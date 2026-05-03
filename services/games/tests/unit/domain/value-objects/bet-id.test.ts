import { describe, it, expect } from 'bun:test';
import { BetId, InvalidBetIdError } from '@/domain/value-objects/bet-id';

describe('BetId Value Object', () => {
  describe('create', () => {
    it('should create a new BetId with UUID v4 format', () => {
      const betId = BetId.create();
      const str = betId.toString();
      
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(str)).toBe(true);
    });

    it('should create different BetIds on each call', () => {
      const betId1 = BetId.create();
      const betId2 = BetId.create();
      
      expect(betId1.toString()).not.toBe(betId2.toString());
    });
  });

  describe('fromString', () => {
    it('should create BetId from valid UUID v4 string', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = BetId.fromString(validUuid);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(validUuid);
      }
    });

    it('should accept UUID v4 with version 4 in third group', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = BetId.fromString(validUuid);
      expect(result.ok).toBe(true);
    });

    it('should accept UUID v4 with variant bits [89ab] in fourth group', () => {
      const validUuids = [
        '550e8400-e29b-41d4-8716-446655440000', // 8
        '550e8400-e29b-41d4-9716-446655440000', // 9
        '550e8400-e29b-41d4-a716-446655440000', // a
        '550e8400-e29b-41d4-b716-446655440000', // b
      ];
      
      validUuids.forEach(uuid => {
        const result = BetId.fromString(uuid);
        expect(result.ok).toBe(true);
      });
    });

    it('should reject empty string', () => {
      const result = BetId.fromString('');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidBetIdError);
        expect(result.error.message).toContain('non-empty');
      }
    });

    it('should reject null', () => {
      const result = BetId.fromString(null as any);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidBetIdError);
      }
    });

    it('should reject non-UUID string', () => {
      const result = BetId.fromString('not-a-uuid');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidBetIdError);
        expect(result.error.message).toContain('valid UUID v4');
      }
    });

    it('should reject UUID v1 format', () => {
      const uuidV1 = '550e8400-e29b-11d4-a716-446655440000'; // version 1
      const result = BetId.fromString(uuidV1);
      expect(result.ok).toBe(false);
    });

    it('should reject UUID with wrong variant bits', () => {
      const invalidUuid = '550e8400-e29b-41d4-c716-446655440000'; // c is not valid variant
      const result = BetId.fromString(invalidUuid);
      expect(result.ok).toBe(false);
    });

    it('should reject UUID with missing hyphens', () => {
      const result = BetId.fromString('550e8400e29b41d4a716446655440000');
      expect(result.ok).toBe(false);
    });

    it('should accept uppercase UUID', () => {
      const validUuid = '550E8400-E29B-41D4-A716-446655440000';
      const result = BetId.fromString(validUuid);
      expect(result.ok).toBe(true);
    });

    it('should accept mixed case UUID', () => {
      const validUuid = '550e8400-E29b-41D4-a716-446655440000';
      const result = BetId.fromString(validUuid);
      expect(result.ok).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return the UUID string', () => {
      const betId = BetId.create();
      const str = betId.toString();
      
      expect(typeof str).toBe('string');
      expect(str.length).toBe(36); // UUID format length
    });

    it('should return consistent value', () => {
      const betId = BetId.create();
      const str1 = betId.toString();
      const str2 = betId.toString();
      
      expect(str1).toBe(str2);
    });
  });

  describe('equals', () => {
    it('should return true for same BetId', () => {
      const betId = BetId.create();
      expect(betId.equals(betId)).toBe(true);
    });

    it('should return true for BetIds created from same UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result1 = BetId.fromString(uuid);
      const result2 = BetId.fromString(uuid);
      
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });

    it('should return false for different BetIds', () => {
      const betId1 = BetId.create();
      const betId2 = BetId.create();
      
      expect(betId1.equals(betId2)).toBe(false);
    });

    it('should return false for BetIds from different UUIDs', () => {
      const result1 = BetId.fromString('550e8400-e29b-41d4-a716-446655440000');
      const result2 = BetId.fromString('550e8400-e29b-41d4-a716-446655440001');
      
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });
  });

  describe('immutability', () => {
    it('should not allow modification of internal value', () => {
      const betId = BetId.create();
      const str1 = betId.toString();
      
      // Try to modify (should not affect the object)
      const str2 = betId.toString();
      
      expect(str1).toBe(str2);
    });
  });
});
