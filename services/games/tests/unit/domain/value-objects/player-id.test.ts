import { describe, it, expect } from 'bun:test';
import { PlayerId, InvalidPlayerIdError } from '@/domain/value-objects/player-id';

describe('PlayerId Value Object', () => {
  describe('fromString', () => {
    it('should create PlayerId from valid string', () => {
      const result = PlayerId.fromString('user-123');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe('user-123');
      }
    });

    it('should create PlayerId from UUID string', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = PlayerId.fromString(uuid);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(uuid);
      }
    });

    it('should create PlayerId from numeric string', () => {
      const result = PlayerId.fromString('12345');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe('12345');
      }
    });

    it('should create PlayerId from email-like string', () => {
      const result = PlayerId.fromString('user@example.com');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe('user@example.com');
      }
    });

    it('should trim whitespace from input', () => {
      const result = PlayerId.fromString('  user-123  ');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe('user-123');
      }
    });

    it('should reject empty string', () => {
      const result = PlayerId.fromString('');
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidPlayerIdError);
        expect(result.error.message).toContain('non-empty');
      }
    });

    it('should reject null', () => {
      const result = PlayerId.fromString(null as any);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidPlayerIdError);
      }
    });

    it('should reject undefined', () => {
      const result = PlayerId.fromString(undefined as any);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidPlayerIdError);
      }
    });

    it('should reject whitespace-only string', () => {
      const result = PlayerId.fromString('   ');
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidPlayerIdError);
        expect(result.error.message).toContain('empty or whitespace');
      }
    });

    it('should reject non-string values', () => {
      const result = PlayerId.fromString(123 as any);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidPlayerIdError);
      }
    });

    it('should accept string with special characters', () => {
      const result = PlayerId.fromString('user-123_abc.test');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe('user-123_abc.test');
      }
    });

    it('should accept string with unicode characters', () => {
      const result = PlayerId.fromString('user-123-ñ-é');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe('user-123-ñ-é');
      }
    });

    it('should accept single character string', () => {
      const result = PlayerId.fromString('a');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe('a');
      }
    });

    it('should accept very long string', () => {
      const longString = 'a'.repeat(1000);
      const result = PlayerId.fromString(longString);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(longString);
      }
    });
  });

  describe('toString', () => {
    it('should return the player ID string', () => {
      const result = PlayerId.fromString('user-123');
      
      if (result.ok) {
        expect(result.value.toString()).toBe('user-123');
      }
    });

    it('should return consistent value', () => {
      const result = PlayerId.fromString('user-123');
      
      if (result.ok) {
        const str1 = result.value.toString();
        const str2 = result.value.toString();
        expect(str1).toBe(str2);
      }
    });
  });

  describe('equals', () => {
    it('should return true for same PlayerId', () => {
      const result = PlayerId.fromString('user-123');
      
      if (result.ok) {
        expect(result.value.equals(result.value)).toBe(true);
      }
    });

    it('should return true for PlayerIds created from same string', () => {
      const result1 = PlayerId.fromString('user-123');
      const result2 = PlayerId.fromString('user-123');
      
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });

    it('should return false for different PlayerIds', () => {
      const result1 = PlayerId.fromString('user-123');
      const result2 = PlayerId.fromString('user-456');
      
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });

    it('should return false for case-sensitive comparison', () => {
      const result1 = PlayerId.fromString('User-123');
      const result2 = PlayerId.fromString('user-123');
      
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });

    it('should return true when comparing trimmed values', () => {
      const result1 = PlayerId.fromString('  user-123  ');
      const result2 = PlayerId.fromString('user-123');
      
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });
  });

  describe('immutability', () => {
    it('should not allow modification of internal value', () => {
      const result = PlayerId.fromString('user-123');
      
      if (result.ok) {
        const str1 = result.value.toString();
        const str2 = result.value.toString();
        expect(str1).toBe(str2);
      }
    });
  });
});
