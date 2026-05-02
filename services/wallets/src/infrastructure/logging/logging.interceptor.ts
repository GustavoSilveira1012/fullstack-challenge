/**
 * Logging Interceptor
 * 
 * Automatically logs HTTP requests and responses with request ID and timing information.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { StructuredLogger } from './structured-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger: StructuredLogger;

  constructor() {
    this.logger = new StructuredLogger({ context: 'HTTP' });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const { method, url, requestId } = request;
    const startTime = Date.now();

    // Log incoming request
    this.logger.info('Incoming request', {
      method,
      url,
      requestId,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;

          // Log successful response
          this.logger.info('Request completed', {
            method,
            url,
            requestId,
            statusCode,
            duration,
          });
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;

          // Log error response
          this.logger.error('Request failed', {
            method,
            url,
            requestId,
            duration,
            error: error.message,
          }, error.stack);
        },
      })
    );
  }
}
