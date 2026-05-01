/**
 * RabbitMQPublisher Implementation
 * 
 * Implements the IEventPublisher interface to publish domain events to RabbitMQ.
 * 
 * Features:
 * - Connection lifecycle management (connect, disconnect, reconnect)
 * - Automatic exchange creation and binding
 * - Event type to exchange/routing key mapping
 * - Error handling with retry logic
 * - Graceful shutdown support
 * 
 * Validates: Requirements 8.1, 8.5, 8.6
 */

import * as amqp from 'amqplib';
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { IEventPublisher } from './event-publisher.interface';
import {
  DomainEvent,
  WalletCreated,
  BalanceCredited,
  BalanceDebited,
  InsufficientBalanceErrorEvent,
} from '../../domain/domain-event';
import { environmentConfig } from '../config/environment.config';

/**
 * Configuration for retry logic
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

/**
 * RabbitMQPublisher
 * 
 * Manages RabbitMQ connection and publishes domain events to appropriate exchanges.
 * Implements automatic reconnection and retry logic for resilient message publishing.
 */
@Injectable()
export class RabbitMQPublisher implements IEventPublisher, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQPublisher.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private isConnecting = false;
  private isShuttingDown = false;
  private readonly retryConfig: RetryConfig;
  private readonly connectionFactory: (url: string) => Promise<amqp.Connection>;

  constructor(
    retryConfig: Partial<RetryConfig> = {},
    connectionFactory?: (url: string) => Promise<amqp.Connection>
  ) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    this.connectionFactory = connectionFactory || amqp.connect;
  }

  /**
   * Initialize the publisher on module startup.
   * Establishes connection to RabbitMQ and creates necessary exchanges.
   */
  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  /**
   * Cleanup on module shutdown.
   * Closes channel and connection gracefully.
   */
  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  /**
   * Establishes connection to RabbitMQ and creates a channel.
   * Creates the wallet.events exchange for publishing domain events.
   * 
   * @throws Error if connection fails after retries
   */
  async connect(): Promise<void> {
    if (this.isConnecting) {
      this.logger.warn('Connection attempt already in progress');
      return;
    }

    if (this.connection && this.channel) {
      this.logger.debug('Already connected to RabbitMQ');
      return;
    }

    this.isConnecting = true;

    try {
      const rabbitmqUrl = environmentConfig.rabbitmqUrl;
      this.logger.log(`Connecting to RabbitMQ at ${rabbitmqUrl}`);

      // Create connection using the factory
      this.connection = await this.connectionFactory(rabbitmqUrl);
      this.logger.log('RabbitMQ connection established');

      // Set up connection error handlers
      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error:', err);
        this.handleConnectionError();
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        if (!this.isShuttingDown) {
          this.handleConnectionError();
        }
      });

      // Create channel
      this.channel = await this.connection.createChannel();
      this.logger.log('RabbitMQ channel created');

      // Set up channel error handlers
      this.channel.on('error', (err) => {
        this.logger.error('RabbitMQ channel error:', err);
      });

      this.channel.on('close', () => {
        this.logger.warn('RabbitMQ channel closed');
      });

      // Create wallet.events exchange (topic exchange for routing by event type)
      const walletExchange = environmentConfig.rabbitmqWalletExchange;
      await this.channel.assertExchange(walletExchange, 'topic', {
        durable: true,
        autoDelete: false,
      });
      this.logger.log(`Exchange '${walletExchange}' asserted`);

      this.isConnecting = false;
    } catch (error) {
      this.isConnecting = false;
      this.logger.error('Failed to connect to RabbitMQ:', error);
      throw new Error(`RabbitMQ connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Closes the RabbitMQ connection gracefully.
   * Closes channel first, then connection.
   */
  async disconnect(): Promise<void> {
    this.isShuttingDown = true;

    try {
      if (this.channel) {
        this.logger.log('Closing RabbitMQ channel');
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        this.logger.log('Closing RabbitMQ connection');
        await this.connection.close();
        this.connection = null;
      }

      this.logger.log('RabbitMQ connection closed successfully');
    } catch (error) {
      this.logger.error('Error during RabbitMQ disconnect:', error);
      // Force cleanup even if close fails
      this.channel = null;
      this.connection = null;
    } finally {
      this.isShuttingDown = false;
    }
  }

  /**
   * Handles connection errors by attempting to reconnect.
   * Uses exponential backoff for reconnection attempts.
   */
  private async handleConnectionError(): Promise<void> {
    if (this.isShuttingDown || this.isConnecting) {
      return;
    }

    this.channel = null;
    this.connection = null;

    this.logger.warn('Attempting to reconnect to RabbitMQ...');

    let attempt = 0;
    while (attempt < this.retryConfig.maxRetries && !this.isShuttingDown) {
      attempt++;
      const delay = Math.min(
        this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
        this.retryConfig.maxDelayMs
      );

      this.logger.log(`Reconnection attempt ${attempt}/${this.retryConfig.maxRetries} in ${delay}ms`);
      await this.sleep(delay);

      try {
        await this.connect();
        this.logger.log('Reconnection successful');
        return;
      } catch (error) {
        this.logger.error(`Reconnection attempt ${attempt} failed:`, error);
      }
    }

    this.logger.error('Failed to reconnect to RabbitMQ after maximum retries');
  }

  /**
   * Publishes a domain event to RabbitMQ.
   * 
   * Determines the appropriate exchange and routing key based on event type,
   * serializes the event to JSON, and publishes to the message broker.
   * 
   * Implements retry logic for transient failures.
   * 
   * @param event - The domain event to publish
   * @throws Error if publishing fails after retries
   */
  async publish(event: DomainEvent): Promise<void> {
    if (!this.channel) {
      this.logger.error('Cannot publish event: RabbitMQ channel not available');
      throw new Error('RabbitMQ channel not available');
    }

    const exchange = this.getExchangeName(event);
    const routingKey = this.getRoutingKey(event);
    const message = JSON.stringify(event);

    this.logger.debug(`Publishing event ${event.eventId} to exchange '${exchange}' with routing key '${routingKey}'`);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const published = this.channel.publish(
          exchange,
          routingKey,
          Buffer.from(message),
          {
            persistent: true, // Survive broker restarts
            contentType: 'application/json',
            timestamp: event.occurredAt.getTime(),
            messageId: event.eventId,
          }
        );

        if (!published) {
          // Channel buffer is full, wait for drain event
          this.logger.warn('Channel buffer full, waiting for drain...');
          await new Promise<void>((resolve) => {
            this.channel!.once('drain', () => resolve());
          });
        }

        this.logger.log(`Event ${event.eventId} published successfully to ${exchange}/${routingKey}`);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.error(`Publish attempt ${attempt}/${this.retryConfig.maxRetries} failed:`, error);

        if (attempt < this.retryConfig.maxRetries) {
          const delay = Math.min(
            this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
            this.retryConfig.maxDelayMs
          );
          this.logger.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    const errorMessage = `Failed to publish event ${event.eventId} after ${this.retryConfig.maxRetries} attempts`;
    this.logger.error(errorMessage, lastError);
    throw new Error(`${errorMessage}: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Maps domain event types to RabbitMQ exchange names.
   * 
   * All wallet service events are published to the wallet.events exchange.
   * 
   * @param event - The domain event
   * @returns The exchange name for the event
   */
  private getExchangeName(event: DomainEvent): string {
    // All wallet events go to the wallet.events exchange
    return environmentConfig.rabbitmqWalletExchange;
  }

  /**
   * Maps domain event types to RabbitMQ routing keys.
   * 
   * Routing keys follow the pattern: wallet.<event_type>
   * This allows consumers to subscribe to specific event types using topic patterns.
   * 
   * @param event - The domain event
   * @returns The routing key for the event
   */
  private getRoutingKey(event: DomainEvent): string {
    if (event instanceof WalletCreated) {
      return 'wallet.created';
    }

    if (event instanceof BalanceCredited) {
      return 'wallet.balance_credited';
    }

    if (event instanceof BalanceDebited) {
      return 'wallet.balance_debited';
    }

    if (event instanceof InsufficientBalanceErrorEvent) {
      return 'wallet.insufficient_balance';
    }

    // Fallback for unknown event types
    this.logger.warn(`Unknown event type: ${event.constructor.name}, using default routing key`);
    return 'wallet.unknown';
  }

  /**
   * Utility method to sleep for a specified duration.
   * 
   * @param ms - Duration in milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Checks if the publisher is connected and ready to publish events.
   * 
   * @returns true if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }
}
