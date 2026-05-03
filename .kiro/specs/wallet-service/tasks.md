# Implementation Plan: Wallet Service

## Overview

This implementation plan breaks down the Wallet Service into discrete, incremental coding tasks following Domain-Driven Design principles. The service will be built in layers: domain entities and value objects first, then application use cases, infrastructure components, and finally presentation layer with REST controllers. Each task builds on previous work, with property-based tests validating correctness properties and unit tests covering specific scenarios.

**Technology Stack**: NestJS + Bun + Prisma + RabbitMQ + fast-check

**Implementation Order**: Domain → Application → Infrastructure → Presentation → Integration

## Tasks

- [x] 1. Set up project dependencies and configuration
  - Install required dependencies: Prisma, RabbitMQ client (amqplib), fast-check, JWT validation library
  - Configure Prisma schema with Wallet model (id, playerId, balance as BigInt, timestamps)
  - Set up TypeScript strict mode configuration
  - Create environment variable configuration module
  - _Requirements: 11.4, 15.1, 15.2_

- [x] 2. Implement domain layer - Value Objects
  - [x] 2.1 Implement Money value object
    - Create Money class with private bigint centavos field
    - Implement static factory methods: fromCentavos(), zero()
    - Implement arithmetic methods: add(), subtract()
    - Implement comparison methods: isGreaterThanOrEqual(), equals()
    - Implement getter: toCentavos()
    - Implement validation to reject negative values
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 2.2 Write property test for Money precision (Property 1)
    - **Property 1: Money Value Object Precision**
    - **Validates: Requirements 3.1, 3.3**
    - Generate random non-negative bigint values
    - Verify Money stores values exactly without precision loss
    - Verify Money rejects negative values
  
  - [x] 2.3 Write property test for Money arithmetic (Property 2)
    - **Property 2: Money Arithmetic Exactness**
    - **Validates: Requirements 3.2, 3.4**
    - Generate pairs of Money instances
    - Verify add() produces exact sum
    - Verify subtract() produces exact difference when M1 >= M2
    - Verify subtract() returns error when M1 < M2
  
  - [x] 2.4 Write property test for amount validation (Property 8)
    - **Property 8: Amount Validation**
    - **Validates: Requirements 4.2, 5.2**
    - Generate invalid values (zero, negative, non-integer, non-numeric)
    - Verify Money.fromCentavos() rejects all invalid inputs
  
  - [x] 2.5 Write unit tests for Money value object
    - Test zero() factory method
    - Test edge cases: maximum safe bigint, boundary values
    - Test equals() with same and different values
    - Test error messages for invalid inputs

- [x] 3. Implement domain layer - Entity Value Objects
  - [x] 3.1 Implement WalletId value object
    - Create WalletId class with private string value (UUID v4)
    - Implement static factory methods: create(), fromString()
    - Implement validation for UUID format
    - Implement toString() and equals() methods
    - _Requirements: 1.5, 14.2_
  
  - [x] 3.2 Implement PlayerId value object
    - Create PlayerId class with private string value
    - Implement static factory method: fromString()
    - Implement validation for non-empty string
    - Implement toString() and equals() methods
    - _Requirements: 1.2, 9.2_
  
  - [x] 3.3 Write unit tests for WalletId and PlayerId
    - Test valid UUID creation and parsing
    - Test invalid UUID rejection
    - Test equals() method
    - Test immutability

