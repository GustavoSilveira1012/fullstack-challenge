/**
 * Unit Tests for RabbitMQPublisher
 * 
 * Tests the RabbitMQ publisher implementation including:
 * - Connection lifecycle management
 * - Event publishing with correct exchange and routing key mapping
 * - Error handling and retry logic
 * - Graceful shutdown
 */

import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import * as amqp from 'amqplib';
import { RabbitMQPublisher } from '../../../src/infrastructure/messaging/rabbitmq-publisher';
import {
  WalletCreated,
  BalanceCredited,
  BalanceDebited,
  InsufficientBalanceErrorEvent,
} from '../../../src/domain/domain-event';
import { WalletId } from '../../../src/domain/wallet-id';
import { PlayerId } from '../../../src/domain/player-id';
import { Money } from '../../../src/domain/money';

/**
 * Helper function to unwrap Result types
 */
function unwrap<T, E>(result: { ok: true; value: T } | { ok: false; error: E }): T {
  if (!result.ok) {
    throw result.error;
  }
  return result.value;
}

/**
 * Mock RabbitMQ connection and channel
 */
class MockChannel {
  private eventHandlers: Map<string, Function[]> = new Map();
  public publishCalls: Array<{
    exchange: string;
    routingKey: string;
    content: Buffer;
    options: any;
  }> = [];
  public assertExchangeCalls: Array<{
    exchange: string;
    type: string;
    options: any;
  }> = [];
  public shouldFailPublish = false;
  public shouldBufferFull = false;

  async assertExchange(exchange: string, type: string, options: any): Promise<void> {
    this.assertExchangeCalls.push({ exchange, type, options });
  }

  publish(exchange: string, routingKey: string, content: Buffer, options: any): boolean {
    if (this.shouldFailPublish) {
      throw new Error('Publish failed');
    }

    this.publishCalls.push({ exchange, routingKey, content, options });

    if (this.shouldBufferFull) {
      // Simulate buffer full on first call, then drain
      this.shouldBufferFull = false;
      setTimeout(() => {
        this.emit('drain');
      }, 10);
      return false;
    }

    return true;
  }

  async close(): Promise<void> {
    // Mock close
  }

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  once(event: string, handler: Function): void {
    const wrappedHandler = (...args: any[]) => {
      handler(...args);
      this.off(event, wrappedHandler);
    };
    this.on(event, wrappedHandler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(...args));
    }
  }
}

class MockConnection {
  private eventHandlers: Map<string, Function[]> = new Map();
  public mockChannel: MockChannel;

  constructor() {
    this.mockChannel = new MockChannel();
  }

  async createChannel(): Promise<MockChannel> {
    return this.mockChannel;
  }

  async close(): Promise<void> {
    // Mock close
  }

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(...args));
    }
  }
}

