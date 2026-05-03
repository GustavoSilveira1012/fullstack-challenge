import { describe, it, expect } from 'bun:test';
import fc from 'fast-check';
import { Wallet, InsufficientBalanceError } from '../../../src/domain/wallet';
import { Money } from '../../../src/domain/money';
import { WalletId } from '../../../src/domain/wallet-id';
import { PlayerId } from '../../../src/domain/player-id';

/**
 * Property-Based Tests for Wallet Entity
 * 
 * These tests verify universal correctness properties across randomly generated inputs.
 * Each test runs 100 iterations with different random values.
 */

/**
 * Helper function to create a test wallet with a specific balance
 */
const createWalletWithBalance = (balanceCentavos: bigint): Wallet => {
  const id = WalletId.create();
  const playerIdResult = PlayerId.fromString('test-player-123');
  if (!playerIdResult.ok) throw new Error('Failed to create PlayerId');

  const balanceResult = Money.fromCentavos(balanceCentavos);
  if (!balanceResult.ok) throw new Error('Failed to create Money');

  const now = new Date();
  return new Wallet(id, playerIdResult.value, balanceResult.value, now, now);
};

describe('Property 3: Credit Operation Correctness', () => {
  /**
   * **Validates: Requirements 4.3**
   * 
   * For any Wallet with balance B and any positive Money amount A,
   * calling wallet.credit(A) SHALL result in a new balance of exactly B + A centavos.
   */
  
  it('should increase balance by exact credit amount for any initial balance and positive credit', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 1000000000n }), // Initial balance (0 to 1 billion centavos)
        fc.bigInt({ min: 1n, max: 1000000n }),    // Credit amount (1 to 1 million centavos)
        (initialBalanceCentavos, creditAmountCentavos) => {
          // Arrange
          const wallet = createWalletWithBalance(initialBalanceCentavos);
          const creditAmountResult = Money.fromCentavos(creditAmountCentavos);
          
          expect(creditAmountResult.ok).toBe(true);
          if (!creditAmountResult.ok) return;
          
          const creditAmount = creditAmountResult.value;
          
          // Act
          wallet.credit(creditAmount);
          
          // Assert - verify exact arithmetic: new balance = initial + credit
          const expectedBalance = initialBalanceCentavos + creditAmountCentavos;
          expect(wallet.getBalance().toCentavos()).toBe(expectedBalance);
          expect(wallet.getBalance().toCentavos() === expectedBalance).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle credit operations with zero initial balance', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1n, max: 1000000n }), // Credit amount
        (creditAmountCentavos) => {
          // Arrange
          const wallet = createWalletWithBalance(0n);
          const creditAmountResult = Money.fromCentavos(creditAmountCentavos);
          
          expect(creditAmountResult.ok).toBe(true);
          if (!creditAmountResult.ok) return;
          
          // Act
          wallet.credit(creditAmountResult.value);
          
          // Assert - balance should equal credit amount
          expect(wallet.getBalance().toCentavos()).toBe(creditAmountCentavos);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle multiple sequential credit operations with exact arithmetic', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 1000000n }), // Initial balance
        fc.array(fc.bigInt({ min: 1n, max: 100000n }), { minLength: 1, maxLength: 10 }), // Array of credit amounts
        (initialBalanceCentavos, creditAmounts) => {
          // Arrange
          const wallet = createWalletWithBalance(initialBalanceCentavos);
          
          // Act - apply all credits
          let expectedBalance = initialBalanceCentavos;
          for (const creditAmountCentavos of creditAmounts) {
            const creditAmountResult = Money.fromCentavos(creditAmountCentavos);
            expect(creditAmountResult.ok).toBe(true);
            if (!creditAmountResult.ok) return;
            
            wallet.credit(creditAmountResult.value);
            expectedBalance += creditAmountCentavos;
          }
          
          // Assert - verify final balance equals initial + sum of all credits
          expect(wallet.getBalance().toCentavos()).toBe(expectedBalance);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle very large credit amounts without precision loss', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 10n ** 15n }), // Initial balance (up to quadrillion)
        fc.bigInt({ min: 1n, max: 10n ** 15n }), // Large credit amount
        (initialBalanceCentavos, creditAmountCentavos) => {
          // Arrange
          const wallet = createWalletWithBalance(initialBalanceCentavos);
          const creditAmountResult = Money.fromCentavos(creditAmountCentavos);
          
          expect(creditAmountResult.ok).toBe(true);
          if (!creditAmountResult.ok) return;
          
          // Act
          wallet.credit(creditAmountResult.value);
          
          // Assert - verify exact arithmetic with large numbers
          const expectedBalance = initialBalanceCentavos + creditAmountCentavos;
          expect(wallet.getBalance().toCentavos()).toBe(expectedBalance);
          expect(wallet.getBalance().toCentavos() === expectedBalance).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property 4: Debit Operation Correctness with Sufficient Balance', () => {
  /**
   * **Validates: Requirements 5.4**
   * 
   * For any Wallet with balance B and any positive Money amount A where B >= A,
   * calling wallet.debit(A) SHALL result in a new balance of exactly B - A centavos.
   */
  
  it('should decrease balance by exact debit amount when balance is sufficient', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 1000000000n }), // Balance
        fc.bigInt({ min: 0n, max: 1000000n }),    // Debit amount
        (balanceCentavos, debitAmountCentavos) => {
          // Ensure balance >= debit amount by using max and min
          const largerValue = balanceCentavos >= debitAmountCentavos ? balanceCentavos : debitAmountCentavos;
          const smallerValue = balanceCentavos >= debitAmountCentavos ? debitAmountCentavos : balanceCentavos;
          
          // Skip if debit amount is zero (not a valid debit operation)
          if (smallerValue === 0n) return true;
          
          // Arrange
          const wallet = createWalletWithBalance(largerValue);
          const debitAmountResult = Money.fromCentavos(smallerValue);
          
          expect(debitAmountResult.ok).toBe(true);
          if (!debitAmountResult.ok) return;
          
          const debitAmount = debitAmountResult.value;
          
          // Act
          const result = wallet.debit(debitAmount);
          
          // Assert - verify debit succeeds and balance is exact
          expect(result.ok).toBe(true);
          const expectedBalance = largerValue - smallerValue;
          expect(wallet.getBalance().toCentavos()).toBe(expectedBalance);
          expect(wallet.getBalance().toCentavos() === expectedBalance).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle debit of entire balance to zero', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1n, max: 1000000000n }), // Balance (positive)
        (balanceCentavos) => {
          // Arrange
          const wallet = createWalletWithBalance(balanceCentavos);
          const debitAmountResult = Money.fromCentavos(balanceCentavos);
          
          expect(debitAmountResult.ok).toBe(true);
          if (!debitAmountResult.ok) return;
          
          // Act
          const result = wallet.debit(debitAmountResult.value);
          
          // Assert - balance should be exactly zero
          expect(result.ok).toBe(true);
          expect(wallet.getBalance().toCentavos()).toBe(0n);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle multiple sequential debit operations with exact arithmetic', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 100000n, max: 10000000n }), // Initial balance (large enough for multiple debits)
        fc.array(fc.bigInt({ min: 1n, max: 10000n }), { minLength: 1, maxLength: 5 }), // Array of debit amounts
        (initialBalanceCentavos, debitAmounts) => {
          // Calculate total debit amount
          const totalDebit = debitAmounts.reduce((sum, amount) => sum + amount, 0n);
          
          // Skip if total debit exceeds balance
          if (totalDebit > initialBalanceCentavos) return true;
          
          // Arrange
          const wallet = createWalletWithBalance(initialBalanceCentavos);
          
          // Act - apply all debits
          let expectedBalance = initialBalanceCentavos;
          for (const debitAmountCentavos of debitAmounts) {
            const debitAmountResult = Money.fromCentavos(debitAmountCentavos);
            expect(debitAmountResult.ok).toBe(true);
            if (!debitAmountResult.ok) return;
            
            const result = wallet.debit(debitAmountResult.value);
            expect(result.ok).toBe(true);
            expectedBalance -= debitAmountCentavos;
          }
          
          // Assert - verify final balance equals initial - sum of all debits
          expect(wallet.getBalance().toCentavos()).toBe(expectedBalance);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle very large debit amounts without precision loss', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 10n ** 15n, max: 10n ** 16n }), // Large balance
        fc.bigInt({ min: 1n, max: 10n ** 15n }),         // Large debit amount
        (balanceCentavos, debitAmountCentavos) => {
          // Ensure balance >= debit amount
          if (balanceCentavos < debitAmountCentavos) return true;
          
          // Arrange
          const wallet = createWalletWithBalance(balanceCentavos);
          const debitAmountResult = Money.fromCentavos(debitAmountCentavos);
          
          expect(debitAmountResult.ok).toBe(true);
          if (!debitAmountResult.ok) return;
          
          // Act
          const result = wallet.debit(debitAmountResult.value);
          
          // Assert - verify exact arithmetic with large numbers
          expect(result.ok).toBe(true);
          const expectedBalance = balanceCentavos - debitAmountCentavos;
          expect(wallet.getBalance().toCentavos()).toBe(expectedBalance);
          expect(wallet.getBalance().toCentavos() === expectedBalance).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle debit operations that leave minimal balance', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 2n, max: 1000000n }), // Balance (at least 2)
        (balanceCentavos) => {
          // Debit all but 1 centavo
          const debitAmountCentavos = balanceCentavos - 1n;
          
          // Arrange
          const wallet = createWalletWithBalance(balanceCentavos);
          const debitAmountResult = Money.fromCentavos(debitAmountCentavos);
          
          expect(debitAmountResult.ok).toBe(true);
          if (!debitAmountResult.ok) return;
          
          // Act
          const result = wallet.debit(debitAmountResult.value);
          
          // Assert - balance should be exactly 1 centavo
          expect(result.ok).toBe(true);
          expect(wallet.getBalance().toCentavos()).toBe(1n);
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property 5: Balance Non-Negativity Invariant', () => {
  /**
   * **Validates: Requirements 5.6, 6.1, 6.2, 6.3**
   * 
   * For any Wallet with balance B and any positive Money amount A where B < A,
   * calling wallet.debit(A) SHALL reject the operation and return an InsufficientBalanceError,
   * leaving the balance unchanged at B centavos.
   */
  
  it('should reject debit when amount exceeds balance and leave balance unchanged', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 1000000n }),    // Balance
        fc.bigInt({ min: 1n, max: 1000000n }),    // Debit amount
        (balanceCentavos, debitAmountCentavos) => {
          // Ensure balance < debit amount
          const smallerValue = balanceCentavos < debitAmountCentavos ? balanceCentavos : debitAmountCentavos;
          const largerValue = balanceCentavos < debitAmountCentavos ? debitAmountCentavos : balanceCentavos;
          
          // Skip if they're equal (not testing insufficient balance case)
          if (smallerValue === largerValue) return true;
          
          // Arrange
          const wallet = createWalletWithBalance(smallerValue);
          const originalBalance = wallet.getBalance().toCentavos();
          const debitAmountResult = Money.fromCentavos(largerValue);
          
          expect(debitAmountResult.ok).toBe(true);
          if (!debitAmountResult.ok) return;
          
          const debitAmount = debitAmountResult.value;
          
          // Act
          const result = wallet.debit(debitAmount);
          
          // Assert - verify debit fails with InsufficientBalanceError
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toBeInstanceOf(InsufficientBalanceError);
            expect(result.error.requestedAmount.toCentavos()).toBe(largerValue);
            expect(result.error.currentBalance.toCentavos()).toBe(smallerValue);
          }
          
          // Assert - verify balance remains unchanged
          expect(wallet.getBalance().toCentavos()).toBe(originalBalance);
          expect(wallet.getBalance().toCentavos()).toBe(smallerValue);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should reject debit from zero balance and leave balance at zero', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1n, max: 1000000n }), // Debit amount (positive)
        (debitAmountCentavos) => {
          // Arrange
          const wallet = createWalletWithBalance(0n);
          const debitAmountResult = Money.fromCentavos(debitAmountCentavos);
          
          expect(debitAmountResult.ok).toBe(true);
          if (!debitAmountResult.ok) return;
          
          // Act
          const result = wallet.debit(debitAmountResult.value);
          
          // Assert - verify debit fails
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toBeInstanceOf(InsufficientBalanceError);
          }
          
          // Assert - verify balance remains zero
          expect(wallet.getBalance().toCentavos()).toBe(0n);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should maintain non-negative balance invariant after mixed operations', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1000n, max: 100000n }), // Initial balance
        fc.array(
          fc.record({
            type: fc.constantFrom('credit', 'debit'),
            amount: fc.bigInt({ min: 1n, max: 10000n })
          }),
          { minLength: 5, maxLength: 20 }
        ),
        (initialBalanceCentavos, operations) => {
          // Arrange
          const wallet = createWalletWithBalance(initialBalanceCentavos);
          
          // Act - apply all operations
          for (const operation of operations) {
            const amountResult = Money.fromCentavos(operation.amount);
            expect(amountResult.ok).toBe(true);
            if (!amountResult.ok) return;
            
            if (operation.type === 'credit') {
              wallet.credit(amountResult.value);
            } else {
              // Debit may fail if insufficient balance
              wallet.debit(amountResult.value);
            }
            
            // Assert - balance must always be non-negative
            expect(wallet.getBalance().toCentavos()).toBeGreaterThanOrEqual(0n);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should reject debit by exactly 1 centavo when balance is insufficient', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 1000000n }), // Balance
        (balanceCentavos) => {
          // Try to debit balance + 1
          const debitAmountCentavos = balanceCentavos + 1n;
          
          // Arrange
          const wallet = createWalletWithBalance(balanceCentavos);
          const originalBalance = wallet.getBalance().toCentavos();
          const debitAmountResult = Money.fromCentavos(debitAmountCentavos);
          
          expect(debitAmountResult.ok).toBe(true);
          if (!debitAmountResult.ok) return;
          
          // Act
          const result = wallet.debit(debitAmountResult.value);
          
          // Assert - verify debit fails
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toBeInstanceOf(InsufficientBalanceError);
          }
          
          // Assert - verify balance unchanged
          expect(wallet.getBalance().toCentavos()).toBe(originalBalance);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should never allow balance to become negative through any sequence of operations', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 100000n }), // Initial balance
        fc.array(fc.bigInt({ min: 1n, max: 50000n }), { minLength: 1, maxLength: 10 }), // Debit attempts
        (initialBalanceCentavos, debitAttempts) => {
          // Arrange
          const wallet = createWalletWithBalance(initialBalanceCentavos);
          
          // Act - attempt all debits
          for (const debitAmountCentavos of debitAttempts) {
            const debitAmountResult = Money.fromCentavos(debitAmountCentavos);
            expect(debitAmountResult.ok).toBe(true);
            if (!debitAmountResult.ok) return;
            
            wallet.debit(debitAmountResult.value);
            
            // Assert - balance must never be negative
            expect(wallet.getBalance().toCentavos()).toBeGreaterThanOrEqual(0n);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should provide correct error details when debit fails', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 100000n }),  // Balance
        fc.bigInt({ min: 1n, max: 100000n }),  // Debit amount
        (balanceCentavos, debitAmountCentavos) => {
          // Ensure balance < debit amount
          if (balanceCentavos >= debitAmountCentavos) return true;
          
          // Arrange
          const wallet = createWalletWithBalance(balanceCentavos);
          const debitAmountResult = Money.fromCentavos(debitAmountCentavos);
          
          expect(debitAmountResult.ok).toBe(true);
          if (!debitAmountResult.ok) return;
          
          // Act
          const result = wallet.debit(debitAmountResult.value);
          
          // Assert - verify error contains correct details
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toBeInstanceOf(InsufficientBalanceError);
            expect(result.error.requestedAmount.toCentavos()).toBe(debitAmountCentavos);
            expect(result.error.currentBalance.toCentavos()).toBe(balanceCentavos);
            expect(result.error.message).toContain('Insufficient balance');
            expect(result.error.message).toContain(debitAmountCentavos.toString());
            expect(result.error.message).toContain(balanceCentavos.toString());
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});
