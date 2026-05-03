import { describe, it, expect, beforeEach } from 'vitest';
import {
  Round,
  RoundState,
  InvalidStateTransitionError,
  IProvablyFairService,
} from '../../../../src/domain/entities/round';
import { RoundId } from '../../../../src/domain/value-objects/round-id';
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

describe('Round Entity', () => {
  let mockService: MockProvablyFairService;
  let round: Round;

  beforeEach(() => {
    mockService = new MockProvablyFairService();
    round = Round.create(mockService);
  });

  describe('Round Creation', () => {
    it('should create a new round in BETTING state', () => {
      expect(round.getState()).toBe(RoundState.BETTING);
    });

    it('should initialize with version 1', () => {
      expect(round.getVersion()).toBe(1);
    });

    it('should have a valid round ID', () => {
      expect(round.getId()).toBeDefined();
      expect(round.getId().toString()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should have a server seed', () => {
      expect(round.getServerSeed()).toBeDefined();
    });

    it('should have a server seed hash', () => {
      expect(round.getServerSeedHash()).toBeDefined();
    });

    it('should have a crash point >= 1.00x', () => {
      const crashPoint = round.getCrashPoint();
      expect(crashPoint.toNumber()).toBeGreaterThanOrEqual(1.0);
    });

    it('should have creation timestamp', () => {
      expect(round.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('should have null timestamps for started, crashed, and finished', () => {
      expect(round.getStartedAt()).toBeNull();
      expect(round.getCrashedAt()).toBeNull();
      expect(round.getFinishedAt()).toBeNull();
    });
  });

  describe('State Transitions', () => {
    describe('BETTING → RUNNING', () => {
      it('should transition from BETTING to RUNNING', () => {
        const result = round.start();

        expect(result.ok).toBe(true);
        expect(round.getState()).toBe(RoundState.RUNNING);
      });

      it('should increment version on start', () => {
        const initialVersion = round.getVersion();
        round.start();

        expect(round.getVersion()).toBe(initialVersion + 1);
      });

      it('should set startedAt timestamp', () => {
        expect(round.getStartedAt()).toBeNull();

        round.start();

        expect(round.getStartedAt()).toBeInstanceOf(Date);
      });

      it('should reject transition if not in BETTING state', () => {
        round.start();
        const result = round.start();

        expect(result.ok).toBe(false);
        expect(result.error).toBeInstanceOf(InvalidStateTransitionError);
        expect(result.error.message).toContain('RUNNING');
      });
    });

    describe('RUNNING → CRASHED', () => {
      beforeEach(() => {
        round.start();
      });

      it('should transition from RUNNING to CRASHED', () => {
        const result = round.crash();

        expect(result.ok).toBe(true);
        expect(round.getState()).toBe(RoundState.CRASHED);
      });

      it('should increment version on crash', () => {
        const initialVersion = round.getVersion();
        round.crash();

        expect(round.getVersion()).toBe(initialVersion + 1);
      });

      it('should set crashedAt timestamp', () => {
        expect(round.getCrashedAt()).toBeNull();

        round.crash();

        expect(round.getCrashedAt()).toBeInstanceOf(Date);
      });

      it('should reject transition if not in RUNNING state', () => {
        round.crash();
        const result = round.crash();

        expect(result.ok).toBe(false);
        expect(result.error).toBeInstanceOf(InvalidStateTransitionError);
        expect(result.error.message).toContain('CRASHED');
      });
    });

    describe('CRASHED → FINISHED', () => {
      beforeEach(() => {
        round.start();
        round.crash();
      });

      it('should transition from CRASHED to FINISHED', () => {
        const result = round.finish();

        expect(result.ok).toBe(true);
        expect(round.getState()).toBe(RoundState.FINISHED);
      });

      it('should increment version on finish', () => {
        const initialVersion = round.getVersion();
        round.finish();

        expect(round.getVersion()).toBe(initialVersion + 1);
      });

      it('should set finishedAt timestamp', () => {
        expect(round.getFinishedAt()).toBeNull();

        round.finish();

        expect(round.getFinishedAt()).toBeInstanceOf(Date);
      });

      it('should reject transition if not in CRASHED state', () => {
        round.finish();
        const result = round.finish();

        expect(result.ok).toBe(false);
        expect(result.error).toBeInstanceOf(InvalidStateTransitionError);
        expect(result.error.message).toContain('FINISHED');
      });
    });

    describe('Invalid Transitions', () => {
      it('should reject BETTING → CRASHED', () => {
        const result = round.crash();

        expect(result.ok).toBe(false);
        expect(result.error).toBeInstanceOf(InvalidStateTransitionError);
      });

      it('should reject BETTING → FINISHED', () => {
        const result = round.finish();

        expect(result.ok).toBe(false);
        expect(result.error).toBeInstanceOf(InvalidStateTransitionError);
      });

      it('should reject RUNNING → FINISHED', () => {
        round.start();
        const result = round.finish();

        expect(result.ok).toBe(false);
        expect(result.error).toBeInstanceOf(InvalidStateTransitionError);
      });

      it('should reject RUNNING → BETTING', () => {
        round.start();
        const result = round.start();

        expect(result.ok).toBe(false);
        expect(result.error).toBeInstanceOf(InvalidStateTransitionError);
      });
    });
  });

  describe('Query Methods', () => {
    it('canAcceptBets() should return true in BETTING state', () => {
      expect(round.canAcceptBets()).toBe(true);
    });

    it('canAcceptBets() should return false in RUNNING state', () => {
      round.start();
      expect(round.canAcceptBets()).toBe(false);
    });

    it('canAcceptBets() should return false in CRASHED state', () => {
      round.start();
      round.crash();
      expect(round.canAcceptBets()).toBe(false);
    });

    it('canAcceptBets() should return false in FINISHED state', () => {
      round.start();
      round.crash();
      round.finish();
      expect(round.canAcceptBets()).toBe(false);
    });

    it('isRunning() should return true only in RUNNING state', () => {
      expect(round.isRunning()).toBe(false);

      round.start();
      expect(round.isRunning()).toBe(true);

      round.crash();
      expect(round.isRunning()).toBe(false);
    });

    it('hasCrashed() should return true only in CRASHED state', () => {
      expect(round.hasCrashed()).toBe(false);

      round.start();
      expect(round.hasCrashed()).toBe(false);

      round.crash();
      expect(round.hasCrashed()).toBe(true);

      round.finish();
      expect(round.hasCrashed()).toBe(false);
    });

    it('isFinished() should return true only in FINISHED state', () => {
      expect(round.isFinished()).toBe(false);

      round.start();
      expect(round.isFinished()).toBe(false);

      round.crash();
      expect(round.isFinished()).toBe(false);

      round.finish();
      expect(round.isFinished()).toBe(true);
    });
  });

  describe('Getters', () => {
    it('should return correct ID', () => {
      const id = round.getId();
      expect(id).toBeDefined();
      expect(id.equals(round.getId())).toBe(true);
    });

    it('should return correct server seed', () => {
      const seed = round.getServerSeed();
      expect(seed).toBeDefined();
      expect(seed.toString()).toMatch(/^[0-9a-f]+$/i);
    });

    it('should return correct server seed hash', () => {
      const hash = round.getServerSeedHash();
      expect(hash).toBeDefined();
      expect(hash.toString()).toMatch(/^[0-9a-f]{64}$/i);
    });

    it('should return correct crash point', () => {
      const crashPoint = round.getCrashPoint();
      expect(crashPoint).toBeDefined();
      expect(crashPoint.toNumber()).toBeGreaterThanOrEqual(1.0);
    });

    it('should return correct state', () => {
      expect(round.getState()).toBe(RoundState.BETTING);

      round.start();
      expect(round.getState()).toBe(RoundState.RUNNING);

      round.crash();
      expect(round.getState()).toBe(RoundState.CRASHED);

      round.finish();
      expect(round.getState()).toBe(RoundState.FINISHED);
    });

    it('should return correct timestamps', () => {
      const createdAt = round.getCreatedAt();
      expect(createdAt).toBeInstanceOf(Date);

      expect(round.getStartedAt()).toBeNull();
      round.start();
      expect(round.getStartedAt()).toBeInstanceOf(Date);

      expect(round.getCrashedAt()).toBeNull();
      round.crash();
      expect(round.getCrashedAt()).toBeInstanceOf(Date);

      expect(round.getFinishedAt()).toBeNull();
      round.finish();
      expect(round.getFinishedAt()).toBeInstanceOf(Date);
    });

    it('should return correct version', () => {
      expect(round.getVersion()).toBe(1);

      round.start();
      expect(round.getVersion()).toBe(2);

      round.crash();
      expect(round.getVersion()).toBe(3);

      round.finish();
      expect(round.getVersion()).toBe(4);
    });
  });

  describe('Immutability', () => {
    it('should return same id instance on multiple calls', () => {
      const id1 = round.getId();
      const id2 = round.getId();
      expect(id1.equals(id2)).toBe(true);
    });

    it('should return same serverSeed instance on multiple calls', () => {
      const seed1 = round.getServerSeed();
      const seed2 = round.getServerSeed();
      expect(seed1.toString()).toBe(seed2.toString());
    });

    it('should return same createdAt timestamp on multiple calls', () => {
      const createdAt1 = round.getCreatedAt();
      const createdAt2 = round.getCreatedAt();
      expect(createdAt1.getTime()).toBe(createdAt2.getTime());
    });
  });

  describe('State Invariants', () => {
    it('should maintain monotonically increasing timestamps', () => {
      const createdAt = round.getCreatedAt();

      round.start();
      const startedAt = round.getStartedAt()!;
      expect(startedAt.getTime()).toBeGreaterThanOrEqual(createdAt.getTime());

      round.crash();
      const crashedAt = round.getCrashedAt()!;
      expect(crashedAt.getTime()).toBeGreaterThanOrEqual(startedAt.getTime());

      round.finish();
      const finishedAt = round.getFinishedAt()!;
      expect(finishedAt.getTime()).toBeGreaterThanOrEqual(crashedAt.getTime());
    });

    it('should maintain valid state sequence', () => {
      expect(round.getState()).toBe(RoundState.BETTING);

      round.start();
      expect(round.getState()).toBe(RoundState.RUNNING);

      round.crash();
      expect(round.getState()).toBe(RoundState.CRASHED);

      round.finish();
      expect(round.getState()).toBe(RoundState.FINISHED);
    });
  });
});
