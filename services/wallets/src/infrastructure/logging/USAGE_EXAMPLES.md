# Logging Usage Examples

This document provides practical examples of how to use the structured logging infrastructure in the Wallet Service.

## Basic Usage in Use Cases

### Example: Adding Logging to CreateWalletUseCase

```typescript
import { Injectable } from '@nestjs/common';
import { StructuredLogger } from '../infrastructure/logging';
import type { IWalletRepository } from '../domain/wallet-repository';
import type { IEventPublisher } from '../infrastructure/messaging/event-publisher.interface';
import { PlayerId } from '../domain/player-id';
import { WalletId } from '../domain/wallet-id';
import { Money } from '../domain/money';
import { Wallet } from '../domain/wallet';
import { WalletCreated } from '../domain/domain-event';
import { WalletResponseDto } from './dtos';
import { WalletAlreadyExistsError } from './errors';

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

@Injectable()
export class CreateWalletUseCase {
  private readonly logger: StructuredLogger;

  constructor(
    private readonly walletRepository: IWalletRepository,
    private readonly eventPublisher: IEventPublisher
  ) {
    // Create logger with context
    this.logger = new StructuredLogger({ component: 'CreateWalletUseCase' });
  }

  async execute(
    playerId: PlayerId
  ): Promise<Result<WalletResponseDto, WalletAlreadyExistsError>> {
    this.logger.info('Creating wallet', { playerId: playerId.toString() });

    // Check if wallet already exists
    const exists = await this.walletRepository.existsByPlayerId(playerId);
    if (exists) {
      this.logger.warn('Wallet already exists', { playerId: playerId.toString() });
      return {
        ok: false,
        error: new WalletAlreadyExistsError(playerId.toString()),
      };
    }

    // Create new wallet with zero balance
    const walletId = WalletId.create();
    const balance = Money.zero();
    const now = new Date();
    const wallet = new Wallet(walletId, playerId, balance, now, now);

    // Save wallet to repository
    await this.walletRepository.save(wallet);

    this.logger.info('Wallet created successfully', {
      walletId: walletId.toString(),
      playerId: playerId.toString(),
      balance: balance.toCentavos().toString(),
    });

    // Publish WalletCreated event
    const event = new WalletCreated(walletId, playerId);
    await this.eventPublisher.publish(event);

    // Return WalletResponseDto
    return {
      ok: true,
      value: new WalletResponseDto(
        wallet.getId().toString(),
        wallet.getPlayerId().toString(),
        wallet.getBalance().toCentavos().toString(),
        wallet.getCreatedAt().toISOString(),
        wallet.getUpdatedAt().toISOString()
      ),
    };
  }
}
```

## Usage in Controllers

### Example: Adding Logging to WalletsController

```typescript
import { Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import { StructuredLogger } from '../../infrastructure/logging';
import { JwtAuthGuard } from '../guards';
import { CreateWalletUseCase } from '../../application/create-wallet.use-case';
import { GetWalletUseCase } from '../../application/get-wallet.use-case';
import { PlayerId } from '../../domain/player-id';
import { WalletResponseDto } from '../../application/dtos';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  private readonly logger: StructuredLogger;

  constructor(
    private readonly createWalletUseCase: CreateWalletUseCase,
    private readonly getWalletUseCase: GetWalletUseCase
  ) {
    this.logger = new StructuredLogger({ component: 'WalletsController' });
  }

  @Post()
  async createWallet(@Request() req: any): Promise<WalletResponseDto> {
    const playerId = PlayerId.fromString(req.user.sub);
    const requestId = req.requestId;

    // Create child logger with request ID
    const logger = this.logger.child({ requestId });

    logger.info('Create wallet request received', {
      playerId: playerId.toString(),
    });

    const result = await this.createWalletUseCase.execute(playerId);

    if (!result.ok) {
      logger.warn('Create wallet failed', {
        playerId: playerId.toString(),
        error: result.error.message,
      });
      throw result.error;
    }

    logger.info('Create wallet completed', {
      walletId: result.value.id,
      playerId: result.value.playerId,
    });

    return result.value;
  }

  @Get('me')
  async getMyWallet(@Request() req: any): Promise<WalletResponseDto> {
    const playerId = PlayerId.fromString(req.user.sub);
    const requestId = req.requestId;

    const logger = this.logger.child({ requestId });

    logger.info('Get wallet request received', {
      playerId: playerId.toString(),
    });

    const result = await this.getWalletUseCase.execute(playerId);

    if (!result.ok) {
      logger.warn('Get wallet failed', {
        playerId: playerId.toString(),
        error: result.error.message,
      });
      throw result.error;
    }

    logger.info('Get wallet completed', {
      walletId: result.value.id,
      playerId: result.value.playerId,
    });

    return result.value;
  }
}
```

## Usage in Infrastructure Components

