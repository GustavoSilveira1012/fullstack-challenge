import { RoundId } from '../value-objects/round-id';
import { ServerSeed } from '../value-objects/server-seed';
import { ServerSeedHash } from '../value-objects/server-seed-hash';
import { CrashPoint } from '../value-objects/crash-point';

/**
 * RoundState Enum
 * Represents the state of a game round
 * Valid transitions: BETTING → RUNNING → CRASHED → FINISHED
 */
export enum RoundState {
  BETTING = 'BETTING',
  RUNNING = 'RUNNING',
  CRASHED = 'CRASHED',
  FINISHED = 'FINISHED',
}

/**
 * InvalidStateTransitionError
 * Thrown when attempting an invalid state transition
 */
export class InvalidStateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateTransitionError';
  }
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/**
 * ProvablyFairService Interface
 * Defines the contract for provably fair operations
 */
export interface IProvablyFairService {
  generateServerSeed(): ServerSeed;
  calculateCrashPoint(serverSeed: ServerSeed, clientSeed?: string): CrashPoint;
  hashServerSeed(serverSeed: ServerSeed): ServerSeedHash;
}

/**
 * Round Entity
 * Represents a complete game round with state machine
 * Invariants:
 * - State transitions must follow: BETTING → RUNNING → CRASHED → FINISHED
 * - ServerSeed must remain secret until round crashes
 * - CrashPoint must be >= 1.00x
 * - Timestamps must be monotonically increasing
 */
export class Round {
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

  /**
   * Constructor for Round entity
   * @param id - Unique round identifier
   * @param serverSeed - Secret server seed for provably fair
   * @param serverSeedHash - SHA-256 hash of server seed
   * @param crashPoint - Pre-determined crash point
   * @param state - Current round state
   * @param createdAt - Timestamp when round was created
   * @param startedAt - Timestamp when round started (null if not started)
   * @param crashedAt - Timestamp when round crashed (null if not crashed)
   * @param finishedAt - Timestamp when round finished (null if not finished)
   * @param version - Optimistic locking version
   */
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
    version: number,
  ) {
    this.id = id;
    this.serverSeed = serverSeed;
    this.serverSeedHash = serverSeedHash;
    this.crashPoint = crashPoint;
    this.state = state;
    this.createdAt = createdAt;
    this.startedAt = startedAt;
    this.crashedAt = crashedAt;
    this.finishedAt = finishedAt;
    this.version = version;
  }

  /**
   * Factory method to create a new Round
   * Creates a round in BETTING state with generated server seed and crash point
   * @param provablyFairService - Service for generating provably fair values
   * @returns New Round instance in BETTING state
   */
  static create(provablyFairService: IProvablyFairService): Round {
    const id = RoundId.create();
    const serverSeed = provablyFairService.generateServerSeed();
    const serverSeedHash = provablyFairService.hashServerSeed(serverSeed);
    const crashPoint = provablyFairService.calculateCrashPoint(serverSeed);
    const now = new Date();

    return new Round(
      id,
      serverSeed,
      serverSeedHash,
      crashPoint,
      RoundState.BETTING,
      now,
      null,
      null,
      null,
      1,
    );
  }

  /**
   * Transition round from BETTING to RUNNING state
   * @returns Result indicating success or InvalidStateTransitionError
   */
  start(): Result<void, InvalidStateTransitionError> {
    if (this.state !== RoundState.BETTING) {
      return {
        ok: false,
        error: new InvalidStateTransitionError(
          `Cannot start round in ${this.state} state. Round must be in BETTING state.`,
        ),
      };
    }

    this.state = RoundState.RUNNING;
    this.startedAt = new Date();
    this.version++;

    return { ok: true, value: undefined };
  }

  /**
   * Transition round from RUNNING to CRASHED state
   * @returns Result indicating success or InvalidStateTransitionError
   */
  crash(): Result<void, InvalidStateTransitionError> {
    if (this.state !== RoundState.RUNNING) {
      return {
        ok: false,
        error: new InvalidStateTransitionError(
          `Cannot crash round in ${this.state} state. Round must be in RUNNING state.`,
        ),
      };
    }

    this.state = RoundState.CRASHED;
    this.crashedAt = new Date();
    this.version++;

    return { ok: true, value: undefined };
  }

  /**
   * Transition round from CRASHED to FINISHED state
   * @returns Result indicating success or InvalidStateTransitionError
   */
  finish(): Result<void, InvalidStateTransitionError> {
    if (this.state !== RoundState.CRASHED) {
      return {
        ok: false,
        error: new InvalidStateTransitionError(
          `Cannot finish round in ${this.state} state. Round must be in CRASHED state.`,
        ),
      };
    }

    this.state = RoundState.FINISHED;
    this.finishedAt = new Date();
    this.version++;

    return { ok: true, value: undefined };
  }

  /**
   * Query method: Check if round can accept bets
   * @returns true if round is in BETTING state
   */
  canAcceptBets(): boolean {
    return this.state === RoundState.BETTING;
  }

  /**
   * Query method: Check if round is running
   * @returns true if round is in RUNNING state
   */
  isRunning(): boolean {
    return this.state === RoundState.RUNNING;
  }

  /**
   * Query method: Check if round has crashed
   * @returns true if round is in CRASHED state
   */
  hasCrashed(): boolean {
    return this.state === RoundState.CRASHED;
  }

  /**
   * Query method: Check if round is finished
   * @returns true if round is in FINISHED state
   */
  isFinished(): boolean {
    return this.state === RoundState.FINISHED;
  }

  /**
   * Getter: Get round ID
   * @returns RoundId instance
   */
  getId(): RoundId {
    return this.id;
  }

  /**
   * Getter: Get server seed
   * @returns ServerSeed instance
   */
  getServerSeed(): ServerSeed {
    return this.serverSeed;
  }

  /**
   * Getter: Get server seed hash
   * @returns ServerSeedHash instance
   */
  getServerSeedHash(): ServerSeedHash {
    return this.serverSeedHash;
  }

  /**
   * Getter: Get crash point
   * @returns CrashPoint instance
   */
  getCrashPoint(): CrashPoint {
    return this.crashPoint;
  }

  /**
   * Getter: Get current state
   * @returns RoundState enum value
   */
  getState(): RoundState {
    return this.state;
  }

  /**
   * Getter: Get creation timestamp
   * @returns Date instance
   */
  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Getter: Get start timestamp
   * @returns Date instance or null if not started
   */
  getStartedAt(): Date | null {
    return this.startedAt;
  }

  /**
   * Getter: Get crash timestamp
   * @returns Date instance or null if not crashed
   */
  getCrashedAt(): Date | null {
    return this.crashedAt;
  }

  /**
   * Getter: Get finish timestamp
   * @returns Date instance or null if not finished
   */
  getFinishedAt(): Date | null {
    return this.finishedAt;
  }

  /**
   * Getter: Get optimistic locking version
   * @returns Version number
   */
  getVersion(): number {
    return this.version;
  }
}
