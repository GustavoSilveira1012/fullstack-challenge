import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { IEventPublisher } from './event-publisher.interface';
import { DomainEvent } from '../../domain/events/domain-event';
import { RoundCreated } from '../../domain/events/round-created';
import { RoundStarted } from '../../domain/events/round-started';
import { RoundCrashed } from '../../domain/events/round-crashed';
import { BetPlaced } from '../../domain/events/bet-placed';
import { BetCashedOut } from '../../domain/events/bet-cashed-out';
import { BetLost } from '../../domain/events/bet-lost';
import { EnvironmentConfig } from '../config/environment.config';

/**
 * RabbitMQ Publisher Implementation
 * Publishes domain events to RabbitMQ message broker
 */
@Injectable()
export class RabbitMQPublisher implements IEventPublisher, OnModuleInit, OnModuleDestroy {
  private connection: any = null;
  private channel: any = null;
  private readonly logger = new Logger(RabbitMQPublisher.name);

  constructor(private readonly config: EnvironmentConfig) {}

  /**
   * Initialize RabbitMQ connection on module init
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.connect();
      this.logger.log('RabbitMQ Publisher connected');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  /**
   * Close RabbitMQ connection on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('RabbitMQ Publisher disconnected');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', error);
    }
  }

  /**
   * Publish a domain event to RabbitMQ
   * @param event - Domain event to publish
   * @throws Error if publishing fails
   */
  async publish(event: DomainEvent): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    const exchangeName = this.getExchangeName(event);
    const routingKey = this.getRoutingKey(event);
    const messageDto = this.toMessageDto(event);

    try {
      // Ensure exchange exists
      await this.channel.assertExchange(exchangeName, 'topic', {
        durable: true,
      });

      // Publish message
      const published = this.channel.publish(
        exchangeName,
        routingKey,
        Buffer.from(JSON.stringify(messageDto)),
        {
          persistent: true,
          contentType: 'application/json',
          timestamp: Date.now(),
        },
      );

      if (!published) {
        this.logger.warn(
          `Message buffer full for event ${event.constructor.name}`,
        );
      }

      this.logger.debug(
        `Published event ${event.constructor.name} to ${exchangeName}/${routingKey}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish event ${event.constructor.name}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Connect to RabbitMQ
   * @private
   */
  private async connect(): Promise<void> {
    const url = this.config.getRabbitMQUrl();
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();

    // Set up error handlers
    this.connection.on('error', (error: any) => {
      this.logger.error('RabbitMQ connection error', error);
    });

    this.channel.on('error', (error: any) => {
      this.logger.error('RabbitMQ channel error', error);
    });
  }

  /**
   * Get exchange name for event type
   * @param event - Domain event
   * @returns Exchange name
   * @private
   */
  private getExchangeName(event: DomainEvent): string {
    if (
      event instanceof BetPlaced ||
      event instanceof BetCashedOut ||
      event instanceof BetLost
    ) {
      return 'games.events';
    }

    if (
      event instanceof RoundCreated ||
      event instanceof RoundStarted ||
      event instanceof RoundCrashed
    ) {
      return 'games.events';
    }

    return 'games.events';
  }

  /**
   * Get routing key for event type
   * @param event - Domain event
   * @returns Routing key
   * @private
   */
  private getRoutingKey(event: DomainEvent): string {
    if (event instanceof BetPlaced) {
      return 'bet.placed';
    }

    if (event instanceof BetCashedOut) {
      return 'bet.cashed_out';
    }

    if (event instanceof BetLost) {
      return 'bet.lost';
    }

    if (event instanceof RoundCreated) {
      return 'round.created';
    }

    if (event instanceof RoundStarted) {
      return 'round.started';
    }

    if (event instanceof RoundCrashed) {
      return 'round.crashed';
    }

    return 'unknown';
  }

  /**
   * Convert domain event to message DTO
   * @param event - Domain event
   * @returns Message DTO
   * @private
   */
  private toMessageDto(event: DomainEvent): any {
    const baseDto = {
      eventId: event.eventId,
      occurredAt: event.occurredAt.toISOString(),
      eventType: event.constructor.name,
    };

    if (event instanceof BetPlaced) {
      return {
        ...baseDto,
        betId: event.betId.toString(),
        roundId: event.roundId.toString(),
        playerId: event.playerId.toString(),
        amount: event.amount.toCentavos().toString(),
      };
    }

    if (event instanceof BetCashedOut) {
      return {
        ...baseDto,
        betId: event.betId.toString(),
        roundId: event.roundId.toString(),
        playerId: event.playerId.toString(),
        amount: event.amount.toCentavos().toString(),
        multiplier: event.multiplier.toNumber(),
        payout: event.payout.toCentavos().toString(),
      };
    }

    if (event instanceof BetLost) {
      return {
        ...baseDto,
        betId: event.betId.toString(),
        roundId: event.roundId.toString(),
        playerId: event.playerId.toString(),
        amount: event.amount.toCentavos().toString(),
      };
    }

    if (event instanceof RoundCreated) {
      return {
        ...baseDto,
        roundId: event.roundId.toString(),
        serverSeedHash: event.serverSeedHash.toString(),
      };
    }

    if (event instanceof RoundStarted) {
      return {
        ...baseDto,
        roundId: event.roundId.toString(),
        startedAt: event.startedAt.toISOString(),
      };
    }

    if (event instanceof RoundCrashed) {
      return {
        ...baseDto,
        roundId: event.roundId.toString(),
        crashPoint: event.crashPoint.toNumber(),
        serverSeed: event.serverSeed.toString(),
        crashedAt: event.crashedAt.toISOString(),
      };
    }

    return baseDto;
  }
}
