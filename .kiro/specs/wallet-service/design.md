# Design Document: Wallet Service

## Overview

The Wallet Service is a bounded context within the fullstack crash game application that manages player wallets, balances, and monetary operations. It is designed following Domain-Driven Design (DDD) principles with a clear separation between domain logic, application use cases, infrastructure concerns, and presentation layers.

### Core Responsibilities

- **Wallet Management**: Create and retrieve player wallets
- **Balance Operations**: Process credit and debit operations with exact monetary precision
- **Event-Driven Integration**: Consume events from the Game Service via RabbitMQ
- **Concurrency Control**: Ensure safe concurrent access to wallet balances
- **Authentication**: Validate JWT tokens and enforce player-specific access control

### Key Design Principles

1. **Exact Monetary Precision**: All monetary values are stored and processed as integer centavos (1/100 of base currency) to eliminate floating-point rounding errors
2. **Domain-Driven Design**: Business logic is encapsulated in the domain layer, isolated from infrastructure concerns
3. **Event-Driven Architecture**: Wallet operations are triggered by domain events from the Game Service
4. **Pessimistic Locking**: Database-level locking prevents race conditions during concurrent balance updates
5. **Idempotency**: Operations are designed to handle at-least-once message delivery semantics
6. **Type Safety**: TypeScript strict mode enforces compile-time type checking

### Technology Stack

- **Runtime**: Bun (Node.js-compatible JavaScript runtime)
- **Framework**: NestJS (TypeScript framework with dependency injection)
- **Database**: PostgreSQL 18+ (with exact precision numeric types)
- **ORM**: Prisma (type-safe database client with migration support)
- **Message Broker**: RabbitMQ (AMQP 0-9-1 protocol)
- **Authentication**: JWT validation (tokens issued by Keycloak)
- **API Gateway**: Kong (handles routing and initial JWT validation)

## Architecture

### Layered Architecture

The Wallet Service follows a four-layer DDD architecture:

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                      │
│  - REST Controllers (WalletsController, HealthController)│
│  - DTOs (CreateWalletDto, WalletResponseDto)            │
│  - Guards (JwtAuthGuard)                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Application Layer                       │
│  - Use Cases (CreateWalletUseCase, GetWalletUseCase,    │
│    ProcessBetPlacedUseCase, ProcessCashoutUseCase,      │
│    ProcessBetLostUseCase)                                │
│  - Application Services                                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    Domain Layer                          │
│  - Entities (Wallet)                                     │
│  - Value Objects (Money, WalletId, PlayerId)            │
│  - Domain Events (WalletCreated, BalanceCredited,       │
│    BalanceDebited, InsufficientBalanceError)            │
│  - Repository Interfaces (IWalletRepository)            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                     │
│  - Repository Implementations (PrismaWalletRepository)   │
│  - Message Broker (RabbitMQConsumer, RabbitMQPublisher) │
│  - Database Configuration (Prisma Client)                │
│  - External Service Clients                              │
└─────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

#### REST API Flow (Wallet Creation)

```mermaid
sequenceDiagram
    participant Client
    participant Kong as API Gateway
    participant Controller as WalletsController
    participant Guard as JwtAuthGuard
    participant UseCase as CreateWalletUseCase
    participant Wallet as Wallet Entity
    participant Repo as WalletRepository
    participant DB as PostgreSQL

    Client->>Kong: POST /wallets (JWT in header)
    Kong->>Controller: Forward request
    Controller->>Guard: Validate JWT
    Guard-->>Controller: Extract playerId
    Controller->>UseCase: execute(playerId)
    UseCase->>Wallet: create(playerId)
    Wallet-->>UseCase: Wallet instance
    UseCase->>Repo: save(wallet)
    Repo->>DB: INSERT INTO wallets
    DB-->>Repo: Success
    Repo-->>UseCase: Saved wallet
    UseCase-->>Controller: WalletResponseDto
    Controller-->>Client: 201 Created
```

#### Event-Driven Flow (Bet Placed)

