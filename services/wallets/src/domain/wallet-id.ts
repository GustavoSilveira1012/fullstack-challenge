/**
 * WalletId Value Object
 * 
 * Represents a unique wallet identifier using UUID v4 format.
 * Immutable value object that ensures wallet IDs are valid UUIDs.
 * 
 * Invariants:
 * - Value must be a valid UUID v4 format
 * - Immutable after creation
 */

import { randomUUID } from 'crypto';

export class InvalidWalletIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidWalletIdError';
  }
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export class WalletId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Creates a new WalletId with a randomly generated UUID v4.
   * 
   * @returns WalletId instance with a new UUID v4
   */
  static create(): WalletId {
    const uuid = randomUUID();
    return new WalletId(uuid);
  }

  /**
   * Creates a WalletId from an existing UUID string.
   * 
   * @param value - UUID string to validate and use
   * @returns Result with WalletId instance or InvalidWalletIdError
   */
  static fromString(value: string): Result<WalletId, InvalidWalletIdError> {
    if (!WalletId.isValidUUID(value)) {
      return {
        ok: false,
        error: new InvalidWalletIdError(
          `Invalid wallet ID format: ${value}. Expected UUID v4 format.`
        ),
      };
    }

    return {
      ok: true,
      value: new WalletId(value),
    };
  }

  /**
   * Validates if a string is a valid UUID format.
   * Accepts both v4 and other UUID versions for flexibility.
   * 
   * @param value - String to validate
   * @returns true if valid UUID format, false otherwise
   */
  private static isValidUUID(value: string): boolean {
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    // where x is any hexadecimal digit and y is one of 8, 9, A, or B
    // We'll accept any valid UUID format (not just v4) for flexibility
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * Returns the UUID string value.
   * 
   * @returns The UUID string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Checks if this WalletId equals another.
   * 
   * @param other - WalletId instance to compare
   * @returns true if values are equal, false otherwise
   */
  equals(other: WalletId): boolean {
    return this.value === other.value;
  }
}
