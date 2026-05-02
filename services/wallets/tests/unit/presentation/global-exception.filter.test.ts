import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { GlobalExceptionFilter } from '../../../src/presentation/filters/global-exception.filter';
import { WalletAlreadyExistsError, WalletNotFoundError } from '../../../src/application/errors';
import { InsufficientBalanceError } from '../../../src/domain/wallet';
import { InvalidMoneyError, NegativeMoneyError, Money } from '../../../src/domain/money';
import { InvalidWalletIdError } from '../../../src/domain/wallet-id';
import { InvalidPlayerIdError } from '../../../src/domain/player-id';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';

/**
 * Unit Tests for Global Exception Filter
 * 
 * Validates that the global exception filter correctly maps errors to HTTP responses
 * with consistent formatting, request IDs, and appropriate logging.
 */

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();

    // Mock response object
    mockResponse = {
      status: mock((code: number) => mockResponse),
      json: mock((body: any) => mockResponse),
    };

    // Mock request object
    mockRequest = {
      method: 'POST',
      url: '/wallets',
      user: { playerId: 'test-player-123' },
    };

    // Mock ArgumentsHost
    mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as ArgumentsHost;
  });

  describe('Domain Error Mapping', () => {
    it('should map WalletAlreadyExistsError to 409 Conflict', () => {
      const error = new WalletAlreadyExistsError('player-123');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.code).toBe('WALLET_ALREADY_EXISTS');
      expect(responseBody.error.message).toContain('player-123');
      expect(responseBody.error.requestId).toBeDefined();
      expect(responseBody.error.timestamp).toBeDefined();
    });

    it('should map WalletNotFoundError to 404 Not Found', () => {
      const error = new WalletNotFoundError('player-123');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.code).toBe('WALLET_NOT_FOUND');
      expect(responseBody.error.message).toContain('player-123');
    });

    it('should map InsufficientBalanceError to 422 Unprocessable Entity with details', () => {
      const requestedAmount = Money.fromCentavos(10000n);
      const currentBalance = Money.fromCentavos(5000n);

      if (!requestedAmount.ok || !currentBalance.ok) {
        throw new Error('Failed to create Money instances');
      }

      const error = new InsufficientBalanceError(
        requestedAmount.value,
        currentBalance.value
      );

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.code).toBe('INSUFFICIENT_BALANCE');
      expect(responseBody.error.details).toBeDefined();
      expect(responseBody.error.details.requestedAmount).toBe('10000');
      expect(responseBody.error.details.currentBalance).toBe('5000');
    });

    it('should map InvalidMoneyError to 400 Bad Request', () => {
      const error = new InvalidMoneyError('Money value cannot be negative');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.code).toBe('INVALID_MONEY');
    });

    it('should map NegativeMoneyError to 400 Bad Request', () => {
      const error = new NegativeMoneyError('Cannot subtract: result would be negative');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.code).toBe('INVALID_MONEY');
    });

    it('should map InvalidWalletIdError to 400 Bad Request', () => {
      const error = new InvalidWalletIdError('Invalid wallet ID format');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.code).toBe('INVALID_WALLET_ID');
    });

    it('should map InvalidPlayerIdError to 400 Bad Request', () => {
      const error = new InvalidPlayerIdError('Invalid player ID format');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.code).toBe('INVALID_PLAYER_ID');
    });
  });

  describe('HTTP Exception Mapping', () => {
    it('should map HttpException with correct status and message', () => {
      const error = new HttpException('Unauthorized access', HttpStatus.UNAUTHORIZED);

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.code).toBe('UNAUTHORIZED');
      expect(responseBody.error.message).toBe('Unauthorized access');
    });

    it('should handle HttpException with object response', () => {
      const error = new HttpException(
        { message: 'Validation failed', error: { field: 'amount' } },
        HttpStatus.BAD_REQUEST
      );

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.code).toBe('BAD_REQUEST');
      expect(responseBody.error.message).toBe('Validation failed');
    });
  });

  describe('Infrastructure Error Mapping', () => {
    it('should map database connection errors to 503 Service Unavailable', () => {
      const error = new Error('Failed to connect to database');
      error.name = 'DatabaseConnectionError';

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.code).toBe('DATABASE_UNAVAILABLE');
    });

    it('should map database timeout errors to 504 Gateway Timeout', () => {
      const error = new Error('Query timeout exceeded');
      error.name = 'DatabaseTimeoutError';

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.GATEWAY_TIMEOUT);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.code).toBe('DATABASE_TIMEOUT');
    });

    it('should map lock acquisition errors to 409 Conflict', () => {
      const error = new Error('Failed to acquire lock on resource');
      error.name = 'LockAcquisitionError';

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.code).toBe('LOCK_CONFLICT');
    });

    it('should map Prisma errors to database errors', () => {
      const error = new Error('Prisma query failed');
      error.name = 'PrismaClientKnownRequestError';

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('Unknown Error Mapping', () => {
    it('should map unknown errors to 500 Internal Server Error', () => {
      const error = new Error('Something unexpected happened');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(responseBody.error.message).toBe('An unexpected error occurred');
    });

    it('should handle non-Error exceptions', () => {
      const error = 'String error';

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('Error Response Structure', () => {
    it('should include all required fields in error response', () => {
      const error = new WalletNotFoundError('player-123');

      filter.catch(error, mockArgumentsHost);

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error).toBeDefined();
      expect(responseBody.error.code).toBeDefined();
      expect(responseBody.error.message).toBeDefined();
      expect(responseBody.error.timestamp).toBeDefined();
      expect(responseBody.error.requestId).toBeDefined();
    });

    it('should generate unique request IDs for different errors', () => {
      const error1 = new WalletNotFoundError('player-123');
      const error2 = new WalletNotFoundError('player-456');

      filter.catch(error1, mockArgumentsHost);
      const requestId1 = mockResponse.json.mock.calls[0][0].error.requestId;

      // Create new mock response for second call
      const mockResponse2 = {
        status: mock((code: number) => mockResponse2),
        json: mock((body: any) => mockResponse2),
      };

      const mockArgumentsHost2 = {
        switchToHttp: () => ({
          getResponse: () => mockResponse2,
          getRequest: () => mockRequest,
        }),
      } as ArgumentsHost;

      filter.catch(error2, mockArgumentsHost2);
      const requestId2 = mockResponse2.json.mock.calls[0][0].error.requestId;

      expect(requestId1).not.toBe(requestId2);
    });

    it('should format timestamp as ISO 8601', () => {
      const error = new WalletNotFoundError('player-123');

      filter.catch(error, mockArgumentsHost);

      const responseBody = mockResponse.json.mock.calls[0][0];
      const timestamp = responseBody.error.timestamp;

      // Verify ISO 8601 format
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });

    it('should include details field only when present', () => {
      const error = new WalletNotFoundError('player-123');

      filter.catch(error, mockArgumentsHost);

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.details).toBeUndefined();
    });

    it('should include details field for errors with additional context', () => {
      const requestedAmount = Money.fromCentavos(10000n);
      const currentBalance = Money.fromCentavos(5000n);

      if (!requestedAmount.ok || !currentBalance.ok) {
        throw new Error('Failed to create Money instances');
      }

      const error = new InsufficientBalanceError(
        requestedAmount.value,
        currentBalance.value
      );

      filter.catch(error, mockArgumentsHost);

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.details).toBeDefined();
      expect(typeof responseBody.error.details).toBe('object');
    });
  });

  describe('Error Logging', () => {
    it('should log server errors (5xx) with error level', () => {
      const error = new Error('Database connection failed');
      error.name = 'DatabaseConnectionError';

      // Spy on logger
      const loggerErrorSpy = mock(() => {});
      (filter as any).logger.error = loggerErrorSpy;

      filter.catch(error, mockArgumentsHost);

      expect(loggerErrorSpy).toHaveBeenCalled();
      const logMessage = loggerErrorSpy.mock.calls[0][0];
      expect(logMessage).toContain('Server error');
    });

    it('should log client errors (4xx) with warn level', () => {
      const error = new WalletNotFoundError('player-123');

      // Spy on logger
      const loggerWarnSpy = mock(() => {});
      (filter as any).logger.warn = loggerWarnSpy;

      filter.catch(error, mockArgumentsHost);

      expect(loggerWarnSpy).toHaveBeenCalled();
      const logMessage = loggerWarnSpy.mock.calls[0][0];
      expect(logMessage).toContain('Client error');
    });

    it('should include request context in logs', () => {
      const error = new WalletNotFoundError('player-123');

      // Spy on logger
      const loggerWarnSpy = mock(() => {});
      (filter as any).logger.warn = loggerWarnSpy;

      filter.catch(error, mockArgumentsHost);

      expect(loggerWarnSpy).toHaveBeenCalled();
      const logContext = loggerWarnSpy.mock.calls[0][1];
      
      // Parse JSON context
      const context = JSON.parse(logContext);
      expect(context.method).toBe('POST');
      expect(context.url).toBe('/wallets');
      expect(context.requestId).toBeDefined();
      expect(context.statusCode).toBe(404);
    });

    it('should include player ID in logs when available', () => {
      const error = new WalletNotFoundError('player-123');

      // Spy on logger
      const loggerWarnSpy = mock(() => {});
      (filter as any).logger.warn = loggerWarnSpy;

      filter.catch(error, mockArgumentsHost);

      expect(loggerWarnSpy).toHaveBeenCalled();
      const logContext = loggerWarnSpy.mock.calls[0][1];
      
      // Parse JSON context
      const context = JSON.parse(logContext);
      expect(context.playerId).toBe('test-player-123');
    });

    it('should include error name and message in logs', () => {
      const error = new WalletAlreadyExistsError('player-123');

      // Spy on logger
      const loggerWarnSpy = mock(() => {});
      (filter as any).logger.warn = loggerWarnSpy;

      filter.catch(error, mockArgumentsHost);

      expect(loggerWarnSpy).toHaveBeenCalled();
      const logContext = loggerWarnSpy.mock.calls[0][1];
      
      // Parse JSON context
      const context = JSON.parse(logContext);
      expect(context.errorName).toBe('WalletAlreadyExistsError');
      expect(context.errorMessage).toContain('player-123');
    });

    it('should include stack trace for server errors', () => {
      const error = new Error('Unexpected database error');
      error.name = 'DatabaseError';

      // Spy on logger
      const loggerErrorSpy = mock(() => {});
      (filter as any).logger.error = loggerErrorSpy;

      filter.catch(error, mockArgumentsHost);

      expect(loggerErrorSpy).toHaveBeenCalled();
      expect(loggerErrorSpy.mock.calls[0].length).toBeGreaterThanOrEqual(2);
      const stackTrace = loggerErrorSpy.mock.calls[0][1];
      expect(typeof stackTrace).toBe('string');
    });

    it('should include timestamp in log context', () => {
      const error = new WalletNotFoundError('player-123');

      // Spy on logger
      const loggerWarnSpy = mock(() => {});
      (filter as any).logger.warn = loggerWarnSpy;

      filter.catch(error, mockArgumentsHost);

      expect(loggerWarnSpy).toHaveBeenCalled();
      const logContext = loggerWarnSpy.mock.calls[0][1];
      
      // Parse JSON context
      const context = JSON.parse(logContext);
      expect(context.timestamp).toBeDefined();
      expect(context.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle logging when player ID is not available', () => {
      const error = new WalletNotFoundError('player-123');

      // Mock request without user
      const mockRequestWithoutUser = {
        method: 'POST',
        url: '/wallets',
      };

      const mockArgumentsHostWithoutUser = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequestWithoutUser,
        }),
      } as ArgumentsHost;

      // Spy on logger
      const loggerWarnSpy = mock(() => {});
      (filter as any).logger.warn = loggerWarnSpy;

      filter.catch(error, mockArgumentsHostWithoutUser);

      expect(loggerWarnSpy).toHaveBeenCalled();
      const logContext = loggerWarnSpy.mock.calls[0][1];
      
      // Parse JSON context
      const context = JSON.parse(logContext);
      expect(context.playerId).toBeUndefined();
    });

    it('should handle logging for non-Error exceptions', () => {
      const error = 'String error message';

      // Spy on logger
      const loggerErrorSpy = mock(() => {});
      (filter as any).logger.error = loggerErrorSpy;

      filter.catch(error, mockArgumentsHost);

      expect(loggerErrorSpy).toHaveBeenCalled();
      const logMessage = loggerErrorSpy.mock.calls[0][0];
      expect(logMessage).toContain('Server error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors with missing message property', () => {
      const error = new Error();
      error.name = 'UnknownError';

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.message).toBeDefined();
    });

    it('should handle null exception', () => {
      const error = null;

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should handle undefined exception', () => {
      const error = undefined;

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should handle database errors with connection keyword in message', () => {
      const error = new Error('connection refused by database server');
      error.name = 'DatabaseError';

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.code).toBe('DATABASE_UNAVAILABLE');
    });

    it('should handle database errors with timeout keyword in message', () => {
      const error = new Error('Operation timeout after 5000ms');
      error.name = 'DatabaseError';

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.GATEWAY_TIMEOUT);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.code).toBe('DATABASE_TIMEOUT');
    });

    it('should handle database errors with deadlock keyword in message', () => {
      const error = new Error('Deadlock detected during transaction');
      error.name = 'Error';

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.code).toBe('LOCK_CONFLICT');
    });

    it('should handle HttpException with string response', () => {
      const error = new HttpException('Forbidden resource', HttpStatus.FORBIDDEN);

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.code).toBe('FORBIDDEN');
      expect(responseBody.error.message).toBe('Forbidden resource');
    });

    it('should handle HttpException with complex object response', () => {
      const error = new HttpException(
        {
          message: 'Multiple validation errors',
          error: {
            fields: ['amount', 'playerId'],
            details: 'Invalid input format',
          },
        },
        HttpStatus.BAD_REQUEST
      );

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalled();

      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.error.code).toBe('BAD_REQUEST');
      expect(responseBody.error.message).toBe('Multiple validation errors');
      expect(responseBody.error.details).toBeDefined();
    });
  });
});
