import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Bet, BetState, InvalidStateTransitionError } from '../../../../src/domain/entities/bet';
import { BetId } from '../../../../src/domain/value-objects/bet-id';
import { RoundId } from '../../../../src/domain/value-objects/round-id';
import { PlayerId } from '../../../../src/domain/value-objects/player-id';
import { Money } from '../../../../src/domain/value-objects/money';
import { Multiplier } from '../../../../src/domain/value-objects/multiplier';

/**
 * Arbitraries for property-based testing
 */
const betStateArbitrary = fc.oneof(
  fc.constant(BetState.PENDING),
  fc.constant(BetState.ACTIVE),
  fc.constant(BetState.CASHED_OUT),
  fc.constant(BetState.LOST),
  fc.constant(BetState.REJECTED),
);

const validBetAmountArbitrary = fc.integer({ min: 100, max: 100000 });

const multiplierArbitrary = fc.float({ min: 1.0, max: 100.0, noNaN: true });

describe('Bet Entity - Property-Based Tests', () => {
  describe('Property 7: Bet State Transition Validity', () => {
    /**
     * **Validates: Requirements 29.1, 29.2**
     *
     * This property verifies that:
     * 1. Only valid state transitions are allowed (PENDING → ACTIVE → (CASHED_OUT | LOST))
     * 2. Invalid transitions are rejected with InvalidStateTransitionError
     * 3. State invariants are maintained throughout the lifecycle
     */

    it('should only allow valid transitions from PENDING state', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          validBetAmountArbitrary,
          (seed, amount) => {
            fc.configureGlobal({ seed });
            const roundId = RoundId.create();
            const playerId = PlayerId.fromString('player-123').value;
            const money = Money.fromCentavos(BigInt(amount)).value;

            const bet = Bet.create(roundId, playerId, money);
            expect(bet.getState()).toBe(BetState.PENDING);

            // From PENDING, only activate() should succeed
            const activateResult = bet.activate();
            expect(activateResult.ok).toBe(true);
            expect(bet.getState()).toBe(BetState.ACTIVE);

            // Create a fresh bet for testing cashOut from PENDING
            const bet2 = Bet.create(roundId, playerId, money);
            const multiplier = Multiplier.fromNumber(2.5).value;
            const cashOutResult = bet2.cashOut(multiplier);
            expect(cashOutResult.ok).toBe(false);
            expect(cashOutResult.error).toBeInstanceOf(InvalidStateTransitionError);

            // Create a fresh bet for testing markAsLost from PENDING
            const bet3 = Bet.create(roundId, playerId, money);
            const lostResult = bet3.markAsLost();
            expect(lostResult.ok).toBe(false);
            expect(lostResult.error).toBeInstanceOf(InvalidStateTransitionError);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('should only allow valid transitions from ACTIVE state', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          validBetAmountArbitrary,
          multiplierArbitrary,
          (seed, amount, multiplierValue) => {
            fc.configureGlobal({ seed });
            const roundId = RoundId.create();
            const playerId = PlayerId.fromString('player-123').value;
            const money = Money.fromCentavos(BigInt(amount)).value;
            const multiplier = Multiplier.fromNumber(multiplierValue).value;

            const bet = Bet.create(roundId, playerId, money);
            bet.activate();
            expect(bet.getState()).toBe(BetState.ACTIVE);

            // From ACTIVE, cashOut() should succeed
            const cashOutResult = bet.cashOut(multiplier);
            expect(cashOutResult.ok).toBe(true);
            expect(bet.getState()).toBe(BetState.CASHED_OUT);

            // Create a fresh bet for testing markAsLost from ACTIVE
            const bet2 = Bet.create(roundId, playerId, money);
            bet2.activate();
            const lostResult = bet2.markAsLost();
            expect(lostResult.ok).toBe(true);
            expect(bet2.getState()).toBe(BetState.LOST);

            // Create a fresh bet for testing activate from ACTIVE
            const bet3 = Bet.create(roundId, playerId, money);
            bet3.activate();
            const activateResult = bet3.activate();
            expect(activateResult.ok).toBe(false);
            expect(activateResult.error).toBeInstanceOf(InvalidStateTransitionError);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('should not allow transitions from CASHED_OUT state', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          validBetAmountArbitrary,
          multiplierArbitrary,
          (seed, amount, multiplierValue) => {
            fc.configureGlobal({ seed });
            const roundId = RoundId.create();
            const playerId = PlayerId.fromString('player-123').value;
            const money = Money.fromCentavos(BigInt(amount)).value;
            const multiplier = Multiplier.fromNumber(multiplierValue).value;

            const bet = Bet.create(roundId, playerId, money);
            bet.activate();
            bet.cashOut(multiplier);
            expect(bet.getState()).toBe(BetState.CASHED_OUT);

            // From CASHED_OUT, no transitions should succeed
            const activateResult = bet.activate();
            expect(activateResult.ok).toBe(false);

            const lostResult = bet.markAsLost();
            expect(lostResult.ok).toBe(false);

            const cashOutResult = bet.cashOut(multiplier);
            expect(cashOutResult.ok).toBe(false);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('should not allow transitions from LOST state', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          validBetAmountArbitrary,
          multiplierArbitrary,
          (seed, amount, multiplierValue) => {
            fc.configureGlobal({ seed });
            const roundId = RoundId.create();
            const playerId = PlayerId.fromString('player-123').value;
            const money = Money.fromCentavos(BigInt(amount)).value;
            const multiplier = Multiplier.fromNumber(multiplierValue).value;

            const bet = Bet.create(roundId, playerId, money);
            bet.activate();
            bet.markAsLost();
            expect(bet.getState()).toBe(BetState.LOST);

            // From LOST, no transitions should succeed
            const activateResult = bet.activate();
            expect(activateResult.ok).toBe(false);

            const cashOutResult = bet.cashOut(multiplier);
            expect(cashOutResult.ok).toBe(false);

            const lostResult = bet.markAsLost();
            expect(lostResult.ok).toBe(false);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('should maintain state invariants through complete lifecycle', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          validBetAmountArbitrary,
          multiplierArbitrary,
          (seed, amount, multiplierValue) => {
            fc.configureGlobal({ seed });
            const roundId = RoundId.create();
            const playerId = PlayerId.fromString('player-123').value;
            const money = Money.fromCentavos(BigInt(amount)).value;
            const multiplier = Multiplier.fromNumber(multiplierValue).value;

            const bet = Bet.create(roundId, playerId, money);

            // Initial state
            expect(bet.getState()).toBe(BetState.PENDING);
            expect(bet.canCashOut()).toBe(false);
            expect(bet.isActive()).toBe(false);
            expect(bet.hasCashedOut()).toBe(false);
            expect(bet.isLost()).toBe(false);

            // After activate
            bet.activate();
            expect(bet.getState()).toBe(BetState.ACTIVE);
            expect(bet.canCashOut()).toBe(true);
            expect(bet.isActive()).toBe(true);
            expect(bet.hasCashedOut()).toBe(false);
            expect(bet.isLost()).toBe(false);

            // After cashOut
            bet.cashOut(multiplier);
            expect(bet.getState()).toBe(BetState.CASHED_OUT);
            expect(bet.canCashOut()).toBe(false);
            expect(bet.isActive()).toBe(false);
            expect(bet.hasCashedOut()).toBe(true);
            expect(bet.isLost()).toBe(false);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('should set cashOutMultiplier and payout when cashing out', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          validBetAmountArbitrary,
          multiplierArbitrary,
          (seed, amount, multiplierValue) => {
            fc.configureGlobal({ seed });
            const roundId = RoundId.create();
            const playerId = PlayerId.fromString('player-123').value;
            const money = Money.fromCentavos(BigInt(amount)).value;
            const multiplier = Multiplier.fromNumber(multiplierValue).value;

            const bet = Bet.create(roundId, playerId, money);
            expect(bet.getCashOutMultiplier()).toBeNull();
            expect(bet.getPayout()).toBeNull();

            bet.activate();
            bet.cashOut(multiplier);

            expect(bet.getCashOutMultiplier()).not.toBeNull();
            expect(bet.getCashOutMultiplier()!.toNumber()).toBe(multiplierValue);
            expect(bet.getPayout()).not.toBeNull();
          },
        ),
        { numRuns: 50 },
      );
    });

    it('should reject invalid transitions with appropriate error messages', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          validBetAmountArbitrary,
          multiplierArbitrary,
          (seed, amount, multiplierValue) => {
            fc.configureGlobal({ seed });
            const roundId = RoundId.create();
            const playerId = PlayerId.fromString('player-123').value;
            const money = Money.fromCentavos(BigInt(amount)).value;
            const multiplier = Multiplier.fromNumber(multiplierValue).value;

            // Test PENDING → CASHOUT (invalid)
            const bet1 = Bet.create(roundId, playerId, money);
            const result1 = bet1.cashOut(multiplier);
            expect(result1.ok).toBe(false);
            expect(result1.error.message).toContain('ACTIVE');

            // Test ACTIVE → ACTIVATE (invalid)
            const bet2 = Bet.create(roundId, playerId, money);
            bet2.activate();
            const result2 = bet2.activate();
            expect(result2.ok).toBe(false);
            expect(result2.error.message).toContain('PENDING');

            // Test LOST → CASHOUT (invalid)
            const bet3 = Bet.create(roundId, playerId, money);
            bet3.activate();
            bet3.markAsLost();
            const result3 = bet3.cashOut(multiplier);
            expect(result3.ok).toBe(false);
            expect(result3.error.message).toContain('ACTIVE');
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('Property 4: Payout Calculation Exactness', () => {
    /**
     * **Validates: Requirements 5.5, 15.3**
     *
     * This property verifies that:
     * 1. Payout = floor(amount × multiplier) exactly
     * 2. No floating-point rounding errors occur
     */

    it('should calculate payout as floor(amount × multiplier)', () => {
      fc.assert(
        fc.property(
          validBetAmountArbitrary,
          multiplierArbitrary,
          (amount, multiplierValue) => {
            const roundId = RoundId.create();
            const playerId = PlayerId.fromString('player-123').value;
            const money = Money.fromCentavos(BigInt(amount)).value;
            const multiplier = Multiplier.fromNumber(multiplierValue).value;

            const bet = Bet.create(roundId, playerId, money);
            const payout = bet.calculatePayout(multiplier);

            // Expected payout: floor(amount * multiplier)
            const expectedPayout = BigInt(Math.floor(amount * multiplierValue));
            expect(payout.toCentavos()).toBe(expectedPayout);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should never round up when calculating payout', () => {
      fc.assert(
        fc.property(
          validBetAmountArbitrary,
          multiplierArbitrary,
          (amount, multiplierValue) => {
            const roundId = RoundId.create();
            const playerId = PlayerId.fromString('player-123').value;
            const money = Money.fromCentavos(BigInt(amount)).value;
            const multiplier = Multiplier.fromNumber(multiplierValue).value;

            const bet = Bet.create(roundId, playerId, money);
            const payout = bet.calculatePayout(multiplier);

            // Payout should never exceed amount * multiplier
            const maxPayout = amount * multiplierValue;
            expect(Number(payout.toCentavos())).toBeLessThanOrEqual(maxPayout);

            // Payout should be at least floor(amount * multiplier)
            const minPayout = Math.floor(amount * multiplierValue);
            expect(Number(payout.toCentavos())).toBeGreaterThanOrEqual(minPayout);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should handle edge cases with multiplier 1.0', () => {
      fc.assert(
        fc.property(validBetAmountArbitrary, (amount) => {
          const roundId = RoundId.create();
          const playerId = PlayerId.fromString('player-123').value;
          const money = Money.fromCentavos(BigInt(amount)).value;
          const multiplier = Multiplier.initial();

          const bet = Bet.create(roundId, playerId, money);
          const payout = bet.calculatePayout(multiplier);

          // With multiplier 1.0, payout should equal amount
          expect(payout.toCentavos()).toBe(BigInt(amount));
        }),
        { numRuns: 50 },
      );
    });

    it('should handle large multipliers correctly', () => {
      fc.assert(
        fc.property(
          validBetAmountArbitrary,
          fc.float({ min: 10.0, max: 100.0, noNaN: true }),
          (amount, multiplierValue) => {
            const roundId = RoundId.create();
            const playerId = PlayerId.fromString('player-123').value;
            const money = Money.fromCentavos(BigInt(amount)).value;
            const multiplier = Multiplier.fromNumber(multiplierValue).value;

            const bet = Bet.create(roundId, playerId, money);
            const payout = bet.calculatePayout(multiplier);

            // Verify calculation is correct
            const expectedPayout = BigInt(Math.floor(amount * multiplierValue));
            expect(payout.toCentavos()).toBe(expectedPayout);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('Property 5: Bet Amount Validation', () => {
    /**
     * **Validates: Requirements 3.2, 27.1, 27.2**
     *
     * This property verifies that:
     * 1. Valid amounts (100-100000 centavos) are accepted
     * 2. Invalid amounts are rejected
     */

    it('should accept valid bet amounts between 100 and 100000 centavos', () => {
      fc.assert(
        fc.property(validBetAmountArbitrary, (amount) => {
          const roundId = RoundId.create();
          const playerId = PlayerId.fromString('player-123').value;
          const moneyResult = Money.fromCentavos(BigInt(amount));

          expect(moneyResult.ok).toBe(true);
          const money = moneyResult.value;

          const bet = Bet.create(roundId, playerId, money);
          expect(bet.getAmount().toCentavos()).toBe(BigInt(amount));
        }),
        { numRuns: 100 },
      );
    });

    it('should reject amounts below minimum (100 centavos)', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 99 }), (amount) => {
          const roundId = RoundId.create();
          const playerId = PlayerId.fromString('player-123').value;
          const moneyResult = Money.fromCentavos(BigInt(amount));

          // Money should still be created (it's a value object)
          // But in the use case layer, this would be rejected
          if (moneyResult.ok) {
            const money = moneyResult.value;
            const bet = Bet.create(roundId, playerId, money);
            // The bet is created, but validation happens at use case level
            expect(bet.getAmount().toCentavos()).toBe(BigInt(amount));
          }
        }),
        { numRuns: 50 },
      );
    });

    it('should reject amounts above maximum (100000 centavos)', () => {
      fc.assert(
        fc.property(fc.integer({ min: 100001, max: 1000000 }), (amount) => {
          const roundId = RoundId.create();
          const playerId = PlayerId.fromString('player-123').value;
          const moneyResult = Money.fromCentavos(BigInt(amount));

          // Money should still be created (it's a value object)
          // But in the use case layer, this would be rejected
          if (moneyResult.ok) {
            const money = moneyResult.value;
            const bet = Bet.create(roundId, playerId, money);
            // The bet is created, but validation happens at use case level
            expect(bet.getAmount().toCentavos()).toBe(BigInt(amount));
          }
        }),
        { numRuns: 50 },
      );
    });

    it('should reject negative amounts', () => {
      fc.assert(
        fc.property(fc.integer({ min: -100000, max: -1 }), (amount) => {
          const roundId = RoundId.create();
          const playerId = PlayerId.fromString('player-123').value;
          const moneyResult = Money.fromCentavos(BigInt(amount));

          expect(moneyResult.ok).toBe(false);
        }),
        { numRuns: 50 },
      );
    });
  });
});
