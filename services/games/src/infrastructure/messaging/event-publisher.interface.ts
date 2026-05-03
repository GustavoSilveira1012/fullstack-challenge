import { DomainEvent } from '../../domain/events/domain-event';

/**
 * Event Publisher Interface
 * Defines the contract for publishing domain events to external systems
 */
export interface IEventPublisher {
  /**
   * Publish a domain event
   * @param event - Domain event to publish
   * @throws Error if publishing fails
   */
  publish(event: DomainEvent): Promise<void>;
}
