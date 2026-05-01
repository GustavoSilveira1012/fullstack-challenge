/**
 * Wallet Entity
 * 
 * Aggregate root that encapsulates wallet business logic including credit/debit operations
 * and balance invariants. Ensures balance never goes negative.
 * 
 * Invariants:
 * - Balance must always be >= 0 centavos
 * - PlayerId must be immutable after creation
 * - WalletId must be immutable after creation
 */

import { Money, NegativeMoneyError } from './money';
import { WalletId } from './wallet-id';
import { PlayerId } from './player-id';

export class InsufficientBalanceError extends Error {
  constructor(
    public readonly requestedAmount: Money,
    public readonly currentBalance: Money
  ) {
    super(
      `Insufficient balance: requested ${requestedAmount.toCentavos()} centavos, but current balance is ${currentBalance.toCentavos()} centavos`
    );
    this.name = 'InsufficientBalanceError';
  }
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export class Wallet {
  private readonly id: WalletId;
  private readonly playerId: PlayerId;
  private balance: Money;
  private readonly createdAt: Date;
  private updatedAt: Date;

  /**
   * Creates a new Wallet instance.
   * 
   * @param id - Unique wallet identifier
   * @param playerId - Player who owns this wallet
   * @param balance - Current wallet balance
   * @param createdAt - Timestamp when wallet was created
   * @param updatedAt - Timestamp when wallet was last updated
   */
  constructor(
    id: WalletId,
    playerId: PlayerId,
    balance: Money,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.playerId = playerId;
    this.balance = balance;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Credits (adds) an amount to the wallet balance.
   * 
   * @param amount - Positive Money amount to credit
   */
  credit(amount: Money): void {
    this.balance = this.balance.add(amount);
    this.updatedAt = new Date();
  }

  /**
   * Debits (subtracts) an amount from the wallet balance.
   * Validates that the balance is sufficient before performing the debit.
   * 
   * @param amount - Positive Money amount to debit
   * @returns Result with void on success or InsufficientBalanceError if balance is insufficient
   */
  debit(amount: Money): Result<void, InsufficientBalanceError> {
    // Check if balance is sufficient
    if (!this.balance.isGreaterThanOrEqual(amount)) {
      return {
        ok: false,
        error: new InsufficientBalanceError(amount, this.balance),
      };
    }

    // Perform the debit
    const subtractResult = this.balance.subtract(amount);

    // This should never fail since we checked isGreaterThanOrEqual above
    // But we handle it defensively
    if (!subtractResult.ok) {
      return {
        ok: false,
        error: new InsufficientBalanceError(amount, this.balance),
      };
    }

    this.balance = subtractResult.value;
    this.updatedAt = new Date();

    return {
      ok: true,
      value: undefined,
    };
  }

  /**
   * Returns the wallet ID.
   * 
   * @returns WalletId instance
   */
  getId(): WalletId {
    return this.id;
  }

  /**
   * Returns the player ID.
   * 
   * @returns PlayerId instance
   */
  getPlayerId(): PlayerId {
    return this.playerId;
  }

  /**
   * Returns the current balance.
   * 
   * @returns Money instance representing current balance
   */
  getBalance(): Money {
    return this.balance;
  }

  /**
   * Returns the creation timestamp.
   * 
   * @returns Date when wallet was created
   */
  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Returns the last update timestamp.
   * 
   * @returns Date when wallet was last updated
   */
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
