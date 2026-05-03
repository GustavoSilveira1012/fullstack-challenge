/**
 * Base interface for all domain events.
 * All domain events must have a unique event ID and timestamp of when they occurred.
 */
export interface DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
}

export default DomainEvent;
