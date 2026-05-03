import { randomUUID } from 'crypto';
import { DomainEvent } from './domain-event';
import { RoundId } from '../value-objects/round-id';

/**
 * Domain event published when a round transitions from BETTING to RUNNING state.
 * Contains the round ID and the timestamp when the round started.
 */
export class RoundStarted implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly roundId: RoundId;
  readonly startedAt: Date;

  constructor(
    roundId: RoundId,
    startedAt: Date,
    occurredAt: Date = new Date(),
    eventId: string = randomUUID(),
  ) {
    this.eventId = eventId;
    this.occurredAt = occurredAt;
    this.roundId = roundId;
    this.startedAt = startedAt;
  }

  /**
   * Serialize the event to JSON format for storage or transmission.
   */
  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      occurredAt: this.occurredAt.toISOString(),
      roundId: this.roundId.toString(),
      startedAt: this.startedAt.toISOString(),
    };
  }
}
