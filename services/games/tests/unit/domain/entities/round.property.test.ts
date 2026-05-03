import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  Round,
  RoundState,
  InvalidStateTransitionError,
  IProvablyFairService,
} from '../../../../src/domain/entities/round';
import { ServerSeed } from '../../../../src/domain/value-objects/server-seed';
import { ServerSeedHash } from '../../../../src/domain/value-objects/server-seed-hash';
import { CrashPoint } from '../../../../src/domain/value-objects/crash-point';
import { Multiplier } from '../../../../src/domain/value-objects/multiplier';

/**
 * Mock ProvablyFairService for testing
 */
class MockProvablyFairService implements IProvablyFairService {
  generateServerSeed(): ServerSeed {
    return ServerSeed.generate();
  }

  calculateCrashPoint(): CrashPoint {
    const multiplier = Multiplier.fromNumber(2.5).value;
    return CrashPoint.fromMultiplier(multiplier).value;
  }

  hashServerSeed(seed: ServerSeed): ServerSeedHash {
    return ServerSeedHash.fromServerSeed(seed);
  }
}

/**
 * Arbitraries for property-based testing
 */
const roundStateArbitrary = fc.oneof(
  fc.constant(RoundState.BETTING),
  fc.constant(RoundState.RUNNING),
  fc.constant(RoundState.CRASHED),
  fc.constant(RoundState.FINISHED),
);

