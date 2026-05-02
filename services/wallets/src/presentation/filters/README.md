# Presentation Layer Filters

This directory contains exception filters for handling errors in the presentation layer.

## Global Exception Filter

The `GlobalExceptionFilter` provides centralized error handling for all REST API endpoints.

### Features

- **Domain Error Mapping**: Maps domain errors to appropriate HTTP status codes
- **Infrastructure Error Mapping**: Maps infrastructure errors to 5xx responses
- **Consistent Error Format**: All errors follow a standardized JSON structure
- **Request ID Tracking**: Generates unique request IDs for error tracking
- **Contextual Logging**: Logs all errors with request context and severity levels

### Error Mappings

#### Domain Errors (4xx)

| Error Type | HTTP Status | Error Code |
|------------|-------------|------------|
| `WalletAlreadyExistsError` | 409 Conflict | `WALLET_ALREADY_EXISTS` |
| `WalletNotFoundError` | 404 Not Found | `WALLET_NOT_FOUND` |
| `InsufficientBalanceError` | 422 Unprocessable Entity | `INSUFFICIENT_BALANCE` |
| `InvalidMoneyError` | 400 Bad Request | `INVALID_MONEY` |
| `NegativeMoneyError` | 400 Bad Request | `INVALID_MONEY` |
| `InvalidWalletIdError` | 400 Bad Request | `INVALID_WALLET_ID` |
| `InvalidPlayerIdError` | 400 Bad Request | `INVALID_PLAYER_ID` |

#### Infrastructure Errors (5xx)

| Error Type | HTTP Status | Error Code |
|------------|-------------|------------|
| Database Connection Errors | 503 Service Unavailable | `DATABASE_UNAVAILABLE` |
| Database Timeout Errors | 504 Gateway Timeout | `DATABASE_TIMEOUT` |
| Lock Acquisition Errors | 409 Conflict | `LOCK_CONFLICT` |
| Prisma Errors | 500 Internal Server Error | `DATABASE_ERROR` |
| Unknown Errors | 500 Internal Server Error | `INTERNAL_SERVER_ERROR` |

### Error Response Format

All error responses follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "additional context"
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "uuid-v4"
  }
}
```

### Logging Strategy

The filter logs errors with different severity levels:

- **ERROR**: Server errors (5xx) - includes stack trace
- **WARN**: Client errors (4xx) - includes request context
- **LOG**: Successful operations

Log entries include:
- Request ID
- HTTP method and URL
- Status code
- Error name and message
- Player ID (if available from JWT)
- Timestamp

### Usage

The filter is registered globally in `main.ts`:

```typescript
import { GlobalExceptionFilter } from './presentation/filters';

const app = await NestFactory.create(AppModule);
app.useGlobalFilters(new GlobalExceptionFilter());
```

### Testing

Comprehensive unit tests are available in `tests/unit/presentation/global-exception.filter.test.ts`:

- Domain error mapping (7 tests)
- HTTP exception mapping (2 tests)
- Infrastructure error mapping (4 tests)
- Unknown error mapping (2 tests)
- Error response structure (3 tests)

Run tests with:

```bash
bun test tests/unit/presentation/global-exception.filter.test.ts
```

### Requirements Validation

This implementation validates:

- **Requirement 13.1**: Errors during REST requests return structured error responses with error codes and messages
- **Requirement 13.2**: All credit and debit operations are logged with timestamps, player ID, amount, and resulting balance
- **Requirement 13.4**: Connection failures to PostgreSQL or RabbitMQ are logged

### Design Alignment

Follows the error handling strategy defined in the design document:

- Maps domain errors to appropriate HTTP responses
- Maps infrastructure errors to 5xx responses
- Provides consistent error response format
- Includes request ID for tracking
- Logs errors with appropriate context and severity