- [x] 4. Implement domain layer - Wallet Entity
  - [x] 4.1 Implement Wallet entity class
    - Create Wallet class with private fields: id, playerId, balance, createdAt, updatedAt
    - Implement constructor with all fields
    - Implement credit(amount: Money) method to increase balance
    - Implement debit(amount: Money) method with balance validation
    - Implement getters for all fields
    - Ensure balance invariant: balance >= 0
    - _Requirements: 3.1, 4.3, 5.4, 6.1, 6.2, 14.2_
  
  - [x] 4.2 Write property test for credit operation (Property 3)
    - **Property 3: Credit Operation Correctness**
    - **Validates: Requirements 4.3**
    - Generate random initial balance and positive credit amount
    - Verify new balance equals initial balance + credit amount exactly
  
  - [x] 4.3 Write property test for debit operation with sufficient balance (Property 4)
    - **Property 4: Debit Operation Correctness with Sufficient Balance**
    - **Validates: Requirements 5.4**
    - Generate random balance and debit amount where balance >= amount
    - Verify new balance equals initial balance - debit amount exactly
  
  - [x] 4.4 Write property test for balance non-negativity invariant (Property 5)
    - **Property 5: Balance Non-Negativity Invariant**
    - **Validates: Requirements 5.6, 6.1, 6.2, 6.3**
    - Generate random balance and debit amount where balance < amount
    - Verify debit() returns InsufficientBalanceError
    - Verify balance remains unchanged
  
  - [x] 4.5 Write unit tests for Wallet entity
    - Test wallet creation with zero balance
    - Test credit operation updates updatedAt timestamp
    - Test debit operation updates updatedAt timestamp
    - Test getters return correct values
    - Test immutability of id and playerId

- [x] 5. Implement domain layer - Domain Events
  - [x] 5.1 Create domain event interfaces and classes
    - Create DomainEvent interface with eventId and occurredAt
    - Implement WalletCreated event
    - Implement BalanceCredited event
    - Implement BalanceDebited event
    - Implement InsufficientBalanceError event
    - _Requirements: 5.6, 6.3, 13.5_
  
  - [x] 5.2 Write unit tests for domain events
    - Test event creation with required fields
    - Test event immutability
    - Test event serialization to JSON

- [x] 6. Implement domain layer - Repository Interface
  - [x] 6.1 Define IWalletRepository interface
    - Define save(wallet: Wallet): Promise<void>
    - Define findById(id: WalletId): Promise<Wallet | null>
    - Define findByPlayerId(playerId: PlayerId): Promise<Wallet | null>
    - Define findByPlayerIdForUpdate(playerId: PlayerId): Promise<Wallet | null>
    - Define existsByPlayerId(playerId: PlayerId): Promise<boolean>
    - _Requirements: 1.4, 2.1, 7.2, 14.4_

- [x] 7. Checkpoint - Domain layer complete
  - Ensure all domain tests pass, ask the user if questions arise.

- [x] 8. Implement infrastructure layer - Prisma setup
  - [x] 8.1 Create Prisma schema and migrations
    - Define Wallet model in schema.prisma with exact field types
    - Add CHECK constraint for balance >= 0
    - Add unique index on playerId
    - Generate initial migration
    - _Requirements: 3.5, 6.4, 11.2, 11.5_
  
  - [x] 8.2 Create Prisma client module
    - Create PrismaModule for NestJS dependency injection
    - Create PrismaService with connection lifecycle management
    - Configure connection pool and query timeout
    - _Requirements: 11.1, 11.3_

- [x] 9. Implement infrastructure layer - Wallet Repository
  - [x] 9.1 Implement PrismaWalletRepository
    - Implement save() with upsert logic and transaction support
    - Implement findById() with domain model mapping
    - Implement findByPlayerId() with domain model mapping
    - Implement findByPlayerIdForUpdate() using SELECT FOR UPDATE
    - Implement existsByPlayerId() with efficient query
    - Implement toDomain() mapper from Prisma record to Wallet entity
    - Implement toPersistence() mapper from Wallet entity to Prisma record
    - _Requirements: 1.4, 4.4, 5.5, 7.2, 7.4, 11.3_
  
  - [x] 9.2 Write integration tests for PrismaWalletRepository
    - Test save() creates new wallet
    - Test save() updates existing wallet
    - Test findByPlayerId() returns correct wallet
    - Test findByPlayerIdForUpdate() acquires lock
    - Test existsByPlayerId() returns correct boolean
    - Test transaction rollback on error
    - Test unique constraint on playerId

