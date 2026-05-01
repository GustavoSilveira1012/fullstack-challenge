/**
 * Money Value Object
 * 
 * Represents monetary values with exact precision using integer centavos.
 * Immutable value object that ensures no rounding errors occur in monetary calculations.
 * 
 * Invariants:
 * - Centavos must be >= 0
 * - Immutable after creation
 * - All arithmetic operations return new Money instances
 */

export class InvalidMoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMoneyError';
  }
}

export class NegativeMoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NegativeMoneyError';
  }
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export class Money {
  private readonly centavos: bigint;

  private constructor(centavos: bigint) {
    this.centavos = centavos;
  }

  /**
   * Creates a Money instance from centavos value.
   * 
   * @param centavos - Non-negative integer representing centavos
   * @returns Result with Money instance or InvalidMoneyError
   */
  static fromCentavos(centavos: bigint): Result<Money, InvalidMoneyError> {
    if (centavos < 0n) {
      return {
        ok: false,
        error: new InvalidMoneyError('Money value cannot be negative'),
      };
    }

    return {
      ok: true,
      value: new Money(centavos),
    };
  }

  /**
   * Creates a Money instance with zero centavos.
   * 
   * @returns Money instance with 0 centavos
   */
  static zero(): Money {
    return new Money(0n);
  }

  /**
   * Adds another Money instance to this one.
   * 
   * @param other - Money instance to add
   * @returns New Money instance with the sum
   */
  add(other: Money): Money {
    return new Money(this.centavos + other.centavos);
  }

  /**
   * Subtracts another Money instance from this one.
   * 
   * @param other - Money instance to subtract
   * @returns Result with new Money instance or NegativeMoneyError if result would be negative
   */
  subtract(other: Money): Result<Money, NegativeMoneyError> {
    const result = this.centavos - other.centavos;

    if (result < 0n) {
      return {
        ok: false,
        error: new NegativeMoneyError(
          `Cannot subtract ${other.centavos} from ${this.centavos}: result would be negative`
        ),
      };
    }

    return {
      ok: true,
      value: new Money(result),
    };
  }

  /**
   * Checks if this Money instance is greater than or equal to another.
   * 
   * @param other - Money instance to compare
   * @returns true if this >= other, false otherwise
   */
  isGreaterThanOrEqual(other: Money): boolean {
    return this.centavos >= other.centavos;
  }

  /**
   * Checks if this Money instance equals another.
   * 
   * @param other - Money instance to compare
   * @returns true if values are equal, false otherwise
   */
  equals(other: Money): boolean {
    return this.centavos === other.centavos;
  }

  /**
   * Returns the centavos value as a bigint.
   * 
   * @returns The centavos value
   */
  toCentavos(): bigint {
    return this.centavos;
  }
}
