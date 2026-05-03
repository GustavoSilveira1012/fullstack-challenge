/**
 * PlayerId Value Object
 * Represents a unique identifier for a player
 * Extracted from JWT token sub claim
 */

export class InvalidPlayerIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPlayerIdError';
  }
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export class PlayerId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Create PlayerId from a string value
   * @param value - Player ID string (typically from JWT sub claim)
   * @returns Result with PlayerId instance or InvalidPlayerIdError
   */
  static fromString(value: string): Result<PlayerId, InvalidPlayerIdError> {
    if (!value || typeof value !== 'string') {
      return {
        ok: false,
        error: new InvalidPlayerIdError('PlayerId must be a non-empty string'),
      };
    }

    if (value.trim().length === 0) {
      return {
        ok: false,
        error: new InvalidPlayerIdError('PlayerId cannot be empty or whitespace'),
      };
    }

    return { ok: true, value: new PlayerId(value.trim()) };
  }

  /**
   * Get the string representation of the PlayerId
   * @returns Player ID string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Check equality with another PlayerId
   * @param other - PlayerId instance to compare
   * @returns true if IDs are equal
   */
  equals(other: PlayerId): boolean {
    return this.value === other.value;
  }
}
