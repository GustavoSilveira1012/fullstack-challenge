import { describe, it, expect, beforeEach } from 'bun:test';
import { Round, RoundState, InvalidStateTransitionError } from '../../../../src/domain/entities/round';
import { ProvablyFairService } from '../../../../src/domain/services/provably-fair.service';

describe('Round Entity', () => {
  let provablyFairService: ProvablyFairService;

  beforeEach(() => {
    provablyFairService = new ProvablyFairService();
  });

  describe('create', () => {
    it('should create a new round in BETTING state', () => {
      const round = Round.create(provablyFairService);

      expect(round.getState()).toBe(RoundState.BETTING);
      expect(round.getId()).toBeDefined();
      expect(round.getServerSeed()).toBeDefined();
      expect(round.getServerSeedHash()).toBeDefined();
      expect(round.getCrashPoint()).toBeDefined();
      expect(round.getCreatedAt()).toBeDefined();
      expect(round.getStartedAt()).toBeNull();
      expect(round.getCrashedAt()).toBeNull();
      expect(round.getFinishedAt()).toBeNull();
    });

    it('should generate different server seeds for different rounds', () => {
      const round1 = Round.create(provablyFairService);
      const round2 = Round.create(provablyFairService);

      expect(round1.getServerSeed().toString()).not.toBe(
        round2.getServerSeed().toString(),
      );
    });
  });

  describe('state transitions', () => {
    it('should transition from BETTING to RUNNING', () => {
      const round = Round.create(provablyFairService);

      const result = round.start();
      expect(result.ok).toBe(true);
      expect(round.getState()).toBe(RoundState.RUNNING);
      expect(round.getStartedAt()).toBeDefined();
    });

    it('should reject transition from BETTING to CRASHED', () => {
      const round = Round.create(provablyFairService);

      const result = round.crash();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidStateTransitionError);
      }
    });

    it('should transition from RUNNING to CRASHED', () => {
      const round = Round.create(provablyFairService);
      round.start();

      const result = round.crash();
      expect(result.ok).toBe(true);
      expect(round.getState()).toBe(RoundState.CRASHED);
      expect(round.getCrashedAt()).toBeDefined();
    });

    it('should transition from CRASHED to FINISHED', () => {
      const round = Round.create(provablyFairService);
      round.start();
      round.crash();

      const result = round.finish();
      expect(result.ok).toBe(true);
      expect(round.getState()).toBe(RoundState.FINISHED);
      expect(round.getFinishedAt()).toBeDefined();
    });

    it('should reject transition from FINISHED to any state', () => {
      const round = Round.create(provablyFairService);
      round.start();
      round.crash();
      round.finish();

      const result = round.start();
      expect(result.ok).toBe(false);
    });
  });

  describe('query methods', () => {
    it('should return true for canAcceptBets in BETTING state', () => {
      const round = Round.create(provablyFairService);
      expect(round.canAcceptBets()).toBe(true);
    });

    it('should return false for canAcceptBets in RUNNING state', () => {
      const round = Round.create(provablyFairService);
      round.start();
      expect(round.canAcceptBets()).toBe(false);
    });

    it('should return true for isRunning in RUNNING state', () => {
      const round = Round.create(provablyFairService);
      round.start();
      expect(round.isRunning()).toBe(true);
    });

    it('should return true for hasCrashed in CRASHED state', () => {
      const round = Round.create(provablyFairService);
      round.start();
      round.crash();
      expect(round.hasCrashed()).toBe(true);
    });

    it('should return true for isFinished in FINISHED state', () => {
      const round = Round.create(provablyFairService);
      round.start();
      round.crash();
      round.finish();
      expect(round.isFinished()).toBe(true);
    });
  });

  describe('version tracking', () => {
    it('should increment version on state transitions', () => {
      const round = Round.create(provablyFairService);
      const initialVersion = round.getVersion();

      round.start();
      expect(round.getVersion()).toBe(initialVersion + 1);

      round.crash();
      expect(round.getVersion()).toBe(initialVersion + 2);

      round.finish();
      expect(round.getVersion()).toBe(initialVersion + 3);
    });
  });
});