describe('RabbitMQPublisher', () => {
  let publisher: RabbitMQPublisher;
  let mockConnection: MockConnection;

  beforeEach(() => {
    // Create mock connection
    mockConnection = new MockConnection();

    // Create publisher with mock connection factory
    publisher = new RabbitMQPublisher(
      {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 50,
        backoffMultiplier: 2,
      },
      async () => mockConnection as any
    );
  });

  afterEach(async () => {
    // Cleanup
    if (publisher) {
      await publisher.disconnect();
    }
  });

  describe('Connection Management', () => {
    it('should establish connection on connect()', async () => {
      await publisher.connect();

      expect(publisher.isConnected()).toBe(true);
      expect(mockConnection.mockChannel.assertExchangeCalls).toHaveLength(1);
      expect(mockConnection.mockChannel.assertExchangeCalls[0]).toEqual({
        exchange: 'wallet.events',
        type: 'topic',
        options: { durable: true, autoDelete: false },
      });
    });

    it('should not reconnect if already connected', async () => {
      await publisher.connect();
      const firstChannel = mockConnection.mockChannel;

      await publisher.connect();
      const secondChannel = mockConnection.mockChannel;

      // Should reuse the same channel
      expect(secondChannel).toBe(firstChannel);
    });

    it('should close connection on disconnect()', async () => {
      await publisher.connect();
      expect(publisher.isConnected()).toBe(true);

      await publisher.disconnect();
      expect(publisher.isConnected()).toBe(false);
    });

    it('should handle connection errors gracefully', async () => {
      await publisher.connect();

      // Simulate connection error
      mockConnection.emit('error', new Error('Connection lost'));

      // Give time for error handler to process and attempt reconnection
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Connection should be reconnected (our mock allows immediate reconnection)
      expect(publisher.isConnected()).toBe(true);
    });
  });

  describe('Event Publishing', () => {
    beforeEach(async () => {
      await publisher.connect();
      mockConnection.mockChannel.publishCalls = []; // Reset publish calls
    });

    it('should publish WalletCreated event with correct routing key', async () => {
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-123');
      if (!playerIdResult.ok) throw playerIdResult.error;
      const playerId = playerIdResult.value;
      const event = new WalletCreated(walletId, playerId);

      await publisher.publish(event);

      expect(mockConnection.mockChannel.publishCalls).toHaveLength(1);
      const call = mockConnection.mockChannel.publishCalls[0];
      expect(call.exchange).toBe('wallet.events');
      expect(call.routingKey).toBe('wallet.created');
      expect(call.options.persistent).toBe(true);
      expect(call.options.contentType).toBe('application/json');
      expect(call.options.messageId).toBe(event.eventId);

      const message = JSON.parse(call.content.toString());
      expect(message.eventId).toBe(event.eventId);
      expect(message.walletId).toBe(walletId.toString());
      expect(message.playerId).toBe(playerId.toString());
    });

    it('should publish BalanceCredited event with correct routing key', async () => {
      const walletId = WalletId.create();
      const amount = unwrap(Money.fromCentavos(10000n));
      const newBalance = unwrap(Money.fromCentavos(50000n));
      const event = new BalanceCredited(walletId, amount, newBalance);

      await publisher.publish(event);

      expect(mockConnection.mockChannel.publishCalls).toHaveLength(1);
      const call = mockConnection.mockChannel.publishCalls[0];
      expect(call.exchange).toBe('wallet.events');
      expect(call.routingKey).toBe('wallet.balance_credited');

      const message = JSON.parse(call.content.toString());
      expect(message.amount).toBe('10000');
      expect(message.newBalance).toBe('50000');
    });

    it('should publish BalanceDebited event with correct routing key', async () => {
      const walletId = WalletId.create();
      const amount = unwrap(Money.fromCentavos(5000n));
      const newBalance = unwrap(Money.fromCentavos(45000n));
      const event = new BalanceDebited(walletId, amount, newBalance);

      await publisher.publish(event);

      expect(mockConnection.mockChannel.publishCalls).toHaveLength(1);
      const call = mockConnection.mockChannel.publishCalls[0];
      expect(call.exchange).toBe('wallet.events');
      expect(call.routingKey).toBe('wallet.balance_debited');

      const message = JSON.parse(call.content.toString());
      expect(message.amount).toBe('5000');
      expect(message.newBalance).toBe('45000');
    });

    it('should publish InsufficientBalanceErrorEvent with correct routing key', async () => {
      const walletId = WalletId.create();
      const playerId = unwrap(PlayerId.fromString('player-123'));
      const requestedAmount = unwrap(Money.fromCentavos(10000n));
      const currentBalance = unwrap(Money.fromCentavos(5000n));
      const event = new InsufficientBalanceErrorEvent(
        walletId,
        playerId,
        requestedAmount,
        currentBalance
      );

      await publisher.publish(event);

      expect(mockConnection.mockChannel.publishCalls).toHaveLength(1);
      const call = mockConnection.mockChannel.publishCalls[0];
      expect(call.exchange).toBe('wallet.events');
      expect(call.routingKey).toBe('wallet.insufficient_balance');

      const message = JSON.parse(call.content.toString());
      expect(message.requestedAmount).toBe('10000');
      expect(message.currentBalance).toBe('5000');
    });

    it('should handle channel buffer full by waiting for drain', async () => {
      mockConnection.mockChannel.shouldBufferFull = true;

      const walletId = WalletId.create();
      const playerId = unwrap(PlayerId.fromString('player-123'));
      const event = new WalletCreated(walletId, playerId);

      await publisher.publish(event);

      // Should still succeed after drain
      expect(mockConnection.mockChannel.publishCalls).toHaveLength(1);
    });
  });

  describe('Error Handling and Retry Logic', () => {
    beforeEach(async () => {
      await publisher.connect();
      mockConnection.mockChannel.publishCalls = [];
    });

    it('should retry publishing on failure', async () => {
      const walletId = WalletId.create();
      const playerId = unwrap(PlayerId.fromString('player-123'));
      const event = new WalletCreated(walletId, playerId);

      // Fail first 2 attempts, succeed on 3rd
      let attemptCount = 0;
      mockConnection.mockChannel.shouldFailPublish = true;
      const originalPublish = mockConnection.mockChannel.publish.bind(mockConnection.mockChannel);
      mockConnection.mockChannel.publish = function (
        exchange: string,
        routingKey: string,
        content: Buffer,
        options: any
      ): boolean {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Publish failed');
        }
        mockConnection.mockChannel.shouldFailPublish = false;
        return originalPublish(exchange, routingKey, content, options);
      };

      await publisher.publish(event);

      expect(attemptCount).toBe(3);
      expect(mockConnection.mockChannel.publishCalls).toHaveLength(1);
    });

    it('should throw error after max retries', async () => {
      const walletId = WalletId.create();
      const playerId = unwrap(PlayerId.fromString('player-123'));
      const event = new WalletCreated(walletId, playerId);

      mockConnection.mockChannel.shouldFailPublish = true;

      await expect(publisher.publish(event)).rejects.toThrow();
    });

    it('should throw error when channel is not available', async () => {
      await publisher.disconnect();

      const walletId = WalletId.create();
      const playerId = unwrap(PlayerId.fromString('player-123'));
      const event = new WalletCreated(walletId, playerId);

      await expect(publisher.publish(event)).rejects.toThrow('RabbitMQ channel not available');
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should connect on module init', async () => {
      const newMockConnection = new MockConnection();
      const newPublisher = new RabbitMQPublisher({}, async () => newMockConnection as any);
      await newPublisher.onModuleInit();

      expect(newPublisher.isConnected()).toBe(true);

      await newPublisher.onModuleDestroy();
    });

    it('should disconnect on module destroy', async () => {
      await publisher.onModuleInit();
      expect(publisher.isConnected()).toBe(true);

      await publisher.onModuleDestroy();
      expect(publisher.isConnected()).toBe(false);
    });
  });

  describe('Exchange and Routing Key Mapping', () => {
    beforeEach(async () => {
      await publisher.connect();
      mockConnection.mockChannel.publishCalls = [];
    });

    it('should map all events to wallet.events exchange', async () => {
      const walletId = WalletId.create();
      const playerId = unwrap(PlayerId.fromString('player-123'));
      const amount = unwrap(Money.fromCentavos(1000n));

      const events = [
        new WalletCreated(walletId, playerId),
        new BalanceCredited(walletId, amount, amount),
        new BalanceDebited(walletId, amount, Money.zero()),
        new InsufficientBalanceErrorEvent(walletId, playerId, amount, Money.zero()),
      ];

      for (const event of events) {
        await publisher.publish(event);
      }

      expect(mockConnection.mockChannel.publishCalls).toHaveLength(4);
      mockConnection.mockChannel.publishCalls.forEach((call) => {
        expect(call.exchange).toBe('wallet.events');
      });
    });

    it('should use correct routing keys for each event type', async () => {
      const walletId = WalletId.create();
      const playerId = unwrap(PlayerId.fromString('player-123'));
      const amount = unwrap(Money.fromCentavos(1000n));

      const testCases = [
        { event: new WalletCreated(walletId, playerId), expectedKey: 'wallet.created' },
        { event: new BalanceCredited(walletId, amount, amount), expectedKey: 'wallet.balance_credited' },
        { event: new BalanceDebited(walletId, amount, Money.zero()), expectedKey: 'wallet.balance_debited' },
        {
          event: new InsufficientBalanceErrorEvent(walletId, playerId, amount, Money.zero()),
          expectedKey: 'wallet.insufficient_balance',
        },
      ];

      for (const { event, expectedKey } of testCases) {
        mockConnection.mockChannel.publishCalls = [];
        await publisher.publish(event);

        expect(mockConnection.mockChannel.publishCalls).toHaveLength(1);
        expect(mockConnection.mockChannel.publishCalls[0].routingKey).toBe(expectedKey);
      }
    });
  });
});
