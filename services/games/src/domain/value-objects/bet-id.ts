import { randomUUID } from 'crypto';

/**
 * BetId Value Object
 * Represents a unique identifier for a bet
 * Uses UUID v4 format
 */

export class InvalidBetIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBetIdError';
  }
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class BetId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Create a new BetId with a randomly generated UUID v4
   * @returns BetId instance
   */
  static create(): BetId {
    return new BetId(randomUUID());
  }

  /**
   * Create BetId from an existing UUID string
   * @param value - UUID v4 string
   * @returns Result with BetId instance or InvalidBetIdError
   */
  static fromString(value: string): Result<BetId, InvalidBetIdError> {
    if (!value || typeof value !== 'string') {
      return {
        ok: false,
        error: new InvalidBetIdError('BetId must be a non-empty string'),
      };
    }

    if (!UUID_V4_REGEX.test(value)) {
      return {
        ok: false,
        error: new InvalidBetIdError(
          `BetId must be a valid UUID v4 format, got: ${value}`
        ),
      };
    }

    return { ok: true, value: new BetId(value) };
  }

  /**
   * Get the string representation of the BetId
   * @returns UUID v4 string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Check equality with another BetId
   * @param other - BetId instance to compare
   * @returns true if IDs are equal
   */
  equals(other: BetId): boolean {
    return this.value === other.value;
  }
}
