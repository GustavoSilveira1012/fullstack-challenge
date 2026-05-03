import { BetId } from '../value-objects/bet-id';
import { RoundId } from '../value-objects/round-id';
import { PlayerId } from '../value-objects/player-id';
import { Money } from '../value-objects/money';
import { Multiplier } from '../value-objects/multiplier';

/**
 * BetState Enum
 * Represents the state of a bet
 * Valid transitions: PENDING → ACTIVE → (CASHED_OUT | LOST)
 */
export enum BetState {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  CASHED_OUT = 'CASHED_OUT',
  LOST = 'LOST',
  REJECTED = 'REJECTED',
}

/**
 * InvalidStateTransitionError
 * Thrown when attempting an invalid state transition
 */
export class InvalidStateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateTransitionError';
  }
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Bet Entity
 * Represents a player's wager in a game round with state machine
 * Invariants:
 * - State transitions must follow: PENDING → ACTIVE → (CASHED_OUT | LOST)
 * - Amount must be between 100 and 100000 centavos
 * - CashOutMultiplier and Payout must be set when state is CASHED_OUT
 * - Payout = floor(amount × multiplier) in centavos
 */
export class Bet {
  private readonly id: BetId;
  private readonly roundId: RoundId;
  private readonly playerId: PlayerId;
  private readonly amount: Money;
  private state: BetState;
  private cashOutMultiplier: Multiplier | null;
  private payout: Money | null;
  private readonly createdAt: Date;
  private updatedAt: Date;

  /**
   * Constructor for Bet entity
   * @param id - Unique bet identifier
   * @param roundId - Round this bet belongs to
   * @param playerId - Player who placed the bet
   * @param amount - Bet amount in centavos
   * @param state - Current bet state
   * @param cashOutMultiplier - Multiplier at cash out (null if not cashed out)
   * @param payout - Payout amount (null if not cashed out)
   * @param createdAt - Timestamp when bet was created
   * @param updatedAt - Timestamp when bet was last updated
   */
  constructor(
    id: BetId,
    roundId: RoundId,
    playerId: PlayerId,
    amount: Money,
    state: BetState,
    cashOutMultiplier: Multiplier | null,
    payout: Money | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.roundId = roundId;
    this.playerId = playerId;
    this.amount = amount;
    this.state = state;
    this.cashOutMultiplier = cashOutMultiplier;
    this.payout = payout;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Factory method to create a new Bet
   * Creates a bet in PENDING state
   * @param roundId - Round this bet belongs to
   * @param playerId - Player who is placing the bet
   * @param amount - Bet amount in centavos
   * @returns New Bet instance in PENDING state
   */
  static create(roundId: RoundId, playerId: PlayerId, amount: Money): Bet {
    const id = BetId.create();
    const now = new Date();

    return new Bet(
      id,
      roundId,
      playerId,
      amount,
      BetState.PENDING,
      null,
      null,
      now,
      now,
    );
  }

  /**
   * Transition bet from PENDING to ACTIVE state
   * @returns Result indicating success or InvalidStateTransitionError
   */
  activate(): Result<void, InvalidStateTransitionError> {
    if (this.state !== BetState.PENDING) {
      return {
        ok: false,
        error: new InvalidStateTransitionError(
          `Cannot activate bet in ${this.state} state. Bet must be in PENDING state.`,
        ),
      };
    }

    this.state = BetState.ACTIVE;
    this.updatedAt = new Date();

    return { ok: true, value: undefined };
  }

  /**
   * Transition bet from ACTIVE to CASHED_OUT state
   * Captures the multiplier and calculates payout
   * @param multiplier - Multiplier at cash out
   * @returns Result indicating success or InvalidStateTransitionError
   */
  cashOut(multiplier: Multiplier): Result<void, InvalidStateTransitionError> {
    if (this.state !== BetState.ACTIVE) {
      return {
        ok: false,
        error: new InvalidStateTransitionError(
          `Cannot cash out bet in ${this.state} state. Bet must be in ACTIVE state.`,
        ),
      };
    }

    this.cashOutMultiplier = multiplier;
    this.payout = this.calculatePayout(multiplier);
    this.state = BetState.CASHED_OUT;
    this.updatedAt = new Date();

    return { ok: true, value: undefined };
  }

  /**
   * Transition bet from ACTIVE to LOST state
   * @returns Result indicating success or InvalidStateTransitionError
   */
  markAsLost(): Result<void, InvalidStateTransitionError> {
    if (this.state !== BetState.ACTIVE) {
      return {
        ok: false,
        error: new InvalidStateTransitionError(
          `Cannot mark bet as lost in ${this.state} state. Bet must be in ACTIVE state.`,
        ),
      };
    }

    this.state = BetState.LOST;
    this.updatedAt = new Date();

    return { ok: true, value: undefined };
  }

  /**
   * Transition bet to REJECTED state
   * Can be called from PENDING state when wallet rejects the bet
   * @returns Result indicating success or InvalidStateTransitionError
   */
  markAsRejected(): Result<void, InvalidStateTransitionError> {
    if (this.state !== BetState.PENDING) {
      return {
        ok: false,
        error: new InvalidStateTransitionError(
          `Cannot reject bet in ${this.state} state. Bet must be in PENDING state.`,
        ),
      };
    }

    this.state = BetState.REJECTED;
    this.updatedAt = new Date();

    return { ok: true, value: undefined };
  }

  /**
   * Calculate payout for a given multiplier
   * Formula: payout = floor(amount × multiplier)
   * @param multiplier - Multiplier to calculate payout for
   * @returns Payout amount in centavos
   */
  calculatePayout(multiplier: Multiplier): Money {
    return this.amount.multiplyBy(multiplier.toNumber());
  }

  /**
   * Query method: Check if bet can cash out
   * @returns true if bet is in ACTIVE state
   */
  canCashOut(): boolean {
    return this.state === BetState.ACTIVE;
  }

  /**
   * Query method: Check if bet is active
   * @returns true if bet is in ACTIVE state
   */
  isActive(): boolean {
    return this.state === BetState.ACTIVE;
  }

  /**
   * Query method: Check if bet has cashed out
   * @returns true if bet is in CASHED_OUT state
   */
  hasCashedOut(): boolean {
    return this.state === BetState.CASHED_OUT;
  }

  /**
   * Query method: Check if bet is lost
   * @returns true if bet is in LOST state
   */
  isLost(): boolean {
    return this.state === BetState.LOST;
  }

  /**
   * Getter: Get bet ID
   * @returns BetId instance
   */
  getId(): BetId {
    return this.id;
  }

  /**
   * Getter: Get round ID
   * @returns RoundId instance
   */
  getRoundId(): RoundId {
    return this.roundId;
  }

  /**
   * Getter: Get player ID
   * @returns PlayerId instance
   */
  getPlayerId(): PlayerId {
    return this.playerId;
  }

  /**
   * Getter: Get bet amount
   * @returns Money instance
   */
  getAmount(): Money {
    return this.amount;
  }

  /**
   * Getter: Get current state
   * @returns BetState enum value
   */
  getState(): BetState {
    return this.state;
  }

  /**
   * Getter: Get cash out multiplier
   * @returns Multiplier instance or null if not cashed out
   */
  getCashOutMultiplier(): Multiplier | null {
    return this.cashOutMultiplier;
  }

  /**
   * Getter: Get payout amount
   * @returns Money instance or null if not cashed out
   */
  getPayout(): Money | null {
    return this.payout;
  }

  /**
   * Getter: Get creation timestamp
   * @returns Date instance
   */
  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Getter: Get last update timestamp
   * @returns Date instance
   */
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
