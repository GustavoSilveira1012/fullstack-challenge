/**
 * Optimized Integration Tests for RabbitMQConsumer - Task 14.2.5
 * 
 * This is an optimized version focusing on error handling and logging tests
 * with reduced examples and faster execution times.
 * 
 * Tests the RabbitMQ consumer with a real RabbitMQ instance.
 * These tests verify:
 * - Error logging for invalid messages
 * - Error logging for use case failures  
 * - Error logging for connection issues
 * - Proper error context in logs
 * 
 * Prerequisites:
 * - RabbitMQ must be running (via docker-compose)
 * - Use RABBITMQ_URL environment variable to connect
 * 
 * Validates: Requirements 13.1
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import * as amqp from 'amqplib';
import { RabbitMQConsumer } from '../../../src/infrastructure/messaging/rabbitmq-consumer';
import { ProcessBetPlacedUseCase } from '../../../src/application/process-bet-placed.use-case';
import { ProcessCashoutUseCase } from '../../../src/application/process-cashout.use-case';
import { ProcessBetLostUseCase } from '../../../src/application/process-bet-lost.use-case';
import { BetPlacedEventDto, CashoutEventDto, BetLostEventDto } from '../../../src/application/dtos';
import { WalletNotFoundError } from '../../../src/application/errors';

/**
 * Test configuration
 * Note: When running tests locally, RabbitMQ is accessible via localhost:5672
 * When running in Docker, it's accessible via rabbitmq:5672
 */
const TEST_RABBITMQ_URL = process.env.RABBITMQ_TEST_URL || 'amqp://admin:admin@localhost:5672';
const TEST_EXCHANGE = 'game.events.optimized';
const TEST_QUEUE_PREFIX = 'test.optimized';

// Mock environment config to use test values
const originalEnv = process.env;
beforeAll(() => {
  process.env.RABBITMQ_URL = TEST_RABBITMQ_URL;
  process.env.RABBITMQ_GAME_EXCHANGE = TEST_EXCHANGE;
  process.env.RABBITMQ_BET_PLACED_QUEUE = `${TEST_QUEUE_PREFIX}.bet-placed`;
  process.env.RABBITMQ_CASHOUT_QUEUE = `${TEST_QUEUE_PREFIX}.cashout`;
  process.env.RABBITMQ_BET_LOST_QUEUE = `${TEST_QUEUE_PREFIX}.bet-lost`;
});

afterAll(() => {
  process.env = originalEnv;
});

