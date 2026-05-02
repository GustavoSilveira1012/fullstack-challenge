/**
 * Focused Error Handling and Logging Tests for RabbitMQConsumer - Task 14.2.5
 * 
 * This test file focuses specifically on error handling and logging validation
 * with minimal setup and fast execution times.
 * 
 * Tests verify:
 * - Error logging for invalid messages
 * - Error logging for use case failures
 * - Error logging for connection issues
 * - Proper error context in logs
 * 
 * Validates: Requirements 13.1
 */

import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import { Logger } from '@nestjs/common';
import { RabbitMQConsumer } from '../../../src/infrastructure/messaging/rabbitmq-consumer';
import { ProcessBetPlacedUseCase } from '../../../src/application/process-bet-placed.use-case';
import { ProcessCashoutUseCase } from '../../../src/application/process-cashout.use-case';
import { ProcessBetLostUseCase } from '../../../src/application/process-bet-lost.use-case';
import { WalletNotFoundError } from '../../../src/application/errors';

describe('RabbitMQConsumer Error Handling and Logging - Task 14.2.5', () => {
  let consumer: RabbitMQConsumer;
  let mockProcessBetPlacedUseCase: ProcessBetPlacedUseCase;
  let mockProcessCashoutUseCase: ProcessCashoutUseCase;
  let mockProcessBetLostUseCase: ProcessBetLostUseCase;
  let loggerSpy: any;

  beforeEach(() => {
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

    // Spy on Logger methods for logging verification
    loggerSpy = {
      log: spyOn(Logger.prototype, 'log'),
      error: spyOn(Logger.prototype, 'error'),
      warn: spyOn(Logger.prototype, 'warn'),
      debug: spyOn(Logger.prototype, 'debug'),
    };

    // Create consumer with mocked use cases
    consumer = new RabbitMQConsumer(
      mockProcessBetPlacedUseCase,
      mockProcessCashoutUseCase,
      mockProcessBetLostUseCase
    );
  });

  afterEach(() => {
    // Restore Logger methods safely
    if (loggerSpy) {
      Object.values(loggerSpy).forEach((spy: any) => {
        if (spy && typeof spy.mockRestore === 'function') {
          spy.mockRestore();
        }
      });
    }
  });

  describe('Error Logging for Invalid Messages', () => {
    it('should log error when processing invalid JSON messages', async () => {
      // Create a mock message with invalid JSON content
      const mockMessage = {
        content: Buffer.from('invalid json {'),
        properties: { messageId: 'invalid-json-msg' },
      } as any;

      // Access the private handleBetPlaced method through reflection
      const handleBetPlaced = (consumer as any).handleBetPlaced.bind(consumer);
      
      // Mock the channel for ACK/NACK operations
      (consumer as any).channel = {
        ack: mock(() => {}),
        nack: mock(() => {}),
      };

      // Call the handler directly
      await handleBetPlaced(mockMessage);

      // Verify error was logged
      expect(loggerSpy.error).toHaveBeenCalled();
      
      // Check that error log contains relevant information about JSON parsing
      const errorCalls = loggerSpy.error.mock.calls;
      const hasJsonError = errorCalls.some((call: any[]) => 
        call.some(arg => 
          typeof arg === 'object' && 
          (arg.message?.includes('bet placed') || arg.error?.includes('JSON'))
        )
      );
      expect(hasJsonError).toBe(true);
    });

    it('should log error when processing messages with missing required fields', async () => {
      // Create a mock message with incomplete data
      const incompleteData = {
        eventId: 'event-123',
        // Missing playerId, betId, amount, timestamp
      };

      const mockMessage = {
        content: Buffer.from(JSON.stringify(incompleteData)),
        properties: { messageId: 'incomplete-msg' },
      } as any;

      // Mock use case to fail when processing invalid data
      mockProcessBetPlacedUseCase.execute = mock(() => 
        Promise.reject(new Error('Invalid event data: missing required fields'))
      );

      // Access the private handleBetPlaced method
      const handleBetPlaced = (consumer as any).handleBetPlaced.bind(consumer);
      
      // Mock the channel
      (consumer as any).channel = {
        ack: mock(() => {}),
        nack: mock(() => {}),
      };

      // Call the handler directly
      await handleBetPlaced(mockMessage);

      // Verify error was logged for validation failure
      expect(loggerSpy.error).toHaveBeenCalled();
      
      // Check that error log contains information about missing fields
      const errorCalls = loggerSpy.error.mock.calls;
      const hasValidationError = errorCalls.some((call: any[]) => 
        call.some(arg => 
          typeof arg === 'object' && 
          (arg.message?.includes('Transient error') || arg.error?.includes('missing'))
        )
      );
      expect(hasValidationError).toBe(true);
    });
  });

  describe('Error Logging for Use Case Failures', () => {
    it('should log error for transient use case failures', async () => {
      // Mock use case to throw transient error
      mockProcessBetPlacedUseCase.execute = mock(() => 
        Promise.reject(new Error('Database connection timeout'))
      );

      const validEventData = {
        eventId: 'event-error',
        playerId: 'player-123',
        betId: 'bet-456',
        amount: '10000',
        timestamp: '2024-01-15T10:30:00.000Z'
      };

      const mockMessage = {
        content: Buffer.from(JSON.stringify(validEventData)),
        properties: { messageId: 'error-msg' },
      } as any;

      // Access the private handleBetPlaced method
      const handleBetPlaced = (consumer as any).handleBetPlaced.bind(consumer);
      
      // Mock the channel
      (consumer as any).channel = {
        ack: mock(() => {}),
        nack: mock(() => {}),
      };

      // Call the handler directly
      await handleBetPlaced(mockMessage);

      // Verify error was logged with proper context
      expect(loggerSpy.error).toHaveBeenCalled();
      
      // Check that error log contains transient error information
      const errorCalls = loggerSpy.error.mock.calls;
      const hasTransientError = errorCalls.some((call: any[]) => 
        call.some(arg => 
          typeof arg === 'object' && 
          (arg.message?.includes('Transient error') || arg.error?.includes('timeout'))
        )
      );
      expect(hasTransientError).toBe(true);
    });

    it('should log warning for domain errors (business logic errors)', async () => {
      // Mock use case to return domain error
      mockProcessBetPlacedUseCase.execute = mock(() => 
        Promise.resolve({ 
          ok: false, 
          error: new WalletNotFoundError('player-123') 
        })
      );

      const validEventData = {
        eventId: 'event-domain-error',
        playerId: 'player-123',
        betId: 'bet-456',
        amount: '10000',
        timestamp: '2024-01-15T10:30:00.000Z'
      };

      const mockMessage = {
        content: Buffer.from(JSON.stringify(validEventData)),
        properties: { messageId: 'domain-error-msg' },
      } as any;

      // Access the private handleBetPlaced method
      const handleBetPlaced = (consumer as any).handleBetPlaced.bind(consumer);
      
      // Mock the channel
      (consumer as any).channel = {
        ack: mock(() => {}),
        nack: mock(() => {}),
      };

      // Call the handler directly
      await handleBetPlaced(mockMessage);

      // Verify warning was logged for domain error
      expect(loggerSpy.warn).toHaveBeenCalled();
      
      // Check that warning log contains domain error information
      const warnCalls = loggerSpy.warn.mock.calls;
      const hasDomainError = warnCalls.some((call: any[]) => 
        call.some(arg => 
          typeof arg === 'object' && 
          (arg.message?.includes('domain error') || arg.error?.includes('WalletNotFoundError'))
        )
      );
      expect(hasDomainError).toBe(true);
    });
  });

  describe('Error Context in Logs', () => {
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

      const mockMessage = {
        content: Buffer.from(JSON.stringify(eventData)),
        properties: { messageId: 'context-msg' },
      } as any;

      // Access the private handleCashout method
      const handleCashout = (consumer as any).handleCashout.bind(consumer);
      
      // Mock the channel
      (consumer as any).channel = {
        ack: mock(() => {}),
        nack: mock(() => {}),
      };

      // Call the handler directly
      await handleCashout(mockMessage);

      // Verify error was logged with proper context
      expect(loggerSpy.error).toHaveBeenCalled();
      
      // Check that the error log contains relevant information
      const errorCalls = loggerSpy.error.mock.calls;
      const hasRelevantLog = errorCalls.some((call: any[]) => 
        call.some(arg => 
          typeof arg === 'object' && 
          (arg.message?.includes('cashout') || arg.error?.includes(errorMessage) || arg.messageId === 'context-msg')
        )
      );
      expect(hasRelevantLog).toBe(true);
    });

    it('should log successful message processing with context', async () => {
      const eventData = {
        eventId: 'event-success',
        playerId: 'player-123',
        betId: 'bet-456',
        amount: '10000',
        timestamp: '2024-01-15T10:30:00.000Z'
      };

      const mockMessage = {
        content: Buffer.from(JSON.stringify(eventData)),
        properties: { messageId: 'success-msg' },
      } as any;

      // Access the private handleBetPlaced method
      const handleBetPlaced = (consumer as any).handleBetPlaced.bind(consumer);
      
      // Mock the channel
      (consumer as any).channel = {
        ack: mock(() => {}),
        nack: mock(() => {}),
      };

      // Call the handler directly
      await handleBetPlaced(mockMessage);

      // Verify success was logged with context
      expect(loggerSpy.log).toHaveBeenCalled();
      
      // Check that success log contains event information
      const logCalls = loggerSpy.log.mock.calls;
      const hasSuccessLog = logCalls.some((call: any[]) => 
        call.some(arg => 
          typeof arg === 'object' && 
          (arg.message?.includes('Processing bet placed') || arg.eventId === 'event-success')
        )
      );
      expect(hasSuccessLog).toBe(true);
    });
  });

  describe('Connection Error Logging', () => {
    it('should log connection errors during startup', async () => {
      // Mock environment with invalid RabbitMQ URL
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
      expect(loggerSpy.error).toHaveBeenCalled();
      
      // Check that connection error was logged
      const errorCalls = loggerSpy.error.mock.calls;
      const hasConnectionError = errorCalls.some((call: any[]) => 
        call.some(arg => 
          typeof arg === 'string' && 
          (arg.includes('Failed to start RabbitMQ consumer') || arg.includes('connection'))
        )
      );
      expect(hasConnectionError).toBe(true);

      // Restore original URL
      process.env.RABBITMQ_URL = originalEnvUrl;
    });
  });
});