- [x] 10. Implement infrastructure layer - RabbitMQ Publisher
  - [x] 10.1 Implement IEventPublisher interface
    - Define publish(event: DomainEvent): Promise<void>
    - _Requirements: 8.1_
  
  - [x] 10.2 Implement RabbitMQPublisher
    - Create RabbitMQ connection management
    - Implement publish() to send events to appropriate exchange
    - Implement getExchangeName() to map event types to exchanges
    - Implement getRoutingKey() to map event types to routing keys
    - Add error handling and retry logic
    - _Requirements: 8.1, 8.5, 8.6_
  
  - [x] 10.3 Write integration tests for RabbitMQPublisher
    - Test connection establishment
    - Test event publishing to correct exchange
    - Test routing key generation
    - Test error handling on connection failure

- [x] 11. Implement application layer - Use Cases
  - [x] 11.1 Implement CreateWalletUseCase
    - Inject IWalletRepository and IEventPublisher
    - Check if wallet already exists using existsByPlayerId()
    - Create new Wallet entity with zero balance
    - Save wallet to repository
    - Publish WalletCreated event
    - Return WalletResponseDto
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 11.2 Implement GetWalletUseCase
    - Inject IWalletRepository
    - Find wallet by playerId using findByPlayerId()
    - Return WalletNotFoundError if wallet doesn't exist
    - Map wallet entity to WalletResponseDto
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 11.3 Implement ProcessBetPlacedUseCase
    - Inject IWalletRepository and IEventPublisher
    - Find wallet by playerId using findByPlayerIdForUpdate() (acquire lock)
    - Return WalletNotFoundError if wallet doesn't exist
    - Parse amount from event DTO to Money value object
    - Call wallet.debit(amount)
    - If debit succeeds, save wallet and publish BalanceDebited event
    - If debit fails (insufficient balance), publish InsufficientBalanceError event
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 7.1, 7.2_
  
  - [x] 11.4 Implement ProcessCashoutUseCase
    - Inject IWalletRepository and IEventPublisher
    - Find wallet by playerId using findByPlayerIdForUpdate() (acquire lock)
    - Return WalletNotFoundError if wallet doesn't exist
    - Parse amount from event DTO to Money value object
    - Call wallet.credit(amount)
    - Save wallet and publish BalanceCredited event
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 7.1, 7.2_
  
  - [x] 11.5 Implement ProcessBetLostUseCase
    - Inject IWalletRepository
    - Find wallet by playerId to verify it exists
    - Return WalletNotFoundError if wallet doesn't exist
    - Log the event for audit purposes (no balance modification)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [x] 11.6 Write property test for bet lost idempotency (Property 7)
    - **Property 7: Bet Lost Event Idempotency**
    - **Validates: Requirements 8.7, 10.4**
    - Generate random wallet balance and bet lost event
    - Process event multiple times
    - Verify balance remains unchanged after each processing
  
  - [x] 11.7 Write unit tests for all use cases
    - Test CreateWalletUseCase success path
    - Test CreateWalletUseCase with existing wallet (error)
    - Test GetWalletUseCase success path
    - Test GetWalletUseCase with non-existent wallet (error)
    - Test ProcessBetPlacedUseCase with sufficient balance
    - Test ProcessBetPlacedUseCase with insufficient balance
    - Test ProcessCashoutUseCase success path
    - Test ProcessBetLostUseCase success path

- [x] 12. Implement application layer - DTOs
  - [x] 12.1 Create request and response DTOs
    - Create CreateWalletDto (empty, playerId from JWT)
    - Create WalletResponseDto with validation decorators
    - Create BetPlacedEventDto with validation decorators
    - Create CashoutEventDto with validation decorators
    - Create BetLostEventDto with validation decorators
    - Create InsufficientBalanceErrorDto
    - _Requirements: 1.1, 2.2, 4.1, 5.1, 10.1, 13.2_
  
  - [x] 12.2 Write unit tests for DTO validation
    - Test valid DTO creation
    - Test invalid DTO rejection (missing fields, wrong types)
    - Test amount validation (positive integers only)