```mermaid
sequenceDiagram
    participant Game as Game Service
    participant RabbitMQ
    participant Consumer as RabbitMQConsumer
    participant UseCase as ProcessBetPlacedUseCase
    participant Repo as WalletRepository
    participant DB as PostgreSQL

    Game->>RabbitMQ: Publish Bet_Placed_Event
    RabbitMQ->>Consumer: Deliver message
    Consumer->>UseCase: execute(playerId, amount)
    UseCase->>Repo: findByPlayerId(playerId) FOR UPDATE
    Repo->>DB: SELECT ... FOR UPDATE
    DB-->>Repo: Locked wallet
    Repo-->>UseCase: Wallet instance
    UseCase->>UseCase: wallet.debit(amount)
    alt Sufficient balance
        UseCase->>Repo: save(wallet)
        Repo->>DB: UPDATE wallets SET balance = ...
        DB-->>Repo: Success
        UseCase-->>Consumer: Success
        Consumer->>RabbitMQ: ACK message
    else Insufficient balance
        UseCase->>RabbitMQ: Publish Insufficient_Balance_Error
        UseCase-->>Consumer: Error
        Consumer->>RabbitMQ: ACK message (processed)
    end
```

### Concurrency Control Strategy

The service uses **pessimistic locking** at the database level to prevent race conditions:

1. **SELECT FOR UPDATE**: When processing balance operations, the repository acquires an exclusive row lock
2. **Transaction Isolation**: All balance updates occur within database transactions (READ COMMITTED isolation level)
3. **Lock Timeout**: Database queries have a 5-second lock timeout to prevent deadlocks
4. **Retry Logic**: Failed operations due to lock conflicts are retried up to 3 times with exponential backoff

## Components and Interfaces

### Domain Layer

#### Wallet Entity

```typescript
class Wallet {
  private readonly id: WalletId;
  private readonly playerId: PlayerId;
  private balance: Money;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(id: WalletId, playerId: PlayerId, balance: Money, createdAt: Date, updatedAt: Date);

  // Business logic methods
  credit(amount: Money): void;
  debit(amount: Money): Result<void, InsufficientBalanceError>;
  
  // Getters
  getId(): WalletId;
  getPlayerId(): PlayerId;
  getBalance(): Money;
  getCreatedAt(): Date;
  getUpdatedAt(): Date;
}
```

**Invariants**:
- Balance must always be >= 0 centavos
- PlayerId must be immutable after creation
- WalletId must be immutable after creation

#### Money Value Object

```typescript
class Money {
  private readonly centavos: bigint;

  private constructor(centavos: bigint);

  static fromCentavos(centavos: bigint): Result<Money, InvalidMoneyError>;
  static zero(): Money;

  add(other: Money): Money;
  subtract(other: Money): Result<Money, NegativeMoneyError>;
  isGreaterThanOrEqual(other: Money): boolean;
  equals(other: Money): boolean;
  
  toCentavos(): bigint;
}
```

**Invariants**:
- Centavos must be >= 0
- Immutable after creation
- All arithmetic operations return new Money instances

#### Value Objects

```typescript
class WalletId {
  private readonly value: string; // UUID v4
  
  private constructor(value: string);
  static create(): WalletId;
  static fromString(value: string): Result<WalletId, InvalidWalletIdError>;
  toString(): string;
  equals(other: WalletId): boolean;
}

class PlayerId {
  private readonly value: string; // From JWT sub claim
  
  private constructor(value: string);
  static fromString(value: string): Result<PlayerId, InvalidPlayerIdError>;
  toString(): string;
  equals(other: PlayerId): boolean;
}
```

#### Domain Events

```typescript
interface DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
}

class WalletCreated implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly walletId: WalletId;
  readonly playerId: PlayerId;
}

class BalanceCredited implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly walletId: WalletId;
  readonly amount: Money;
  readonly newBalance: Money;
}

class BalanceDebited implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly walletId: WalletId;
  readonly amount: Money;
  readonly newBalance: Money;
}

class InsufficientBalanceError implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly walletId: WalletId;
  readonly playerId: PlayerId;
  readonly requestedAmount: Money;
  readonly currentBalance: Money;
}
```

#### Repository Interface

```typescript
interface IWalletRepository {
  save(wallet: Wallet): Promise<void>;
  findById(id: WalletId): Promise<Wallet | null>;
  findByPlayerId(playerId: PlayerId): Promise<Wallet | null>;
  findByPlayerIdForUpdate(playerId: PlayerId): Promise<Wallet | null>;
  existsByPlayerId(playerId: PlayerId): Promise<boolean>;
}
```

