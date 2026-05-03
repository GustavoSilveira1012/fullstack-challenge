import { describe, it, expect } from 'bun:test';
import fc from 'fast-check';
import { Wallet } from '../../../src/domain/wallet';
import { Money } from '../../../src/domain/money';
import { WalletId } from '../../../src/domain/wallet-id';
import { PlayerId } from '../../../src/domain/player-id';

/**
 * Property-Based Tests for Concurrent Wallet Operations
 * 
 * These tests verify the correctness property that must hold for concurrent operations:
 * For any sequence of concurrent credit and debit operations, if all operations are
 * serialized correctly (through database locking), the final balance must equal
 * initial_balance + sum(credits) - sum(debits).
 * 
 * This test validates the mathematical correctness property that the locking mechanism
 * must preserve, without requiring actual concurrent execution or database integration.
 * 
 * **Validates: Requirements 7.1**
 */

/**
 * Helper function to create a test wallet with a specific balance
 */
const createWalletWithBalance = (balanceCentavos: bigint): Wallet => {
  const id = WalletId.create();
  const playerIdResult = PlayerId.fromString('test-player-concurrent-123');
  if (!playerIdResult.ok) throw new Error('Failed to create PlayerId');

  const balanceResult = Money.fromCentavos(balanceCentavos);
  if (!balanceResult.ok) throw new Error('Failed to create Money');

  const now = new Date();
  return new Wallet(id, playerIdResult.value, balanceResult.value, now, now);
};

/**
 * Type representing an operation to perform on a wallet
 */
type Operation = 
  | { type: 'credit'; amount: bigint }
  | { type: 'debit'; amount: bigint };

/**
 * Simulates sequential execution of operations (as would happen with proper locking)
 * Returns the final balance after all operations are applied
 */
const executeOperationsSequentially = (
  initialBalance: bigint,
  operations: Operation[]
): bigint => {
  const wallet = createWalletWithBalance(initialBalance);
  
  for (const operation of operations) {
    const amountResult = Money.fromCentavos(operation.amount);
    if (!amountResult.ok) continue;
    
    if (operation.type === 'credit') {
      wallet.credit(amountResult.value);
    } else {
      // Debit may fail if insufficient balance
      wallet.debit(amountResult.value);
    }
  }
  
  return wallet.getBalance().toCentavos();
};