- [x] 13. Checkpoint - Application layer complete
  - Ensure all application tests pass, ask the user if questions arise.

- [x] 14. Implement infrastructure layer - RabbitMQ Consumer
  - [x] 14.1 Implement RabbitMQConsumer
    - Inject ProcessBetPlacedUseCase, ProcessCashoutUseCase, ProcessBetLostUseCase
    - Implement start() to connect and subscribe to queues
    - Implement stop() for graceful shutdown
    - Implement handleBetPlaced() to parse message and call use case
    - Implement handleCashout() to parse message and call use case
    - Implement handleBetLost() to parse message and call use case
    - Add message acknowledgment logic (ACK on success, NACK on transient error)
    - Add error handling and logging
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 13.1_
  
  - [x] 14.2 Write integration tests for RabbitMQConsumer
    - [x] 14.2.1 Set up test infrastructure and basic connection tests
      - Create test setup with in-memory RabbitMQ or test container
      - Test RabbitMQConsumer connection establishment
      - Test graceful shutdown functionality
      - _Requirements: 8.1, 8.2_

    - [x] 14.2.2 Test queue subscription functionality
      - Test subscription to bet-placed queue
      - Test subscription to cashout queue  
      - Test subscription to bet-lost queue
      - Verify all three queues are properly bound
      - _Requirements: 8.3, 8.4_

    - [x] 14.2.3 Test message parsing and use case invocation
      - Test handleBetPlaced() message parsing and ProcessBetPlacedUseCase invocation
      - Test handleCashout() message parsing and ProcessCashoutUseCase invocation
      - Test handleBetLost() message parsing and ProcessBetLostUseCase invocation
      - Test invalid message format handling
      - _Requirements: 8.5, 8.6_

    - [x] 14.2.4 Test message acknowledgment behavior
      - Test ACK on successful message processing
      - Test NACK on transient errors (database connection issues)
      - Test message requeue behavior on NACK
      - _Requirements: 8.7_

    - [x] 14.2.5 Test error handling and logging
      - Test error logging for invalid messages
      - Test error logging for use case failures
      - Test error logging for connection issues
      - Verify proper error context in logs
      - _Requirements: 13.1_

- [x] 15. Implement presentation layer - Authentication Guard
  - [x] 15.1 Implement JwtAuthGuard
    - Implement CanActivate interface
    - Extract JWT token from Authorization header
    - Validate token signature, expiration, and issuer
    - Extract playerId from token sub claim
    - Attach playerId to request object
    - Return 401 error for missing or invalid tokens
    - _Requirements: 9.1, 9.2, 9.3, 9.5_
  
  - [x] 15.2 Write unit tests for JwtAuthGuard
    - Test valid token extraction and validation
    - Test missing token rejection
    - Test invalid token rejection
    - Test expired token rejection
    - Test playerId extraction

- [ ] 16. Implement presentation layer - REST Controllers
  - [x] 16.1 Implement WalletsController
    - Apply @UseGuards(JwtAuthGuard) decorator
    - Implement POST /wallets endpoint
    - Extract playerId from request (set by guard)
    - Call CreateWalletUseCase
    - Return 201 Created with WalletResponseDto
    - Handle WalletAlreadyExistsError → 409 Conflict
    - Implement GET /wallets/me endpoint
    - Extract playerId from request (set by guard)
    - Call GetWalletUseCase
    - Return 200 OK with WalletResponseDto
    - Handle WalletNotFoundError → 404 Not Found
    - _Requirements: 1.1, 1.3, 1.5, 2.1, 2.2, 2.3, 9.4, 13.2_
  
  - [x] 16.2 Implement HealthController
    - Inject PrismaService and RabbitMQ connection
    - Implement GET /health endpoint
    - Check database connectivity with simple query
    - Check RabbitMQ connectivity
    - Return 200 OK if all healthy
    - Return 503 Service Unavailable if any dependency unhealthy
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [x] 16.3 Write E2E tests for WalletsController
    - Test POST /wallets with valid JWT (success)
    - Test POST /wallets without JWT (401)
    - Test POST /wallets with existing wallet (409)
    - Test GET /wallets/me with valid JWT (success)
    - Test GET /wallets/me without JWT (401)
    - Test GET /wallets/me with non-existent wallet (404)
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_
  
  - [x] 16.4 Write E2E tests for HealthController
    - Test GET /health with healthy dependencies (200)
    - Test GET /health with database down (503)
    - Test GET /health with RabbitMQ down (503)