### Application Layer

#### Use Cases

```typescript
class CreateWalletUseCase {
  constructor(
    private readonly walletRepository: IWalletRepository,
    private readonly eventPublisher: IEventPublisher
  );

  async execute(playerId: PlayerId): Promise<Result<WalletResponseDto, WalletAlreadyExistsError>>;
}

class GetWalletUseCase {
  constructor(private readonly walletRepository: IWalletRepository);

  async execute(playerId: PlayerId): Promise<Result<WalletResponseDto, WalletNotFoundError>>;
}

class ProcessBetPlacedUseCase {
  constructor(
    private readonly walletRepository: IWalletRepository,
    private readonly eventPublisher: IEventPublisher
  );

  async execute(playerId: PlayerId, amount: Money): Promise<Result<void, WalletNotFoundError | InsufficientBalanceError>>;
}

class ProcessCashoutUseCase {
  constructor(
    private readonly walletRepository: IWalletRepository,
    private readonly eventPublisher: IEventPublisher
  );

  async execute(playerId: PlayerId, amount: Money): Promise<Result<void, WalletNotFoundError>>;
}

class ProcessBetLostUseCase {
  constructor(private readonly walletRepository: IWalletRepository);

  async execute(playerId: PlayerId, amount: Money): Promise<Result<void, WalletNotFoundError>>;
}
```

#### DTOs

```typescript
class CreateWalletDto {
  // No body needed - playerId extracted from JWT
}

class WalletResponseDto {
  readonly id: string;
  readonly playerId: string;
  readonly balance: string; // String representation of centavos
  readonly createdAt: string; // ISO 8601
  readonly updatedAt: string; // ISO 8601
}

class BetPlacedEventDto {
  readonly eventId: string;
  readonly playerId: string;
  readonly betId: string;
  readonly amount: string; // Centavos as string
  readonly timestamp: string; // ISO 8601
}

class CashoutEventDto {
  readonly eventId: string;
  readonly playerId: string;
  readonly betId: string;
  readonly amount: string; // Centavos as string
  readonly multiplier: string; // e.g., "2.50"
  readonly timestamp: string; // ISO 8601
}

class BetLostEventDto {
  readonly eventId: string;
  readonly playerId: string;
  readonly betId: string;
  readonly amount: string; // Centavos as string
  readonly timestamp: string; // ISO 8601
}

class InsufficientBalanceErrorDto {
  readonly eventId: string;
  readonly playerId: string;
  readonly betId: string;
  readonly requestedAmount: string; // Centavos as string
  readonly currentBalance: string; // Centavos as string
  readonly timestamp: string; // ISO 8601
}
```

### Infrastructure Layer

#### Prisma Repository Implementation

```typescript
class PrismaWalletRepository implements IWalletRepository {
  constructor(private readonly prisma: PrismaClient);

  async save(wallet: Wallet): Promise<void>;
  async findById(id: WalletId): Promise<Wallet | null>;
  async findByPlayerId(playerId: PlayerId): Promise<Wallet | null>;
  async findByPlayerIdForUpdate(playerId: PlayerId): Promise<Wallet | null>;
  async existsByPlayerId(playerId: PlayerId): Promise<boolean>;
  
  private toDomain(record: WalletRecord): Wallet;
  private toPersistence(wallet: Wallet): WalletRecord;
}
```

#### RabbitMQ Consumer

```typescript
class RabbitMQConsumer {
  constructor(
    private readonly connection: Connection,
    private readonly betPlacedUseCase: ProcessBetPlacedUseCase,
    private readonly cashoutUseCase: ProcessCashoutUseCase,
    private readonly betLostUseCase: ProcessBetLostUseCase
  );

  async start(): Promise<void>;
  async stop(): Promise<void>;
  
  private async handleBetPlaced(message: ConsumeMessage): Promise<void>;
  private async handleCashout(message: ConsumeMessage): Promise<void>;
  private async handleBetLost(message: ConsumeMessage): Promise<void>;
}
```

#### RabbitMQ Publisher

