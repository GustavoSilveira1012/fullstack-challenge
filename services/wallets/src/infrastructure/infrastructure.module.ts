/**
 * Infrastructure Module
 * 
 * NestJS module representing the infrastructure layer of the Wallet Service.
 * Provides implementations for database persistence, message broker integration,
 * and other infrastructure concerns.
 * 
 * This module:
 * - Registers PrismaService for database connectivity
 * - Provides PrismaWalletRepository as the IWalletRepository implementation
 * - Provides RabbitMQPublisher as the IEventPublisher implementation
 * - Registers RabbitMQConsumer for consuming events from Game Service
 * - Exports infrastructure services for use in other modules
 * 
 * Requirements: 14.4
 */

import { Module } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';
import { PrismaWalletRepository } from './database/prisma-wallet.repository';
import { RabbitMQPublisher } from './messaging/rabbitmq-publisher';
import { RabbitMQConsumer } from './messaging/rabbitmq-consumer';
import { IWalletRepository } from '../domain/wallet-repository';
import { IEventPublisher } from './messaging/event-publisher.interface';

/**
 * Provider token for IWalletRepository
 * Used for dependency injection of the wallet repository implementation
 */
export const WALLET_REPOSITORY = 'IWalletRepository';

/**
 * Provider token for IEventPublisher
 * Used for dependency injection of the event publisher implementation
 */
export const EVENT_PUBLISHER = 'IEventPublisher';

@Module({
  providers: [
    // Database services
    PrismaService,
    
    // Repository implementation
    {
      provide: WALLET_REPOSITORY,
      useClass: PrismaWalletRepository,
    },
    
    // Message broker publisher
    {
      provide: EVENT_PUBLISHER,
      useClass: RabbitMQPublisher,
    },
    
    // Message broker consumer
    RabbitMQConsumer,
  ],
  exports: [
    // Export PrismaService for direct use in health checks
    PrismaService,
    
    // Export repository for use in application layer
    WALLET_REPOSITORY,
    
    // Export event publisher for use in application layer
    EVENT_PUBLISHER,
    
    // Export consumer for health checks and lifecycle management
    RabbitMQConsumer,
  ],
})
export class InfrastructureModule {}
