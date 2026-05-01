/**
 * Domain Event Interface
 * 
 * Base interface for all domain events in the wallet service.
 * Domain events represent significant business occurrences that other services may need to know about.
 * 
 * Invariants:
 * - eventId must be a unique identifier (UUID v4)
 * - occurredAt must be a valid timestamp
 * - All domain events are immutable after creation
 */

import { randomUUID } from 'crypto';
import { WalletId } from './wallet-id';
import { PlayerId } from './player-id';
import { Money } from './money';

/**
 * Base interface for all domain events.
 * All domain events must have a unique event ID and timestamp.
 */
export interface DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
}

/**
 * WalletCreated Event
 * 
 * Published when a new wallet is created for a player.
 * This event signals that a player now has a wallet and can participate in games.
 */
export class WalletCreated implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly walletId: WalletId;
  readonly playerId: PlayerId;

  constructor(walletId: WalletId, playerId: PlayerId) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
    this.walletId = walletId;
    this.playerId = playerId;
  }

  /**
   * Serializes the event to a JSON-compatible object.
   * 
   * @returns Plain object representation of the event
   */
  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      occurredAt: this.occurredAt.toISOString(),
      walletId: this.walletId.toString(),
      playerId: this.playerId.toString(),
    };
  }
}

/**
 * BalanceCredited Event
 * 
 * Published when a wallet balance is increased (e.g., after a cashout).
 * Contains the credited amount and the new balance after the operation.
 */
export class BalanceCredited implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly walletId: WalletId;
  readonly amount: Money;
  readonly newBalance: Money;

  constructor(walletId: WalletId, amount: Money, newBalance: Money) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
    this.walletId = walletId;
    this.amount = amount;
    this.newBalance = newBalance;
  }

  /**
   * Serializes the event to a JSON-compatible object.
   * 
   * @returns Plain object representation of the event
   */
  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      occurredAt: this.occurredAt.toISOString(),
      walletId: this.walletId.toString(),
      amount: this.amount.toCentavos().toString(),
      newBalance: this.newBalance.toCentavos().toString(),
    };
  }
}

/**
 * BalanceDebited Event
 * 
 * Published when a wallet balance is decreased (e.g., after placing a bet).
 * Contains the debited amount and the new balance after the operation.
 */
export class BalanceDebited implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly walletId: WalletId;
  readonly amount: Money;
  readonly newBalance: Money;

  constructor(walletId: WalletId, amount: Money, newBalance: Money) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
    this.walletId = walletId;
    this.amount = amount;
    this.newBalance = newBalance;
  }

  /**
   * Serializes the event to a JSON-compatible object.
   * 
   * @returns Plain object representation of the event
   */
  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      occurredAt: this.occurredAt.toISOString(),
      walletId: this.walletId.toString(),
      amount: this.amount.toCentavos().toString(),
      newBalance: this.newBalance.toCentavos().toString(),
    };
  }
}

/**
 * InsufficientBalanceError Event
 * 
 * Published when a debit operation fails due to insufficient balance.
 * This event allows the Game Service to handle bet rejections appropriately.
 */
export class InsufficientBalanceErrorEvent implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly walletId: WalletId;
  readonly playerId: PlayerId;
  readonly requestedAmount: Money;
  readonly currentBalance: Money;

  constructor(
    walletId: WalletId,
    playerId: PlayerId,
    requestedAmount: Money,
    currentBalance: Money
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
    this.walletId = walletId;
    this.playerId = playerId;
    this.requestedAmount = requestedAmount;
    this.currentBalance = currentBalance;
  }

  /**
   * Serializes the event to a JSON-compatible object.
   * 
   * @returns Plain object representation of the event
   */
  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      occurredAt: this.occurredAt.toISOString(),
      walletId: this.walletId.toString(),
      playerId: this.playerId.toString(),
      requestedAmount: this.requestedAmount.toCentavos().toString(),
      currentBalance: this.currentBalance.toCentavos().toString(),
    };
  }
}
