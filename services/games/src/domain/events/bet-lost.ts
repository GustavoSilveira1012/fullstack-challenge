import { randomUUID } from 'crypto';
import { DomainEvent } from './domain-event';
import { BetId } from '../value-objects/bet-id';
import { RoundId } from '../value-objects/round-id';
import { PlayerId } from '../value-objects/player-id';
import { Money } from '../value-objects/money';

/**
 * Domain event published when a player's bet is lost (round crashes before cash out).
 * Contains the bet ID, round ID, player ID, and original bet amount.
 * This event is typically published to RabbitMQ for wallet service integration.
 */
export class BetLost implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly betId: BetId;
  readonly roundId: RoundId;
  readonly playerId: PlayerId;
  readonly amount: Money;

  constructor(
    betId: BetId,
    roundId: RoundId,
    playerId: PlayerId,
    amount: Money,
    occurredAt: Date = new Date(),
    eventId: string = randomUUID(),
  ) {
    this.eventId = eventId;
    this.occurredAt = occurredAt;
    this.betId = betId;
    this.roundId = roundId;
    this.playerId = playerId;
    this.amount = amount;
  }

  /**
   * Serialize the event to JSON format for storage or transmission.
   * Amount is serialized as centavos (integer).
   */
  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      occurredAt: this.occurredAt.toISOString(),
      betId: this.betId.toString(),
      roundId: this.roundId.toString(),
      playerId: this.playerId.toString(),
      amount: this.amount.toCentavos().toString(),
    };
  }
}
