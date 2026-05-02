# Logging Infrastructure

This module provides structured JSON logging with request ID tracking and sensitive data redaction.

## Components

### StructuredLogger

The main logging service that outputs JSON-formatted logs to stdout.

**Features:**
- JSON-formatted output for log aggregation systems
- Configurable log levels (error, warn, info, debug)
- Automatic sensitive data redaction
- Context support for structured logging
- Child logger creation for scoped contexts

**Usage:**

```typescript
import { StructuredLogger } from './infrastructure/logging';

const logger = new StructuredLogger({ component: 'WalletService' });

// Simple logging
logger.info('Wallet created');

// Logging with context
logger.info('Balance updated', {
  walletId: 'wallet-123',
  playerId: 'player-456',
  previousBalance: '10000',
  newBalance: '15000',
});

// Error logging with stack trace
logger.error('Database connection failed', {
  error: 'Connection timeout',
}, error.stack);

// Create child logger with additional context
const childLogger = logger.child({ requestId: 'req-789' });
childLogger.info('Processing request');
```

### RequestIdMiddleware

Middleware that generates or extracts a unique request ID for each HTTP request.

**Features:**
- Generates UUID v4 for each request
- Accepts existing request ID from `X-Request-ID` header
- Adds request ID to response headers
- Attaches request ID to Express request object

**Configuration:**

```typescript
import { RequestIdMiddleware } from './infrastructure/logging';

// In AppModule
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes('*');
  }
}
```

### LoggingInterceptor

Interceptor that automatically logs all HTTP requests and responses.

**Features:**
- Logs incoming requests with method, URL, and request ID
- Logs completed requests with status code and duration
- Logs failed requests with error details
- Automatic timing measurement

**Configuration:**

```typescript
import { LoggingInterceptor } from './infrastructure/logging';

// In main.ts
app.useGlobalInterceptors(new LoggingInterceptor());
```

## Log Format

All logs are output as JSON with the following structure:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "service": "wallet-service",
  "message": "Balance updated",
  "context": {
    "walletId": "wallet-123",
    "playerId": "player-456",
    "previousBalance": "10000",
    "newBalance": "15000",
    "requestId": "req-789"
  }
}
```

## Log Levels

Log levels are configured via the `LOG_LEVEL` environment variable:

- `error`: Only error messages
- `warn`: Warnings and errors
- `info`: Informational messages, warnings, and errors (default)
- `debug`: All messages including debug information

## Sensitive Data Redaction

The following fields are automatically redacted from logs:

- `password`
- `token`
- `jwt`
- `authorization`
- `secret`
- `apiKey`
- `api_key`

Redacted fields are replaced with `[REDACTED]` in the log output.

**Example:**

```typescript
logger.info('User authenticated', {
  playerId: 'player-123',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
});

// Output:
// {
//   "timestamp": "2024-01-15T10:30:00.000Z",
//   "level": "info",
//   "service": "wallet-service",
//   "message": "User authenticated",
//   "context": {
//     "playerId": "player-123",
//     "token": "[REDACTED]"
//   }
// }
```

## Best Practices

1. **Use structured context**: Always provide context objects instead of string interpolation
   ```typescript
   // Good
   logger.info('Wallet created', { walletId, playerId });
   
   // Avoid
   logger.info(`Wallet ${walletId} created for player ${playerId}`);
   ```

2. **Create child loggers**: Use child loggers to add persistent context
   ```typescript
   const walletLogger = logger.child({ component: 'WalletService' });
   ```

3. **Log at appropriate levels**:
   - `error`: Unrecoverable errors, infrastructure failures
   - `warn`: Recoverable errors, business rule violations
   - `info`: Successful operations, state changes
   - `debug`: Detailed operation flow, debugging information

4. **Include request ID**: Always include request ID in logs for request correlation
   ```typescript
   logger.info('Processing bet', { requestId: req.requestId, betId });
   ```

5. **Avoid logging sensitive data**: Never log JWT tokens, passwords, or personal information
