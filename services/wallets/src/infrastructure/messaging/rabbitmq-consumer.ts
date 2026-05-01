/**
 * RabbitMQConsumer Implementation
 * 
 * Consumes events from the Game Service via RabbitMQ and processes them
 * using the appropriate use cases.
 * 
 * Features:
 * - Connection lifecycle management (connect, disconnect)
 * - Subscription to multiple queues (bet.placed, bet.cashout, bet.lost)
 * - Message parsing and validation
 * - Use case invocation based on message type
 * - Message acknowledgment (ACK on success, NACK on transient errors)
 * - Error handling and logging
 * - Graceful shutdown support
 * 
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 13.1
 */

import * as amqp from 'amqplib';
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ProcessBetPlacedUseCase } from '../../application/process-bet-placed.use-case';
import { ProcessCashoutUseCase } from '../../application/process-cashout.use-case';
import { ProcessBetLostUseCase } from '../../application/process-bet-lost.use-case';
import { BetPlacedEventDto, CashoutEventDto, BetLostEventDto } from '../../application/dtos';
import { environmentConfig } from '../config/environment.config';

/**
 * RabbitMQConsumer
 * 
 * Manages RabbitMQ connection and consumes events from Game Service queues.
 * Routes messages to appropriate use cases and handles acknowledgment logic.
 */
