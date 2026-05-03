# Design Document: Game Service

## Overview

The Game Service is a bounded context within the fullstack crash game application that manages the complete game lifecycle, including rounds, bets, multiplier progression, crash points, and real-time communication. It is designed following Domain-Driven Design (DDD) principles with a clear separation between domain logic, application use cases, infrastructure concerns, and presentation layers.

### Core Responsibilities

- **Round Management**: Create rounds, manage state transitions (Betting → Running → Crashed → Finished)
- **Bet Processing**: Accept bets during betting phase, process cash outs during running phase
- **Multiplier Progression**: Calculate and broadcast real-time multiplier updates
- **Provably Fair System**: Generate verifiable crash points using cryptographic algorithms
- **Real-Time Communication**: Broadcast game events to all connected clients via WebSocket
- **Wallet Integration**: Coordinate with Wallet Service for balance operations via RabbitMQ

### Key Design Principles

1. **Provably Fair**: All crash points are pre-determined using cryptographic algorithms and verifiable by players
2. **Domain-Driven Design**: Business logic is encapsulated in the domain layer, isolated from infrastructure concerns
3. **Event-Driven Architecture**: Game events trigger wallet operations and real-time broadcasts
4. **Exact Monetary Precision**: All monetary values are stored and processed as integer centavos
5. **Concurrency Safety**: Atomic operations prevent race conditions during bet placement and cash out
6. **Type Safety**: TypeScript strict mode enforces compile-time type checking
7. **Real-Time Synchronization**: All clients receive consistent game state via WebSocket broadcasts

### Technology Stack

- **Runtime**: Bun (Node.js-compatible JavaScript runtime)
- **Framework**: NestJS (TypeScript framework with dependency injection)
- **Database**: PostgreSQL 18+ (with exact precision numeric types)
- **ORM**: Prisma (type-safe database client with migration support)
- **Message Broker**: RabbitMQ (AMQP 0-9-1 protocol)
- **WebSocket**: Socket.IO (real-time bidirectional communication)
- **Authentication**: JWT validation (tokens issued by Keycloak)
- **API Gateway**: Kong (handles routing and initial JWT validation)
- **Cryptography**: Node.js crypto module (HMAC-SHA256 for provably fair)

## Architecture

### Layered Architecture

The Game Service follows a four-layer DDD architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation Layer                           │
│  - REST Controllers (GamesController, RoundsController,          │
│    BetsController, HealthController)                             │
│  - WebSocket Gateway (GameGateway)                               │
│  - DTOs (PlaceBetDto, CashOutDto, RoundResponseDto)             │
│  - Guards (JwtAuthGuard)                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Application Layer                            │
│  - Use Cases (CreateRoundUseCase, StartRoundUseCase,            │
│    PlaceBetUseCase, CashOutUseCase, ProcessRoundCrashUseCase,   │
│    GetCurrentRoundUseCase, GetRoundHistoryUseCase,              │
│    GetPlayerBetHistoryUseCase, VerifyRoundUseCase)              │
│  - Application Services (RoundEngine)                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Domain Layer                               │
│  - Entities (Round, Bet)                                         │
│  - Value Objects (Money, RoundId, BetId, PlayerId, Multiplier,  │
│    CrashPoint, ServerSeed, ServerSeedHash)                       │
│  - Domain Events (RoundCreated, RoundStarted, RoundCrashed,     │
│    BetPlaced, BetCashedOut, BetLost)                            │
│  - Repository Interfaces (IRoundRepository, IBetRepository)      │
│  - Domain Services (ProvablyFairService, MultiplierService)     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                          │
│  - Repository Implementations (PrismaRoundRepository,            │
│    PrismaBetRepository)                                          │
│  - Message Broker (RabbitMQPublisher, RabbitMQConsumer)         │
│  - WebSocket Manager (SocketIOAdapter)                          │
│  - Database Configuration (Prisma Client)                        │
│  - Round Engine (Background service for round lifecycle)         │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

#### Complete Game Flow

```mermaid
sequenceDiagram
    participant Engine as Round Engine
    participant Domain as Round Entity
    participant Repo as Repository
    participant WS as WebSocket Gateway
    participant Player
    participant RabbitMQ
    participant Wallet as Wallet Service

    Note over Engine: Round Creation
    Engine->>Domain: Create new Round
    Domain->>Domain: Generate ServerSeed
    Domain->>Domain: Calculate CrashPoint
    Domain-->>Engine: Round (Betting state)
    Engine->>Repo: Save round
    Engine->>WS: Broadcast round_created
    WS->>Player: {roundId, serverSeedHash}

    Note over Engine: Betting Phase (10s)
    loop Every second
        Engine->>WS: Broadcast betting_countdown
        WS->>Player: {remainingTime}
    end

    Note over Player: Bet Placement
    Player->>Domain: Place bet (amount)
    Domain->>Domain: Validate (betting phase, amount, no duplicate)
    Domain->>Repo: Save bet (Pending)
    Domain->>RabbitMQ: Publish Bet_Placed_Event
    RabbitMQ->>Wallet: Debit balance
    Domain->>WS: Broadcast bet_placed
    WS->>Player: {playerId, amount}

    Note over Engine: Round Start
    Engine->>Domain: Start round
    Domain->>Domain: Transition to Running
    Domain->>Domain: Transition bets to Active
    Engine->>Repo: Update round and bets
    Engine->>WS: Broadcast round_started
    WS->>Player: {roundId, startTime}

    Note over Engine: Multiplier Progression
    loop 10+ times per second
        Engine->>Domain: Calculate current multiplier
        Engine->>WS: Broadcast multiplier_update
        WS->>Player: {multiplier, timestamp}
    end

    Note over Player: Cash Out
    Player->>Domain: Cash out
    Domain->>Domain: Validate (running phase, active bet)
    Domain->>Domain: Capture multiplier
    Domain->>Domain: Calculate payout
    Domain->>Domain: Transition bet to CashedOut
    Domain->>Repo: Update bet
    Domain->>RabbitMQ: Publish Cashout_Event
    RabbitMQ->>Wallet: Credit balance
    Domain->>WS: Broadcast cashout
    WS->>Player: {playerId, multiplier, payout}

    Note over Engine: Round Crash
    Engine->>Domain: Check if multiplier >= crashPoint
    Domain->>Domain: Transition to Crashed
    Domain->>Domain: Mark active bets as Lost
    Engine->>Repo: Update round and bets
    Engine->>RabbitMQ: Publish Bet_Lost_Events
    RabbitMQ->>Wallet: Log losses (no balance change)
    Engine->>WS: Broadcast round_crashed
    WS->>Player: {crashPoint, serverSeed}

    Note over Engine: Round Finish
    Engine->>Domain: Transition to Finished
    Engine->>Repo: Update round
    Engine->>Engine: Create new round
```

#### Bet Placement Flow with Wallet Integration

```mermaid
sequenceDiagram
    participant Client
    participant Controller as GamesController
    participant UseCase as PlaceBetUseCase
    participant Round as Round Entity
    participant Bet as Bet Entity
    participant Repo as BetRepository
    participant Publisher as RabbitMQPublisher
    participant RabbitMQ
    participant Wallet as Wallet Service

    Client->>Controller: POST /games/bet {amount}
    Controller->>UseCase: execute(playerId, amount)
    UseCase->>Round: validateBettingPhase()
    Round-->>UseCase: OK
    UseCase->>Bet: create(roundId, playerId, amount)
    Bet-->>UseCase: Bet (Pending state)
    UseCase->>Repo: save(bet)
    Repo-->>UseCase: Saved
    UseCase->>Publisher: publish(Bet_Placed_Event)
    Publisher->>RabbitMQ: Send to bet.placed queue
    RabbitMQ->>Wallet: Deliver event
    Wallet->>Wallet: Debit balance
    alt Sufficient balance
        Wallet->>RabbitMQ: ACK
        UseCase-->>Controller: Success
        Controller-->>Client: 201 Created {betId}
    else Insufficient balance
        Wallet->>RabbitMQ: Publish Insufficient_Balance_Event
        RabbitMQ->>Publisher: Deliver error event
        Publisher->>UseCase: Handle error
        UseCase->>Repo: Mark bet as rejected
        UseCase-->>Controller: Error
        Controller-->>Client: 422 Insufficient Balance
    end
```

### Concurrency Control Strategy

The service uses a combination of **optimistic locking** and **atomic operations**:

1. **Round State Transitions**: Optimistic locking with version field to prevent conflicting state changes
2. **Bet Placement**: Atomic database operations with unique constraints (one bet per player per round)
3. **Cash Out**: Atomic update with current multiplier capture in a single transaction
4. **Transaction Isolation**: READ COMMITTED isolation level for all operations
5. **Retry Logic**: Failed operations due to conflicts are retried up to 3 times with exponential backoff

## Components and Interfaces

### Domain Layer

#### Round Entity

