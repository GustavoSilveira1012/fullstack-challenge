import { describe, it, expect, beforeEach } from 'bun:test';
import { Bet, BetState, InvalidStateTransitionError } from '../../../../src/domain/entities/bet';
import { RoundId } from '../../../../src/domain/value-objects/round-id';
import { PlayerId } from '../../../../src/domain/value-objects/player-id';
import { Money } from '../../../../src/domain/value-objects/money';
import { Multiplier } from '../../../../src/domain/value-objects/multiplier';

describe('Bet Entity', () => {
  let roundId: RoundId;
  let playerId: PlayerId;
  let amount: Money;

  beforeEach(() => {
    const roundIdResult = RoundId.fromString('550e8400-e29b-41d4-a716-446655440000');
    const playerIdResult = PlayerId.fromString('player-123');
    const amountResult = Money.fromCentavos(1000n);

    if (roundIdResult.ok) roundId = roundIdResult.value;
    if (playerIdResult.ok) playerId = playerIdResult.value;
    if (amountResult.ok) amount = amountResult.value;
  });

  describe('create', () => {
    it('should create a new bet in PENDING state', () => {
      const bet = Bet.create(roundId, playerId, amount);

      expect(bet.getState()).toBe(BetState.PENDING);
      expect(bet.getId()).toBeDefined();
      expect(bet.getRoundId().toString()).toBe(roundId.toString());
      expect(bet.getPlayerId().toString()).toBe(playerId.toString());
      expect(bet.getAmount().toCentavos()).toBe(1000n);
      expect(bet.getCashOutMultiplier()).toBeNull();
      expect(bet.getPayout()).toBeNull();
      expect(bet.getCreatedAt()).toBeDefined();
      expect(bet.getUpdatedAt()).toBeDefined();
    });
  });

  describe('state transitions', () => {
    it('should transition from PENDING to ACTIVE', () => {
      const bet = Bet.create(roundId, playerId, amount);

      const result = bet.activate();
      expect(result.ok).toBe(true);
      expect(bet.getState()).toBe(BetState.ACTIVE);
    });

    it('should reject transition from PENDING to LOST', () => {
      const bet = Bet.create(roundId, playerId, amount);

      const result = bet.markAsLost();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidStateTransitionError);
      }
    });

    it('should transition from ACTIVE to CASHED_OUT', () => {
      const bet = Bet.create(roundId, playerId, amount);
      bet.activate();

      const multiplierResult = Multiplier.fromNumber(2.5);
      if (multiplierResult.ok) {
        const result = bet.cashOut(multiplierResult.value);
        expect(result.ok).toBe(true);
        expect(bet.getState()).toBe(BetState.CASHED_OUT);
        expect(bet.getCashOutMultiplier()?.toNumber()).toBe(2.5);
        expect(bet.getPayout()?.toCentavos()).toBe(2500n);
      }
    });

    it('should transition from ACTIVE to LOST', () => {
      const bet = Bet.create(roundId, playerId, amount);
      bet.activate();

      const result = bet.markAsLost();
      expect(result.ok).toBe(true);
      expect(bet.getState()).toBe(BetState.LOST);
    });

    it('should reject transition from CASHED_OUT to LOST', () => {
      const bet = Bet.create(roundId, playerId, amount);
      bet.activate();

      const multiplierResult = Multiplier.fromNumber(2.5);
      if (multiplierResult.ok) {
        bet.cashOut(multiplierResult.value);

        const result = bet.markAsLost();
        expect(result.ok).toBe(false);
      }
    });

    it('should transition from PENDING to REJECTED', () => {
      const bet = Bet.create(roundId, playerId, amount);

      const result = bet.markAsRejected();
      expect(result.ok).toBe(true);
      expect(bet.getState()).toBe(BetState.REJECTED);
    });
  });

  describe('calculatePayout', () => {
    it('should calculate payout correctly', () => {
      const bet = Bet.create(roundId, playerId, amount);

      const multiplierResult = Multiplier.fromNumber(1.5);
      if (multiplierResult.ok) {
        const payout = bet.calculatePayout(multiplierResult.value);
        expect(payout.toCentavos()).toBe(1500n);
      }
    });

    it('should round down payout to nearest centavo', () => {
      const bet = Bet.create(roundId, playerId, amount);

      const multiplierResult = Multiplier.fromNumber(1.555);
      if (multiplierResult.ok) {
        const payout = bet.calculatePayout(multiplierResult.value);
        expect(payout.toCentavos()).toBe(1555n);
      }
    });
  });

  describe('query methods', () => {
    it('should return true for canCashOut in ACTIVE state', () => {
      const bet = Bet.create(roundId, playerId, amount);
      bet.activate();
      expect(bet.canCashOut()).toBe(true);
    });

    it('should return false for canCashOut in PENDING state', () => {
      const bet = Bet.create(roundId, playerId, amount);
      expect(bet.canCashOut()).toBe(false);
    });

    it('should return true for isActive in ACTIVE state', () => {
      const bet = Bet.create(roundId, playerId, amount);
      bet.activate();
      expect(bet.isActive()).toBe(true);
    });

    it('should return true for hasCashedOut in CASHED_OUT state', () => {
      const bet = Bet.create(roundId, playerId, amount);
      bet.activate();

      const multiplierResult = Multiplier.fromNumber(2.5);
      if (multiplierResult.ok) {
        bet.cashOut(multiplierResult.value);
        expect(bet.hasCashedOut()).toBe(true);
      }
    });

    it('should return true for isLost in LOST state', () => {
      const bet = Bet.create(roundId, playerId, amount);
      bet.activate();
      bet.markAsLost();
      expect(bet.isLost()).toBe(true);
    });
  });
});