describe('Round Entity - Property-Based Tests', () => {
  describe('Property 6: Round State Transition Validity', () => {
    /**
     * **Validates: Requirements 28.1, 28.2, 28.3**
     *
     * This property verifies that:
     * 1. Only valid state transitions are allowed (BETTING → RUNNING → CRASHED → FINISHED)
     * 2. Invalid transitions are rejected with InvalidStateTransitionError
     * 3. State invariants are maintained throughout the lifecycle
     */

    it('should only allow valid transitions from BETTING state', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (seed) => {
          fc.configureGlobal({ seed });
          const mockService = new MockProvablyFairService();
          const round = Round.create(mockService);

          // From BETTING, only start() should succeed
          const startResult = round.start();
          expect(startResult.ok).toBe(true);
          expect(round.getState()).toBe(RoundState.RUNNING);

          // Create a fresh round for testing crash from BETTING
          const round2 = Round.create(mockService);
          const crashResult = round2.crash();
          expect(crashResult.ok).toBe(false);
          expect(crashResult.error).toBeInstanceOf(InvalidStateTransitionError);

          // Create a fresh round for testing finish from BETTING
          const round3 = Round.create(mockService);
          const finishResult = round3.finish();
          expect(finishResult.ok).toBe(false);
          expect(finishResult.error).toBeInstanceOf(InvalidStateTransitionError);
        }),
        { numRuns: 50 },
      );
    });

    it('should only allow valid transitions from RUNNING state', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (seed) => {
          fc.configureGlobal({ seed });
          const mockService = new MockProvablyFairService();
          const round = Round.create(mockService);

          round.start();
          expect(round.getState()).toBe(RoundState.RUNNING);

          // From RUNNING, only crash() should succeed
          const crashResult = round.crash();
          expect(crashResult.ok).toBe(true);
          expect(round.getState()).toBe(RoundState.CRASHED);

          // Create a fresh round for testing start from RUNNING
          const round2 = Round.create(mockService);
          round2.start();
          const startResult = round2.start();
          expect(startResult.ok).toBe(false);
          expect(startResult.error).toBeInstanceOf(InvalidStateTransitionError);

          // Create a fresh round for testing finish from RUNNING
          const round3 = Round.create(mockService);
          round3.start();
          const finishResult = round3.finish();
          expect(finishResult.ok).toBe(false);
          expect(finishResult.error).toBeInstanceOf(InvalidStateTransitionError);
        }),
        { numRuns: 50 },
      );
    });

    it('should only allow valid transitions from CRASHED state', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (seed) => {
          fc.configureGlobal({ seed });
          const mockService = new MockProvablyFairService();
          const round = Round.create(mockService);

          round.start();
          round.crash();
          expect(round.getState()).toBe(RoundState.CRASHED);

          // From CRASHED, only finish() should succeed
          const finishResult = round.finish();
          expect(finishResult.ok).toBe(true);
          expect(round.getState()).toBe(RoundState.FINISHED);

          // Create a fresh round for testing start from CRASHED
          const round2 = Round.create(mockService);
          round2.start();
          round2.crash();
          const startResult = round2.start();
          expect(startResult.ok).toBe(false);
          expect(startResult.error).toBeInstanceOf(InvalidStateTransitionError);

          // Create a fresh round for testing crash from CRASHED
          const round3 = Round.create(mockService);
          round3.start();
          round3.crash();
          const crashResult = round3.crash();
          expect(crashResult.ok).toBe(false);
          expect(crashResult.error).toBeInstanceOf(InvalidStateTransitionError);
        }),
        { numRuns: 50 },
      );
    });

    it('should not allow transitions from FINISHED state', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (seed) => {
          fc.configureGlobal({ seed });
          const mockService = new MockProvablyFairService();
          const round = Round.create(mockService);

          round.start();
          round.crash();
          round.finish();
          expect(round.getState()).toBe(RoundState.FINISHED);

          // From FINISHED, no transitions should succeed
          const startResult = round.start();
          expect(startResult.ok).toBe(false);
          expect(startResult.error).toBeInstanceOf(InvalidStateTransitionError);

          const crashResult = round.crash();
          expect(crashResult.ok).toBe(false);
          expect(crashResult.error).toBeInstanceOf(InvalidStateTransitionError);

          const finishResult = round.finish();
          expect(finishResult.ok).toBe(false);
          expect(finishResult.error).toBeInstanceOf(InvalidStateTransitionError);
        }),
        { numRuns: 50 },
      );
    });

    it('should maintain state invariants through complete lifecycle', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (seed) => {
          fc.configureGlobal({ seed });
          const mockService = new MockProvablyFairService();
          const round = Round.create(mockService);

          // Initial state
          expect(round.getState()).toBe(RoundState.BETTING);
          expect(round.canAcceptBets()).toBe(true);
          expect(round.isRunning()).toBe(false);
          expect(round.hasCrashed()).toBe(false);
          expect(round.isFinished()).toBe(false);

          // After start
          round.start();
          expect(round.getState()).toBe(RoundState.RUNNING);
          expect(round.canAcceptBets()).toBe(false);
          expect(round.isRunning()).toBe(true);
          expect(round.hasCrashed()).toBe(false);
          expect(round.isFinished()).toBe(false);

          // After crash
          round.crash();
          expect(round.getState()).toBe(RoundState.CRASHED);
          expect(round.canAcceptBets()).toBe(false);
          expect(round.isRunning()).toBe(false);
          expect(round.hasCrashed()).toBe(true);
          expect(round.isFinished()).toBe(false);

          // After finish
          round.finish();
          expect(round.getState()).toBe(RoundState.FINISHED);
          expect(round.canAcceptBets()).toBe(false);
          expect(round.isRunning()).toBe(false);
          expect(round.hasCrashed()).toBe(false);
          expect(round.isFinished()).toBe(true);
        }),
        { numRuns: 50 },
      );
    });

    it('should increment version on each state transition', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (seed) => {
          fc.configureGlobal({ seed });
          const mockService = new MockProvablyFairService();
          const round = Round.create(mockService);

          const initialVersion = round.getVersion();
          expect(initialVersion).toBe(1);

          round.start();
          expect(round.getVersion()).toBe(initialVersion + 1);

          round.crash();
          expect(round.getVersion()).toBe(initialVersion + 2);

          round.finish();
          expect(round.getVersion()).toBe(initialVersion + 3);
        }),
        { numRuns: 50 },
      );
    });

    it('should set timestamps in monotonically increasing order', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (seed) => {
          fc.configureGlobal({ seed });
          const mockService = new MockProvablyFairService();
          const round = Round.create(mockService);

          const createdAt = round.getCreatedAt().getTime();

          round.start();
          const startedAt = round.getStartedAt()!.getTime();
          expect(startedAt).toBeGreaterThanOrEqual(createdAt);

          round.crash();
          const crashedAt = round.getCrashedAt()!.getTime();
          expect(crashedAt).toBeGreaterThanOrEqual(startedAt);

          round.finish();
          const finishedAt = round.getFinishedAt()!.getTime();
          expect(finishedAt).toBeGreaterThanOrEqual(crashedAt);
        }),
        { numRuns: 50 },
      );
    });

    it('should reject invalid transitions with appropriate error messages', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (seed) => {
          fc.configureGlobal({ seed });
          const mockService = new MockProvablyFairService();

          // Test BETTING → CRASH (invalid)
          const round1 = Round.create(mockService);
          const result1 = round1.crash();
          expect(result1.ok).toBe(false);
          expect(result1.error.message).toContain('RUNNING');

          // Test RUNNING → START (invalid)
          const round2 = Round.create(mockService);
          round2.start();
          const result2 = round2.start();
          expect(result2.ok).toBe(false);
          expect(result2.error.message).toContain('RUNNING');

          // Test CRASHED → START (invalid)
          const round3 = Round.create(mockService);
          round3.start();
          round3.crash();
          const result3 = round3.start();
          expect(result3.ok).toBe(false);
          expect(result3.error.message).toContain('BETTING');
        }),
        { numRuns: 50 },
      );
    });
  });
});