```typescript
enum RoundState {
  BETTING = 'BETTING',
  RUNNING = 'RUNNING',
  CRASHED = 'CRASHED',
  FINISHED = 'FINISHED'
}

class Round {
  private readonly id: RoundId;
  private readonly serverSeed: ServerSeed;
  private readonly serverSeedHash: ServerSeedHash;
  private readonly crashPoint: CrashPoint;
  private state: RoundState;
  private readonly createdAt: Date;
  private startedAt: Date | null;
  private crashedAt: Date | null;
  private finishedAt: Date | null;
  private version: number;

  constructor(
    id: RoundId,
    serverSeed: ServerSeed,
    serverSeedHash: ServerSeedHash,
    crashPoint: CrashPoint,
    state: RoundState,
    createdAt: Date,
    startedAt: Date | null,
    crashedAt: Date | null,
    finishedAt: Date | null,
    version: number
  );

  // Factory method
  static create(provablyFairService: ProvablyFairService): Round;

  // State transition methods
  start(): Result<void, InvalidStateTransitionError>;
  crash(): Result<void, InvalidStateTransitionError>;
  finish(): Result<void, InvalidStateTransitionError>;

  // Query methods
  canAcceptBets(): boolean;
  isRunning(): boolean;
  hasCrashed(): boolean;
  isFinished(): boolean;

  // Getters
  getId(): RoundId;
  getServerSeed(): ServerSeed;
  getServerSeedHash(): ServerSeedHash;
  getCrashPoint(): CrashPoint;
  getState(): RoundState;
  getCreatedAt(): Date;
  getStartedAt(): Date | null;
  getCrashedAt(): Date | null;
  getFinishedAt(): Date | null;
  getVersion(): number;
}
```

**Invariants**:

- State transitions must follow: BETTING → RUNNING → CRASHED → FINISHED
- ServerSeed must remain secret until round crashes
- CrashPoint must be >= 1.00x
- Timestamps must be monotonically increasing

#### Bet Entity

```typescript
enum BetState {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  CASHED_OUT = 'CASHED_OUT',
  LOST = 'LOST',
  REJECTED = 'REJECTED'
}

class Bet {
  private readonly id: BetId;
  private readonly roundId: RoundId;
  private readonly playerId: PlayerId;
  private readonly amount: Money;
  private state: BetState;
  private cashOutMultiplier: Multiplier | null;
  private payout: Money | null;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(
    id: BetId,
    roundId: RoundId,
    playerId: PlayerId,
    amount: Money,
    state: BetState,
    cashOutMultiplier: Multiplier | null,
    payout: Money | null,
    createdAt: Date,
    updatedAt: Date
  );

  // Factory method
  static create(roundId: RoundId, playerId: PlayerId, amount: Money): Bet;

  // State transition methods
  activate(): Result<void, InvalidStateTransitionError>;
  cashOut(multiplier: Multiplier): Result<void, InvalidStateTransitionError>;
  markAsLost(): Result<void, InvalidStateTransitionError>;
  markAsRejected(): Result<void, InvalidStateTransitionError>;

  // Business logic
  calculatePayout(multiplier: Multiplier): Money;

  // Query methods
  canCashOut(): boolean;
  isActive(): boolean;
  hasCashedOut(): boolean;
  isLost(): boolean;

  // Getters
  getId(): BetId;
  getRoundId(): RoundId;
  getPlayerId(): PlayerId;
  getAmount(): Money;
  getState(): BetState;
  getCashOutMultiplier(): Multiplier | null;
  getPayout(): Money | null;
  getCreatedAt(): Date;
  getUpdatedAt(): Date;
}
```

**Invariants**:

- State transitions must follow: PENDING → ACTIVE → (CASHED_OUT | LOST)
- Amount must be between 100 and 100000 centavos
- CashOutMultiplier and Payout must be set when state is CASHED_OUT
- Payout = Amount × CashOutMultiplier (rounded down to nearest centavo)

#### Value Objects

```typescript
class Money {
  private readonly centavos: bigint;

  private constructor(centavos: bigint);

  static fromCentavos(centavos: bigint): Result<Money, InvalidMoneyError>;
  static zero(): Money;

  add(other: Money): Money;
  subtract(other: Money): Result<Money, NegativeMoneyError>;
  multiplyBy(multiplier: Multiplier): Money;
  isGreaterThanOrEqual(other: Money): boolean;
  equals(other: Money): boolean;
  
  toCentavos(): bigint;
  toDecimal(): string; // e.g., "100.50"
}

class Multiplier {
  private readonly value: number; // e.g., 1.50, 2.37, 10.00

  private constructor(value: number);

  static fromNumber(value: number): Result<Multiplier, InvalidMultiplierError>;
  static initial(): Multiplier; // Returns 1.00x

  isGreaterThanOrEqual(other: Multiplier): boolean;
  equals(other: Multiplier): boolean;
  
  toNumber(): number;
  toString(): string; // e.g., "1.50x"
}

class CrashPoint {
  private readonly multiplier: Multiplier;

  private constructor(multiplier: Multiplier);

  static fromMultiplier(multiplier: Multiplier): Result<CrashPoint, InvalidCrashPointError>;
  
  getMultiplier(): Multiplier;
  toNumber(): number;
  toString(): string;
}

class ServerSeed {
  private readonly value: string; // Hex string, 32 bytes (256 bits)

  private constructor(value: string);

  static generate(): ServerSeed;
  static fromString(value: string): Result<ServerSeed, InvalidServerSeedError>;
  
  toString(): string;
  toBuffer(): Buffer;
}

class ServerSeedHash {
  private readonly value: string; // SHA-256 hash as hex string

  private constructor(value: string);

  static fromServerSeed(seed: ServerSeed): ServerSeedHash;
  static fromString(value: string): Result<ServerSeedHash, InvalidHashError>;
  
  toString(): string;
  equals(other: ServerSeedHash): boolean;
}

class RoundId {
  private readonly value: string; // UUID v4
  
  private constructor(value: string);
  static create(): RoundId;
  static fromString(value: string): Result<RoundId, InvalidRoundIdError>;
  toString(): string;
  equals(other: RoundId): boolean;
}

class BetId {
  private readonly value: string; // UUID v4
  
  private constructor(value: string);
  static create(): BetId;
  static fromString(value: string): Result<BetId, InvalidBetIdError>;
  toString(): string;
  equals(other: BetId): boolean;
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

class RoundCreated implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly roundId: RoundId;
  readonly serverSeedHash: ServerSeedHash;
  readonly crashPoint: CrashPoint; // Not revealed to clients
}

class RoundStarted implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly roundId: RoundId;
  readonly startedAt: Date;
}

class RoundCrashed implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly roundId: RoundId;
  readonly crashPoint: CrashPoint;
  readonly serverSeed: ServerSeed;
  readonly crashedAt: Date;
}

class BetPlaced implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly betId: BetId;
  readonly roundId: RoundId;
  readonly playerId: PlayerId;
  readonly amount: Money;
}

class BetCashedOut implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly betId: BetId;
  readonly roundId: RoundId;
  readonly playerId: PlayerId;
  readonly amount: Money;
  readonly multiplier: Multiplier;
  readonly payout: Money;
}

class BetLost implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly betId: BetId;
  readonly roundId: RoundId;
  readonly playerId: PlayerId;
  readonly amount: Money;
}
```

#### Domain Services

```typescript
interface IProvablyFairService {
  generateServerSeed(): ServerSeed;
  calculateCrashPoint(serverSeed: ServerSeed, clientSeed?: string): CrashPoint;
  hashServerSeed(serverSeed: ServerSeed): ServerSeedHash;
  verifyCrashPoint(serverSeed: ServerSeed, crashPoint: CrashPoint, clientSeed?: string): boolean;
}

class ProvablyFairService implements IProvablyFairService {
  private readonly houseEdge: number = 0.03; // 3%

  generateServerSeed(): ServerSeed {
    // Generate cryptographically secure random 32 bytes
    const buffer = crypto.randomBytes(32);
    return ServerSeed.fromString(buffer.toString('hex'));
  }

  calculateCrashPoint(serverSeed: ServerSeed, clientSeed?: string): CrashPoint {
    // Algorithm:
    // 1. Combine serverSeed with optional clientSeed using HMAC-SHA256
    // 2. Convert hash to number between 0 and 1
    // 3. Apply house edge formula: crashPoint = 99 / (1 - hashValue) * (1 - houseEdge)
    // 4. Round to 2 decimal places
    // 5. Ensure minimum crash point of 1.00x
  }

  hashServerSeed(serverSeed: ServerSeed): ServerSeedHash {
    const hash = crypto.createHash('sha256')
      .update(serverSeed.toBuffer())
      .digest('hex');
    return ServerSeedHash.fromString(hash);
  }

  verifyCrashPoint(serverSeed: ServerSeed, crashPoint: CrashPoint, clientSeed?: string): boolean {
    const calculated = this.calculateCrashPoint(serverSeed, clientSeed);
    return calculated.equals(crashPoint);
  }
}

interface IMultiplierService {
  calculateMultiplier(startTime: Date, currentTime: Date, crashPoint: CrashPoint): Multiplier;
  getTimeUntilCrash(startTime: Date, crashPoint: CrashPoint): number; // milliseconds
}

class MultiplierService implements IMultiplierService {
  calculateMultiplier(startTime: Date, currentTime: Date, crashPoint: CrashPoint): Multiplier {
    // Formula: multiplier = e^(0.00006 * elapsedMs)
    // This creates an exponential curve that reaches crashPoint at the predetermined time
    // The constant 0.00006 is calibrated to create a visually appealing curve
    const elapsedMs = currentTime.getTime() - startTime.getTime();
    const multiplierValue = Math.pow(Math.E, 0.00006 * elapsedMs);
    return Multiplier.fromNumber(Math.min(multiplierValue, crashPoint.toNumber()));
  }

  getTimeUntilCrash(startTime: Date, crashPoint: CrashPoint): number {
    // Inverse of the multiplier formula
    // elapsedMs = ln(crashPoint) / 0.00006
    return Math.log(crashPoint.toNumber()) / 0.00006;
  }
}
```

