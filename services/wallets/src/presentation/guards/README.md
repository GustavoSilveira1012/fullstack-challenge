# JWT Authentication Guard

## Overview

The `JwtAuthGuard` is a NestJS guard that validates JWT tokens issued by Keycloak and extracts the player ID from the token's `sub` claim. It implements authentication for REST endpoints by:

1. Extracting JWT token from the `Authorization` header
2. Validating token signature using the configured JWT secret
3. Validating token expiration timestamp
4. Validating token issuer matches the configured Keycloak realm
5. Extracting the player ID from the token's `sub` claim
6. Attaching the player ID to the request object for use in controllers

## Requirements Validated

- **Requirement 9.1**: Validates JWT token in Authorization header
- **Requirement 9.2**: Extracts player ID from token claims
- **Requirement 9.3**: Returns 401 for missing or invalid tokens
- **Requirement 9.5**: Associates operations with authenticated player ID

## Usage

### Basic Usage in Controller

```typescript
import { Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard, AuthenticatedRequest } from '../guards';

@Controller('wallets')
@UseGuards(JwtAuthGuard) // Apply to all routes in this controller
export class WalletsController {
  @Post()
  async createWallet(@Request() req: AuthenticatedRequest) {
    // Access the authenticated player ID
    const playerId = req.playerId;
    // Use playerId in your use case
    return this.createWalletUseCase.execute(playerId);
  }

  @Get('me')
  async getMyWallet(@Request() req: AuthenticatedRequest) {
    const playerId = req.playerId;
    return this.getWalletUseCase.execute(playerId);
  }
}
```

### Apply to Specific Routes

```typescript
@Controller('wallets')
export class WalletsController {
  @Get('health')
  // No guard - public endpoint
  healthCheck() {
    return { status: 'ok' };
  }

  @Post()
  @UseGuards(JwtAuthGuard) // Apply only to this route
  async createWallet(@Request() req: AuthenticatedRequest) {
    const playerId = req.playerId;
    return this.createWalletUseCase.execute(playerId);
  }
}
```

## Request Format

The guard expects the JWT token in the `Authorization` header with the `Bearer` scheme:

```
Authorization: Bearer <jwt-token>
```

## Token Validation

The guard validates the following JWT properties:

1. **Signature**: Verified using `JWT_SECRET` from environment config
2. **Algorithm**: Must be HS256 (Keycloak shared secret algorithm)
3. **Issuer**: Must match `JWT_ISSUER` from environment config
4. **Expiration**: Token must not be expired (`exp` claim)
5. **Subject**: Must contain a valid player ID (`sub` claim)

## Error Responses

The guard throws `UnauthorizedException` (HTTP 401) in the following cases:

| Scenario | Error Message |
|----------|---------------|
| Missing Authorization header | "Missing or invalid Authorization header" |
| Invalid header format | "Missing or invalid Authorization header" |
| Invalid token signature | "Invalid token signature or format" |
| Expired token | "Token has expired" |
| Token not yet valid | "Token not yet valid" |
| Wrong issuer | "Token validation failed" |
| Missing sub claim | "Token missing sub claim (player ID)" |
| Invalid player ID | "Invalid player ID in token: ..." |

## Configuration

The guard uses the following environment variables (configured in `environment.config.ts`):

- `JWT_SECRET`: Shared secret for verifying token signatures
- `JWT_ISSUER`: Expected token issuer (Keycloak realm URL)

Example `.env` configuration:

```env
JWT_SECRET=shared-secret-from-keycloak
JWT_ISSUER=http://keycloak:8080/realms/crash-game
```

## Testing

Unit tests are located in `tests/unit/presentation/jwt-auth.guard.test.ts` and cover:

- ✅ Valid token authentication
- ✅ Missing Authorization header
- ✅ Invalid header format
- ✅ Invalid token signature
- ✅ Expired tokens
- ✅ Wrong issuer
- ✅ Missing sub claim
- ✅ Invalid player ID formats
- ✅ Tokens with additional claims
- ✅ Various player ID formats (UUID, alphanumeric)

Run tests with:

```bash
bun test tests/unit/presentation/jwt-auth.guard.test.ts
```

## Implementation Details

### AuthenticatedRequest Interface

The guard extends the Express `Request` interface to include the extracted `playerId`:

```typescript
export interface AuthenticatedRequest extends Request {
  playerId: PlayerId;
}
```

This allows controllers to access the authenticated player ID in a type-safe manner.

### PlayerId Value Object

The guard uses the `PlayerId` value object from the domain layer to ensure player IDs are valid:

- Must be a non-empty string
- Whitespace-only strings are rejected
- Immutable after creation

### Token Validation Flow

```
1. Extract token from Authorization header
   ↓
2. Verify token signature with JWT_SECRET
   ↓
3. Verify token expiration (exp claim)
   ↓
4. Verify token issuer matches JWT_ISSUER
   ↓
5. Extract sub claim (player ID)
   ↓
6. Validate player ID format
   ↓
7. Attach PlayerId to request object
   ↓
8. Allow request to proceed
```

## Security Considerations

1. **Token Verification**: All tokens are cryptographically verified using the shared secret
2. **Expiration Checking**: Expired tokens are automatically rejected
3. **Issuer Validation**: Only tokens from the configured Keycloak realm are accepted
4. **Algorithm Restriction**: Only HS256 algorithm is allowed (prevents algorithm confusion attacks)
5. **No Token Storage**: Tokens are validated on each request (stateless authentication)

## Integration with Use Cases

Controllers should extract the `playerId` from the authenticated request and pass it to use cases:

```typescript
@Post()
@UseGuards(JwtAuthGuard)
async createWallet(@Request() req: AuthenticatedRequest) {
  // Extract playerId from authenticated request
  const playerId = req.playerId;
  
  // Pass to use case
  const result = await this.createWalletUseCase.execute(playerId);
  
  // Handle result
  if (!result.ok) {
    throw new ConflictException(result.error.message);
  }
  
  return result.value;
}
```

This ensures that:
- Authentication is handled at the presentation layer
- Domain logic remains pure and testable
- Player ID is validated before reaching use cases