```typescript
class RabbitMQPublisher implements IEventPublisher {
  constructor(private readonly connection: Connection);

  async publish(event: DomainEvent): Promise<void>;
  
  private getExchangeName(event: DomainEvent): string;
  private getRoutingKey(event: DomainEvent): string;
}
```

### Presentation Layer

#### REST Controllers

```typescript
@Controller('wallets')
@UseGuards(JwtAuthGuard)
class WalletsController {
  constructor(
    private readonly createWalletUseCase: CreateWalletUseCase,
    private readonly getWalletUseCase: GetWalletUseCase
  );

  @Post()
  async createWallet(@Request() req): Promise<WalletResponseDto>;

  @Get('me')
  async getMyWallet(@Request() req): Promise<WalletResponseDto>;
}

@Controller('health')
class HealthController {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly rabbitMQConnection: Connection
  );

  @Get()
  async check(): Promise<HealthCheckResponseDto>;
}
```

#### Guards

```typescript
@Injectable()
class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
  
  private validateToken(token: string): Promise<JwtPayload>;
  private extractPlayerId(payload: JwtPayload): PlayerId;
}
```

## Data Models

### Database Schema (Prisma)

```prisma
model Wallet {
  id         String   @id @default(uuid())
  playerId   String   @unique @map("player_id")
  balance    BigInt   @default(0)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@map("wallets")
  @@index([playerId])
}
```

**Schema Constraints**:
- `id`: Primary key, UUID v4
- `playerId`: Unique constraint (one wallet per player)
- `balance`: BIGINT type for exact precision, CHECK constraint `balance >= 0`
- `createdAt`: Timestamp with timezone, default to current timestamp
- `updatedAt`: Timestamp with timezone, automatically updated on modification

**Indexes**:
- Primary key index on `id`
- Unique index on `playerId` (for fast lookups and constraint enforcement)

### Message Schemas

#### Bet_Placed_Event