describe('Property 6: Concurrent Operations Correctness', () => {

  /**
   * **Validates: Requirements 7.1**
   * 
   * For any Wallet with initial balance B and any sequence of N concurrent credit operations 
   * with amounts [A1, A2, ..., An] and M concurrent debit operations with amounts [D1, D2, ..., Dm], 
   * when operations are properly serialized (via database locking), the final balance SHALL be 
   * exactly B + Σ(Ai) - Σ(Dj) centavos for all successful operations.
   * 
   * This property verifies the mathematical correctness that the locking mechanism must preserve.
   */
  
  it('should maintain correct balance with sequential credit operations', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 100000n }), // Initial balance
        fc.array(fc.bigInt({ min: 1n, max: 1000n }), { minLength: 2, maxLength: 20 }), // Credit amounts
        (initialBalanceCentavos, creditAmounts) => {
          // Arrange
          const wallet = createWalletWithBalance(initialBalanceCentavos);
          
          // Act - Apply all credit operations sequentially
          for (const amount of creditAmounts) {
            const creditAmountResult = Money.fromCentavos(amount);
            expect(creditAmountResult.ok).toBe(true);
            if (!creditAmountResult.ok) return;
            
            wallet.credit(creditAmountResult.value);
          }
          
          // Assert - Verify final balance equals initial + sum of all credits
          const expectedBalance = initialBalanceCentavos + creditAmounts.reduce((sum, amt) => sum + amt, 0n);
          expect(wallet.getBalance().toCentavos()).toBe(expectedBalance);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should maintain correct balance with sequential debit operations', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 10000n, max: 100000n }), // Initial balance (large enough for debits)
        fc.array(fc.bigInt({ min: 1n, max: 500n }), { minLength: 2, maxLength: 20 }), // Debit amounts
        (initialBalanceCentavos, debitAmounts) => {
          // Calculate total debit
          const totalDebit = debitAmounts.reduce((sum, amt) => sum + amt, 0n);
          
          // Skip if total debit exceeds balance
          if (totalDebit > initialBalanceCentavos) return true;
          
          // Arrange
          const wallet = createWalletWithBalance(initialBalanceCentavos);
          
          // Act - Apply all debit operations sequentially
          for (const amount of debitAmounts) {
            const debitAmountResult = Money.fromCentavos(amount);
            expect(debitAmountResult.ok).toBe(true);
            if (!debitAmountResult.ok) return;
            
            const result = wallet.debit(debitAmountResult.value);
            expect(result.ok).toBe(true);
          }
          
          // Assert - Verify final balance equals initial - sum of all debits
          const expectedBalance = initialBalanceCentavos - totalDebit;
          expect(wallet.getBalance().toCentavos()).toBe(expectedBalance);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should maintain correct balance with mixed sequential credit and debit operations', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 50000n, max: 100000n }), // Initial balance
        fc.array(
          fc.record({
            type: fc.constantFrom('credit' as const, 'debit' as const),
            amount: fc.bigInt({ min: 1n, max: 1000n })
          }),
          { minLength: 5, maxLength: 30 }
        ),
        (initialBalanceCentavos, operations) => {
          // Calculate expected final balance
          let expectedBalance = initialBalanceCentavos;
          for (const op of operations) {
            if (op.type === 'credit') {
              expectedBalance += op.amount;
            } else {
              // Only subtract if balance is sufficient
              if (expectedBalance >= op.amount) {
                expectedBalance -= op.amount;
              }
            }
          }
          
          // Arrange
          const wallet = createWalletWithBalance(initialBalanceCentavos);
          
          // Act - Apply all operations sequentially
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
          }
          
          // Assert - Verify final balance matches expected
          expect(wallet.getBalance().toCentavos()).toBe(expectedBalance);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should produce same result regardless of operation ordering when all operations succeed', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 100000n, max: 200000n }), // Large initial balance
        fc.array(fc.bigInt({ min: 1n, max: 500n }), { minLength: 3, maxLength: 10 }), // Credit amounts
        fc.array(fc.bigInt({ min: 1n, max: 500n }), { minLength: 3, maxLength: 10 }), // Debit amounts
        (initialBalanceCentavos, creditAmounts, debitAmounts) => {
          // Calculate total operations
          const totalCredits = creditAmounts.reduce((sum, amt) => sum + amt, 0n);
          const totalDebits = debitAmounts.reduce((sum, amt) => sum + amt, 0n);
          
          // Skip if debits would exceed balance
          if (initialBalanceCentavos + totalCredits < totalDebits) return true;
          
          // Expected final balance (order-independent when all operations succeed)
          const expectedBalance = initialBalanceCentavos + totalCredits - totalDebits;
          
          // Test 1: Credits first, then debits
          const wallet1 = createWalletWithBalance(initialBalanceCentavos);
          for (const amount of creditAmounts) {
            const moneyResult = Money.fromCentavos(amount);
            if (moneyResult.ok) wallet1.credit(moneyResult.value);
          }
          for (const amount of debitAmounts) {
            const moneyResult = Money.fromCentavos(amount);
            if (moneyResult.ok) wallet1.debit(moneyResult.value);
          }
          
          // Test 2: Debits first, then credits
          const wallet2 = createWalletWithBalance(initialBalanceCentavos);
          for (const amount of debitAmounts) {
            const moneyResult = Money.fromCentavos(amount);
            if (moneyResult.ok) wallet2.debit(moneyResult.value);
          }
          for (const amount of creditAmounts) {
            const moneyResult = Money.fromCentavos(amount);
            if (moneyResult.ok) wallet2.credit(moneyResult.value);
          }
          
          // Test 3: Interleaved operations
          const wallet3 = createWalletWithBalance(initialBalanceCentavos);
          const maxLen = Math.max(creditAmounts.length, debitAmounts.length);
          for (let i = 0; i < maxLen; i++) {
            if (i < creditAmounts.length) {
              const moneyResult = Money.fromCentavos(creditAmounts[i]);
              if (moneyResult.ok) wallet3.credit(moneyResult.value);
            }
            if (i < debitAmounts.length) {
              const moneyResult = Money.fromCentavos(debitAmounts[i]);
              if (moneyResult.ok) wallet3.debit(moneyResult.value);
            }
          }
          
          // Assert - All orderings should produce the same final balance
          expect(wallet1.getBalance().toCentavos()).toBe(expectedBalance);
          expect(wallet2.getBalance().toCentavos()).toBe(expectedBalance);
          expect(wallet3.getBalance().toCentavos()).toBe(expectedBalance);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle operations where some debits fail due to insufficient balance', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1000n, max: 5000n }), // Small initial balance
        fc.array(fc.bigInt({ min: 500n, max: 2000n }), { minLength: 3, maxLength: 10 }), // Debit amounts (some will fail)
        (initialBalanceCentavos, debitAmounts) => {
          // Arrange
          const wallet = createWalletWithBalance(initialBalanceCentavos);
          let expectedBalance = initialBalanceCentavos;
          
          // Act - Apply debit operations, tracking which succeed
          for (const amount of debitAmounts) {
            const debitAmountResult = Money.fromCentavos(amount);
            expect(debitAmountResult.ok).toBe(true);
            if (!debitAmountResult.ok) return;
            
            const result = wallet.debit(debitAmountResult.value);
            if (result.ok) {
              expectedBalance -= amount;
            }
          }
          
          // Assert - Final balance should match expected (only successful debits applied)
          expect(wallet.getBalance().toCentavos()).toBe(expectedBalance);
          expect(wallet.getBalance().toCentavos()).toBeGreaterThanOrEqual(0n);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should maintain balance invariant across any sequence of operations', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 50000n }), // Initial balance
        fc.array(
          fc.record({
            type: fc.constantFrom('credit' as const, 'debit' as const),
            amount: fc.bigInt({ min: 1n, max: 5000n })
          }),
          { minLength: 10, maxLength: 50 }
        ),
        (initialBalanceCentavos, operations) => {
          // Arrange
          const wallet = createWalletWithBalance(initialBalanceCentavos);
          let runningBalance = initialBalanceCentavos;
          
          // Act - Apply all operations and track expected balance
          for (const operation of operations) {
            const amountResult = Money.fromCentavos(operation.amount);
            expect(amountResult.ok).toBe(true);
            if (!amountResult.ok) return;
            
            if (operation.type === 'credit') {
              wallet.credit(amountResult.value);
              runningBalance += operation.amount;
            } else {
              const result = wallet.debit(amountResult.value);
              if (result.ok) {
                runningBalance -= operation.amount;
              }
            }
            
            // Assert - Balance must always be non-negative
            expect(wallet.getBalance().toCentavos()).toBeGreaterThanOrEqual(0n);
            expect(wallet.getBalance().toCentavos()).toBe(runningBalance);
          }
          
          // Assert - Final balance matches running calculation
          expect(wallet.getBalance().toCentavos()).toBe(runningBalance);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should verify that concurrent operations property holds: final_balance = initial + credits - debits', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 10000n, max: 100000n }), // Initial balance
        fc.array(
          fc.record({
            type: fc.constantFrom('credit' as const, 'debit' as const),
            amount: fc.bigInt({ min: 100n, max: 1000n })
          }),
          { minLength: 5, maxLength: 20 }
        ),
        (initialBalanceCentavos, operations) => {
          // Calculate expected balance assuming all valid operations succeed
          let expectedBalance = initialBalanceCentavos;
          let totalCredits = 0n;
          let totalDebits = 0n;
          
          for (const op of operations) {
            if (op.type === 'credit') {
              totalCredits += op.amount;
              expectedBalance += op.amount;
            } else {
              if (expectedBalance >= op.amount) {
                totalDebits += op.amount;
                expectedBalance -= op.amount;
              }
            }
          }
          
          // Execute operations sequentially (simulating serialized concurrent execution)
          const finalBalance = executeOperationsSequentially(initialBalanceCentavos, operations);
          
          // Assert - The concurrent operations correctness property
          expect(finalBalance).toBe(expectedBalance);
          expect(finalBalance).toBe(initialBalanceCentavos + totalCredits - totalDebits);
          expect(finalBalance).toBeGreaterThanOrEqual(0n);
        }
      ),
      { numRuns: 20 }
    );
  });
});