#### Repository Interfaces

```typescript
interface IRoundRepository {
  save(round: Round): Promise<void>;
  findById(id: RoundId): Promise<Round | null>;
  findCurrent(): Promise<Round | null>;
  findFinished(page: number, pageSize: number): Promise<{ rounds: Round[]; total: number }>;
  existsById(id: RoundId): Promise<boolean>;
}

interface IBetRepository {
  save(bet: Bet): Promise<void>;
  findById(id: BetId): Promise<Bet | null>;
  findByRoundId(roundId: RoundId): Promise<Bet[]>;
  findByPlayerId(playerId: PlayerId, page: number, pageSize: number): Promise<{ bets: Bet[]; total: number }>;
  findByRoundIdAndPlayerId(roundId: RoundId, playerId: PlayerId): Promise<Bet | null>;
  findActiveByRoundId(roundId: RoundId): Promise<Bet[]>;
  existsByRoundIdAndPlayerId(roundId: RoundId, playerId: PlayerId): Promise<boolean>;
}
```

### Application Layer

#### Use Cases

```typescript
class CreateRoundUseCase {
  constructor(
    private readonly roundRepository: IRoundRepository,
    private readonly provablyFairService: IProvablyFairService,
    private readonly eventPublisher: IEventPublisher
  );

  async execute(): Promise<Result<RoundResponseDto, Error>> {
    // 1. Create new round using provably fair service
    // 2. Save round to repository
    // 3. Publish RoundCreated event
    // 4. Return round DTO
  }
}

class StartRoundUseCase {
  constructor(
    private readonly roundRepository: IRoundRepository,
    private readonly betRepository: IBetRepository,
    private readonly eventPublisher: IEventPublisher
  );

  async execute(roundId: RoundId): Promise<Result<void, RoundNotFoundError | InvalidStateTransitionError>> {
    // 1. Find round by ID
    // 2. Transition round to RUNNING state
    // 3. Find all PENDING bets for round
    // 4. Transition all bets to ACTIVE state
    // 5. Save round and bets
    // 6. Publish RoundStarted event
  }
}

class PlaceBetUseCase {
  constructor(
    private readonly roundRepository: IRoundRepository,
    private readonly betRepository: IBetRepository,
    private readonly eventPublisher: IEventPublisher
  );

  async execute(playerId: PlayerId, amount: Money): Promise<Result<BetResponseDto, Error>> {
    // 1. Find current round
    // 2. Validate round is in BETTING state
    // 3. Validate amount is within limits (100-100000 centavos)
    // 4. Check player doesn't already have a bet in this round
    // 5. Create bet entity
    // 6. Save bet
    // 7. Publish BetPlaced event (to RabbitMQ for wallet debit)
    // 8. Return bet DTO
  }
}

class CashOutUseCase {
  constructor(
    private readonly roundRepository: IRoundRepository,
    private readonly betRepository: IBetRepository,
    private readonly multiplierService: IMultiplierService,
    private readonly eventPublisher: IEventPublisher
  );

  async execute(playerId: PlayerId): Promise<Result<CashOutResponseDto, Error>> {
    // 1. Find current round
    // 2. Validate round is in RUNNING state
    // 3. Find player's active bet in current round
    // 4. Calculate current multiplier
    // 5. Calculate payout
    // 6. Transition bet to CASHED_OUT state
    // 7. Save bet
    // 8. Publish BetCashedOut event (to RabbitMQ for wallet credit)
    // 9. Return cash out DTO
  }
}

class ProcessRoundCrashUseCase {
  constructor(
    private readonly roundRepository: IRoundRepository,
    private readonly betRepository: IBetRepository,
    private readonly eventPublisher: IEventPublisher
  );

  async execute(roundId: RoundId): Promise<Result<void, Error>> {
    // 1. Find round by ID
    // 2. Transition round to CRASHED state
    // 3. Find all ACTIVE bets for round
    // 4. Transition all active bets to LOST state
    // 5. Save round and bets
    // 6. Publish RoundCrashed event
    // 7. Publish BetLost events for each lost bet (to RabbitMQ)
  }
}

class GetCurrentRoundUseCase {
  constructor(
    private readonly roundRepository: IRoundRepository,
    private readonly betRepository: IBetRepository
  );

  async execute(): Promise<Result<CurrentRoundResponseDto, RoundNotFoundError>> {
    // 1. Find current round
    // 2. Find all bets for current round
    // 3. Map to DTO (exclude serverSeed, include serverSeedHash)
    // 4. Return DTO
  }
}

class GetRoundHistoryUseCase {
  constructor(private readonly roundRepository: IRoundRepository);

  async execute(page: number, pageSize: number): Promise<Result<RoundHistoryResponseDto, Error>> {
    // 1. Validate pagination parameters
    // 2. Find finished rounds with pagination
    // 3. Map to DTOs (exclude serverSeed for future rounds)
    // 4. Return paginated response
  }
}

class GetPlayerBetHistoryUseCase {
  constructor(private readonly betRepository: IBetRepository);

  async execute(playerId: PlayerId, page: number, pageSize: number): Promise<Result<BetHistoryResponseDto, Error>> {
    // 1. Validate pagination parameters
    // 2. Find bets for player with pagination
    // 3. Map to DTOs
    // 4. Return paginated response
  }
}

class VerifyRoundUseCase {
  constructor(
    private readonly roundRepository: IRoundRepository,
    private readonly provablyFairService: IProvablyFairService
  );

  async execute(roundId: RoundId): Promise<Result<VerificationResponseDto, RoundNotFoundError>> {
    // 1. Find round by ID
    // 2. Verify round has crashed (serverSeed is revealed)
    // 3. Verify crash point using provably fair service
    // 4. Return verification data (serverSeed, serverSeedHash, crashPoint, algorithm)
  }
}
```

#### DTOs

```typescript
class PlaceBetDto {
  @IsInt()
  @Min(100)
  @Max(100000)
  amount: number; // Centavos
}

class BetResponseDto {
  readonly id: string;
  readonly roundId: string;
  readonly playerId: string;
  readonly amount: string; // Centavos as string
  readonly state: BetState;
  readonly createdAt: string; // ISO 8601
}

class CashOutResponseDto {
  readonly betId: string;
  readonly multiplier: string; // e.g., "2.50"
  readonly payout: string; // Centavos as string
  readonly cashedOutAt: string; // ISO 8601
}

class RoundResponseDto {
  readonly id: string;
  readonly state: RoundState;
  readonly serverSeedHash: string;
  readonly crashPoint?: string; // Only included after crash
  readonly serverSeed?: string; // Only included after crash
  readonly createdAt: string;
  readonly startedAt?: string;
  readonly crashedAt?: string;
}

class CurrentRoundResponseDto {
  readonly round: RoundResponseDto;
  readonly bets: BetSummaryDto[];
  readonly remainingBettingTime?: number; // Seconds, only in BETTING state
  readonly currentMultiplier?: string; // Only in RUNNING state
}

class BetSummaryDto {
  readonly playerId: string;
  readonly amount: string;
  readonly state: BetState;
  readonly cashOutMultiplier?: string;
  readonly payout?: string;
}

class RoundHistoryResponseDto {
  readonly rounds: RoundHistoryItemDto[];
  readonly pagination: PaginationDto;
}

class RoundHistoryItemDto {
  readonly id: string;
  readonly crashPoint: string;
  readonly serverSeedHash: string;
  readonly totalBets: number;
  readonly createdAt: string;
}

class BetHistoryResponseDto {
  readonly bets: BetHistoryItemDto[];
  readonly pagination: PaginationDto;
}

class BetHistoryItemDto {
  readonly id: string;
  readonly roundId: string;
  readonly amount: string;
  readonly state: BetState;
  readonly cashOutMultiplier?: string;
  readonly payout?: string;
  readonly createdAt: string;
}

class VerificationResponseDto {
  readonly roundId: string;
  readonly serverSeed: string;
  readonly serverSeedHash: string;
  readonly crashPoint: string;
  readonly algorithm: string; // Description of the provably fair algorithm
  readonly verified: boolean;
}

class PaginationDto {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}
```

#### Application Services

