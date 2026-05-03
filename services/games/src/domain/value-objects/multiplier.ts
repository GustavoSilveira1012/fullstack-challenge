/**
 * Multiplier Value Object
 * Represents the game multiplier (e.g., 1.50x, 2.37x)
 * Ensures minimum value of 1.00x
 */

export class InvalidMultiplierError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMultiplierError';
  }
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export class Multiplier {
  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  /**
   * Create Multiplier from a number
   * @param value - Multiplier value (must be >= 1.00)
   * @returns Result with Multiplier instance or InvalidMultiplierError
   */
  static fromNumber(value: number): Result<Multiplier, InvalidMultiplierError> {
    if (value < 1.0) {
      return {
        ok: false,
        error: new InvalidMultiplierError(
          'Multiplier must be at least 1.00x'
        ),
      };
    }
    return { ok: true, value: new Multiplier(value) };
  }

  /**
   * Create initial Multiplier (1.00x)
   * @returns Multiplier instance with value 1.00
   */
  static initial(): Multiplier {
    return new Multiplier(1.0);
  }

  /**
   * Check if this Multiplier is greater than or equal to another
   * @param other - Multiplier instance to compare
   * @returns true if this >= other
   */
  isGreaterThanOrEqual(other: Multiplier): boolean {
    return this.value >= other.value;
  }

  /**
   * Check equality with another Multiplier instance
   * @param other - Multiplier instance to compare
   * @returns true if values are equal (within floating point precision)
   */
  equals(other: Multiplier): boolean {
    // Use epsilon for floating point comparison
    const epsilon = 1e-9;
    return Math.abs(this.value - other.value) < epsilon;
  }

  /**
   * Get the numeric value
   * @returns number multiplier value
   */
  toNumber(): number {
    return this.value;
  }

  /**
   * Get the string representation
   * @returns string in format "X.XXx" (e.g., "1.50x", "2.37x")
   */
  toString(): string {
    return `${this.value.toFixed(2)}x`;
  }
}
