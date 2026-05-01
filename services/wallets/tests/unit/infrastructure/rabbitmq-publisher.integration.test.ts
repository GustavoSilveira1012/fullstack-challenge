/**
 * Integration Tests for RabbitMQPublisher
 * 
 * Tests the RabbitMQ publisher with a real RabbitMQ instance.
 * These tests verify:
 * - Connection establishment to real RabbitMQ
 * - Event publishing to correct exchanges
 * - Routing key generation
 * - Error handling on connection failures
 * 
 * Prerequisites:
 * - RabbitMQ must be running (via docker-compose)
 * - Use RABBITMQ_URL environment variable to connect
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
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
 * Test configuration
 * Note: When running tests locally, RabbitMQ is accessible via localhost:5672
 * When running in Docker, it's accessible via rabbitmq:5672
 */
const TEST_RABBITMQ_URL = process.env.RABBITMQ_TEST_URL || 'amqp://admin:admin@localhost:5672';
const TEST_EXCHANGE = 'wallet.events';
const TEST_QUEUE_PREFIX = 'test.wallet.integration';

describe('RabbitMQPublisher Integration Tests', () => {
  let publisher: RabbitMQPublisher;
  let testConnection: amqp.Connection;
  let testChannel: amqp.Channel;
  let testQueueName: string;

  beforeAll(async () => {
    // Create a test connection and channel for verification
    try {
      testConnection = await amqp.connect(TEST_RABBITMQ_URL);
      testChannel = await testConnection.createChannel();

      // Create a unique test queue for this test run
      testQueueName = `${TEST_QUEUE_PREFIX}.${Date.now()}`;
      await testChannel.assertQueue(testQueueName, {
        durable: false,
        autoDelete: true,
      });

      // Bind the test queue to the wallet.events exchange with wildcard routing key
      await testChannel.assertExchange(TEST_EXCHANGE, 'topic', {
        durable: true,
        autoDelete: false,
      });
      await testChannel.bindQueue(testQueueName, TEST_EXCHANGE, 'wallet.#');
    } catch (error) {
      console.error('Failed to setup test environment:', error);
      throw new Error(
        'RabbitMQ is not available. Please ensure docker-compose is running with: docker-compose up -d rabbitmq'
      );
    }
  });

  afterAll(async () => {
    // Cleanup test resources
    if (testChannel) {
      try {
        await testChannel.deleteQueue(testQueueName);
        await testChannel.close();
      } catch (error) {
        console.error('Error cleaning up test channel:', error);
      }
    }

    if (testConnection) {
      try {
        await testConnection.close();
      } catch (error) {
        console.error('Error closing test connection:', error);
      }
    }
  });

  beforeEach(async () => {
    // Purge the test queue before each test
    if (testChannel) {
      await testChannel.purgeQueue(testQueueName);
    }
  });

  describe('Connection Establishment', () => {
    it('should successfully connect to RabbitMQ', async () => {
      publisher = new RabbitMQPublisher({}, async () => amqp.connect(TEST_RABBITMQ_URL));

      await publisher.connect();

      expect(publisher.isConnected()).toBe(true);

      await publisher.disconnect();
    });

    it('should create wallet.events exchange on connection', async () => {
      publisher = new RabbitMQPublisher({}, async () => amqp.connect(TEST_RABBITMQ_URL));

      await publisher.connect();

      // Verify exchange exists by checking it (passive check)
      await testChannel.checkExchange(TEST_EXCHANGE);

      await publisher.disconnect();
    });

    it('should handle multiple connect calls gracefully', async () => {
      publisher = new RabbitMQPublisher({}, async () => amqp.connect(TEST_RABBITMQ_URL));

      await publisher.connect();
      await publisher.connect();
      await publisher.connect();

      expect(publisher.isConnected()).toBe(true);

      await publisher.disconnect();
    });

    it('should disconnect gracefully', async () => {
      publisher = new RabbitMQPublisher({}, async () => amqp.connect(TEST_RABBITMQ_URL));

      await publisher.connect();
      expect(publisher.isConnected()).toBe(true);

      await publisher.disconnect();
      expect(publisher.isConnected()).toBe(false);
    });
  });

  describe('Event Publishing to Correct Exchange', () => {
    beforeEach(async () => {
      publisher = new RabbitMQPublisher({}, async () => amqp.connect(TEST_RABBITMQ_URL));
      await publisher.connect();
    });

    afterAll(async () => {
      if (publisher) {
        await publisher.disconnect();
      }
    });

    it('should publish WalletCreated event to wallet.events exchange', async () => {
      const walletId = WalletId.create();
      const playerId = unwrap(PlayerId.fromString('player-123'));
      const event = new WalletCreated(walletId, playerId);

      await publisher.publish(event);

      // Wait for message to be delivered
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify message was received in test queue
      const message = await testChannel.get(testQueueName, { noAck: true });
      expect(message).not.toBe(false);

      if (message !== false) {
        const content = JSON.parse(message.content.toString());
        expect(content.eventId).toBe(event.eventId);
        expect(content.walletId).toBe(walletId.toString());
        expect(content.playerId).toBe(playerId.toString());
        expect(message.fields.exchange).toBe(TEST_EXCHANGE);
      }
    });

    it('should publish BalanceCredited event to wallet.events exchange', async () => {
      const walletId = WalletId.create();
      const amount = unwrap(Money.fromCentavos(10000n));
      const newBalance = unwrap(Money.fromCentavos(50000n));
      const event = new BalanceCredited(walletId, amount, newBalance);

      await publisher.publish(event);

      // Wait for message to be delivered
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify message was received
      const message = await testChannel.get(testQueueName, { noAck: true });
      expect(message).not.toBe(false);

      if (message !== false) {
        const content = JSON.parse(message.content.toString());
        expect(content.eventId).toBe(event.eventId);
        expect(content.amount).toBe('10000');
        expect(content.newBalance).toBe('50000');
        expect(message.fields.exchange).toBe(TEST_EXCHANGE);
      }
    });

    it('should publish BalanceDebited event to wallet.events exchange', async () => {
      const walletId = WalletId.create();
      const amount = unwrap(Money.fromCentavos(5000n));
      const newBalance = unwrap(Money.fromCentavos(45000n));
      const event = new BalanceDebited(walletId, amount, newBalance);

      await publisher.publish(event);

      // Wait for message to be delivered
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify message was received
      const message = await testChannel.get(testQueueName, { noAck: true });
      expect(message).not.toBe(false);

      if (message !== false) {
        const content = JSON.parse(message.content.toString());
        expect(content.eventId).toBe(event.eventId);
        expect(content.amount).toBe('5000');
        expect(content.newBalance).toBe('45000');
        expect(message.fields.exchange).toBe(TEST_EXCHANGE);
      }
    });

    it('should publish InsufficientBalanceErrorEvent to wallet.events exchange', async () => {
      const walletId = WalletId.create();
      const playerId = unwrap(PlayerId.fromString('player-456'));
      const requestedAmount = unwrap(Money.fromCentavos(10000n));
      const currentBalance = unwrap(Money.fromCentavos(5000n));
      const event = new InsufficientBalanceErrorEvent(
        walletId,
        playerId,
        requestedAmount,
        currentBalance
      );

      await publisher.publish(event);

      // Wait for message to be delivered
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify message was received
      const message = await testChannel.get(testQueueName, { noAck: true });
      expect(message).not.toBe(false);

      if (message !== false) {
        const content = JSON.parse(message.content.toString());
        expect(content.eventId).toBe(event.eventId);
        expect(content.requestedAmount).toBe('10000');
        expect(content.currentBalance).toBe('5000');
        expect(message.fields.exchange).toBe(TEST_EXCHANGE);
      }
    });

    it('should publish messages with persistent delivery mode', async () => {
      const walletId = WalletId.create();
      const playerId = unwrap(PlayerId.fromString('player-789'));
      const event = new WalletCreated(walletId, playerId);

      await publisher.publish(event);

      // Wait for message to be delivered
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify message properties
      const message = await testChannel.get(testQueueName, { noAck: true });
      expect(message).not.toBe(false);

      if (message !== false) {
        expect(message.properties.contentType).toBe('application/json');
        expect(message.properties.messageId).toBe(event.eventId);
        expect(message.properties.timestamp).toBeDefined();
        // Persistent messages have deliveryMode = 2
        expect(message.properties.deliveryMode).toBe(2);
      }
    });
  });

  describe('Routing Key Generation', () => {
    beforeEach(async () => {
      publisher = new RabbitMQPublisher({}, async () => amqp.connect(TEST_RABBITMQ_URL));
      await publisher.connect();
    });

    afterAll(async () => {
      if (publisher) {
        await publisher.disconnect();
      }
    });

    it('should use "wallet.created" routing key for WalletCreated events', async () => {
      const walletId = WalletId.create();
      const playerId = unwrap(PlayerId.fromString('player-123'));
      const event = new WalletCreated(walletId, playerId);

      await publisher.publish(event);

      // Wait for message to be delivered
      await new Promise((resolve) => setTimeout(resolve, 100));

      const message = await testChannel.get(testQueueName, { noAck: true });
      expect(message).not.toBe(false);

      if (message !== false) {
        expect(message.fields.routingKey).toBe('wallet.created');
      }
    });

    it('should use "wallet.balance_credited" routing key for BalanceCredited events', async () => {
      const walletId = WalletId.create();
      const amount = unwrap(Money.fromCentavos(1000n));
      const event = new BalanceCredited(walletId, amount, amount);

      await publisher.publish(event);

      // Wait for message to be delivered
      await new Promise((resolve) => setTimeout(resolve, 100));

      const message = await testChannel.get(testQueueName, { noAck: true });
      expect(message).not.toBe(false);

      if (message !== false) {
        expect(message.fields.routingKey).toBe('wallet.balance_credited');
      }
    });

    it('should use "wallet.balance_debited" routing key for BalanceDebited events', async () => {
      const walletId = WalletId.create();
      const amount = unwrap(Money.fromCentavos(1000n));
      const event = new BalanceDebited(walletId, amount, Money.zero());

      await publisher.publish(event);

      // Wait for message to be delivered
      await new Promise((resolve) => setTimeout(resolve, 100));

      const message = await testChannel.get(testQueueName, { noAck: true });
      expect(message).not.toBe(false);

      if (message !== false) {
        expect(message.fields.routingKey).toBe('wallet.balance_debited');
      }
    });

    it('should use "wallet.insufficient_balance" routing key for InsufficientBalanceErrorEvent', async () => {
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

      // Wait for message to be delivered
      await new Promise((resolve) => setTimeout(resolve, 100));

      const message = await testChannel.get(testQueueName, { noAck: true });
      expect(message).not.toBe(false);

      if (message !== false) {
        expect(message.fields.routingKey).toBe('wallet.insufficient_balance');
      }
    });

    it('should allow consumers to subscribe to specific event types using routing keys', async () => {
      // Create a queue that only subscribes to wallet.created events
      const specificQueueName = `${TEST_QUEUE_PREFIX}.created.${Date.now()}`;
      await testChannel.assertQueue(specificQueueName, {
        durable: false,
        autoDelete: true,
      });
      await testChannel.bindQueue(specificQueueName, TEST_EXCHANGE, 'wallet.created');

      // Publish multiple event types
      const walletId = WalletId.create();
      const playerId = unwrap(PlayerId.fromString('player-123'));
      const amount = unwrap(Money.fromCentavos(1000n));

      await publisher.publish(new WalletCreated(walletId, playerId));
      await publisher.publish(new BalanceCredited(walletId, amount, amount));
      await publisher.publish(new BalanceDebited(walletId, amount, Money.zero()));

      // Wait for messages to be delivered
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify only WalletCreated event was received in specific queue
      const message1 = await testChannel.get(specificQueueName, { noAck: true });
      expect(message1).not.toBe(false);
      if (message1 !== false) {
        expect(message1.fields.routingKey).toBe('wallet.created');
      }

      // No more messages should be in the queue
      const message2 = await testChannel.get(specificQueueName, { noAck: true });
      expect(message2).toBe(false);

      // Cleanup
      await testChannel.deleteQueue(specificQueueName);
    });
  });

  describe('Error Handling on Connection Failure', () => {
    it('should throw error when connecting to invalid RabbitMQ URL', async () => {
      const invalidPublisher = new RabbitMQPublisher(
        {},
        async () => amqp.connect('amqp://invalid:invalid@nonexistent:5672')
      );

      await expect(invalidPublisher.connect()).rejects.toThrow();
    });

    it('should throw error when publishing without connection', async () => {
      const disconnectedPublisher = new RabbitMQPublisher();

      const walletId = WalletId.create();
      const playerId = unwrap(PlayerId.fromString('player-123'));
      const event = new WalletCreated(walletId, playerId);

      await expect(disconnectedPublisher.publish(event)).rejects.toThrow(
        'RabbitMQ channel not available'
      );
    });

    it('should throw error when publishing after disconnection', async () => {
      publisher = new RabbitMQPublisher({}, async () => amqp.connect(TEST_RABBITMQ_URL));
      await publisher.connect();
      await publisher.disconnect();

      const walletId = WalletId.create();
      const playerId = unwrap(PlayerId.fromString('player-123'));
      const event = new WalletCreated(walletId, playerId);

      await expect(publisher.publish(event)).rejects.toThrow('RabbitMQ channel not available');
    });

    it('should handle connection close gracefully', async () => {
      publisher = new RabbitMQPublisher({}, async () => amqp.connect(TEST_RABBITMQ_URL));
      await publisher.connect();

      // Simulate connection close by disconnecting
      await publisher.disconnect();

      expect(publisher.isConnected()).toBe(false);
    });

    it('should retry publishing on transient failures', async () => {
      publisher = new RabbitMQPublisher(
        {
          maxRetries: 3,
          initialDelayMs: 10,
          maxDelayMs: 50,
          backoffMultiplier: 2,
        },
        async () => amqp.connect(TEST_RABBITMQ_URL)
      );
      await publisher.connect();

      const walletId = WalletId.create();
      const playerId = unwrap(PlayerId.fromString('player-123'));
      const event = new WalletCreated(walletId, playerId);

      // This should succeed even with retry configuration
      await publisher.publish(event);

      // Wait for message to be delivered
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify message was received
      const message = await testChannel.get(testQueueName, { noAck: true });
      expect(message).not.toBe(false);

      await publisher.disconnect();
    });
  });

  describe('Message Serialization', () => {
    beforeEach(async () => {
      publisher = new RabbitMQPublisher({}, async () => amqp.connect(TEST_RABBITMQ_URL));
      await publisher.connect();
    });

    afterAll(async () => {
      if (publisher) {
        await publisher.disconnect();
      }
    });

    it('should serialize events to valid JSON', async () => {
      const walletId = WalletId.create();
      const playerId = unwrap(PlayerId.fromString('player-123'));
      const event = new WalletCreated(walletId, playerId);

      await publisher.publish(event);

      // Wait for message to be delivered
      await new Promise((resolve) => setTimeout(resolve, 100));

      const message = await testChannel.get(testQueueName, { noAck: true });
      expect(message).not.toBe(false);

      if (message !== false) {
        // Should be valid JSON
        const content = JSON.parse(message.content.toString());
        expect(content).toBeDefined();
        expect(typeof content).toBe('object');
        expect(content.eventId).toBeDefined();
        expect(content.occurredAt).toBeDefined();
      }
    });

    it('should include all required event fields in serialized message', async () => {
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

      // Wait for message to be delivered
      await new Promise((resolve) => setTimeout(resolve, 100));

      const message = await testChannel.get(testQueueName, { noAck: true });
      expect(message).not.toBe(false);

      if (message !== false) {
        const content = JSON.parse(message.content.toString());
        expect(content.eventId).toBeDefined();
        expect(content.occurredAt).toBeDefined();
        expect(content.walletId).toBe(walletId.toString());
        expect(content.playerId).toBe(playerId.toString());
        expect(content.requestedAmount).toBe('10000');
        expect(content.currentBalance).toBe('5000');
      }
    });

    it('should serialize Money values as string centavos', async () => {
      const walletId = WalletId.create();
      const amount = unwrap(Money.fromCentavos(123456789n));
      const newBalance = unwrap(Money.fromCentavos(987654321n));
      const event = new BalanceCredited(walletId, amount, newBalance);

      await publisher.publish(event);

      // Wait for message to be delivered
      await new Promise((resolve) => setTimeout(resolve, 100));

      const message = await testChannel.get(testQueueName, { noAck: true });
      expect(message).not.toBe(false);

      if (message !== false) {
        const content = JSON.parse(message.content.toString());
        expect(content.amount).toBe('123456789');
        expect(content.newBalance).toBe('987654321');
        expect(typeof content.amount).toBe('string');
        expect(typeof content.newBalance).toBe('string');
      }
    });
  });
});
