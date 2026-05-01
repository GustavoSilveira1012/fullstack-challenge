import { describe, it, expect } from 'bun:test';
import { PlayerId, InvalidPlayerIdError } from '../../../src/domain/player-id';

describe('PlayerId Value Object', () => {
  describe('fromString()', () => {
    it('should create PlayerId from valid non-empty string', () => {
      const playerIdString = 'player-123';
      const result = PlayerId.fromString(playerIdString);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(playerIdString);
      }
    });

    it('should accept UUID format player ID', () => {
      const playerIdString = '550e8400-e29b-41d4-a716-446655440000';
      const result = PlayerId.fromString(playerIdString);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(playerIdString);
      }
    });

    it('should accept alphanumeric player ID', () => {
      const playerIdString = 'player123abc';
      const result = PlayerId.fromString(playerIdString);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(playerIdString);
      }
    });

    it('should accept player ID with special characters', () => {
      const playerIdString = 'player-123_abc@example.com';
      const result = PlayerId.fromString(playerIdString);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(playerIdString);
      }
    });

    it('should accept numeric string player ID', () => {
      const playerIdString = '12345';
      const result = PlayerId.fromString(playerIdString);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(playerIdString);
      }
    });

    it('should accept single character player ID', () => {
      const playerIdString = 'a';
      const result = PlayerId.fromString(playerIdString);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(playerIdString);
      }
    });

    it('should accept long player ID', () => {
      const playerIdString = 'a'.repeat(1000);
      const result = PlayerId.fromString(playerIdString);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(playerIdString);
      }
    });

    it('should reject empty string', () => {
      const result = PlayerId.fromString('');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidPlayerIdError);
        expect(result.error.message).toContain('Invalid player ID');
        expect(result.error.message).toContain('non-empty string');
      }
    });

    it('should reject whitespace-only string', () => {
      const result = PlayerId.fromString('   ');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidPlayerIdError);
        expect(result.error.name).toBe('InvalidPlayerIdError');
      }
    });

    it('should reject string with only tabs', () => {
      const result = PlayerId.fromString('\t\t\t');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidPlayerIdError);
      }
    });

    it('should reject string with only newlines', () => {
      const result = PlayerId.fromString('\n\n\n');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidPlayerIdError);
      }
    });

    it('should reject string with mixed whitespace', () => {
      const result = PlayerId.fromString(' \t\n ');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidPlayerIdError);
      }
    });

    it('should accept string with leading whitespace', () => {
      const playerIdString = '  player-123';
      const result = PlayerId.fromString(playerIdString);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(playerIdString);
      }
    });

    it('should accept string with trailing whitespace', () => {
      const playerIdString = 'player-123  ';
      const result = PlayerId.fromString(playerIdString);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(playerIdString);
      }
    });

    it('should accept string with internal whitespace', () => {
      const playerIdString = 'player 123';
      const result = PlayerId.fromString(playerIdString);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(playerIdString);
      }
    });

    it('should have correct error name', () => {
      const result = PlayerId.fromString('');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe('InvalidPlayerIdError');
      }
    });
  });

  describe('toString()', () => {
    it('should return the player ID string value', () => {
      const playerIdString = 'player-123';
      const result = PlayerId.fromString(playerIdString);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(playerIdString);
      }
    });

    it('should return consistent value on multiple calls', () => {
      const playerIdString = 'player-123';
      const result = PlayerId.fromString(playerIdString);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const str1 = result.value.toString();
        const str2 = result.value.toString();

        expect(str1).toBe(str2);
        expect(str1).toBe(playerIdString);
      }
    });

    it('should preserve exact string value including whitespace', () => {
      const playerIdString = '  player-123  ';
      const result = PlayerId.fromString(playerIdString);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(playerIdString);
      }
    });

    it('should preserve case', () => {
      const playerIdString = 'Player-123-ABC';
      const result = PlayerId.fromString(playerIdString);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(playerIdString);
      }
    });
  });

  describe('equals()', () => {
    it('should return true for equal PlayerIds', () => {
      const playerIdString = 'player-123';
      const result1 = PlayerId.fromString(playerIdString);
      const result2 = PlayerId.fromString(playerIdString);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);

      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });

    it('should return false for different PlayerIds', () => {
      const playerIdString1 = 'player-123';
      const playerIdString2 = 'player-456';
      const result1 = PlayerId.fromString(playerIdString1);
      const result2 = PlayerId.fromString(playerIdString2);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);

      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });

    it('should return true when comparing same instance', () => {
      const playerIdString = 'player-123';
      const result = PlayerId.fromString(playerIdString);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.equals(result.value)).toBe(true);
      }
    });

    it('should be case-sensitive', () => {
      const playerIdString1 = 'player-123';
      const playerIdString2 = 'PLAYER-123';
      const result1 = PlayerId.fromString(playerIdString1);
      const result2 = PlayerId.fromString(playerIdString2);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);

      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });

    it('should be whitespace-sensitive', () => {
      const playerIdString1 = 'player-123';
      const playerIdString2 = 'player-123 ';
      const result1 = PlayerId.fromString(playerIdString1);
      const result2 = PlayerId.fromString(playerIdString2);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);

      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });

    it('should return false for different UUID player IDs', () => {
      const playerIdString1 = '550e8400-e29b-41d4-a716-446655440000';
      const playerIdString2 = '660e8400-e29b-41d4-a716-446655440000';
      const result1 = PlayerId.fromString(playerIdString1);
      const result2 = PlayerId.fromString(playerIdString2);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);

      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });
  });

  describe('immutability', () => {
    it('should not allow modification of internal value', () => {
      const playerIdString = 'player-123';
      const result = PlayerId.fromString(playerIdString);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const originalValue = result.value.toString();

        // Attempt to modify (should not be possible due to readonly)
        // TypeScript prevents this at compile time, but we verify runtime behavior
        expect(result.value.toString()).toBe(originalValue);
      }
    });

    it('should maintain same value after multiple toString calls', () => {
      const playerIdString = 'player-123';
      const result = PlayerId.fromString(playerIdString);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const value1 = result.value.toString();
        const value2 = result.value.toString();
        const value3 = result.value.toString();

        expect(value1).toBe(playerIdString);
        expect(value2).toBe(playerIdString);
        expect(value3).toBe(playerIdString);
      }
    });

    it('should maintain same equality after multiple equals calls', () => {
      const playerIdString = 'player-123';
      const result1 = PlayerId.fromString(playerIdString);
      const result2 = PlayerId.fromString(playerIdString);

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
    it('should preserve value through fromString and toString', () => {
      const originalPlayerIdString = 'player-123';
      const result = PlayerId.fromString(originalPlayerIdString);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const retrievedPlayerIdString = result.value.toString();
        expect(retrievedPlayerIdString).toBe(originalPlayerIdString);

        const result2 = PlayerId.fromString(retrievedPlayerIdString);
        expect(result2.ok).toBe(true);
        if (result2.ok) {
          expect(result2.value.equals(result.value)).toBe(true);
        }
      }
    });

    it('should preserve UUID format through round-trip', () => {
      const originalPlayerIdString = '550e8400-e29b-41d4-a716-446655440000';
      const result = PlayerId.fromString(originalPlayerIdString);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const retrievedPlayerIdString = result.value.toString();
        expect(retrievedPlayerIdString).toBe(originalPlayerIdString);

        const result2 = PlayerId.fromString(retrievedPlayerIdString);
        expect(result2.ok).toBe(true);
        if (result2.ok) {
          expect(result2.value.equals(result.value)).toBe(true);
        }
      }
    });

    it('should preserve special characters through round-trip', () => {
      const originalPlayerIdString = 'player-123_abc@example.com';
      const result = PlayerId.fromString(originalPlayerIdString);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const retrievedPlayerIdString = result.value.toString();
        expect(retrievedPlayerIdString).toBe(originalPlayerIdString);

        const result2 = PlayerId.fromString(retrievedPlayerIdString);
        expect(result2.ok).toBe(true);
        if (result2.ok) {
          expect(result2.value.equals(result.value)).toBe(true);
        }
      }
    });
  });

  describe('edge cases', () => {
    it('should handle very long player IDs', () => {
      const longPlayerId = 'a'.repeat(10000);
      const result = PlayerId.fromString(longPlayerId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(longPlayerId);
        expect(result.value.toString().length).toBe(10000);
      }
    });

    it('should handle player IDs with unicode characters', () => {
      const unicodePlayerId = 'player-123-🎮';
      const result = PlayerId.fromString(unicodePlayerId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(unicodePlayerId);
      }
    });

    it('should handle player IDs with emojis', () => {
      const emojiPlayerId = '😀😁😂';
      const result = PlayerId.fromString(emojiPlayerId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(emojiPlayerId);
      }
    });

    it('should handle player IDs with Chinese characters', () => {
      const chinesePlayerId = '玩家123';
      const result = PlayerId.fromString(chinesePlayerId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(chinesePlayerId);
      }
    });

    it('should handle player IDs with Arabic characters', () => {
      const arabicPlayerId = 'لاعب123';
      const result = PlayerId.fromString(arabicPlayerId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toString()).toBe(arabicPlayerId);
      }
    });
  });
});