### Example: Adding Logging to RabbitMQConsumer

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { StructuredLogger } from '../logging';
import { environmentConfig } from '../config/environment.config';
import { ProcessBetPlacedUseCase } from '../../application/process-bet-placed.use-case';
import { ProcessCashoutUseCase } from '../../application/process-cashout.use-case';
import { ProcessBetLostUseCase } from '../../application/process-bet-lost.use-case';

@Injectable()
export class RabbitMQConsumer implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly logger: StructuredLogger;

  constructor(
    private readonly processBetPlacedUseCase: ProcessBetPlacedUseCase,
    private readonly processCashoutUseCase: ProcessCashoutUseCase,
    private readonly processBetLostUseCase: ProcessBetLostUseCase
  ) {
    this.logger = new StructuredLogger({ component: 'RabbitMQConsumer' });
  }

  async onModuleInit(): Promise<void> {
    try {
      this.logger.info('Connecting to RabbitMQ', {
        url: environmentConfig.rabbitmqUrl,
      });

      this.connection = await amqp.connect(environmentConfig.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      this.logger.info('Connected to RabbitMQ successfully');

      await this.setupQueues();
      await this.startConsuming();
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', {
        error: error instanceof Error ? error.message : 'Unknown error',
      }, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  private async handleBetPlaced(message: amqp.ConsumeMessage): Promise<void> {
    const messageId = message.properties.messageId;
    const logger = this.logger.child({ messageId });

    try {
      const content = JSON.parse(message.content.toString());
      
      logger.info('Processing Bet_Placed_Event', {
        playerId: content.playerId,
        betId: content.betId,
        amount: content.amount,
      });

      // Process the bet placed event
      // ... use case execution ...

      logger.info('Bet_Placed_Event processed successfully', {
        playerId: content.playerId,
        betId: content.betId,
      });

      this.channel?.ack(message);
    } catch (error) {
      logger.error('Failed to process Bet_Placed_Event', {
        error: error instanceof Error ? error.message : 'Unknown error',
      }, error instanceof Error ? error.stack : undefined);

      this.channel?.nack(message, false, true);
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.info('Closing RabbitMQ connection');

    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }

    this.logger.info('RabbitMQ connection closed');
  }
}
```

## Error Logging Best Practices

### Example: Logging Errors with Stack Traces

```typescript
try {
  await this.walletRepository.save(wallet);
} catch (error) {
  this.logger.error('Failed to save wallet', {
    walletId: wallet.getId().toString(),
    playerId: wallet.getPlayerId().toString(),
    error: error instanceof Error ? error.message : 'Unknown error',
  }, error instanceof Error ? error.stack : undefined);
  
  throw error;
}
```

### Example: Logging Business Rule Violations

```typescript
const result = wallet.debit(amount);

if (!result.ok) {
  this.logger.warn('Insufficient balance for debit', {
    walletId: wallet.getId().toString(),
    playerId: wallet.getPlayerId().toString(),
    requestedAmount: amount.toCentavos().toString(),
    currentBalance: wallet.getBalance().toCentavos().toString(),
  });
  
  // Publish insufficient balance error event
  await this.eventPublisher.publish(new InsufficientBalanceError(
    wallet.getId(),
    wallet.getPlayerId(),
    amount,
    wallet.getBalance()
  ));
}
```

## Log Output Examples

### Successful Wallet Creation

```json
{
  "timestamp": "2024-01-15T10:30:00.123Z",
  "level": "info",
  "service": "wallet-service",
  "message": "Wallet created successfully",
  "context": {
    "component": "CreateWalletUseCase",
    "walletId": "550e8400-e29b-41d4-a716-446655440000",
    "playerId": "player-123",
    "balance": "0"
  }
}
```

### Request with Request ID

```json
{
  "timestamp": "2024-01-15T10:30:00.456Z",
  "level": "info",
  "service": "wallet-service",
  "message": "Create wallet request received",
  "context": {
    "component": "WalletsController",
    "requestId": "req-789",
    "playerId": "player-123"
  }
}
```

### Error with Stack Trace

```json
{
  "timestamp": "2024-01-15T10:30:00.789Z",
  "level": "error",
  "service": "wallet-service",
  "message": "Failed to save wallet",
  "context": {
    "component": "CreateWalletUseCase",
    "walletId": "550e8400-e29b-41d4-a716-446655440000",
    "playerId": "player-123",
    "error": "Connection timeout"
  },
  "trace": "Error: Connection timeout\n    at PrismaWalletRepository.save (prisma-wallet.repository.ts:45:11)\n    at CreateWalletUseCase.execute (create-wallet.use-case.ts:67:5)"
}
```

### Sensitive Data Redaction

```json
{
  "timestamp": "2024-01-15T10:30:01.000Z",
  "level": "info",
  "service": "wallet-service",
  "message": "User authenticated",
  "context": {
    "component": "JwtAuthGuard",
    "playerId": "player-123",
    "token": "[REDACTED]"
  }
}
```
