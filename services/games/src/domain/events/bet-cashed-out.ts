import { randomUUID } from 'crypto';
import { DomainEvent } from './domain-event';
import { BetId } from '../value-objects/bet-id';
import { RoundId } from '../value-objects/round-id';
import { PlayerId } from '../value-objects/player-id';
import { Money } from '../value-objects/money';
import { Multiplier } from '../value-objects/multiplier';

/**
 * Domain event published when a player cashes out their bet.
 * Contains the bet ID, round ID, player ID, original bet amount, cash out multiplier, and payout.
 * This event is typically published to RabbitMQ for wallet service integration.
 */
export class BetCashedOut implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly betId: BetId;
  readonly roundId: RoundId;
  readonly playerId: PlayerId;
  readonly amount: Money;
  readonly multiplier: Multiplier;
  readonly payout: Money;

  constructor(
    betId: BetId,
    roundId: RoundId,
    playerId: PlayerId,
    amount: Money,
    multiplier: Multiplier,
    payout: Money,
    occurredAt: Date = new Date(),
    eventId: string = randomUUID(),
  ) {
    this.eventId = eventId;
    this.occurredAt = occurredAt;
    this.betId = betId;
    this.roundId = roundId;
    this.playerId = playerId;
    this.amount = amount;
    this.multiplier = multiplier;
    this.payout = payout;
  }

  /**
   * Serialize the event to JSON format for storage or transmission.
   * Amount and payout are serialized as centavos (integers).
   * Multiplier is serialized as a decimal string (e.g., "2.50").
   */
  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      occurredAt: this.occurredAt.toISOString(),
      betId: this.betId.toString(),
      roundId: this.roundId.toString(),
      playerId: this.playerId.toString(),
      amount: this.amount.toCentavos().toString(),
      multiplier: this.multiplier.toString(),
      payout: this.payout.toCentavos().toString(),
    };
  }
}