describe('RabbitMQConsumer Optimized Tests - Task 14.2.5', () => {
  let consumer: RabbitMQConsumer;
  let testConnection: amqp.Connection;
  let testChannel: amqp.Channel;
  
  // Mock use cases
  let mockProcessBetPlacedUseCase: ProcessBetPlacedUseCase;
  let mockProcessCashoutUseCase: ProcessCashoutUseCase;
  let mockProcessBetLostUseCase: ProcessBetLostUseCase;

  // Test queues
  const betPlacedQueue = `${TEST_QUEUE_PREFIX}.bet-placed`;
  const cashoutQueue = `${TEST_QUEUE_PREFIX}.cashout`;
  const betLostQueue = `${TEST_QUEUE_PREFIX}.bet-lost`;

  beforeAll(async () => {
    // Create a test connection and channel for message publishing
    try {
      testConnection = await amqp.connect(TEST_RABBITMQ_URL);
      testChannel = await testConnection.createChannel();

      // Assert exchange exists
      await testChannel.assertExchange(TEST_EXCHANGE, 'topic', {
        durable: true,
        autoDelete: false,
      });

      console.log('Test RabbitMQ connection established');
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
        // Clean up test queues
        await testChannel.deleteQueue(betPlacedQueue).catch(() => {});
        await testChannel.deleteQueue(cashoutQueue).catch(() => {});
        await testChannel.deleteQueue(betLostQueue).catch(() => {});
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
    // Create mock use cases
    mockProcessBetPlacedUseCase = {
      execute: mock(() => Promise.resolve({ ok: true, value: {} })),
    } as any;

    mockProcessCashoutUseCase = {
      execute: mock(() => Promise.resolve({ ok: true, value: {} })),
    } as any;

    mockProcessBetLostUseCase = {
      execute: mock(() => Promise.resolve({ ok: true, value: {} })),
    } as any;

    // Create consumer with mocked use cases
    consumer = new RabbitMQConsumer(
      mockProcessBetPlacedUseCase,
      mockProcessCashoutUseCase,
      mockProcessBetLostUseCase
    );

    // Purge test queues before each test
    if (testChannel) {
      await testChannel.purgeQueue(betPlacedQueue).catch(() => {});
      await testChannel.purgeQueue(cashoutQueue).catch(() => {});
      await testChannel.purgeQueue(betLostQueue).catch(() => {});
    }
  });

  afterEach(async () => {
    // Stop consumer after each test
    if (consumer) {
      await consumer.stop();
    }
  });

  describe('14.2.5 - Error Handling and Logging Tests (Optimized)', () => {
    let consoleSpy: any;

    beforeEach(async () => {
      await consumer.start();
      // Spy on console methods for logging verification
      consoleSpy = {
        log: spyOn(console, 'log').mockImplementation(() => {}),
        error: spyOn(console, 'error').mockImplementation(() => {}),
        warn: spyOn(console, 'warn').mockImplementation(() => {}),
      };
    });

    afterEach(() => {
      // Restore console methods safely
      if (consoleSpy) {
        Object.values(consoleSpy).forEach((spy: any) => {
          if (spy && typeof spy.mockRestore === 'function') {
            spy.mockRestore();
          }
        });
      }
    });

    it('should log error for invalid messages and use case failures', async () => {
      // Test 1: Invalid JSON message
      await testChannel.publish(
        TEST_EXCHANGE,
        'bet.placed',
        Buffer.from('invalid json {'),
        { messageId: 'invalid-json-msg' }
      );

      // Test 2: Use case failure (transient error)
      mockProcessBetPlacedUseCase.execute = mock(() => 
        Promise.reject(new Error('Database connection failed'))
      );

      const eventData = {
        eventId: 'event-error',
        playerId: 'player-123',
        betId: 'bet-456',
        amount: '10000',
        timestamp: '2024-01-15T10:30:00.000Z'
      };

      await testChannel.publish(
        TEST_EXCHANGE,
        'bet.placed',
        Buffer.from(JSON.stringify(eventData)),
        { messageId: 'error-msg' }
      );

      // Wait for message processing (reduced wait time)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify errors were logged
      expect(consoleSpy.error).toHaveBeenCalled();
      expect(consoleSpy.error.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it('should log warnings for domain errors and success for valid processing', async () => {
      // Test 1: Domain error (business logic error)
      mockProcessBetPlacedUseCase.execute = mock(() => 
        Promise.resolve({ 
          ok: false, 
          error: new WalletNotFoundError('player-123') 
        })
      );

      const domainErrorEvent = {
        eventId: 'event-domain-error',
        playerId: 'player-123',
        betId: 'bet-456',
        amount: '10000',
        timestamp: '2024-01-15T10:30:00.000Z'
      };

      await testChannel.publish(
        TEST_EXCHANGE,
        'bet.placed',
        Buffer.from(JSON.stringify(domainErrorEvent)),
        { messageId: 'domain-error-msg' }
      );

      // Reset mock for success case
      mockProcessCashoutUseCase.execute = mock(() => 
        Promise.resolve({ ok: true, value: {} })
      );

      // Test 2: Successful processing
      const successEvent = {
        eventId: 'event-success',
        playerId: 'player-456',
        betId: 'bet-789',
        amount: '25000',
        multiplier: '2.50',
        timestamp: '2024-01-15T10:35:00.000Z'
      };

      await testChannel.publish(
        TEST_EXCHANGE,
        'bet.cashout',
        Buffer.from(JSON.stringify(successEvent)),
        { messageId: 'success-msg' }
      );

      // Wait for message processing (reduced wait time)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify appropriate logging occurred
      expect(consoleSpy.warn).toHaveBeenCalled(); // Domain error should log warning
      expect(consoleSpy.log).toHaveBeenCalled();  // Success should log info
    });

    it('should include proper error context in logs', async () => {
      // Mock use case to throw error with specific message
      const errorMessage = 'Specific database timeout error';
      mockProcessCashoutUseCase.execute = mock(() => 
        Promise.reject(new Error(errorMessage))
      );

      const eventData = {
        eventId: 'event-context',
        playerId: 'player-456',
        betId: 'bet-789',
        amount: '25000',
        multiplier: '2.50',
        timestamp: '2024-01-15T10:35:00.000Z'
      };

      await testChannel.publish(
        TEST_EXCHANGE,
        'bet.cashout',
        Buffer.from(JSON.stringify(eventData)),
        { messageId: 'context-msg' }
      );

      // Wait for message processing (reduced wait time)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify error was logged with proper context
      expect(consoleSpy.error).toHaveBeenCalled();
      
      // Check that the error log contains relevant information
      const errorCalls = consoleSpy.error.mock.calls;
      const hasRelevantLog = errorCalls.some((call: any[]) => 
        call.some(arg => 
          typeof arg === 'object' && 
          (arg.message?.includes('cashout') || arg.error?.includes(errorMessage))
        )
      );
      expect(hasRelevantLog).toBe(true);
    });

    it('should log connection errors', async () => {
      // Stop current consumer
      await consumer.stop();

      // Create consumer with invalid URL to trigger connection error
      const originalEnvUrl = process.env.RABBITMQ_URL;
      process.env.RABBITMQ_URL = 'amqp://invalid:invalid@nonexistent:5672';

      const invalidConsumer = new RabbitMQConsumer(
        mockProcessBetPlacedUseCase,
        mockProcessCashoutUseCase,
        mockProcessBetLostUseCase
      );

      try {
        await invalidConsumer.start();
      } catch (error) {
        // Expected to fail
      }

      // Verify error was logged
      expect(consoleSpy.error).toHaveBeenCalled();

      // Restore original URL
      process.env.RABBITMQ_URL = originalEnvUrl;
    });
  });

  describe('Integration - Minimal End-to-End Message Flow', () => {
    beforeEach(async () => {
      await consumer.start();
    });

    it('should handle complete message flow for all event types', async () => {
      // Prepare test data for all event types (single example each)
      const betPlacedEvent = {
        eventId: 'bet-placed-e2e',
        playerId: 'player-e2e',
        betId: 'bet-e2e-1',
        amount: '10000',
        timestamp: '2024-01-15T10:30:00.000Z'
      };

      const cashoutEvent = {
        eventId: 'cashout-e2e',
        playerId: 'player-e2e',
        betId: 'bet-e2e-2',
        amount: '25000',
        multiplier: '2.50',
        timestamp: '2024-01-15T10:35:00.000Z'
      };

      const betLostEvent = {
        eventId: 'bet-lost-e2e',
        playerId: 'player-e2e',
        betId: 'bet-e2e-3',
        amount: '5000',
        timestamp: '2024-01-15T10:40:00.000Z'
      };

      // Publish all event types
      await testChannel.publish(
        TEST_EXCHANGE,
        'bet.placed',
        Buffer.from(JSON.stringify(betPlacedEvent)),
        { messageId: 'bet-placed-e2e-msg' }
      );

      await testChannel.publish(
        TEST_EXCHANGE,
        'bet.cashout',
        Buffer.from(JSON.stringify(cashoutEvent)),
        { messageId: 'cashout-e2e-msg' }
      );

      await testChannel.publish(
        TEST_EXCHANGE,
        'bet.lost',
        Buffer.from(JSON.stringify(betLostEvent)),
        { messageId: 'bet-lost-e2e-msg' }
      );

      // Wait for all messages to be processed (reduced wait time)
      await new Promise(resolve => setTimeout(resolve, 150));

      // Verify all use cases were called
      expect(mockProcessBetPlacedUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockProcessCashoutUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockProcessBetLostUseCase.execute).toHaveBeenCalledTimes(1);

      // Verify all queues are empty (messages were ACKed)
      expect(await testChannel.get(betPlacedQueue, { noAck: true })).toBe(false);
      expect(await testChannel.get(cashoutQueue, { noAck: true })).toBe(false);
      expect(await testChannel.get(betLostQueue, { noAck: true })).toBe(false);
    });
  });
});