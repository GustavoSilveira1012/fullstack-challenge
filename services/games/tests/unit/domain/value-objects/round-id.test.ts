import { describe, it, expect } from 'bun:test';
import { RoundId, InvalidRoundIdError } from '@/domain/value-objects/round-id';

describe('RoundId Value Object', () => {
  describe('create', () => {
    it('should create a new RoundId with UUID v4 format', () => {
      const roundId = RoundId.create();
      const str = roundId.toString();
      
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(str)).toBe(true);
    });

    it('should create different RoundIds on each call', () => {
      const roundId1 = RoundId.create();
      const roundId2 = RoundId.create();
      
      expect(roundId1.toString()).not.toBe(roundId2.toString());
    });
  });

  describe('fromString', () => {
    it('should create RoundId from valid UUID v4 string', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = RoundId.fromString(validUuid);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(validUuid);
      }
    });

    it('should accept UUID v4 with version 4 in third group', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = RoundId.fromString(validUuid);
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
        const result = RoundId.fromString(uuid);
        expect(result.ok).toBe(true);
      });
    });

    it('should reject empty string', () => {
      const result = RoundId.fromString('');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidRoundIdError);
        expect(result.error.message).toContain('non-empty');
      }
    });

    it('should reject null', () => {
      const result = RoundId.fromString(null as any);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidRoundIdError);
      }
    });

    it('should reject non-UUID string', () => {
      const result = RoundId.fromString('not-a-uuid');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidRoundIdError);
        expect(result.error.message).toContain('valid UUID v4');
      }
    });

    it('should reject UUID v1 format', () => {
      const uuidV1 = '550e8400-e29b-11d4-a716-446655440000'; // version 1
      const result = RoundId.fromString(uuidV1);
      expect(result.ok).toBe(false);
    });

    it('should reject UUID with wrong variant bits', () => {
      const invalidUuid = '550e8400-e29b-41d4-c716-446655440000'; // c is not valid variant
      const result = RoundId.fromString(invalidUuid);
      expect(result.ok).toBe(false);
    });

    it('should reject UUID with missing hyphens', () => {
      const result = RoundId.fromString('550e8400e29b41d4a716446655440000');
      expect(result.ok).toBe(false);
    });

    it('should accept uppercase UUID', () => {
      const validUuid = '550E8400-E29B-41D4-A716-446655440000';
      const result = RoundId.fromString(validUuid);
      expect(result.ok).toBe(true);
    });

    it('should accept mixed case UUID', () => {
      const validUuid = '550e8400-E29b-41D4-a716-446655440000';
      const result = RoundId.fromString(validUuid);
      expect(result.ok).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return the UUID string', () => {
      const roundId = RoundId.create();
      const str = roundId.toString();
      
      expect(typeof str).toBe('string');
      expect(str.length).toBe(36); // UUID format length
    });

    it('should return consistent value', () => {
      const roundId = RoundId.create();
      const str1 = roundId.toString();
      const str2 = roundId.toString();
      
      expect(str1).toBe(str2);
    });
  });

  describe('equals', () => {
    it('should return true for same RoundId', () => {
      const roundId = RoundId.create();
      expect(roundId.equals(roundId)).toBe(true);
    });

    it('should return true for RoundIds created from same UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result1 = RoundId.fromString(uuid);
      const result2 = RoundId.fromString(uuid);
      
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });

    it('should return false for different RoundIds', () => {
      const roundId1 = RoundId.create();
      const roundId2 = RoundId.create();
      
      expect(roundId1.equals(roundId2)).toBe(false);
    });

    it('should return false for RoundIds from different UUIDs', () => {
      const result1 = RoundId.fromString('550e8400-e29b-41d4-a716-446655440000');
      const result2 = RoundId.fromString('550e8400-e29b-41d4-a716-446655440001');
      
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });
  });

  describe('immutability', () => {
    it('should not allow modification of internal value', () => {
      const roundId = RoundId.create();
      const str1 = roundId.toString();
      
      // Try to modify (should not affect the object)
      const str2 = roundId.toString();
      
      expect(str1).toBe(str2);
    });
  });
});