```typescript
class RoundEngine {
  constructor(
    private readonly createRoundUseCase: CreateRoundUseCase,
    private readonly startRoundUseCase: StartRoundUseCase,
    private readonly processRoundCrashUseCase: ProcessRoundCrashUseCase,
    private readonly roundRepository: IRoundRepository,
    private readonly multiplierService: IMultiplierService,
    private readonly webSocketGateway: GameGateway,
    private readonly bettingPhaseDuration: number // seconds, from config
  );

  async start(): Promise<void> {
    // 1. Create initial round
    // 2. Start round lifecycle loop
  }

  private async runRoundLifecycle(): Promise<void> {
    while (true) {
      // 1. Betting Phase
      await this.runBettingPhase();
      
      // 2. Running Phase
      await this.runRunningPhase();
      
      // 3. Crash and Finish
      await this.crashAndFinishRound();
      
      // 4. Create next round
      await this.createRoundUseCase.execute();
    }
  }

  private async runBettingPhase(): Promise<void> {
    // Broadcast countdown every second
    for (let remaining = this.bettingPhaseDuration; remaining > 0; remaining--) {
      this.webSocketGateway.broadcastBettingCountdown(remaining);
      await this.sleep(1000);
    }
  }

  private async runRunningPhase(): Promise<void> {
    const round = await this.roundRepository.findCurrent();
    await this.startRoundUseCase.execute(round.getId());
    
    const startTime = new Date();
    const crashTime = this.multiplierService.getTimeUntilCrash(startTime, round.getCrashPoint());
    
    // Broadcast multiplier updates at 10+ Hz
    const updateInterval = 100; // ms (10 Hz)
    let elapsed = 0;
    
    while (elapsed < crashTime) {
      const currentTime = new Date();
      const multiplier = this.multiplierService.calculateMultiplier(startTime, currentTime, round.getCrashPoint());
      this.webSocketGateway.broadcastMultiplierUpdate(multiplier);
      
      await this.sleep(updateInterval);
      elapsed += updateInterval;
    }
  }

  private async crashAndFinishRound(): Promise<void> {
    const round = await this.roundRepository.findCurrent();
    await this.processRoundCrashUseCase.execute(round.getId());
    
    // Wait 3 seconds before finishing
    await this.sleep(3000);
    
    round.finish();
    await this.roundRepository.save(round);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Infrastructure Layer

#### Prisma Repository Implementations

```typescript
class PrismaRoundRepository implements IRoundRepository {
  constructor(private readonly prisma: PrismaClient);

  async save(round: Round): Promise<void> {
    const data = this.toPersistence(round);
    await this.prisma.round.upsert({
      where: { id: data.id },
      create: data,
      update: {
        state: data.state,
        startedAt: data.startedAt,
        crashedAt: data.crashedAt,
        finishedAt: data.finishedAt,
        version: data.version,
      },
    });
  }

  async findById(id: RoundId): Promise<Round | null> {
    const record = await this.prisma.round.findUnique({
      where: { id: id.toString() },
    });
    return record ? this.toDomain(record) : null;
  }

