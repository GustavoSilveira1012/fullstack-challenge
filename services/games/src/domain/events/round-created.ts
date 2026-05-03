import { randomUUID } from 'crypto';
import { DomainEvent } from './domain-event';
import { RoundId } from '../value-objects/round-id';
import { ServerSeedHash } from '../value-objects/server-seed-hash';
import { CrashPoint } from '../value-objects/crash-point';

/**
 * Domain event published when a new round is created.
 * Contains the round ID, server seed hash (revealed to clients), and crash point (internal only).
 */
export class RoundCreated implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly roundId: RoundId;
  readonly serverSeedHash: ServerSeedHash;
  readonly crashPoint: CrashPoint;

  constructor(
    roundId: RoundId,
    serverSeedHash: ServerSeedHash,
    crashPoint: CrashPoint,
    occurredAt: Date = new Date(),
    eventId: string = randomUUID(),
  ) {
    this.eventId = eventId;
    this.occurredAt = occurredAt;
    this.roundId = roundId;
    this.serverSeedHash = serverSeedHash;
    this.crashPoint = crashPoint;
  }

  /**
   * Serialize the event to JSON format for storage or transmission.
   * Note: RoundId, ServerSeedHash, and CrashPoint are serialized as strings.
   */
  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      occurredAt: this.occurredAt.toISOString(),
      roundId: this.roundId.toString(),
      serverSeedHash: this.serverSeedHash.toString(),
      crashPoint: this.crashPoint.toString(),
    };
  }
}
