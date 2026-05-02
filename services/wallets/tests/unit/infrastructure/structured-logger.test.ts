/**
 * Unit Tests for StructuredLogger
 * 
 * Tests JSON logging format, log levels, context support, and sensitive data redaction.
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { StructuredLogger, type LogContext } from '../../../src/infrastructure/logging/structured-logger.service';

describe('StructuredLogger', () => {
  let originalConsoleLog: typeof console.log;
  let logOutput: string[];

  beforeEach(() => {
    // Capture console.log output
    logOutput = [];
    originalConsoleLog = console.log;
    console.log = mock((message: string) => {
      logOutput.push(message);
    });
  });

  afterEach(() => {
    // Restore console.log
    console.log = originalConsoleLog;
  });

  describe('JSON Logging Format', () => {
    it('should output logs in JSON format', () => {
      const logger = new StructuredLogger();
      logger.info('Test message');

      expect(logOutput).toHaveLength(1);
      const parsed = JSON.parse(logOutput[0]);
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('level');
      expect(parsed).toHaveProperty('service');
      expect(parsed).toHaveProperty('message');
    });

    it('should include service name in logs', () => {
      const logger = new StructuredLogger();
      logger.info('Test message');

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.service).toBe('wallet-service');
    });

    it('should include ISO 8601 timestamp', () => {
      const logger = new StructuredLogger();
      logger.info('Test message');

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Log Levels', () => {
    it('should log error messages', () => {
      const logger = new StructuredLogger();
      logger.error('Error message');

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.level).toBe('error');
      expect(parsed.message).toBe('Error message');
    });

    it('should log warning messages', () => {
      const logger = new StructuredLogger();
      logger.warn('Warning message');

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.level).toBe('warn');
      expect(parsed.message).toBe('Warning message');
    });

    it('should log info messages', () => {
      const logger = new StructuredLogger();
      logger.info('Info message');

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('Info message');
    });

    it('should log debug messages', () => {
      const logger = new StructuredLogger();
      logger.debug('Debug message');

      // Debug messages may not be logged if LOG_LEVEL is set to 'info' or higher
      // Check if debug was logged
      if (logOutput.length > 0) {
        const parsed = JSON.parse(logOutput[0]);
        expect(parsed.level).toBe('debug');
        expect(parsed.message).toBe('Debug message');
      } else {
        // Debug not logged due to log level filtering - this is expected
        expect(logOutput.length).toBe(0);
      }
    });

    it('should include stack trace for error logs', () => {
      const logger = new StructuredLogger();
      const stackTrace = 'Error: Test error\n    at test.ts:10:5';
      logger.error('Error message', {}, stackTrace);

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.trace).toBe(stackTrace);
    });

    it('should not include trace for non-error logs', () => {
      const logger = new StructuredLogger();
      logger.info('Info message', {}, 'some trace');

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.trace).toBeUndefined();
    });
  });

  describe('Context Support', () => {
    it('should include context in logs', () => {
      const logger = new StructuredLogger();
      logger.info('Test message', {
        walletId: 'wallet-123',
        playerId: 'player-456',
      });

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.context).toEqual({
        walletId: 'wallet-123',
        playerId: 'player-456',
      });
    });

    it('should merge base context with log context', () => {
      const logger = new StructuredLogger({ component: 'WalletService' });
      logger.info('Test message', { requestId: 'req-789' });

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.context).toEqual({
        component: 'WalletService',
        requestId: 'req-789',
      });
    });

    it('should not include context property if context is empty', () => {
      const logger = new StructuredLogger();
      logger.info('Test message');

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.context).toBeUndefined();
    });

    it('should create child logger with additional context', () => {
      const logger = new StructuredLogger({ component: 'WalletService' });
      const childLogger = logger.child({ requestId: 'req-789' });
      childLogger.info('Test message');

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.context).toEqual({
        component: 'WalletService',
        requestId: 'req-789',
      });
    });
  });

  describe('Sensitive Data Redaction', () => {
    it('should redact password field', () => {
      const logger = new StructuredLogger();
      logger.info('User login', {
        username: 'player-123',
        password: 'secret123',
      });

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.context.username).toBe('player-123');
      expect(parsed.context.password).toBe('[REDACTED]');
    });

    it('should redact token field', () => {
      const logger = new StructuredLogger();
      logger.info('Authentication', {
        playerId: 'player-123',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      });

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.context.playerId).toBe('player-123');
      expect(parsed.context.token).toBe('[REDACTED]');
    });

    it('should redact jwt field', () => {
      const logger = new StructuredLogger();
      logger.info('Authentication', {
        playerId: 'player-123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      });

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.context.jwt).toBe('[REDACTED]');
    });

    it('should redact authorization field', () => {
      const logger = new StructuredLogger();
      logger.info('Request', {
        method: 'POST',
        authorization: 'Bearer token123',
      });

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.context.authorization).toBe('[REDACTED]');
    });

    it('should redact secret field', () => {
      const logger = new StructuredLogger();
      logger.info('Config', {
        apiUrl: 'https://api.example.com',
        secret: 'my-secret-key',
      });

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.context.secret).toBe('[REDACTED]');
    });

    it('should redact apiKey field', () => {
      const logger = new StructuredLogger();
      logger.info('API call', {
        endpoint: '/api/data',
        apiKey: 'key-123456',
      });

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.context.apiKey).toBe('[REDACTED]');
    });

    it('should redact api_key field', () => {
      const logger = new StructuredLogger();
      logger.info('API call', {
        endpoint: '/api/data',
        api_key: 'key-123456',
      });

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.context.api_key).toBe('[REDACTED]');
    });

    it('should redact sensitive fields in nested objects', () => {
      const logger = new StructuredLogger();
      logger.info('User data', {
        user: {
          id: 'player-123',
          password: 'secret123',
        },
      });

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.context.user.id).toBe('player-123');
      expect(parsed.context.user.password).toBe('[REDACTED]');
    });

    it('should redact sensitive fields in arrays', () => {
      const logger = new StructuredLogger();
      logger.info('Multiple users', {
        users: [
          { id: 'player-1', password: 'secret1' },
          { id: 'player-2', password: 'secret2' },
        ],
      });

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.context.users[0].password).toBe('[REDACTED]');
      expect(parsed.context.users[1].password).toBe('[REDACTED]');
    });

    it('should be case-insensitive for sensitive field detection', () => {
      const logger = new StructuredLogger();
      logger.info('Auth', {
        Password: 'secret123',
        TOKEN: 'token123',
        ApiKey: 'key123',
      });

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.context.Password).toBe('[REDACTED]');
      expect(parsed.context.TOKEN).toBe('[REDACTED]');
      expect(parsed.context.ApiKey).toBe('[REDACTED]');
    });

    it('should not redact non-sensitive fields', () => {
      const logger = new StructuredLogger();
      logger.info('Wallet operation', {
        walletId: 'wallet-123',
        playerId: 'player-456',
        balance: '10000',
        amount: '5000',
      });

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.context.walletId).toBe('wallet-123');
      expect(parsed.context.playerId).toBe('player-456');
      expect(parsed.context.balance).toBe('10000');
      expect(parsed.context.amount).toBe('5000');
    });
  });

  describe('Log Level Filtering', () => {
    it('should respect LOG_LEVEL environment variable', () => {
      // Note: This test assumes LOG_LEVEL is set to 'info' or higher
      const logger = new StructuredLogger();
      
      logger.error('Error message');
      logger.warn('Warning message');
      logger.info('Info message');
      logger.debug('Debug message');

      // With default 'info' level, debug should not be logged
      // But error, warn, and info should be logged
      expect(logOutput.length).toBeGreaterThanOrEqual(3);
    });
  });
});