  async findCurrent(): Promise<Round | null> {
    const record = await this.prisma.round.findFirst({
      where: {
        state: {
          in: ['BETTING', 'RUNNING', 'CRASHED'],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return record ? this.toDomain(record) : null;
  }

  async findFinished(page: number, pageSize: number): Promise<{ rounds: Round[]; total: number }> {
    const [records, total] = await Promise.all([
      this.prisma.round.findMany({
        where: { state: 'FINISHED' },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.round.count({
        where: { state: 'FINISHED' },
      }),
    ]);
    
    return {
      rounds: records.map(r => this.toDomain(r)),
      total,
    };
  }

  async existsById(id: RoundId): Promise<boolean> {
    const count = await this.prisma.round.count({
      where: { id: id.toString() },
    });
    return count > 0;
  }

  private toDomain(record: RoundRecord): Round {
    return new Round(
      RoundId.fromString(record.id),
      ServerSeed.fromString(record.serverSeed),
      ServerSeedHash.fromString(record.serverSeedHash),
      CrashPoint.fromMultiplier(Multiplier.fromNumber(record.crashPoint)),
      record.state as RoundState,
      record.createdAt,
      record.startedAt,
      record.crashedAt,
      record.finishedAt,
      record.version
    );
  }

  private toPersistence(round: Round): RoundRecord {
    return {
      id: round.getId().toString(),
      serverSeed: round.getServerSeed().toString(),
      serverSeedHash: round.getServerSeedHash().toString(),
      crashPoint: round.getCrashPoint().toNumber(),
      state: round.getState(),
      createdAt: round.getCreatedAt(),
      startedAt: round.getStartedAt(),
      crashedAt: round.getCrashedAt(),
      finishedAt: round.getFinishedAt(),
      version: round.getVersion(),
    };
  }
}

class PrismaBetRepository implements IBetRepository {
  constructor(private readonly prisma: PrismaClient);

  async save(bet: Bet): Promise<void> {
    const data = this.toPersistence(bet);
    await this.prisma.bet.upsert({
      where: { id: data.id },
      create: data,
      update: {
        state: data.state,
        cashOutMultiplier: data.cashOutMultiplier,
        payout: data.payout,
        updatedAt: data.updatedAt,
      },
    });
  }

  async findById(id: BetId): Promise<Bet | null> {
    const record = await this.prisma.bet.findUnique({
      where: { id: id.toString() },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByRoundId(roundId: RoundId): Promise<Bet[]> {
    const records = await this.prisma.bet.findMany({
      where: { roundId: roundId.toString() },
      orderBy: { createdAt: 'asc' },
    });
    return records.map(r => this.toDomain(r));
  }

  async findByPlayerId(playerId: PlayerId, page: number, pageSize: number): Promise<{ bets: Bet[]; total: number }> {
    const [records, total] = await Promise.all([
      this.prisma.bet.findMany({
        where: { playerId: playerId.toString() },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.bet.count({
        where: { playerId: playerId.toString() },
      }),
    ]);
    
    return {
      bets: records.map(r => this.toDomain(r)),
      total,
    };
  }

  async findByRoundIdAndPlayerId(roundId: RoundId, playerId: PlayerId): Promise<Bet | null> {
    const record = await this.prisma.bet.findUnique({
      where: {
        roundId_playerId: {
          roundId: roundId.toString(),
          playerId: playerId.toString(),
        },
      },
    });
    return record ? this.toDomain(record) : null;
  }

  async findActiveByRoundId(roundId: RoundId): Promise<Bet[]> {
    const records = await this.prisma.bet.findMany({
      where: {
        roundId: roundId.toString(),
        state: 'ACTIVE',
      },
    });
    return records.map(r => this.toDomain(r));
  }

  async existsByRoundIdAndPlayerId(roundId: RoundId, playerId: PlayerId): Promise<boolean> {
    const count = await this.prisma.bet.count({
      where: {
        roundId: roundId.toString(),
        playerId: playerId.toString(),
      },
    });
    return count > 0;
  }

  private toDomain(record: BetRecord): Bet {
    return new Bet(
      BetId.fromString(record.id),
      RoundId.fromString(record.roundId),
      PlayerId.fromString(record.playerId),
      Money.fromCentavos(BigInt(record.amount)),
      record.state as BetState,
      record.cashOutMultiplier ? Multiplier.fromNumber(record.cashOutMultiplier) : null,
      record.payout ? Money.fromCentavos(BigInt(record.payout)) : null,
      record.createdAt,
      record.updatedAt
    );
  }

  private toPersistence(bet: Bet): BetRecord {
    return {
      id: bet.getId().toString(),
      roundId: bet.getRoundId().toString(),
      playerId: bet.getPlayerId().toString(),
      amount: bet.getAmount().toCentavos().toString(),
      state: bet.getState(),
      cashOutMultiplier: bet.getCashOutMultiplier()?.toNumber() ?? null,
      payout: bet.getPayout()?.toCentavos().toString() ?? null,
      createdAt: bet.getCreatedAt(),
      updatedAt: bet.getUpdatedAt(),
    };
  }
}
```

#### RabbitMQ Publisher

```typescript
class RabbitMQPublisher implements IEventPublisher {
  constructor(private readonly connection: Connection);

  async publish(event: DomainEvent): Promise<void> {
    const channel = await this.connection.createChannel();
    
    try {
      const exchange = this.getExchangeName(event);
      const routingKey = this.getRoutingKey(event);
      const message = JSON.stringify(this.toMessageDto(event));
      
      await channel.assertExchange(exchange, 'topic', { durable: true });
      channel.publish(exchange, routingKey, Buffer.from(message), {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now(),
      });
    } finally {
      await channel.close();
    }
  }

  private getExchangeName(event: DomainEvent): string {
    if (event instanceof BetPlaced || event instanceof BetCashedOut || event instanceof BetLost) {
      return 'game.events';
    }
    return 'game.internal';
  }

  private getRoutingKey(event: DomainEvent): string {
    if (event instanceof BetPlaced) return 'bet.placed';
    if (event instanceof BetCashedOut) return 'bet.cashout';
    if (event instanceof BetLost) return 'bet.lost';
    if (event instanceof RoundCreated) return 'round.created';
    if (event instanceof RoundStarted) return 'round.started';
    if (event instanceof RoundCrashed) return 'round.crashed';
    throw new Error(`Unknown event type: ${event.constructor.name}`);
  }

  private toMessageDto(event: DomainEvent): any {
    if (event instanceof BetPlaced) {
      return {
        eventId: event.eventId,
        playerId: event.playerId.toString(),
        betId: event.betId.toString(),
        amount: event.amount.toCentavos().toString(),
        timestamp: event.occurredAt.toISOString(),
      };
    }
    if (event instanceof BetCashedOut) {
      return {
        eventId: event.eventId,
        playerId: event.playerId.toString(),
        betId: event.betId.toString(),
        amount: event.payout.toCentavos().toString(),
        multiplier: event.multiplier.toString(),
        timestamp: event.occurredAt.toISOString(),
      };
    }
    if (event instanceof BetLost) {
      return {
        eventId: event.eventId,
        playerId: event.playerId.toString(),
        betId: event.betId.toString(),
        amount: event.amount.toCentavos().toString(),
        timestamp: event.occurredAt.toISOString(),
      };
    }
    // Add other event mappings as needed
  }
}
```

#### RabbitMQ Consumer

```typescript
class RabbitMQConsumer {
  constructor(
    private readonly connection: Connection,
    private readonly betRepository: IBetRepository
  );

  async start(): Promise<void> {
    const channel = await this.connection.createChannel();
    
    // Subscribe to insufficient balance events from Wallet Service
    await channel.assertExchange('wallet.events', 'topic', { durable: true });
    await channel.assertQueue('game.insufficient_balance', { durable: true });
    await channel.bindQueue('game.insufficient_balance', 'wallet.events', 'wallet.insufficient_balance');
    
    channel.consume('game.insufficient_balance', async (msg) => {
      if (msg) {
        try {
          await this.handleInsufficientBalance(msg);
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing insufficient balance event:', error);
          channel.nack(msg, false, true); // Requeue for retry
        }
      }
    });
  }

  private async handleInsufficientBalance(message: ConsumeMessage): Promise<void> {
    const event = JSON.parse(message.content.toString());
    const betId = BetId.fromString(event.betId);
    
    const bet = await this.betRepository.findById(betId);
    if (bet) {
      bet.markAsRejected();
      await this.betRepository.save(bet);
    }
  }
}
```

#### WebSocket Gateway

```typescript
@WebSocketGateway({
  cors: {
    origin: '*', // Configure appropriately for production
  },
})
class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    // Send current round state to newly connected client
    this.sendCurrentRoundState(client);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  broadcastRoundCreated(round: Round) {
    this.server.emit('round_created', {
      roundId: round.getId().toString(),
      serverSeedHash: round.getServerSeedHash().toString(),
      timestamp: new Date().toISOString(),
    });
  }

  broadcastBettingCountdown(remainingSeconds: number) {
    this.server.emit('betting_countdown', {
      remainingTime: remainingSeconds,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastRoundStarted(round: Round) {
    this.server.emit('round_started', {
      roundId: round.getId().toString(),
      startedAt: round.getStartedAt()?.toISOString(),
      timestamp: new Date().toISOString(),
    });
  }

  broadcastMultiplierUpdate(multiplier: Multiplier) {
    this.server.emit('multiplier_update', {
      multiplier: multiplier.toString(),
      timestamp: new Date().toISOString(),
    });
  }

  broadcastBetPlaced(bet: Bet, username: string) {
    this.server.emit('bet_placed', {
      playerId: bet.getPlayerId().toString(),
      username,
      amount: bet.getAmount().toCentavos().toString(),
      timestamp: new Date().toISOString(),
    });
  }

  broadcastCashOut(bet: Bet, username: string) {
    this.server.emit('cashout', {
      playerId: bet.getPlayerId().toString(),
      username,
      multiplier: bet.getCashOutMultiplier()?.toString(),
      payout: bet.getPayout()?.toCentavos().toString(),
      timestamp: new Date().toISOString(),
    });
  }

  broadcastRoundCrashed(round: Round) {
    this.server.emit('round_crashed', {
      roundId: round.getId().toString(),
      crashPoint: round.getCrashPoint().toString(),
      serverSeed: round.getServerSeed().toString(),
      crashedAt: round.getCrashedAt()?.toISOString(),
      timestamp: new Date().toISOString(),
    });
  }

  private async sendCurrentRoundState(client: Socket) {
    // Fetch current round and send to client
    // Implementation depends on injected use case
  }
}
```

### Presentation Layer

#### REST Controllers

```typescript
@Controller('games')
class GamesController {
  constructor(
    private readonly placeBetUseCase: PlaceBetUseCase,
    private readonly cashOutUseCase: CashOutUseCase
  );

  @Post('bet')
  @UseGuards(JwtAuthGuard)
  async placeBet(
    @Request() req,
    @Body() dto: PlaceBetDto
  ): Promise<BetResponseDto> {
    const playerId = PlayerId.fromString(req.user.sub);
    const amount = Money.fromCentavos(BigInt(dto.amount));
    
    const result = await this.placeBetUseCase.execute(playerId, amount);
    
    if (result.isErr()) {
      throw this.mapError(result.error);
    }
    
    return result.value;
  }

  @Post('bet/cashout')
  @UseGuards(JwtAuthGuard)
  async cashOut(@Request() req): Promise<CashOutResponseDto> {
    const playerId = PlayerId.fromString(req.user.sub);
    
    const result = await this.cashOutUseCase.execute(playerId);
    
    if (result.isErr()) {
      throw this.mapError(result.error);
    }
    
    return result.value;
  }

  private mapError(error: Error): HttpException {
    // Map domain errors to HTTP exceptions
    if (error instanceof RoundNotInBettingPhaseError) {
      return new UnprocessableEntityException('Betting is closed for current round');
    }
    if (error instanceof DuplicateBetError) {
      return new ConflictException('You already have a bet in this round');
    }
    if (error instanceof InvalidBetAmountError) {
      return new BadRequestException('Bet amount must be between 1.00 and 1000.00');
    }
    if (error instanceof RoundNotRunningError) {
      return new UnprocessableEntityException('Round is not currently running');
    }
    if (error instanceof NoBetFoundError) {
      return new NotFoundException('No active bet found for current round');
    }
    return new InternalServerErrorException('An unexpected error occurred');
  }
}

@Controller('games/rounds')
class RoundsController {
  constructor(
    private readonly getCurrentRoundUseCase: GetCurrentRoundUseCase,
    private readonly getRoundHistoryUseCase: GetRoundHistoryUseCase,
    private readonly verifyRoundUseCase: VerifyRoundUseCase
  );

  @Get('current')
  async getCurrentRound(): Promise<CurrentRoundResponseDto> {
    const result = await this.getCurrentRoundUseCase.execute();
    
    if (result.isErr()) {
      throw new NotFoundException('No current round found');
    }
    
    return result.value;
  }

  @Get('history')
  async getRoundHistory(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20
  ): Promise<RoundHistoryResponseDto> {
    const result = await this.getRoundHistoryUseCase.execute(page, pageSize);
    
    if (result.isErr()) {
      throw new BadRequestException('Invalid pagination parameters');
    }
    
    return result.value;
  }

  @Get(':roundId/verify')
  async verifyRound(@Param('roundId') roundId: string): Promise<VerificationResponseDto> {
    const id = RoundId.fromString(roundId);
    const result = await this.verifyRoundUseCase.execute(id);
    
    if (result.isErr()) {
      throw new NotFoundException('Round not found');
    }
    
    return result.value;
  }
}

@Controller('games/bets')
class BetsController {
  constructor(private readonly getPlayerBetHistoryUseCase: GetPlayerBetHistoryUseCase);

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyBets(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20
  ): Promise<BetHistoryResponseDto> {
    const playerId = PlayerId.fromString(req.user.sub);
    const result = await this.getPlayerBetHistoryUseCase.execute(playerId, page, pageSize);
    
    if (result.isErr()) {
      throw new BadRequestException('Invalid pagination parameters');
    }
    
    return result.value;
  }
}

@Controller('health')
class HealthController {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly rabbitMQConnection: Connection
  );

  @Get()
  async check(): Promise<HealthCheckResponseDto> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRabbitMQ(),
      this.checkWebSocket(),
    ]);

    const allHealthy = checks.every(c => c.status === 'fulfilled' && c.value);

    if (!allHealthy) {
      throw new ServiceUnavailableException({
        status: 'unhealthy',
        checks: {
          database: checks[0].status === 'fulfilled' ? checks[0].value : false,
          rabbitmq: checks[1].status === 'fulfilled' ? checks[1].value : false,
          websocket: checks[2].status === 'fulfilled' ? checks[2].value : false,
        },
      });
    }

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async checkRabbitMQ(): Promise<boolean> {
    try {
      return this.rabbitMQConnection.isConnected();
    } catch {
      return false;
    }
  }

  private async checkWebSocket(): Promise<boolean> {
    // Check if WebSocket server is running
    return true; // Implement actual check
  }
}
```

## Data Models

### Database Schema (Prisma)

```prisma
model Round {
  id              String    @id @default(uuid())
  serverSeed      String    @map("server_seed")
  serverSeedHash  String    @map("server_seed_hash")
  crashPoint      Decimal   @map("crash_point") @db.Decimal(10, 2)
  state           String    @default("BETTING")
  createdAt       DateTime  @default(now()) @map("created_at")
  startedAt       DateTime? @map("started_at")
  crashedAt       DateTime? @map("crashed_at")
  finishedAt      DateTime? @map("finished_at")
  version         Int       @default(0)

  bets            Bet[]

  @@map("rounds")
  @@index([state])
  @@index([createdAt])
}

model Bet {
  id                 String    @id @default(uuid())
  roundId            String    @map("round_id")
  playerId           String    @map("player_id")
  amount             BigInt
  state              String    @default("PENDING")
  cashOutMultiplier  Decimal?  @map("cash_out_multiplier") @db.Decimal(10, 2)
  payout             BigInt?
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")

  round              Round     @relation(fields: [roundId], references: [id])

  @@unique([roundId, playerId])
  @@map("bets")
  @@index([playerId])
  @@index([roundId])
  @@index([state])
}
```

**Schema Constraints**:

- **Round**:
  - `id`: Primary key, UUID v4
  - `serverSeed`: 64-character hex string (32 bytes)
  - `serverSeedHash`: 64-character hex string (SHA-256 hash)
  - `crashPoint`: DECIMAL(10,2) for exact precision (e.g., 1.50, 2.37, 10.00)
  - `state`: ENUM-like string (BETTING, RUNNING, CRASHED, FINISHED)
  - `version`: Optimistic locking field
  - Timestamps: `createdAt`, `startedAt`, `crashedAt`, `finishedAt`

- **Bet**:
  - `id`: Primary key, UUID v4
  - `roundId`: Foreign key to Round
  - `playerId`: Player identifier from JWT
  - `amount`: BIGINT for exact centavo precision
  - `state`: ENUM-like string (PENDING, ACTIVE, CASHED_OUT, LOST, REJECTED)
  - `cashOutMultiplier`: DECIMAL(10,2), nullable
  - `payout`: BIGINT, nullable
  - Unique constraint on `(roundId, playerId)` enforces one bet per player per round

**Indexes**:

- Round: `state`, `createdAt` (for finding current and historical rounds)
- Bet: `playerId`, `roundId`, `state` (for lookups and filtering)

### Message Schemas

#### Bet_Placed_Event (Published by Game Service)

```json
{
  "eventId": "uuid-v4",
  "playerId": "player-uuid",
  "betId": "bet-uuid",
  "amount": "10000",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Exchange**: `game.events` (topic exchange)  
**Routing Key**: `bet.placed`  
**Consumer**: Wallet Service

#### Cashout_Event (Published by Game Service)

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

**Exchange**: `game.events` (topic exchange)  
**Routing Key**: `bet.cashout`  
**Consumer**: Wallet Service

#### Bet_Lost_Event (Published by Game Service)

```json
{
  "eventId": "uuid-v4",
  "playerId": "player-uuid",
  "betId": "bet-uuid",
  "amount": "10000",
  "timestamp": "2024-01-15T10:30:20.000Z"
}
```

**Exchange**: `game.events` (topic exchange)  
**Routing Key**: `bet.lost`  
**Consumer**: Wallet Service

#### Insufficient_Balance_Error (Consumed by Game Service)

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
**Publisher**: Wallet Service

### WebSocket Event Schemas

#### round_created

```json
{
  "roundId": "uuid-v4",
  "serverSeedHash": "sha256-hash-hex",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### betting_countdown

```json
{
  "remainingTime": 5,
  "timestamp": "2024-01-15T10:30:05.000Z"
}
```

#### round_started

```json
{
  "roundId": "uuid-v4",
  "startedAt": "2024-01-15T10:30:10.000Z",
  "timestamp": "2024-01-15T10:30:10.000Z"
}
```

#### multiplier_update

```json
{
  "multiplier": "1.50x",
  "timestamp": "2024-01-15T10:30:11.500Z"
}
```

#### bet_placed

```json
{
  "playerId": "player-uuid",
  "username": "player123",
  "amount": "10000",
  "timestamp": "2024-01-15T10:30:05.000Z"
}
```

#### cashout

```json
{
  "playerId": "player-uuid",
  "username": "player123",
  "multiplier": "2.50x",
  "payout": "25000",
  "timestamp": "2024-01-15T10:30:12.500Z"
}
```

#### round_crashed

```json
{
  "roundId": "uuid-v4",
  "crashPoint": "2.37x",
  "serverSeed": "hex-string",
  "crashedAt": "2024-01-15T10:30:15.000Z",
  "timestamp": "2024-01-15T10:30:15.000Z"
}
```

### Environment Configuration

```env
# Server
PORT=4001
NODE_ENV=production

# Database
DATABASE_URL=postgresql://game_user:game_pass@postgres:5432/games

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
RABBITMQ_GAME_EXCHANGE=game.events
RABBITMQ_WALLET_EXCHANGE=wallet.events
RABBITMQ_INSUFFICIENT_BALANCE_QUEUE=game.insufficient_balance

# JWT
JWT_SECRET=shared-secret-from-keycloak
JWT_ISSUER=http://keycloak:8080/realms/crash-game

# Game Configuration
BETTING_PHASE_DURATION=10
MIN_BET_AMOUNT=100
MAX_BET_AMOUNT=100000
HOUSE_EDGE=0.03

# WebSocket
WEBSOCKET_PORT=4001
WEBSOCKET_CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
```

## Provably Fair Algorithm

### Overview

The provably fair system ensures that crash points are pre-determined before any bets are placed and can be independently verified by players after the round completes. This prevents the house from manipulating results based on player bets.

### Algorithm Components

1. **Server Seed Generation**: Cryptographically secure random 32-byte value
2. **Server Seed Hash**: SHA-256 hash of the server seed, revealed before betting
3. **Crash Point Calculation**: Deterministic function using HMAC-SHA256
4. **House Edge Application**: 3% statistical advantage for the house
5. **Verification**: Players can independently verify crash points using revealed seeds

### Detailed Algorithm

#### Step 1: Server Seed Generation

```typescript
function generateServerSeed(): string {
  // Generate 32 bytes (256 bits) of cryptographically secure random data
  const buffer = crypto.randomBytes(32);
  return buffer.toString('hex'); // 64-character hex string
}
```

**Properties**:

- 256 bits of entropy (2^256 possible values)
- Cryptographically secure (uses OS-level randomness)
- Unpredictable and uniformly distributed

#### Step 2: Server Seed Hash

```typescript
function hashServerSeed(serverSeed: string): string {
  const hash = crypto.createHash('sha256')
    .update(Buffer.from(serverSeed, 'hex'))
    .digest('hex');
  return hash; // 64-character hex string
}
```

**Properties**:

- SHA-256 is a one-way function (cannot reverse to get seed)
- Deterministic (same seed always produces same hash)
- Collision-resistant (different seeds produce different hashes)

#### Step 3: Crash Point Calculation

```typescript
function calculateCrashPoint(serverSeed: string, clientSeed?: string): number {
  const HOUSE_EDGE = 0.03; // 3%
  
  // Step 3.1: Combine seeds using HMAC-SHA256
  const hmac = crypto.createHmac('sha256', serverSeed);
  if (clientSeed) {
    hmac.update(clientSeed);
  } else {
    hmac.update('default-client-seed'); // Use default if no client seed
  }
  const hash = hmac.digest('hex');
  
  // Step 3.2: Convert first 8 bytes of hash to a number between 0 and 1
  const hashValue = parseInt(hash.substring(0, 16), 16); // First 8 bytes as hex
  const maxValue = Math.pow(2, 64); // 2^64
  const normalized = hashValue / maxValue; // Value between 0 and 1
  
  // Step 3.3: Apply crash point formula with house edge
  // Formula: crashPoint = 99 / (1 - normalized) * (1 - houseEdge)
  // This creates an exponential distribution with expected value ~1.97x (with 3% house edge)
  const rawCrashPoint = 99 / (1 - normalized);
  const crashPointWithEdge = rawCrashPoint * (1 - HOUSE_EDGE);
  
  // Step 3.4: Round to 2 decimal places and ensure minimum of 1.00x
  const rounded = Math.max(1.00, Math.round(crashPointWithEdge * 100) / 100);
  
  return rounded;
}
```

**Mathematical Properties**:

- **Distribution**: Exponential distribution with heavy tail (rare high multipliers)
- **Expected Value**: ~1.97x (without house edge would be ~2.00x)
- **House Edge**: 3% reduces expected value, giving house statistical advantage
- **Minimum**: 1.00x (instant crash is possible but rare)
- **Maximum**: Theoretically unbounded, but extremely rare above 100x

**Example Calculation**:

```
serverSeed = "a1b2c3d4e5f6..." (64 hex chars)
clientSeed = "player-chosen-seed" (optional)

HMAC-SHA256(serverSeed, clientSeed) = "7f8e9d..." (64 hex chars)
First 8 bytes: "7f8e9d8c7b6a5948"
Decimal value: 9187201950435353928
Normalized: 9187201950435353928 / 2^64 = 0.498237...

rawCrashPoint = 99 / (1 - 0.498237) = 197.35x
crashPointWithEdge = 197.35 * (1 - 0.03) = 191.43x
rounded = 191.43x
```

#### Step 4: Multiplier Progression Formula

```typescript
function calculateMultiplier(startTime: Date, currentTime: Date, crashPoint: number): number {
  const elapsedMs = currentTime.getTime() - startTime.getTime();
  
  // Exponential growth formula: multiplier = e^(k * t)
  // where k is calibrated so the multiplier reaches crashPoint at the right time
  const k = 0.00006; // Growth rate constant
  const multiplier = Math.pow(Math.E, k * elapsedMs);
  
  // Cap at crash point
  return Math.min(multiplier, crashPoint);
}
```

**Properties**:

- Starts at 1.00x at t=0
- Grows exponentially (smooth acceleration)
- Deterministic (same start time and crash point always produce same curve)
- Reaches crash point at predetermined time

**Time to Crash**:

```typescript
function getTimeUntilCrash(crashPoint: number): number {
  const k = 0.00006;
  // Solve: crashPoint = e^(k * t)
  // t = ln(crashPoint) / k
  return Math.log(crashPoint) / k; // milliseconds
}
```

**Examples**:

- 1.50x crash: ~6.76 seconds
- 2.00x crash: ~11.55 seconds
- 5.00x crash: ~26.82 seconds
- 10.00x crash: ~38.38 seconds

### Verification Process

Players can verify any past round using the following steps:

1. **Retrieve Round Data**: Get `serverSeed`, `serverSeedHash`, `crashPoint` from verification endpoint
2. **Verify Hash**: Calculate SHA-256 hash of `serverSeed` and compare with `serverSeedHash`
3. **Recalculate Crash Point**: Use the algorithm above with `serverSeed` (and `clientSeed` if provided)
4. **Compare**: Verify calculated crash point matches the actual crash point

**Verification Endpoint Response**:

```json
{
  "roundId": "uuid-v4",
  "serverSeed": "a1b2c3d4e5f6...",
  "serverSeedHash": "7f8e9d8c...",
  "crashPoint": "2.37",
  "clientSeed": null,
  "algorithm": "HMAC-SHA256 with 3% house edge",
  "verified": true
}
```

### Hash Chain (Optional Enhancement)

For additional transparency, implement a hash chain where each round's server seed is derived from the previous round:

```typescript
function generateNextServerSeed(previousSeed: string): string {
  const hash = crypto.createHash('sha256')
    .update(Buffer.from(previousSeed, 'hex'))
    .digest('hex');
  return hash;
}
```

This creates an unbroken chain of seeds that can be verified from the genesis seed to the current round, proving that seeds were not cherry-picked.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The Game Service domain layer contains complex business logic that is well-suited for property-based testing. The following properties capture the essential correctness guarantees that must hold for all valid inputs.

### Property Reflection

After analyzing all acceptance criteria, several properties were identified as redundant or overlapping:

- **Crash Point Determinism** (1.5, 7.2, 7.5): All three requirements state the same property - same server seed produces same crash point. These are combined into Property 1.
- **Payout Calculation** (5.5, 15.3): Both requirements specify the same payout formula. These are combined into Property 4.
- **Multiplier Determinism** (4.3, 4.6): Both requirements specify deterministic multiplier calculation. These are combined into Property 3.
- **Round State Transitions** (28.1, 28.2, 28.3): All three specify parts of the same state machine. These are combined into Property 6.
- **Bet State Transitions** (29.1, 29.2): Both specify parts of the same state machine. These are combined into Property 7.

### Property 1: Provably Fair Determinism

*For any* server seed, the crash point calculation SHALL be deterministic such that the same server seed always produces the same crash point, and the crash point SHALL always be greater than or equal to 1.00x.

**Validates: Requirements 1.5, 7.2, 7.5**

### Property 2: Server Seed Hash Integrity

*For any* server seed, the SHA-256 hash SHALL be deterministic (same seed always produces same hash), and the hash SHALL be verifiable by independently computing SHA-256 of the server seed.

**Validates: Requirements 1.4**

### Property 3: Multiplier Progression Determinism

*For any* start time, current time, and crash point, the multiplier calculation SHALL be deterministic and reproducible, such that the same inputs always produce the same multiplier value, and the multiplier SHALL never exceed the crash point.

**Validates: Requirements 4.3, 4.6**

### Property 4: Payout Calculation Exactness

*For any* bet amount (in centavos) and multiplier, the payout calculation SHALL use exact integer arithmetic such that payout = floor(amount × multiplier), with no floating-point rounding errors.

**Validates: Requirements 5.5, 15.3**

### Property 5: Bet Amount Validation

*For any* bet amount, the validation SHALL accept amounts between 100 and 100000 centavos (inclusive) and SHALL reject amounts outside this range.

**Validates: Requirements 3.2, 27.1, 27.2**

### Property 6: Round State Transition Validity

*For any* round, state transitions SHALL only follow the valid sequence: BETTING → RUNNING → CRASHED → FINISHED, and any attempt to transition to an invalid state SHALL be rejected.

**Validates: Requirements 28.1, 28.2, 28.3**

### Property 7: Bet State Transition Validity

*For any* bet, state transitions SHALL only follow the valid sequences: PENDING → ACTIVE → CASHED_OUT or PENDING → ACTIVE → LOST, and any attempt to transition to an invalid state SHALL be rejected.

**Validates: Requirements 29.1, 29.2**

### Property 8: One Bet Per Player Per Round

*For any* round and player, the system SHALL allow at most one bet per player per round, and SHALL reject any attempt to place a second bet in the same round.

**Validates: Requirements 3.3, 3.10**

### Property 9: Monetary Precision

*For any* monetary operation (addition, subtraction, multiplication), the system SHALL use exact integer arithmetic on centavo values, ensuring no precision loss or floating-point errors.

**Validates: Requirements 15.1, 15.2**

### Property 10: Concurrent Bet Placement Safety

*For any* set of concurrent bet placement operations, the system SHALL process each bet atomically such that all invariants are preserved (no duplicate bets, correct balance deductions, consistent state).

**Validates: Requirements 16.1, 16.2**

### Property 11: Multiplier Monotonicity

*For any* round in running phase, the multiplier SHALL increase monotonically over time (never decrease) until it reaches the crash point.

**Validates: Requirements 4.2**

### Property 12: Crash Point Minimum Value

*For any* generated crash point, the value SHALL be greater than or equal to 1.00x.

**Validates: Requirements 7.4**

## Error Handling

### Error Types and Responses

The Game Service defines the following error types with specific HTTP status codes and error messages:

#### Domain Errors

| Error Type | HTTP Status | Error Code | Description |
|------------|-------------|------------|-------------|
| `RoundNotFoundError` | 404 Not Found | `ROUND_NOT_FOUND` | Round does not exist |
| `RoundNotInBettingPhaseError` | 422 Unprocessable Entity | `BETTING_CLOSED` | Cannot place bet outside betting phase |
| `RoundNotRunningError` | 422 Unprocessable Entity | `ROUND_NOT_RUNNING` | Cannot cash out outside running phase |
| `InvalidBetAmountError` | 400 Bad Request | `INVALID_BET_AMOUNT` | Bet amount outside allowed range (1.00-1000.00) |
| `DuplicateBetError` | 409 Conflict | `DUPLICATE_BET` | Player already has a bet in this round |
| `NoBetFoundError` | 404 Not Found | `NO_BET_FOUND` | Player has no active bet in current round |
| `InvalidStateTransitionError` | 422 Unprocessable Entity | `INVALID_STATE_TRANSITION` | Attempted invalid state transition |
| `InvalidMoneyError` | 400 Bad Request | `INVALID_MONEY` | Monetary value is invalid (negative, non-integer) |
| `InvalidMultiplierError` | 400 Bad Request | `INVALID_MULTIPLIER` | Multiplier value is invalid (< 1.00) |
| `InvalidCrashPointError` | 400 Bad Request | `INVALID_CRASH_POINT` | Crash point value is invalid (< 1.00) |
| `InvalidServerSeedError` | 400 Bad Request | `INVALID_SERVER_SEED` | Server seed format is invalid |

#### Infrastructure Errors

| Error Type | HTTP Status | Error Code | Description |
|------------|-------------|------------|-------------|
| `DatabaseConnectionError` | 503 Service Unavailable | `DATABASE_UNAVAILABLE` | Cannot connect to PostgreSQL |
| `MessageBrokerConnectionError` | 503 Service Unavailable | `MESSAGE_BROKER_UNAVAILABLE` | Cannot connect to RabbitMQ |
| `DatabaseTimeoutError` | 504 Gateway Timeout | `DATABASE_TIMEOUT` | Database query exceeded timeout |
| `OptimisticLockError` | 409 Conflict | `CONCURRENT_MODIFICATION` | Round was modified by another operation |

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
2. **Domain Errors**: Log error, handle gracefully (e.g., mark bet as rejected), ACK message
3. **Transient Errors** (e.g., database timeout): Log error, NACK message for redelivery
4. **Permanent Errors**: Log error, publish to dead-letter queue, ACK message

#### Retry Strategy

- **Database Operations**: Retry up to 3 times with exponential backoff (100ms, 200ms, 400ms)
- **Message Processing**: Rely on RabbitMQ redelivery with max 3 attempts
- **Optimistic Lock Conflicts**: Retry up to 3 times with 50ms delay between attempts

### Logging Strategy

#### Log Levels

- **ERROR**: Unrecoverable errors, infrastructure failures, unexpected exceptions
- **WARN**: Recoverable errors, invalid bets, state transition failures
- **INFO**: Successful operations, round created, bet placed, cash out processed
- **DEBUG**: Detailed operation flow, multiplier updates, state transitions

#### Structured Logging Format

All logs use JSON format with the following fields:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "service": "game-service",
  "context": "PlaceBetUseCase",
  "message": "Bet placed successfully",
  "roundId": "round-uuid",
  "playerId": "player-uuid",
  "betId": "bet-uuid",
  "amount": "10000",
  "requestId": "uuid-v4"
}
```

#### Sensitive Data Handling

- **Never log**: JWT tokens, full token payloads, server seeds before round crash
- **Redact**: Player personal information (if present in future)
- **Log**: Player IDs, round IDs, bet IDs, amounts, multipliers, crash points (business data)

## Testing Strategy

The Game Service employs a comprehensive testing strategy with three complementary layers: property-based tests for domain logic, unit tests for specific scenarios, and integration tests for infrastructure components.

### Property-Based Testing

Property-based tests verify universal correctness properties across randomly generated inputs. These tests use **fast-check** (JavaScript property-based testing library) and run a minimum of 100 iterations per property.

#### Test Configuration

```typescript
// tests/unit/domain/provably-fair.property.test.ts
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
 * Feature: game-service, Property 1: Provably Fair Determinism
 * For any server seed, the crash point calculation SHALL be deterministic
 * such that the same server seed always produces the same crash point.
 */
describe('Property 1: Provably Fair Determinism', () => {
  it('should produce same crash point for same server seed', () => {
    fc.assert(
      fc.property(
        fc.hexaString({ minLength: 64, maxLength: 64 }), // Server seed
        (serverSeedHex) => {
          // Arrange
          const serverSeed = ServerSeed.fromString(serverSeedHex);
          const provablyFairService = new ProvablyFairService();
          
          // Act
          const crashPoint1 = provablyFairService.calculateCrashPoint(serverSeed);
          const crashPoint2 = provablyFairService.calculateCrashPoint(serverSeed);
          
          // Assert
          expect(crashPoint1.equals(crashPoint2)).toBe(true);
          expect(crashPoint1.toNumber()).toBeGreaterThanOrEqual(1.00);
        }
      )
    );
  });
});
```

#### Property Test Coverage

| Property | Test File | Arbitraries |
|----------|-----------|-------------|
| Property 1: Provably Fair Determinism | `provably-fair.property.test.ts` | `fc.hexaString()` for seeds |
| Property 2: Server Seed Hash Integrity | `provably-fair.property.test.ts` | `fc.hexaString()` for seeds |
| Property 3: Multiplier Determinism | `multiplier.property.test.ts` | `fc.date()`, `fc.float()` for crash points |
| Property 4: Payout Exactness | `bet.property.test.ts` | `fc.bigInt()` for amounts, `fc.float()` for multipliers |
| Property 5: Bet Amount Validation | `bet.property.test.ts` | `fc.bigInt()` for amounts |
| Property 6: Round State Transitions | `round.property.test.ts` | `fc.constantFrom()` for states |
| Property 7: Bet State Transitions | `bet.property.test.ts` | `fc.constantFrom()` for states |
| Property 8: One Bet Per Player | `bet.property.test.ts` | `fc.uuid()` for player/round IDs |
| Property 9: Monetary Precision | `money.property.test.ts` | `fc.bigInt()` for centavos |
| Property 10: Concurrent Safety | `bet.property.test.ts` | `fc.array()` of bet operations |
| Property 11: Multiplier Monotonicity | `multiplier.property.test.ts` | `fc.date()` sequences |
| Property 12: Crash Point Minimum | `provably-fair.property.test.ts` | `fc.hexaString()` for seeds |

### Unit Testing

Unit tests verify specific scenarios, edge cases, and example-based behavior. These tests use **Bun's built-in test runner**.

#### Unit Test Coverage

**Domain Layer** (Target: 95% coverage):

- Round entity: state transitions, validation, getters
- Bet entity: state transitions, payout calculation, validation
- Value objects: Money, Multiplier, CrashPoint, ServerSeed creation and validation
- Domain services: ProvablyFairService, MultiplierService
- Domain events: creation and serialization

**Application Layer** (Target: 90% coverage):

- Use cases: CreateRound, StartRound, PlaceBet, CashOut, ProcessRoundCrash, GetCurrentRound, GetRoundHistory, GetPlayerBetHistory, VerifyRound
- Error scenarios: round not found, invalid state, duplicate bet, invalid amount
- Edge cases: minimum/maximum bet amounts, crash at 1.00x, concurrent operations

**Presentation Layer** (Target: 85% coverage):

- Controllers: request handling, response formatting, error mapping
- DTOs: validation rules
- Guards: JWT validation and player ID extraction
- WebSocket Gateway: event broadcasting

#### Example Unit Tests

```typescript
// tests/unit/domain/round.test.ts
describe('Round Entity', () => {
  it('should transition from BETTING to RUNNING', () => {
    // Arrange
    const round = createRoundInBettingState();
    
    // Act
    const result = round.start();
    
    // Assert
    expect(result.isOk()).toBe(true);
    expect(round.getState()).toBe(RoundState.RUNNING);
    expect(round.getStartedAt()).not.toBeNull();
  });

  it('should reject transition from BETTING to CRASHED', () => {
    // Arrange
    const round = createRoundInBettingState();
    
    // Act
    const result = round.crash();
    
    // Assert
    expect(result.isErr()).toBe(true);
    expect(result.error).toBeInstanceOf(InvalidStateTransitionError);
    expect(round.getState()).toBe(RoundState.BETTING); // State unchanged
  });
});
```

### Integration Testing

Integration tests verify infrastructure components, database operations, message broker integration, WebSocket communication, and end-to-end API flows.

#### Test Environment Setup

- **Test Database**: Separate PostgreSQL database (`games_test`)
- **Test Message Broker**: Separate RabbitMQ vhost (`/test`)
- **Database Migrations**: Run before each test suite
- **Database Cleanup**: Truncate tables after each test
- **Test Containers**: Use Docker containers for PostgreSQL and RabbitMQ

#### Integration Test Coverage

**Repository Layer**:

- CRUD operations: save, findById, findCurrent, findFinished
- Queries: findByRoundId, findByPlayerId, findActiveByRoundId
- Transactions: atomic updates, rollback on error
- Constraints: unique (roundId, playerId), optimistic locking

**Message Broker**:

- Publisher: publish events to exchanges with routing keys
- Consumer: subscribe to queues, process messages, ACK/NACK
- Error handling: dead-letter queue, redelivery

**WebSocket**:

- Connection: establish connection, disconnect, reconnect
- Broadcasting: send events to all connected clients
- Event delivery: verify clients receive events in correct order

**End-to-End API**:

- POST /games/bet: place bet, authentication, validation, wallet integration
- POST /games/bet/cashout: cash out, authentication, multiplier capture
- GET /games/rounds/current: retrieve current round with bets
- GET /games/rounds/history: retrieve paginated round history
- GET /games/rounds/:id/verify: verify provably fair crash point
- GET /games/bets/me: retrieve player bet history
- GET /health: database, message broker, and WebSocket connectivity

#### Example Integration Test

```typescript
// tests/e2e/bet-placement.e2e.test.ts
describe('POST /games/bet', () => {
  beforeEach(async () => {
    await truncateDatabase();
    await createRoundInBettingPhase();
  });

  it('should place bet and publish event to RabbitMQ', async () => {
    // Arrange
    const token = generateValidJWT({ sub: 'player-123' });
    const rabbitMQSpy = spyOnRabbitMQPublish();
    
    // Act
    const response = await request(app)
      .post('/games/bet')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 10000 });
    
    // Assert
    expect(response.status).toBe(201);
    expect(response.body.betId).toBeDefined();
    expect(response.body.amount).toBe('10000');
    
    // Verify database persistence
    const bet = await prisma.bet.findUnique({
      where: { id: response.body.betId },
    });
    expect(bet).not.toBeNull();
    expect(bet.state).toBe('PENDING');
    
    // Verify RabbitMQ event published
    expect(rabbitMQSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        playerId: 'player-123',
        amount: '10000',
      })
    );
  });

  it('should return 409 when player already has bet in round', async () => {
    // Arrange
    const token = generateValidJWT({ sub: 'player-123' });
    await createBetForPlayer('player-123');
    
    // Act
    const response = await request(app)
      .post('/games/bet')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 10000 });
    
    // Assert
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('DUPLICATE_BET');
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
bun test tests/unit/domain/round.test.ts
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

### Concurrency Strategy

The service uses a combination of optimistic locking and atomic operations:

1. **Optimistic Locking**: Round entity has a `version` field that is incremented on each update. Concurrent updates are detected and retried.
2. **Unique Constraints**: Database enforces one bet per player per round via unique constraint on `(roundId, playerId)`.
3. **Atomic Operations**: All state transitions occur within database transactions.

### WebSocket Broadcast Strategy

- **Broadcast Frequency**: Multiplier updates are broadcast at 10+ Hz (every 100ms or less)
- **Event Ordering**: Events are broadcast in the order they occur (round created → betting countdown → round started → multiplier updates → round crashed)
- **Connection Management**: New clients receive current round state upon connection
- **Scalability**: For horizontal scaling, use Redis pub/sub to synchronize broadcasts across multiple server instances

### Deployment Considerations

1. **Database Migrations**: Run migrations before deploying new service version
2. **Zero-Downtime Deployment**: Use rolling updates with health checks
3. **Message Broker**: Ensure exchanges and queues exist before starting consumers
4. **Environment Variables**: Validate all required env vars on startup
5. **Graceful Shutdown**: Stop round engine, drain message queue, close connections on SIGTERM
6. **Round Engine**: Run as a singleton (only one instance should manage round lifecycle)

### Performance Considerations

1. **Database Connection Pool**: Configure pool size based on expected load (default: 10)
2. **Query Timeout**: Set reasonable timeout to prevent long-running queries (default: 5s)
3. **Message Prefetch**: Process one message at a time to prevent memory issues
4. **Index Usage**: Ensure queries use indexes (state, createdAt, playerId, roundId)
5. **WebSocket Connections**: Monitor connection count and implement rate limiting if needed
6. **Multiplier Calculation**: Cache multiplier values if calculation becomes a bottleneck

### Security Considerations

1. **JWT Validation**: Verify signature, expiration, and issuer
2. **SQL Injection**: Use parameterized queries (Prisma handles this)
3. **Input Validation**: Validate all inputs at DTO layer
4. **Rate Limiting**: Implement at API Gateway level (Kong)
5. **Secrets Management**: Store sensitive config in environment variables or secrets manager
6. **Server Seed Protection**: Never reveal server seed before round crashes

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Authors**: Kiro AI Agent  
**Status**: Ready for Review
