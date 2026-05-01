/**
 * PlayerId Value Object
 * 
 * Represents a unique player identifier extracted from JWT token sub claim.
 * Immutable value object that ensures player IDs are valid non-empty strings.
 * 
 * Invariants:
 * - Value must be a non-empty string
 * - Immutable after creation
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
   * Creates a PlayerId from a string value.
   * 
   * @param value - String to validate and use as player ID
   * @returns Result with PlayerId instance or InvalidPlayerIdError
   */
  static fromString(value: string): Result<PlayerId, InvalidPlayerIdError> {
    if (!PlayerId.isValid(value)) {
      return {
        ok: false,
        error: new InvalidPlayerIdError(
          `Invalid player ID: Player ID must be a non-empty string.`
        ),
      };
    }

    return {
      ok: true,
      value: new PlayerId(value),
    };
  }

  /**
   * Validates if a string is a valid player ID.
   * A valid player ID must be a non-empty string.
   * 
   * @param value - String to validate
   * @returns true if valid player ID, false otherwise
   */
  private static isValid(value: string): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  /**
   * Returns the player ID string value.
   * 
   * @returns The player ID string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Checks if this PlayerId equals another.
   * 
   * @param other - PlayerId instance to compare
   * @returns true if values are equal, false otherwise
   */
  equals(other: PlayerId): boolean {
    return this.value === other.value;
  }
}