```json
{
  "eventId": "uuid-v4",
  "playerId": "player-uuid",
  "betId": "bet-uuid",
  "amount": "10000",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Queue**: `bet.placed`  
**Exchange**: `game.events` (topic exchange)  
**Routing Key**: `bet.placed`

#### Cashout_Event

```json
{
  "eventId": "uuid-v4",
  "playerId": "player-uuid",
  "betId": "bet-uuid",
  "amount": "25000",
  "multiplier": "2.50",
  "timestamp": "2024-01-15T10:30:15.000Z"
}
```

**Queue**: `bet.cashout`  
**Exchange**: `game.events` (topic exchange)  
**Routing Key**: `bet.cashout`

#### Bet_Lost_Event

```json
{
  "eventId": "uuid-v4",
  "playerId": "player-uuid",
  "betId": "bet-uuid",
  "amount": "10000",
  "timestamp": "2024-01-15T10:30:20.000Z"
}
```

**Queue**: `bet.lost`  
**Exchange**: `game.events` (topic exchange)  
**Routing Key**: `bet.lost`

#### Insufficient_Balance_Error (Published by Wallet Service)

```json
{
  "eventId": "uuid-v4",
  "playerId": "player-uuid",
  "betId": "bet-uuid",
  "requestedAmount": "10000",
  "currentBalance": "5000",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Exchange**: `wallet.events` (topic exchange)  
**Routing Key**: `wallet.insufficient_balance`

### Environment Configuration

```env
# Server
PORT=3001

# Database
DATABASE_URL=postgresql://wallet_user:wallet_pass@postgres:5432/wallets

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
RABBITMQ_BET_PLACED_QUEUE=bet.placed
RABBITMQ_CASHOUT_QUEUE=bet.cashout
RABBITMQ_BET_LOST_QUEUE=bet.lost
RABBITMQ_GAME_EXCHANGE=game.events
RABBITMQ_WALLET_EXCHANGE=wallet.events

# JWT
JWT_SECRET=shared-secret-from-keycloak
JWT_ISSUER=http://keycloak:8080/realms/crash-game

# Logging
LOG_LEVEL=info
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The Wallet Service domain layer contains pure business logic that is well-suited for property-based testing. The following properties capture the essential correctness guarantees that must hold for all valid inputs.

### Property 1: Money Value Object Precision

*For any* non-negative integer value of centavos, the Money value object SHALL store the value exactly as a bigint without loss of precision, and SHALL reject negative values.

**Validates: Requirements 3.1, 3.3**

### Property 2: Money Arithmetic Exactness

*For any* two Money instances M1 and M2, arithmetic operations (addition and subtraction) SHALL use exact integer arithmetic such that:
- M1.add(M2).toCentavos() = M1.toCentavos() + M2.toCentavos()
- M1.subtract(M2).toCentavos() = M1.toCentavos() - M2.toCentavos() (when M1 >= M2)
- M1.subtract(M2) SHALL return an error when M1 < M2

**Validates: Requirements 3.2, 3.4**

### Property 3: Credit Operation Correctness

*For any* Wallet with balance B and any positive Money amount A, calling wallet.credit(A) SHALL result in a new balance of exactly B + A centavos.

**Validates: Requirements 4.3**

### Property 4: Debit Operation Correctness with Sufficient Balance

*For any* Wallet with balance B and any positive Money amount A where B >= A, calling wallet.debit(A) SHALL result in a new balance of exactly B - A centavos.

**Validates: Requirements 5.4**

### Property 5: Balance Non-Negativity Invariant

*For any* Wallet with balance B and any positive Money amount A where B < A, calling wallet.debit(A) SHALL reject the operation and return an InsufficientBalanceError, leaving the balance unchanged at B centavos.

**Validates: Requirements 5.6, 6.1, 6.2, 6.3**

### Property 6: Concurrent Operations Correctness

*For any* Wallet with initial balance B and any sequence of N concurrent credit operations with amounts [A1, A2, ..., An] and M concurrent debit operations with amounts [D1, D2, ..., Dm] where the sum of debits does not exceed B + sum of credits, the final balance SHALL be exactly B + Σ(Ai) - Σ(Dj) centavos, regardless of operation interleaving.

**Validates: Requirements 7.1**

### Property 7: Bet Lost Event Idempotency

*For any* Wallet with balance B and any Bet_Lost_Event, processing the event SHALL leave the balance unchanged at B centavos, and processing the same event multiple times SHALL have the same effect as processing it once.

**Validates: Requirements 8.7, 10.4**

### Property 8: Amount Validation

*For any* monetary amount value, the system SHALL accept only positive integer representations and SHALL reject zero, negative values, non-integer values, and non-numeric values.

**Validates: Requirements 4.2, 5.2**

## Error Handling

### Error Types and Responses

The Wallet Service defines the following error types with specific HTTP status codes and error messages:

#### Domain Errors

| Error Type | HTTP Status | Error Code | Description |
|------------|-------------|------------|-------------|
| `WalletAlreadyExistsError` | 409 Conflict | `WALLET_ALREADY_EXISTS` | Player already has a wallet |
| `WalletNotFoundError` | 404 Not Found | `WALLET_NOT_FOUND` | Wallet does not exist for player |
| `InsufficientBalanceError` | 422 Unprocessable Entity | `INSUFFICIENT_BALANCE` | Debit amount exceeds current balance |
| `InvalidMoneyError` | 400 Bad Request | `INVALID_MONEY` | Monetary value is invalid (negative, non-integer) |
| `InvalidWalletIdError` | 400 Bad Request | `INVALID_WALLET_ID` | Wallet ID format is invalid |
| `InvalidPlayerIdError` | 400 Bad Request | `INVALID_PLAYER_ID` | Player ID format is invalid |

#### Infrastructure Errors

| Error Type | HTTP Status | Error Code | Description |
|------------|-------------|------------|-------------|
| `DatabaseConnectionError` | 503 Service Unavailable | `DATABASE_UNAVAILABLE` | Cannot connect to PostgreSQL |
| `MessageBrokerConnectionError` | 503 Service Unavailable | `MESSAGE_BROKER_UNAVAILABLE` | Cannot connect to RabbitMQ |
| `DatabaseTimeoutError` | 504 Gateway Timeout | `DATABASE_TIMEOUT` | Database query exceeded timeout |
| `LockAcquisitionError` | 409 Conflict | `LOCK_CONFLICT` | Failed to acquire wallet lock after retries |

#### Authentication Errors

| Error Type | HTTP Status | Error Code | Description |
|------------|-------------|------------|-------------|
| `UnauthorizedError` | 401 Unauthorized | `UNAUTHORIZED` | JWT token is missing or invalid |
| `ForbiddenError` | 403 Forbidden | `FORBIDDEN` | Player cannot access requested resource |

### Error Response Format

All error responses follow a consistent JSON structure:

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

### Error Handling Strategies

#### REST API Error Handling

1. **Validation Errors**: Caught at the DTO validation layer using class-validator decorators
2. **Domain Errors**: Caught in use cases and mapped to appropriate HTTP responses
3. **Infrastructure Errors**: Caught in controllers and mapped to 5xx responses
4. **Unhandled Errors**: Caught by global exception filter, logged, and returned as 500 Internal Server Error

#### Message Processing Error Handling

1. **Validation Errors**: Log error, publish to dead-letter queue, ACK message
2. **Domain Errors** (e.g., insufficient balance): Log error, publish domain event, ACK message
3. **Transient Errors** (e.g., database timeout): Log error, NACK message for redelivery
4. **Permanent Errors** (e.g., wallet not found): Log error, publish to dead-letter queue, ACK message

#### Retry Strategy

- **Database Operations**: Retry up to 3 times with exponential backoff (100ms, 200ms, 400ms)
- **Message Processing**: Rely on RabbitMQ redelivery with max 3 attempts
- **Lock Acquisition**: Retry up to 3 times with 50ms delay between attempts

### Logging Strategy

#### Log Levels

- **ERROR**: Unrecoverable errors, infrastructure failures, unexpected exceptions
- **WARN**: Recoverable errors, insufficient balance, wallet not found
- **INFO**: Successful operations, wallet created, balance updated
- **DEBUG**: Detailed operation flow, message received, lock acquired

#### Structured Logging Format

All logs use JSON format with the following fields:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "service": "wallet-service",
  "context": "ProcessBetPlacedUseCase",
  "message": "Debit operation completed",
  "playerId": "player-uuid",
  "walletId": "wallet-uuid",
  "amount": "10000",
  "previousBalance": "50000",
  "newBalance": "40000",
  "requestId": "uuid-v4"
}
```

#### Sensitive Data Handling

- **Never log**: JWT tokens, full token payloads
- **Redact**: Player personal information (if present in future)
- **Log**: Player IDs, wallet IDs, amounts, balances (business data)

## Testing Strategy

The Wallet Service employs a comprehensive testing strategy with three complementary layers: property-based tests for domain logic, unit tests for specific scenarios, and integration tests for infrastructure components.

### Property-Based Testing

Property-based tests verify universal correctness properties across randomly generated inputs. These tests use **fast-check** (JavaScript property-based testing library) and run a minimum of 100 iterations per property.

#### Test Configuration

```typescript
// tests/unit/domain/wallet.property.test.ts
import fc from 'fast-check';

const TEST_ITERATIONS = 100;

fc.configureGlobal({
  numRuns: TEST_ITERATIONS,
  verbose: true,
});
```

#### Property Test Implementation

Each property test must:
1. Reference its design document property in a comment tag
2. Generate random valid inputs using fast-check arbitraries
3. Execute the operation under test
4. Assert the property holds for all generated inputs

**Example Property Test:**

```typescript
/**
 * Feature: wallet-service, Property 3: Credit Operation Correctness
 * For any Wallet with balance B and any positive Money amount A,
 * calling wallet.credit(A) SHALL result in a new balance of exactly B + A centavos.
 */
describe('Property 3: Credit Operation Correctness', () => {
  it('should increase balance by exact credit amount', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 1000000000n }), // Initial balance
        fc.bigInt({ min: 1n, max: 1000000n }),    // Credit amount
        (initialBalanceCentavos, creditAmountCentavos) => {
          // Arrange
          const wallet = createWalletWithBalance(initialBalanceCentavos);
          const creditAmount = Money.fromCentavos(creditAmountCentavos);
          
          // Act
          wallet.credit(creditAmount);
          
          // Assert
          const expectedBalance = initialBalanceCentavos + creditAmountCentavos;
          expect(wallet.getBalance().toCentavos()).toBe(expectedBalance);
        }
      )
    );
  });
});
```

#### Property Test Coverage

| Property | Test File | Arbitraries |
|----------|-----------|-------------|
| Property 1: Money Precision | `money.property.test.ts` | `fc.bigInt({ min: 0n })` |
| Property 2: Money Arithmetic | `money.property.test.ts` | `fc.bigInt({ min: 0n })` pairs |
| Property 3: Credit Operation | `wallet.property.test.ts` | Balance + positive amount |
| Property 4: Debit Operation | `wallet.property.test.ts` | Balance >= amount |
| Property 5: Balance Invariant | `wallet.property.test.ts` | Balance < amount |
| Property 6: Concurrent Operations | `wallet.property.test.ts` | Array of operations |
| Property 7: Bet Lost Idempotency | `process-bet-lost.property.test.ts` | Bet lost events |
| Property 8: Amount Validation | `money.property.test.ts` | Invalid values |

### Unit Testing

Unit tests verify specific scenarios, edge cases, and example-based behavior. These tests use **Bun's built-in test runner**.

#### Unit Test Coverage

**Domain Layer** (Target: 95% coverage):
- Wallet entity: credit, debit, getters
- Money value object: creation, arithmetic, validation
- Value objects: WalletId, PlayerId creation and validation
- Domain events: creation and serialization

**Application Layer** (Target: 90% coverage):
- Use cases: CreateWallet, GetWallet, ProcessBetPlaced, ProcessCashout, ProcessBetLost
- Error scenarios: wallet already exists, wallet not found, insufficient balance
- Edge cases: zero balance, maximum balance, boundary values

**Presentation Layer** (Target: 85% coverage):
- Controllers: request handling, response formatting
- DTOs: validation rules
- Guards: JWT validation and player ID extraction

#### Example Unit Tests

```typescript
// tests/unit/application/create-wallet.test.ts
describe('CreateWalletUseCase', () => {
  it('should create wallet with zero balance', async () => {
    // Arrange
    const playerId = PlayerId.fromString('player-123');
    const mockRepo = createMockRepository();
    const useCase = new CreateWalletUseCase(mockRepo, mockEventPublisher);
    
    // Act
    const result = await useCase.execute(playerId);
    
    // Assert
    expect(result.isOk()).toBe(true);
    expect(result.value.balance).toBe('0');
  });

  it('should return error when wallet already exists', async () => {
    // Arrange
    const playerId = PlayerId.fromString('player-123');
    const mockRepo = createMockRepository({ existsByPlayerId: true });
    const useCase = new CreateWalletUseCase(mockRepo, mockEventPublisher);
    
    // Act
    const result = await useCase.execute(playerId);
    
    // Assert
    expect(result.isErr()).toBe(true);
    expect(result.error).toBeInstanceOf(WalletAlreadyExistsError);
  });
});
```

### Integration Testing

Integration tests verify infrastructure components, database operations, message broker integration, and end-to-end API flows.

#### Test Environment Setup

- **Test Database**: Separate PostgreSQL database (`wallets_test`)
- **Test Message Broker**: Separate RabbitMQ vhost (`/test`)
- **Database Migrations**: Run before each test suite
- **Database Cleanup**: Truncate tables after each test
- **Test Containers**: Use Docker containers for PostgreSQL and RabbitMQ

#### Integration Test Coverage

**Repository Layer**:
- CRUD operations: save, findById, findByPlayerId
- Locking: findByPlayerIdForUpdate with SELECT FOR UPDATE
- Transactions: atomic updates, rollback on error
- Constraints: unique player ID, non-negative balance

**Message Broker**:
- Consumer: subscribe to queues, process messages, ACK/NACK
- Publisher: publish events to exchanges with routing keys
- Error handling: dead-letter queue, redelivery

**End-to-End API**:
- POST /wallets: create wallet, authentication, duplicate prevention
- GET /wallets/me: retrieve wallet, authentication, authorization
- GET /health: database and message broker connectivity

#### Example Integration Test

```typescript
// tests/e2e/wallets.e2e.test.ts
describe('POST /wallets', () => {
  beforeEach(async () => {
    await truncateDatabase();
  });

  it('should create wallet for authenticated player', async () => {
    // Arrange
    const token = generateValidJWT({ sub: 'player-123' });
    
    // Act
    const response = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send();
    
    // Assert
    expect(response.status).toBe(201);
    expect(response.body.playerId).toBe('player-123');
    expect(response.body.balance).toBe('0');
    
    // Verify database persistence
    const wallet = await prisma.wallet.findUnique({
      where: { playerId: 'player-123' }
    });
    expect(wallet).not.toBeNull();
    expect(wallet.balance).toBe(0n);
  });

  it('should return 401 when JWT is missing', async () => {
    // Act
    const response = await request(app)
      .post('/wallets')
      .send();
    
    // Assert
    expect(response.status).toBe(401);
  });

  it('should return 409 when wallet already exists', async () => {
    // Arrange
    const token = generateValidJWT({ sub: 'player-123' });
    await createWalletInDatabase('player-123');
    
    // Act
    const response = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send();
    
    // Assert
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('WALLET_ALREADY_EXISTS');
  });
});
```

### Test Execution

```bash
# Run all tests
bun test

# Run unit tests only
bun test tests/unit

# Run property tests only
bun test tests/unit/**/*.property.test.ts

# Run integration tests only
bun test:e2e

# Run with coverage
bun test --coverage

# Run specific test file
bun test tests/unit/domain/wallet.test.ts
```

### Coverage Targets

| Layer | Target Coverage | Rationale |
|-------|----------------|-----------|
| Domain | 95% | Core business logic must be thoroughly tested |
| Application | 90% | Use cases contain critical workflows |
| Infrastructure | 75% | Integration tests cover main paths |
| Presentation | 85% | Controllers and DTOs are straightforward |
| **Overall** | **85%** | Balanced coverage across all layers |

### Continuous Integration

- **Pre-commit**: Run unit tests and property tests (fast feedback)
- **CI Pipeline**: Run all tests including integration tests
- **Coverage Report**: Fail build if coverage drops below targets
- **Property Test Failures**: Report failing examples for debugging

## Implementation Notes

### ORM Choice: Prisma

Prisma was selected as the ORM for the following reasons:

1. **Type Safety**: Generates TypeScript types from schema, ensuring compile-time safety
2. **Migration Support**: Built-in migration system with version control
3. **Query Builder**: Intuitive API with autocomplete support
4. **Transaction Support**: First-class support for database transactions
5. **Bun Compatibility**: Works seamlessly with Bun runtime

### Locking Strategy

The service uses PostgreSQL's `SELECT ... FOR UPDATE` to implement pessimistic locking:

```typescript
async findByPlayerIdForUpdate(playerId: PlayerId): Promise<Wallet | null> {
  const record = await this.prisma.$queryRaw`
    SELECT * FROM wallets 
    WHERE player_id = ${playerId.toString()} 
    FOR UPDATE
  `;
  return record ? this.toDomain(record) : null;
}
```

### Message Broker Configuration

**Queue Configuration**:
- **Durable**: true (survive broker restarts)
- **Auto-delete**: false (persist even when no consumers)
- **Exclusive**: false (allow multiple consumers)
- **Prefetch**: 1 (process one message at a time per consumer)

**Exchange Configuration**:
- **Type**: topic (route by pattern matching)
- **Durable**: true
- **Auto-delete**: false

### Deployment Considerations

1. **Database Migrations**: Run migrations before deploying new service version
2. **Zero-Downtime Deployment**: Use rolling updates with health checks
3. **Message Broker**: Ensure queues exist before starting consumers
4. **Environment Variables**: Validate all required env vars on startup
5. **Graceful Shutdown**: Drain message queue and close connections on SIGTERM

### Performance Considerations

1. **Database Connection Pool**: Configure pool size based on expected load (default: 10)
2. **Query Timeout**: Set reasonable timeout to prevent long-running queries (default: 5s)
3. **Message Prefetch**: Process one message at a time to prevent memory issues
4. **Index Usage**: Ensure queries use indexes (player_id index for lookups)
5. **Lock Timeout**: Set lock timeout to prevent deadlocks (default: 5s)

### Security Considerations

1. **JWT Validation**: Verify signature, expiration, and issuer
2. **SQL Injection**: Use parameterized queries (Prisma handles this)
3. **Input Validation**: Validate all inputs at DTO layer
4. **Rate Limiting**: Implement at API Gateway level (Kong)
5. **Secrets Management**: Store sensitive config in environment variables or secrets manager

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Authors**: Kiro AI Agent  
**Status**: Ready for Review