- [x] 17. Implement presentation layer - Error Handling
  - [x] 17.1 Create global exception filter
    - Map domain errors to HTTP status codes
    - Map infrastructure errors to 5xx responses
    - Format error responses with consistent structure
    - Add request ID to error responses
    - Log all errors with context
    - _Requirements: 13.1, 13.2, 13.4_
  
  - [x] 17.2 Write unit tests for exception filter
    - Test domain error mapping
    - Test infrastructure error mapping
    - Test error response format
    - Test error logging

- [x] 18. Implement cross-cutting concerns - Logging
  - [x] 18.1 Configure structured logging
    - Set up JSON logging format
    - Configure log levels from environment
    - Add request ID middleware
    - Add context to all log statements
    - Implement sensitive data redaction
    - _Requirements: 13.1, 13.3, 13.4, 13.5_

- [x] 19. Wire all components together in NestJS modules
  - [x] 19.1 Create DomainModule
    - No providers needed (pure domain logic)
  
  - [x] 19.2 Create InfrastructureModule
    - Register PrismaService as provider
    - Register PrismaWalletRepository as IWalletRepository provider
    - Register RabbitMQPublisher as IEventPublisher provider
    - Register RabbitMQConsumer as provider
    - Configure module exports
    - _Requirements: 14.4_
  
  - [x] 19.3 Create ApplicationModule
    - Import InfrastructureModule
    - Register all use cases as providers
    - Configure module exports
    - _Requirements: 14.3_
  
  - [x] 19.4 Update AppModule
    - Import ApplicationModule
    - Import InfrastructureModule
    - Register WalletsController
    - Register HealthController
    - Register JwtAuthGuard
    - Register global exception filter
    - Configure lifecycle hooks for RabbitMQ consumer startup
    - _Requirements: 14.1_

- [x] 20. Implement concurrent operations property test (Property 6)
  - [x] 20.1 Write property test for concurrent operations correctness
    - **Property 6: Concurrent Operations Correctness**
    - **Validates: Requirements 7.1**
    - Generate random initial balance and sequences of credit/debit operations
    - Execute operations concurrently using Promise.all()
    - Verify final balance equals initial + sum(credits) - sum(debits)
    - Verify no race conditions or lost updates

- [x] 21. Final checkpoint - Integration and testing
  - [x] 21.1 Run all tests and verify coverage
    - Run unit tests: `bun test tests/unit`
    - Run property tests: `bun test tests/unit/**/*.property.test.ts`
    - Run E2E tests: `bun test:e2e`
    - Verify coverage meets targets (domain 95%, application 90%, overall 85%)
    - _Requirements: 16.6_
  
  - [X] 21.2 Test end-to-end flow manually
    - Start PostgreSQL and RabbitMQ using docker-compose
    - Run Prisma migrations
    - Start the service
    - Create wallet via POST /wallets
    - Retrieve wallet via GET /wallets/me
    - Publish test events to RabbitMQ
    - Verify balance updates correctly
    - Check health endpoint
  
  - [~] 21.3 Review and cleanup
    - Remove any unused imports or dead code
    - Ensure all files follow consistent formatting
    - Verify all environment variables documented in .env.example
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate infrastructure components and end-to-end flows
- The implementation follows strict DDD layering: Domain → Application → Infrastructure → Presentation
- All monetary operations use exact integer arithmetic (bigint) to prevent rounding errors
- Pessimistic locking (SELECT FOR UPDATE) prevents race conditions on concurrent balance updates
- Message processing uses at-least-once delivery semantics with idempotent operations where possible
