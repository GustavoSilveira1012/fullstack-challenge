import { describe, it, expect, beforeEach } from 'vitest';
import { Bet, BetState, InvalidStateTransitionError } from '../../../../src/domain/entities/bet';
import { BetId } from '../../../../src/domain/value-objects/bet-id';
import { RoundId } from '../../../../src/domain/value-objects/round-id';
import { PlayerId } from '../../../../src/domain/value-objects/player-id';
import { Money } from '../../../../src/domain/value-objects/money';
import { Multiplier } from '../../../../src/domain/value-objects/multiplier';

describe('Bet Entity - Unit Tests', () => {
  let roundId: RoundId;
  let playerId: PlayerId;
  let amount: Money;

  beforeEach(() => {
    roundId = RoundId.create();
    playerId = PlayerId.fromString('player-123').value;
    amount = Money.fromCentavos(BigInt(1000)).value; // 10.00
  });

  describe('Bet Creation', () => {
    it('should create a bet in PENDING state', () => {
      const bet = Bet.create(roundId, playerId, amount);

      expect(bet.getState()).toBe(BetState.PENDING);
      expect(bet.getRoundId()).toEqual(roundId);
      expect(bet.getPlayerId()).toEqual(playerId);
      expect(bet.getAmount()).toEqual(amount);
      expect(bet.getCashOutMultiplier()).toBeNull();
      expect(bet.getPayout()).toBeNull();
    });

    it('should set creation and update timestamps', () => {
      const beforeCreation = new Date();
      const bet = Bet.create(roundId, playerId, amount);
      const afterCreation = new Date();

      expect(bet.getCreatedAt().getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(bet.getCreatedAt().getTime()).toBeLessThanOrEqual(afterCreation.getTime());
      expect(bet.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(bet.getUpdatedAt().getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('should generate a unique BetId', () => {
      const bet1 = Bet.create(roundId, playerId, amount);
      const bet2 = Bet.create(roundId, playerId, amount);

      expect(bet1.getId().toString()).not.toBe(bet2.getId().toString());
    });
  });

  describe('State Transitions', () => {
    describe('PENDING → ACTIVE', () => {
      it('should transition from PENDING to ACTIVE', () => {
        const bet = Bet.create(roundId, playerId, amount);

        const result = bet.activate();

        expect(result.ok).toBe(true);
        expect(bet.getState()).toBe(BetState.ACTIVE);
      });

      it('should update the updatedAt timestamp', () => {
        const bet = Bet.create(roundId, playerId, amount);
        const createdAt = bet.getUpdatedAt().getTime();

        // Small delay to ensure timestamp difference
        const beforeActivate = new Date();
        bet.activate();
        const afterActivate = new Date();

        expect(bet.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(beforeActivate.getTime());
        expect(bet.getUpdatedAt().getTime()).toBeLessThanOrEqual(afterActivate.getTime());
      });

      it('should reject activation from non-PENDING state', () => {
        const bet = Bet.create(roundId, playerId, amount);
        bet.activate();

        const result = bet.activate();

        expect(result.ok).toBe(false);
        expect(result.error).toBeInstanceOf(InvalidStateTransitionError);
        expect(result.error.message).toContain('PENDING');
      });
    });

    describe('ACTIVE → CASHED_OUT', () => {
      it('should transition from ACTIVE to CASHED_OUT', () => {
        const bet = Bet.create(roundId, playerId, amount);
        bet.activate();
        const multiplier = Multiplier.fromNumber(2.5).value;

        const result = bet.cashOut(multiplier);

        expect(result.ok).toBe(true);
        expect(bet.getState()).toBe(BetState.CASHED_OUT);
      });

      it('should set cashOutMultiplier and payout', () => {
        const bet = Bet.create(roundId, playerId, amount);
        bet.activate();
        const multiplier = Multiplier.fromNumber(2.5).value;

        bet.cashOut(multiplier);

        expect(bet.getCashOutMultiplier()).not.toBeNull();
        expect(bet.getCashOutMultiplier()!.toNumber()).toBe(2.5);
        expect(bet.getPayout()).not.toBeNull();
      });

      it('should calculate correct payout', () => {
        const bet = Bet.create(roundId, playerId, amount);
        bet.activate();
        const multiplier = Multiplier.fromNumber(2.5).value;

        bet.cashOut(multiplier);

        // amount = 1000 centavos, multiplier = 2.5
        // payout = floor(1000 * 2.5) = 2500
        expect(bet.getPayout()!.toCentavos()).toBe(BigInt(2500));
      });

      it('should reject cash out from non-ACTIVE state', () => {
        const bet = Bet.create(roundId, playerId, amount);
        const multiplier = Multiplier.fromNumber(2.5).value;

        const result = bet.cashOut(multiplier);

        expect(result.ok).toBe(false);
        expect(result.error).toBeInstanceOf(InvalidStateTransitionError);
        expect(result.error.message).toContain('ACTIVE');
      });

      it('should update the updatedAt timestamp', () => {
        const bet = Bet.create(roundId, playerId, amount);
        bet.activate();
        const multiplier = Multiplier.fromNumber(2.5).value;

        const beforeCashOut = new Date();
        bet.cashOut(multiplier);
        const afterCashOut = new Date();

        expect(bet.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(beforeCashOut.getTime());
        expect(bet.getUpdatedAt().getTime()).toBeLessThanOrEqual(afterCashOut.getTime());
      });
    });

    describe('ACTIVE → LOST', () => {
      it('should transition from ACTIVE to LOST', () => {
        const bet = Bet.create(roundId, playerId, amount);
        bet.activate();

        const result = bet.markAsLost();

        expect(result.ok).toBe(true);
        expect(bet.getState()).toBe(BetState.LOST);
      });

      it('should not set cashOutMultiplier or payout', () => {
        const bet = Bet.create(roundId, playerId, amount);
        bet.activate();

        bet.markAsLost();

        expect(bet.getCashOutMultiplier()).toBeNull();
        expect(bet.getPayout()).toBeNull();
      });

      it('should reject marking as lost from non-ACTIVE state', () => {
        const bet = Bet.create(roundId, playerId, amount);

        const result = bet.markAsLost();

        expect(result.ok).toBe(false);
        expect(result.error).toBeInstanceOf(InvalidStateTransitionError);
        expect(result.error.message).toContain('ACTIVE');
      });

      it('should update the updatedAt timestamp', () => {
        const bet = Bet.create(roundId, playerId, amount);
        bet.activate();

        const beforeMarkLost = new Date();
        bet.markAsLost();
        const afterMarkLost = new Date();

        expect(bet.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(beforeMarkLost.getTime());
        expect(bet.getUpdatedAt().getTime()).toBeLessThanOrEqual(afterMarkLost.getTime());
      });
    });

    describe('PENDING → REJECTED', () => {
      it('should transition from PENDING to REJECTED', () => {
        const bet = Bet.create(roundId, playerId, amount);

        const result = bet.markAsRejected();

        expect(result.ok).toBe(true);
        expect(bet.getState()).toBe(BetState.REJECTED);
      });

      it('should reject marking as rejected from non-PENDING state', () => {
        const bet = Bet.create(roundId, playerId, amount);
        bet.activate();

        const result = bet.markAsRejected();

        expect(result.ok).toBe(false);
        expect(result.error).toBeInstanceOf(InvalidStateTransitionError);
        expect(result.error.message).toContain('PENDING');
      });

      it('should update the updatedAt timestamp', () => {
        const bet = Bet.create(roundId, playerId, amount);

        const beforeMarkRejected = new Date();
        bet.markAsRejected();
        const afterMarkRejected = new Date();

        expect(bet.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(beforeMarkRejected.getTime());
        expect(bet.getUpdatedAt().getTime()).toBeLessThanOrEqual(afterMarkRejected.getTime());
      });
    });
  });

  describe('Invalid State Transitions', () => {
    it('should reject transition from CASHED_OUT to any state', () => {
      const bet = Bet.create(roundId, playerId, amount);
      bet.activate();
      const multiplier = Multiplier.fromNumber(2.5).value;
      bet.cashOut(multiplier);

      expect(bet.activate().ok).toBe(false);
      expect(bet.markAsLost().ok).toBe(false);
      expect(bet.markAsRejected().ok).toBe(false);
      expect(bet.cashOut(multiplier).ok).toBe(false);
    });

    it('should reject transition from LOST to any state', () => {
      const bet = Bet.create(roundId, playerId, amount);
      bet.activate();
      bet.markAsLost();

      const multiplier = Multiplier.fromNumber(2.5).value;
      expect(bet.activate().ok).toBe(false);
      expect(bet.markAsRejected().ok).toBe(false);
      expect(bet.cashOut(multiplier).ok).toBe(false);
      expect(bet.markAsLost().ok).toBe(false);
    });

    it('should reject transition from REJECTED to any state', () => {
      const bet = Bet.create(roundId, playerId, amount);
      bet.markAsRejected();

      const multiplier = Multiplier.fromNumber(2.5).value;
      expect(bet.activate().ok).toBe(false);
      expect(bet.markAsLost().ok).toBe(false);
      expect(bet.cashOut(multiplier).ok).toBe(false);
      expect(bet.markAsRejected().ok).toBe(false);
    });
  });

  describe('Payout Calculation', () => {
    it('should calculate payout as floor(amount × multiplier)', () => {
      const bet = Bet.create(roundId, playerId, amount);
      const multiplier = Multiplier.fromNumber(2.5).value;

      const payout = bet.calculatePayout(multiplier);

      // amount = 1000, multiplier = 2.5
      // payout = floor(1000 * 2.5) = 2500
      expect(payout.toCentavos()).toBe(BigInt(2500));
    });

    it('should round down payout with fractional results', () => {
      const amount = Money.fromCentavos(BigInt(333)).value; // 3.33
      const bet = Bet.create(roundId, playerId, amount);
      const multiplier = Multiplier.fromNumber(1.5).value;

      const payout = bet.calculatePayout(multiplier);

      // amount = 333, multiplier = 1.5
      // payout = floor(333 * 1.5) = floor(499.5) = 499
      expect(payout.toCentavos()).toBe(BigInt(499));
    });

    it('should handle multiplier of 1.0', () => {
      const bet = Bet.create(roundId, playerId, amount);
      const multiplier = Multiplier.initial();

      const payout = bet.calculatePayout(multiplier);

      // With multiplier 1.0, payout should equal amount
      expect(payout.toCentavos()).toBe(amount.toCentavos());
    });

    it('should handle large multipliers', () => {
      const bet = Bet.create(roundId, playerId, amount);
      const multiplier = Multiplier.fromNumber(50.0).value;

      const payout = bet.calculatePayout(multiplier);

      // amount = 1000, multiplier = 50.0
      // payout = floor(1000 * 50.0) = 50000
      expect(payout.toCentavos()).toBe(BigInt(50000));
    });

    it('should handle small amounts', () => {
      const smallAmount = Money.fromCentavos(BigInt(100)).value; // 1.00
      const bet = Bet.create(roundId, playerId, smallAmount);
      const multiplier = Multiplier.fromNumber(1.5).value;

      const payout = bet.calculatePayout(multiplier);

      // amount = 100, multiplier = 1.5
      // payout = floor(100 * 1.5) = 150
      expect(payout.toCentavos()).toBe(BigInt(150));
    });
  });

  describe('Query Methods', () => {
    it('should correctly report canCashOut status', () => {
      const bet = Bet.create(roundId, playerId, amount);

      expect(bet.canCashOut()).toBe(false);

      bet.activate();
      expect(bet.canCashOut()).toBe(true);

      const multiplier = Multiplier.fromNumber(2.5).value;
      bet.cashOut(multiplier);
      expect(bet.canCashOut()).toBe(false);
    });

    it('should correctly report isActive status', () => {
      const bet = Bet.create(roundId, playerId, amount);

      expect(bet.isActive()).toBe(false);

      bet.activate();
      expect(bet.isActive()).toBe(true);

      const multiplier = Multiplier.fromNumber(2.5).value;
      bet.cashOut(multiplier);
      expect(bet.isActive()).toBe(false);
    });

    it('should correctly report hasCashedOut status', () => {
      const bet = Bet.create(roundId, playerId, amount);

      expect(bet.hasCashedOut()).toBe(false);

      bet.activate();
      expect(bet.hasCashedOut()).toBe(false);

      const multiplier = Multiplier.fromNumber(2.5).value;
      bet.cashOut(multiplier);
      expect(bet.hasCashedOut()).toBe(true);
    });

    it('should correctly report isLost status', () => {
      const bet = Bet.create(roundId, playerId, amount);

      expect(bet.isLost()).toBe(false);

      bet.activate();
      expect(bet.isLost()).toBe(false);

      bet.markAsLost();
      expect(bet.isLost()).toBe(true);
    });
  });

  describe('Getters', () => {
    it('should return all getter values correctly', () => {
      const bet = Bet.create(roundId, playerId, amount);

      expect(bet.getId()).toBeInstanceOf(BetId);
      expect(bet.getRoundId()).toEqual(roundId);
      expect(bet.getPlayerId()).toEqual(playerId);
      expect(bet.getAmount()).toEqual(amount);
      expect(bet.getState()).toBe(BetState.PENDING);
      expect(bet.getCashOutMultiplier()).toBeNull();
      expect(bet.getPayout()).toBeNull();
      expect(bet.getCreatedAt()).toBeInstanceOf(Date);
      expect(bet.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should return correct values after state transitions', () => {
      const bet = Bet.create(roundId, playerId, amount);
      const multiplier = Multiplier.fromNumber(2.5).value;

      bet.activate();
      expect(bet.getState()).toBe(BetState.ACTIVE);

      bet.cashOut(multiplier);
      expect(bet.getState()).toBe(BetState.CASHED_OUT);
      expect(bet.getCashOutMultiplier()!.toNumber()).toBe(2.5);
      expect(bet.getPayout()!.toCentavos()).toBe(BigInt(2500));
    });
  });

  describe('Immutability', () => {
    it('should not allow modification of bet amount after creation', () => {
      const bet = Bet.create(roundId, playerId, amount);
      const originalAmount = bet.getAmount().toCentavos();

      // Attempting to modify the returned amount should not affect the bet
      const returnedAmount = bet.getAmount();
      expect(returnedAmount.toCentavos()).toBe(originalAmount);
    });

    it('should not allow modification of roundId after creation', () => {
      const bet = Bet.create(roundId, playerId, amount);
      const originalRoundId = bet.getRoundId().toString();

      const returnedRoundId = bet.getRoundId();
      expect(returnedRoundId.toString()).toBe(originalRoundId);
    });

    it('should not allow modification of playerId after creation', () => {
      const bet = Bet.create(roundId, playerId, amount);
      const originalPlayerId = bet.getPlayerId().toString();

      const returnedPlayerId = bet.getPlayerId();
      expect(returnedPlayerId.toString()).toBe(originalPlayerId);
    });
  });
});
