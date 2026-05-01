/**
 * IEventPublisher Interface
 * 
 * Interface that defines the contract for publishing domain events to external systems.
 * This interface will be implemented by RabbitMQPublisher to send events to the message broker.
 * 
 * The publisher is responsible for:
 * - Publishing domain events to the appropriate message broker exchange
 * - Handling serialization of events to message format
 * - Managing routing keys based on event types
 * - Handling connection errors and retries
 * 
 * Validates: Requirements 8.1
 */

import { DomainEvent } from '../../domain/domain-event';

export type IEventPublisher = {
  /**
   * Publishes a domain event to the message broker.
   * 
   * The implementation should:
   * - Serialize the event to JSON format
   * - Determine the appropriate exchange and routing key based on event type
   * - Send the message to the message broker
   * - Handle errors and implement retry logic if needed
   * 
   * @param event - The domain event to publish
   * @returns Promise that resolves when the event is successfully published
   * @throws Error if the event cannot be published after retries
   */
  publish(event: DomainEvent): Promise<void>;
};
