import { randomUUID } from 'crypto';
import { DomainEvent } from './domain-event';
import { RoundId } from '../value-objects/round-id';
import { CrashPoint } from '../value-objects/crash-point';
import { ServerSeed } from '../value-objects/server-seed';

/**
 * Domain event published when a round crashes (multiplier reaches crash point).
 * Contains the round ID, crash point, server seed (now revealed), and crash timestamp.
 */
export class RoundCrashed implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly roundId: RoundId;
  readonly crashPoint: CrashPoint;
  readonly serverSeed: ServerSeed;
  readonly crashedAt: Date;

  constructor(
    roundId: RoundId,
    crashPoint: CrashPoint,
    serverSeed: ServerSeed,
    crashedAt: Date,
    occurredAt: Date = new Date(),
    eventId: string = randomUUID(),
  ) {
    this.eventId = eventId;
    this.occurredAt = occurredAt;
    this.roundId = roundId;
    this.crashPoint = crashPoint;
    this.serverSeed = serverSeed;
    this.crashedAt = crashedAt;
  }

  /**
   * Serialize the event to JSON format for storage or transmission.
   */
  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      occurredAt: this.occurredAt.toISOString(),
      roundId: this.roundId.toString(),
      crashPoint: this.crashPoint.toString(),
      serverSeed: this.serverSeed.toString(),
      crashedAt: this.crashedAt.toISOString(),
    };
  }
}
