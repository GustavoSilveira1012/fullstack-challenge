import { describe, it, expect } from 'bun:test';
import { Wallet, InsufficientBalanceError } from '../../../src/domain/wallet';
import { Money } from '../../../src/domain/money';
import { WalletId } from '../../../src/domain/wallet-id';
import { PlayerId } from '../../../src/domain/player-id';

describe('Wallet Entity', () => {
  // Helper function to create a test wallet
  const createTestWallet = (balanceCentavos: bigint = 0n): Wallet => {
    const id = WalletId.create();
    const playerIdResult = PlayerId.fromString('test-player-123');
    if (!playerIdResult.ok) throw new Error('Failed to create PlayerId');

    const balanceResult = Money.fromCentavos(balanceCentavos);
    if (!balanceResult.ok) throw new Error('Failed to create Money');

    const now = new Date();
    return new Wallet(id, playerIdResult.value, balanceResult.value, now, now);
  };

  describe('constructor()', () => {
    it('should create wallet with all required fields', () => {
      const id = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-123');
      const balance = Money.zero();
      const createdAt = new Date('2024-01-15T10:00:00Z');
      const updatedAt = new Date('2024-01-15T10:00:00Z');

      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      const wallet = new Wallet(
        id,
        playerIdResult.value,
        balance,
        createdAt,
        updatedAt
      );

      expect(wallet.getId()).toBe(id);
      expect(wallet.getPlayerId()).toBe(playerIdResult.value);
      expect(wallet.getBalance()).toBe(balance);
      expect(wallet.getCreatedAt()).toBe(createdAt);
      expect(wallet.getUpdatedAt()).toBe(updatedAt);
    });

    it('should create wallet with non-zero balance', () => {
      const balanceResult = Money.fromCentavos(10000n);
      expect(balanceResult.ok).toBe(true);
      if (!balanceResult.ok) return;

      const wallet = createTestWallet(10000n);

      expect(wallet.getBalance().toCentavos()).toBe(10000n);
    });

    it('should create wallet with zero balance', () => {
      const wallet = createTestWallet(0n);

      expect(wallet.getBalance().toCentavos()).toBe(0n);
    });
  });

  describe('credit()', () => {
    it('should increase balance by credit amount', () => {
      const wallet = createTestWallet(10000n);
      const creditResult = Money.fromCentavos(5000n);

      expect(creditResult.ok).toBe(true);
      if (!creditResult.ok) return;

      wallet.credit(creditResult.value);

      expect(wallet.getBalance().toCentavos()).toBe(15000n);
    });

    it('should credit to zero balance', () => {
      const wallet = createTestWallet(0n);
      const creditResult = Money.fromCentavos(10000n);

      expect(creditResult.ok).toBe(true);
      if (!creditResult.ok) return;

      wallet.credit(creditResult.value);

      expect(wallet.getBalance().toCentavos()).toBe(10000n);
    });

    it('should handle multiple credits', () => {
      const wallet = createTestWallet(10000n);
      const credit1Result = Money.fromCentavos(5000n);
      const credit2Result = Money.fromCentavos(3000n);
      const credit3Result = Money.fromCentavos(2000n);

      expect(credit1Result.ok).toBe(true);
      expect(credit2Result.ok).toBe(true);
      expect(credit3Result.ok).toBe(true);
      if (!credit1Result.ok || !credit2Result.ok || !credit3Result.ok) return;

      wallet.credit(credit1Result.value);
      wallet.credit(credit2Result.value);
      wallet.credit(credit3Result.value);

      expect(wallet.getBalance().toCentavos()).toBe(20000n);
    });

    it('should handle large credit amounts', () => {
      const wallet = createTestWallet(1000000000n);
      const creditResult = Money.fromCentavos(999999999n);

      expect(creditResult.ok).toBe(true);
      if (!creditResult.ok) return;

      wallet.credit(creditResult.value);

      expect(wallet.getBalance().toCentavos()).toBe(1999999999n);
    });

    it('should update updatedAt timestamp after credit', () => {
      const wallet = createTestWallet(10000n);
      const originalUpdatedAt = wallet.getUpdatedAt();
      const creditResult = Money.fromCentavos(5000n);

      expect(creditResult.ok).toBe(true);
      if (!creditResult.ok) return;

      // Wait a tiny bit to ensure timestamp changes
      const beforeCredit = new Date();
      wallet.credit(creditResult.value);
      const afterCredit = new Date();

      const newUpdatedAt = wallet.getUpdatedAt();
      expect(newUpdatedAt.getTime()).toBeGreaterThanOrEqual(beforeCredit.getTime());
      expect(newUpdatedAt.getTime()).toBeLessThanOrEqual(afterCredit.getTime());
    });

    it('should credit exactly 1 centavo', () => {
      const wallet = createTestWallet(100n);
      const creditResult = Money.fromCentavos(1n);

      expect(creditResult.ok).toBe(true);
      if (!creditResult.ok) return;

      wallet.credit(creditResult.value);

      expect(wallet.getBalance().toCentavos()).toBe(101n);
    });
  });

  describe('debit()', () => {
    it('should decrease balance by debit amount when sufficient balance', () => {
      const wallet = createTestWallet(10000n);
      const debitResult = Money.fromCentavos(5000n);

      expect(debitResult.ok).toBe(true);
      if (!debitResult.ok) return;

      const result = wallet.debit(debitResult.value);

      expect(result.ok).toBe(true);
      expect(wallet.getBalance().toCentavos()).toBe(5000n);
    });

    it('should debit entire balance to zero', () => {
      const wallet = createTestWallet(10000n);
      const debitResult = Money.fromCentavos(10000n);

      expect(debitResult.ok).toBe(true);
      if (!debitResult.ok) return;

      const result = wallet.debit(debitResult.value);

      expect(result.ok).toBe(true);
      expect(wallet.getBalance().toCentavos()).toBe(0n);
    });

    it('should return error when balance is insufficient', () => {
      const wallet = createTestWallet(5000n);
      const debitResult = Money.fromCentavos(10000n);

      expect(debitResult.ok).toBe(true);
      if (!debitResult.ok) return;

      const result = wallet.debit(debitResult.value);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InsufficientBalanceError);
        expect(result.error.requestedAmount.toCentavos()).toBe(10000n);
        expect(result.error.currentBalance.toCentavos()).toBe(5000n);
        expect(result.error.message).toContain('Insufficient balance');
        expect(result.error.message).toContain('10000');
        expect(result.error.message).toContain('5000');
      }
    });

    it('should not modify balance when debit fails', () => {
      const wallet = createTestWallet(5000n);
      const debitResult = Money.fromCentavos(10000n);

      expect(debitResult.ok).toBe(true);
      if (!debitResult.ok) return;

      const originalBalance = wallet.getBalance().toCentavos();
      const result = wallet.debit(debitResult.value);

      expect(result.ok).toBe(false);
      expect(wallet.getBalance().toCentavos()).toBe(originalBalance);
    });

    it('should return error when debiting from zero balance', () => {
      const wallet = createTestWallet(0n);
      const debitResult = Money.fromCentavos(1n);

      expect(debitResult.ok).toBe(true);
      if (!debitResult.ok) return;

      const result = wallet.debit(debitResult.value);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InsufficientBalanceError);
      }
    });

    it('should handle multiple debits', () => {
      const wallet = createTestWallet(20000n);
      const debit1Result = Money.fromCentavos(5000n);
      const debit2Result = Money.fromCentavos(3000n);
      const debit3Result = Money.fromCentavos(2000n);

      expect(debit1Result.ok).toBe(true);
      expect(debit2Result.ok).toBe(true);
      expect(debit3Result.ok).toBe(true);
      if (!debit1Result.ok || !debit2Result.ok || !debit3Result.ok) return;

      const result1 = wallet.debit(debit1Result.value);
      const result2 = wallet.debit(debit2Result.value);
      const result3 = wallet.debit(debit3Result.value);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      expect(result3.ok).toBe(true);
      expect(wallet.getBalance().toCentavos()).toBe(10000n);
    });

    it('should update updatedAt timestamp after successful debit', () => {
      const wallet = createTestWallet(10000n);
      const debitResult = Money.fromCentavos(5000n);

      expect(debitResult.ok).toBe(true);
      if (!debitResult.ok) return;

      const beforeDebit = new Date();
      const result = wallet.debit(debitResult.value);
      const afterDebit = new Date();

      expect(result.ok).toBe(true);
      const newUpdatedAt = wallet.getUpdatedAt();
      expect(newUpdatedAt.getTime()).toBeGreaterThanOrEqual(beforeDebit.getTime());
      expect(newUpdatedAt.getTime()).toBeLessThanOrEqual(afterDebit.getTime());
    });

    it('should debit exactly 1 centavo', () => {
      const wallet = createTestWallet(100n);
      const debitResult = Money.fromCentavos(1n);

      expect(debitResult.ok).toBe(true);
      if (!debitResult.ok) return;

      const result = wallet.debit(debitResult.value);

      expect(result.ok).toBe(true);
      expect(wallet.getBalance().toCentavos()).toBe(99n);
    });

    it('should handle large debit amounts', () => {
      const wallet = createTestWallet(1999999999n);
      const debitResult = Money.fromCentavos(999999999n);

      expect(debitResult.ok).toBe(true);
      if (!debitResult.ok) return;

      const result = wallet.debit(debitResult.value);

      expect(result.ok).toBe(true);
      expect(wallet.getBalance().toCentavos()).toBe(1000000000n);
    });
  });

  describe('balance invariant: balance >= 0', () => {
    it('should never allow negative balance through debit', () => {
      const wallet = createTestWallet(100n);
      const debitResult = Money.fromCentavos(101n);

      expect(debitResult.ok).toBe(true);
      if (!debitResult.ok) return;

      const result = wallet.debit(debitResult.value);

      expect(result.ok).toBe(false);
      expect(wallet.getBalance().toCentavos()).toBeGreaterThanOrEqual(0n);
    });

    it('should maintain non-negative balance after multiple operations', () => {
      const wallet = createTestWallet(10000n);
      const credit1Result = Money.fromCentavos(5000n);
      const debit1Result = Money.fromCentavos(8000n);
      const debit2Result = Money.fromCentavos(7001n); // This should fail

      expect(credit1Result.ok).toBe(true);
      expect(debit1Result.ok).toBe(true);
      expect(debit2Result.ok).toBe(true);
      if (!credit1Result.ok || !debit1Result.ok || !debit2Result.ok) return;

      wallet.credit(credit1Result.value); // 10000 + 5000 = 15000
      const result1 = wallet.debit(debit1Result.value); // 15000 - 8000 = 7000
      const result2 = wallet.debit(debit2Result.value); // 7000 - 7001 = fail

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(false);
      expect(wallet.getBalance().toCentavos()).toBe(7000n);
      expect(wallet.getBalance().toCentavos()).toBeGreaterThanOrEqual(0n);
    });
  });

  describe('getters', () => {
    it('should return correct wallet ID', () => {
      const id = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-123');
      const balance = Money.zero();
      const now = new Date();

      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      const wallet = new Wallet(id, playerIdResult.value, balance, now, now);

      expect(wallet.getId()).toBe(id);
      expect(wallet.getId().equals(id)).toBe(true);
    });

    it('should return correct player ID', () => {
      const id = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-123');
      const balance = Money.zero();
      const now = new Date();

      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      const wallet = new Wallet(id, playerIdResult.value, balance, now, now);

      expect(wallet.getPlayerId()).toBe(playerIdResult.value);
      expect(wallet.getPlayerId().equals(playerIdResult.value)).toBe(true);
    });

    it('should return correct balance', () => {
      const wallet = createTestWallet(12345n);

      expect(wallet.getBalance().toCentavos()).toBe(12345n);
    });

    it('should return correct createdAt timestamp', () => {
      const id = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-123');
      const balance = Money.zero();
      const createdAt = new Date('2024-01-15T10:00:00Z');
      const updatedAt = new Date('2024-01-15T10:00:00Z');

      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      const wallet = new Wallet(id, playerIdResult.value, balance, createdAt, updatedAt);

      expect(wallet.getCreatedAt()).toBe(createdAt);
      expect(wallet.getCreatedAt().toISOString()).toBe('2024-01-15T10:00:00.000Z');
    });

    it('should return correct updatedAt timestamp', () => {
      const id = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-123');
      const balance = Money.zero();
      const createdAt = new Date('2024-01-15T10:00:00Z');
      const updatedAt = new Date('2024-01-15T11:00:00Z');

      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      const wallet = new Wallet(id, playerIdResult.value, balance, createdAt, updatedAt);

      expect(wallet.getUpdatedAt()).toBe(updatedAt);
      expect(wallet.getUpdatedAt().toISOString()).toBe('2024-01-15T11:00:00.000Z');
    });
  });

  describe('immutability of id and playerId', () => {
    it('should not allow modification of wallet ID', () => {
      const wallet = createTestWallet(10000n);
      const originalId = wallet.getId();

      // Perform operations
      const creditResult = Money.fromCentavos(5000n);
      expect(creditResult.ok).toBe(true);
      if (!creditResult.ok) return;

      wallet.credit(creditResult.value);

      // ID should remain the same
      expect(wallet.getId()).toBe(originalId);
      expect(wallet.getId().equals(originalId)).toBe(true);
    });

    it('should not allow modification of player ID', () => {
      const wallet = createTestWallet(10000n);
      const originalPlayerId = wallet.getPlayerId();

      // Perform operations
      const debitResult = Money.fromCentavos(5000n);
      expect(debitResult.ok).toBe(true);
      if (!debitResult.ok) return;

      wallet.debit(debitResult.value);

      // Player ID should remain the same
      expect(wallet.getPlayerId()).toBe(originalPlayerId);
      expect(wallet.getPlayerId().equals(originalPlayerId)).toBe(true);
    });

    it('should not allow modification of createdAt timestamp', () => {
      const wallet = createTestWallet(10000n);
      const originalCreatedAt = wallet.getCreatedAt();

      // Perform operations
      const creditResult = Money.fromCentavos(5000n);
      expect(creditResult.ok).toBe(true);
      if (!creditResult.ok) return;

      wallet.credit(creditResult.value);

      // createdAt should remain the same
      expect(wallet.getCreatedAt()).toBe(originalCreatedAt);
    });
  });

  describe('InsufficientBalanceError', () => {
    it('should contain requested amount and current balance', () => {
      const requestedResult = Money.fromCentavos(10000n);
      const currentResult = Money.fromCentavos(5000n);

      expect(requestedResult.ok).toBe(true);
      expect(currentResult.ok).toBe(true);
      if (!requestedResult.ok || !currentResult.ok) return;

      const error = new InsufficientBalanceError(
        requestedResult.value,
        currentResult.value
      );

      expect(error.requestedAmount.toCentavos()).toBe(10000n);
      expect(error.currentBalance.toCentavos()).toBe(5000n);
      expect(error.name).toBe('InsufficientBalanceError');
      expect(error.message).toContain('Insufficient balance');
    });

    it('should have descriptive error message', () => {
      const requestedResult = Money.fromCentavos(10000n);
      const currentResult = Money.fromCentavos(5000n);

      expect(requestedResult.ok).toBe(true);
      expect(currentResult.ok).toBe(true);
      if (!requestedResult.ok || !currentResult.ok) return;

      const error = new InsufficientBalanceError(
        requestedResult.value,
        currentResult.value
      );

      expect(error.message).toContain('requested 10000 centavos');
      expect(error.message).toContain('current balance is 5000 centavos');
    });
  });
});
