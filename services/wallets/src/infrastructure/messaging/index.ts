/**
 * Messaging Infrastructure Module
 * 
 * Exports messaging-related interfaces and implementations for event publishing and consuming.
 */

export { IEventPublisher } from './event-publisher.interface';
export { RabbitMQPublisher } from './rabbitmq-publisher';
export { RabbitMQConsumer } from './rabbitmq-consumer';