@Injectable()
export class RabbitMQConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQConsumer.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private isShuttingDown = false;

  constructor(
    private readonly processBetPlacedUseCase: ProcessBetPlacedUseCase,
    private readonly processCashoutUseCase: ProcessCashoutUseCase,
    private readonly processBetLostUseCase: ProcessBetLostUseCase
  ) {}

  /**
   * Initialize the consumer on module startup.
   * Establishes connection to RabbitMQ and subscribes to queues.
   */
  async onModuleInit(): Promise<void> {
    await this.start();
  }

  /**
   * Cleanup on module shutdown.
   * Closes channel and connection gracefully.
   */
  async onModuleDestroy(): Promise<void> {
    await this.stop();
  }

  /**
   * Starts the RabbitMQ consumer.
   * Establishes connection, creates channel, and subscribes to all queues.
   * 
   * @throws Error if connection or subscription fails
   */
  async start(): Promise<void> {
    try {
      const rabbitmqUrl = environmentConfig.rabbitmqUrl;
      this.logger.log(`Connecting to RabbitMQ at ${rabbitmqUrl}`);

      // Create connection
      this.connection = await amqp.connect(rabbitmqUrl);
      this.logger.log('RabbitMQ connection established');

      // Set up connection error handlers
      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error:', err);
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        if (!this.isShuttingDown) {
          this.logger.error('RabbitMQ connection closed unexpectedly');
        }
      });

      // Create channel
      this.channel = await this.connection.createChannel();
      this.logger.log('RabbitMQ channel created');

      // Set prefetch to 1 (process one message at a time)
      await this.channel.prefetch(1);
      this.logger.log('Channel prefetch set to 1');

      // Set up channel error handlers
      this.channel.on('error', (err) => {
        this.logger.error('RabbitMQ channel error:', err);
      });

      this.channel.on('close', () => {
        this.logger.warn('RabbitMQ channel closed');
      });

      // Assert game.events exchange exists
      const gameExchange = environmentConfig.rabbitmqGameExchange;
      await this.channel.assertExchange(gameExchange, 'topic', {
        durable: true,
        autoDelete: false,
      });
      this.logger.log(`Exchange '${gameExchange}' asserted`);

      // Subscribe to all three queues
      await this.subscribeToQueue(
        environmentConfig.rabbitmqBetPlacedQueue,
        gameExchange,
        'bet.placed',
        this.handleBetPlaced.bind(this)
      );

      await this.subscribeToQueue(
        environmentConfig.rabbitmqCashoutQueue,
        gameExchange,
        'bet.cashout',
        this.handleCashout.bind(this)
      );

      await this.subscribeToQueue(
        environmentConfig.rabbitmqBetLostQueue,
        gameExchange,
        'bet.lost',
        this.handleBetLost.bind(this)
      );

      this.logger.log('RabbitMQ consumer started successfully');
    } catch (error) {
      this.logger.error('Failed to start RabbitMQ consumer:', error);
      throw new Error(`RabbitMQ consumer startup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Subscribes to a specific queue and binds it to an exchange.
   * 
   * @param queueName - Name of the queue to subscribe to
   * @param exchange - Exchange to bind the queue to
   * @param routingKey - Routing key for the binding
   * @param handler - Message handler function
   */
  private async subscribeToQueue(
    queueName: string,
    exchange: string,
    routingKey: string,
    handler: (message: amqp.ConsumeMessage) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not available');
    }

    // Assert queue exists
    await this.channel.assertQueue(queueName, {
      durable: true,
      autoDelete: false,
      exclusive: false,
    });
    this.logger.log(`Queue '${queueName}' asserted`);

    // Bind queue to exchange with routing key
    await this.channel.bindQueue(queueName, exchange, routingKey);
    this.logger.log(`Queue '${queueName}' bound to exchange '${exchange}' with routing key '${routingKey}'`);

    // Start consuming messages
    await this.channel.consume(
      queueName,
      async (message) => {
        if (message) {
          try {
            await handler(message);
          } catch (error) {
            this.logger.error(`Error in message handler for queue '${queueName}':`, error);
            // Handler is responsible for ACK/NACK, so we don't do it here
          }
        }
      },
      { noAck: false } // Manual acknowledgment
    );

    this.logger.log(`Subscribed to queue '${queueName}'`);
  }

  /**
   * Handles Bet_Placed_Event messages.
   * Parses the message, invokes ProcessBetPlacedUseCase, and handles acknowledgment.
   * 
   * @param message - RabbitMQ message
   */
  private async handleBetPlaced(message: amqp.ConsumeMessage): Promise<void> {
    const messageId = message.properties.messageId || 'unknown';
    this.logger.debug(`Processing bet.placed message ${messageId}`);

    try {
      // Parse message content
      const content = message.content.toString();
      const eventData = JSON.parse(content);

      // Validate and create DTO
      const eventDto = new BetPlacedEventDto(
        eventData.eventId,
        eventData.playerId,
        eventData.betId,
        eventData.amount,
        eventData.timestamp
      );

      this.logger.log({
        message: 'Processing bet placed event',
        eventId: eventDto.eventId,
        playerId: eventDto.playerId,
        betId: eventDto.betId,
        amount: eventDto.amount,
      });

      // Invoke use case
      const result = await this.processBetPlacedUseCase.execute(eventDto);

      if (result.ok) {
        // Success - ACK the message
        this.channel?.ack(message);
        this.logger.log(`Bet placed event ${eventDto.eventId} processed successfully`);
      } else {
        // Domain error (insufficient balance or wallet not found) - ACK the message
        // These errors should not be retried as they are business logic errors
        this.channel?.ack(message);
        this.logger.warn({
          message: 'Bet placed event processed with domain error',
          eventId: eventDto.eventId,
          error: result.error.constructor.name,
          errorMessage: result.error.message,
        });
      }
    } catch (error) {
      // Transient error (database timeout, connection issues) - NACK for redelivery
      this.logger.error({
        message: 'Transient error processing bet placed event',
        messageId,
        error: error instanceof Error ? error.message : String(error),
      });

      // NACK with requeue=true for transient errors
      this.channel?.nack(message, false, true);
    }
  }

  /**
   * Handles Cashout_Event messages.
   * Parses the message, invokes ProcessCashoutUseCase, and handles acknowledgment.
   * 
   * @param message - RabbitMQ message
   */
  private async handleCashout(message: amqp.ConsumeMessage): Promise<void> {
    const messageId = message.properties.messageId || 'unknown';
    this.logger.debug(`Processing bet.cashout message ${messageId}`);

    try {
      // Parse message content
      const content = message.content.toString();
      const eventData = JSON.parse(content);

      // Validate and create DTO
      const eventDto = new CashoutEventDto(
        eventData.eventId,
        eventData.playerId,
        eventData.betId,
        eventData.amount,
        eventData.multiplier,
        eventData.timestamp
      );

      this.logger.log({
        message: 'Processing cashout event',
        eventId: eventDto.eventId,
        playerId: eventDto.playerId,
        betId: eventDto.betId,
        amount: eventDto.amount,
        multiplier: eventDto.multiplier,
      });

      // Invoke use case
      const result = await this.processCashoutUseCase.execute(eventDto);

      if (result.ok) {
        // Success - ACK the message
        this.channel?.ack(message);
        this.logger.log(`Cashout event ${eventDto.eventId} processed successfully`);
      } else {
        // Domain error (wallet not found) - ACK the message
        // These errors should not be retried as they are business logic errors
        this.channel?.ack(message);
        this.logger.warn({
          message: 'Cashout event processed with domain error',
          eventId: eventDto.eventId,
          error: result.error.constructor.name,
          errorMessage: result.error.message,
        });
      }
    } catch (error) {
      // Transient error (database timeout, connection issues) - NACK for redelivery
      this.logger.error({
        message: 'Transient error processing cashout event',
        messageId,
        error: error instanceof Error ? error.message : String(error),
      });

      // NACK with requeue=true for transient errors
      this.channel?.nack(message, false, true);
    }
  }

  /**
   * Handles Bet_Lost_Event messages.
   * Parses the message, invokes ProcessBetLostUseCase, and handles acknowledgment.
   * 
   * @param message - RabbitMQ message
   */
  private async handleBetLost(message: amqp.ConsumeMessage): Promise<void> {
    const messageId = message.properties.messageId || 'unknown';
    this.logger.debug(`Processing bet.lost message ${messageId}`);

    try {
      // Parse message content
      const content = message.content.toString();
      const eventData = JSON.parse(content);

      // Validate and create DTO
      const eventDto = new BetLostEventDto(
        eventData.eventId,
        eventData.playerId,
        eventData.betId,
        eventData.amount,
        eventData.timestamp
      );

      this.logger.log({
        message: 'Processing bet lost event',
        eventId: eventDto.eventId,
        playerId: eventDto.playerId,
        betId: eventDto.betId,
        amount: eventDto.amount,
      });

      // Invoke use case
      const result = await this.processBetLostUseCase.execute(eventDto);

      if (result.ok) {
        // Success - ACK the message
        this.channel?.ack(message);
        this.logger.log(`Bet lost event ${eventDto.eventId} processed successfully`);
      } else {
        // Domain error (wallet not found) - ACK the message
        // These errors should not be retried as they are business logic errors
        this.channel?.ack(message);
        this.logger.warn({
          message: 'Bet lost event processed with domain error',
          eventId: eventDto.eventId,
          error: result.error.constructor.name,
          errorMessage: result.error.message,
        });
      }
    } catch (error) {
      // Transient error (database timeout, connection issues) - NACK for redelivery
      this.logger.error({
        message: 'Transient error processing bet lost event',
        messageId,
        error: error instanceof Error ? error.message : String(error),
      });

      // NACK with requeue=true for transient errors
      this.channel?.nack(message, false, true);
    }
  }

  /**
   * Stops the RabbitMQ consumer gracefully.
   * Closes channel and connection.
   */
  async stop(): Promise<void> {
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

      this.logger.log('RabbitMQ consumer stopped successfully');
    } catch (error) {
      this.logger.error('Error during RabbitMQ consumer shutdown:', error);
      // Force cleanup even if close fails
      this.channel = null;
      this.connection = null;
    } finally {
      this.isShuttingDown = false;
    }
  }

  /**
   * Checks if the consumer is connected and ready to consume messages.
   * 
   * @returns true if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }
}
