/**
 * Money Value Object
 * Represents monetary amounts in centavos (1/100 of base currency)
 * Ensures exact precision using bigint arithmetic
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
   * Create Money from centavos amount
   * @param centavos - Amount in centavos (must be non-negative)
   * @returns Result with Money instance or InvalidMoneyError
   */
  static fromCentavos(centavos: bigint): Result<Money, InvalidMoneyError> {
    if (centavos < 0n) {
      return {
        ok: false,
        error: new InvalidMoneyError('Money amount cannot be negative'),
      };
    }
    return { ok: true, value: new Money(centavos) };
  }

  /**
   * Create Money with zero value
   * @returns Money instance with 0 centavos
   */
  static zero(): Money {
    return new Money(0n);
  }

  /**
   * Add another Money instance to this one
   * @param other - Money instance to add
   * @returns New Money instance with sum
   */
  add(other: Money): Money {
    return new Money(this.centavos + other.centavos);
  }

  /**
   * Subtract another Money instance from this one
   * @param other - Money instance to subtract
   * @returns Result with new Money instance or NegativeMoneyError
   */
  subtract(other: Money): Result<Money, NegativeMoneyError> {
    const result = this.centavos - other.centavos;
    if (result < 0n) {
      return {
        ok: false,
        error: new NegativeMoneyError(
          'Cannot subtract more money than available'
        ),
      };
    }
    return { ok: true, value: new Money(result) };
  }

  /**
   * Multiply Money by a Multiplier
   * Result is rounded down to nearest centavo
   * @param multiplier - Multiplier value
   * @returns New Money instance with product
   */
  multiplyBy(multiplier: number): Money {
    // Multiply centavos by multiplier and round down
    // Formula: floor(centavos * multiplier)
    const result = BigInt(Math.floor(Number(this.centavos) * multiplier));
    return new Money(result);
  }

  /**
   * Check if this Money is greater than or equal to another
   * @param other - Money instance to compare
   * @returns true if this >= other
   */
  isGreaterThanOrEqual(other: Money): boolean {
    return this.centavos >= other.centavos;
  }

  /**
   * Check equality with another Money instance
   * @param other - Money instance to compare
   * @returns true if amounts are equal
   */
  equals(other: Money): boolean {
    return this.centavos === other.centavos;
  }

  /**
   * Get the centavos value
   * @returns bigint centavos amount
   */
  toCentavos(): bigint {
    return this.centavos;
  }

  /**
   * Get the decimal representation
   * @returns string in format "XXX.XX" (e.g., "100.50")
   */
  toDecimal(): string {
    const absValue = this.centavos < 0n ? -this.centavos : this.centavos;
    const dollars = absValue / 100n;
    const cents = absValue % 100n;
    const sign = this.centavos < 0n ? '-' : '';
    return `${sign}${dollars}.${cents.toString().padStart(2, '0')}`;
  }
}
