import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { WalletAlreadyExistsError, WalletNotFoundError } from '../../application/errors';
import { InsufficientBalanceError } from '../../domain/wallet';
import { InvalidMoneyError, NegativeMoneyError } from '../../domain/money';
import { InvalidWalletIdError } from '../../domain/wallet-id';
import { InvalidPlayerIdError } from '../../domain/player-id';

/**
 * Error Response Structure
 * 
 * Consistent error response format for all API errors.
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    requestId: string;
  };
}

/**
 * Global Exception Filter
 * 
 * Catches all exceptions thrown in the application and maps them to appropriate
 * HTTP responses with consistent error formatting.
 * 
 * Responsibilities:
 * - Map domain errors to HTTP status codes
 * - Map infrastructure errors to 5xx responses
 * - Format error responses with consistent structure
 * - Add request ID to error responses
 * - Log all errors with context
 * 
 * Validates: Requirements 13.1, 13.2, 13.4
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Generate unique request ID for tracking
    const requestId = randomUUID();

    // Determine HTTP status and error details
    const { status, errorCode, message, details } = this.mapExceptionToResponse(exception);

    // Build error response
    const errorResponse: ErrorResponse = {
      error: {
        code: errorCode,
        message,
        ...(details && { details }),
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    // Log error with context
    this.logError(exception, request, requestId, status);

    // Send response
    response.status(status).json(errorResponse);
  }

  /**
   * Maps exception to HTTP response details
   */
  private mapExceptionToResponse(exception: unknown): {
    status: number;
    errorCode: string;
    message: string;
    details?: Record<string, unknown>;
  } {
    // Handle NestJS HttpException
    if (exception instanceof HttpException) {
      return this.mapHttpException(exception);
    }

    // Handle domain errors
    if (exception instanceof WalletAlreadyExistsError) {
      return {
        status: HttpStatus.CONFLICT,
        errorCode: 'WALLET_ALREADY_EXISTS',
        message: exception.message,
      };
    }

    if (exception instanceof WalletNotFoundError) {
      return {
        status: HttpStatus.NOT_FOUND,
        errorCode: 'WALLET_NOT_FOUND',
        message: exception.message,
      };
    }

    if (exception instanceof InsufficientBalanceError) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errorCode: 'INSUFFICIENT_BALANCE',
        message: exception.message,
        details: {
          requestedAmount: exception.requestedAmount.toCentavos().toString(),
          currentBalance: exception.currentBalance.toCentavos().toString(),
        },
      };
    }

    if (exception instanceof InvalidMoneyError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        errorCode: 'INVALID_MONEY',
        message: exception.message,
      };
    }

    if (exception instanceof NegativeMoneyError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        errorCode: 'INVALID_MONEY',
        message: exception.message,
      };
    }

    if (exception instanceof InvalidWalletIdError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        errorCode: 'INVALID_WALLET_ID',
        message: exception.message,
      };
    }

    if (exception instanceof InvalidPlayerIdError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        errorCode: 'INVALID_PLAYER_ID',
        message: exception.message,
      };
    }

    // Handle database errors (infrastructure)
    if (this.isDatabaseError(exception)) {
      return this.mapDatabaseError(exception);
    }

    // Handle unknown errors
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    };
  }

  /**
   * Maps NestJS HttpException to response details
   */
  private mapHttpException(exception: HttpException): {
    status: number;
    errorCode: string;
    message: string;
    details?: Record<string, unknown>;
  } {
    const status = exception.getStatus();
    const response = exception.getResponse();

    // Handle structured error response
    if (typeof response === 'object' && response !== null) {
      const errorResponse = response as Record<string, unknown>;
      return {
        status,
        errorCode: this.getErrorCodeFromStatus(status),
        message: (errorResponse.message as string) || exception.message,
        details: errorResponse.error ? (errorResponse.error as Record<string, unknown>) : undefined,
      };
    }

    // Handle string error response
    return {
      status,
      errorCode: this.getErrorCodeFromStatus(status),
      message: typeof response === 'string' ? response : exception.message,
    };
  }

  /**
   * Maps database errors to response details
   */
  private mapDatabaseError(exception: unknown): {
    status: number;
    errorCode: string;
    message: string;
  } {
    const error = exception as Error;

    // Check for connection errors
    if (error.message.includes('connect') || error.message.includes('connection')) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        errorCode: 'DATABASE_UNAVAILABLE',
        message: 'Database service is currently unavailable',
      };
    }

    // Check for timeout errors
    if (error.message.includes('timeout')) {
      return {
        status: HttpStatus.GATEWAY_TIMEOUT,
        errorCode: 'DATABASE_TIMEOUT',
        message: 'Database query exceeded timeout',
      };
    }

    // Check for lock acquisition errors
    if (error.message.includes('lock') || error.message.includes('deadlock')) {
      return {
        status: HttpStatus.CONFLICT,
        errorCode: 'LOCK_CONFLICT',
        message: 'Failed to acquire resource lock',
      };
    }

    // Generic database error
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: 'DATABASE_ERROR',
      message: 'A database error occurred',
    };
  }

  /**
   * Checks if exception is a database error
   */
  private isDatabaseError(exception: unknown): boolean {
    if (!(exception instanceof Error)) {
      return false;
    }

    const error = exception as Error;
    const errorName = error.name.toLowerCase();
    const errorMessage = error.message.toLowerCase();

    // Check for lock errors first (should be handled separately)
    if (errorName.includes('lock') || errorMessage.includes('lock') || 
        errorName.includes('deadlock') || errorMessage.includes('deadlock')) {
      return true;
    }

    // Check for Prisma errors
    if (errorName.includes('prisma')) {
      return true;
    }

    // Check for common database error patterns
    const databaseErrorPatterns = [
      'database',
      'connection',
      'query',
      'transaction',
      'constraint',
      'unique',
      'foreign key',
    ];

    return databaseErrorPatterns.some(
      (pattern) => errorName.includes(pattern) || errorMessage.includes(pattern)
    );
  }

  /**
   * Gets error code from HTTP status
   */
  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_SERVER_ERROR';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SERVICE_UNAVAILABLE';
      case HttpStatus.GATEWAY_TIMEOUT:
        return 'GATEWAY_TIMEOUT';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  /**
   * Logs error with context
   */
  private logError(
    exception: unknown,
    request: Request,
    requestId: string,
    status: number
  ): void {
    const error = exception instanceof Error ? exception : new Error(String(exception));

    // Determine log level based on status code
    const isClientError = status >= 400 && status < 500;
    const isServerError = status >= 500;

    // Build log context
    const logContext = {
      requestId,
      method: request.method,
      url: request.url,
      statusCode: status,
      errorName: error.name,
      errorMessage: error.message,
      playerId: (request as any).user?.playerId, // Extract from JWT if available
      timestamp: new Date().toISOString(),
    };

    // Log based on severity
    if (isServerError) {
      this.logger.error(
        `Server error: ${error.message}`,
        error.stack,
        JSON.stringify(logContext)
      );
    } else if (isClientError) {
      this.logger.warn(
        `Client error: ${error.message}`,
        JSON.stringify(logContext)
      );
    } else {
      this.logger.log(
        `Request processed: ${error.message}`,
        JSON.stringify(logContext)
      );
    }
  }
}
