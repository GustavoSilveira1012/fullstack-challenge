import { randomUUID } from 'crypto';

/**
 * RoundId Value Object
 * Represents a unique identifier for a game round
 * Uses UUID v4 format
 */

export class InvalidRoundIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRoundIdError';
  }
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class RoundId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Create a new RoundId with a randomly generated UUID v4
   * @returns RoundId instance
   */
  static create(): RoundId {
    return new RoundId(randomUUID());
  }

  /**
   * Create RoundId from an existing UUID string
   * @param value - UUID v4 string
   * @returns Result with RoundId instance or InvalidRoundIdError
   */
  static fromString(value: string): Result<RoundId, InvalidRoundIdError> {
    if (!value || typeof value !== 'string') {
      return {
        ok: false,
        error: new InvalidRoundIdError('RoundId must be a non-empty string'),
      };
    }

    if (!UUID_V4_REGEX.test(value)) {
      return {
        ok: false,
        error: new InvalidRoundIdError(
          `RoundId must be a valid UUID v4 format, got: ${value}`
        ),
      };
    }

    return { ok: true, value: new RoundId(value) };
  }

  /**
   * Get the string representation of the RoundId
   * @returns UUID v4 string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Check equality with another RoundId
   * @param other - RoundId instance to compare
   * @returns true if IDs are equal
   */
  equals(other: RoundId): boolean {
    return this.value === other.value;
  }
}
