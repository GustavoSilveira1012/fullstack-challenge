/**
 * CrashPoint Value Object
 * Represents the predetermined crash point for a round
 * Wraps a Multiplier and ensures it's >= 1.00x
 */

import { Multiplier } from './multiplier';

export class InvalidCrashPointError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCrashPointError';
  }
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export class CrashPoint {
  private readonly multiplier: Multiplier;

  private constructor(multiplier: Multiplier) {
    this.multiplier = multiplier;
  }

  /**
   * Create CrashPoint from a Multiplier
   * @param multiplier - Multiplier instance (must be >= 1.00x)
   * @returns Result with CrashPoint instance or InvalidCrashPointError
   */
  static fromMultiplier(
    multiplier: Multiplier
  ): Result<CrashPoint, InvalidCrashPointError> {
    // Multiplier already validates >= 1.00x, so we just wrap it
    return { ok: true, value: new CrashPoint(multiplier) };
  }

  /**
   * Get the underlying Multiplier
   * @returns Multiplier instance
   */
  getMultiplier(): Multiplier {
    return this.multiplier;
  }

  /**
   * Get the numeric value
   * @returns number crash point value
   */
  toNumber(): number {
    return this.multiplier.toNumber();
  }

  /**
   * Get the string representation
   * @returns string in format "X.XXx" (e.g., "1.50x", "2.37x")
   */
  toString(): string {
    return this.multiplier.toString();
  }
}
