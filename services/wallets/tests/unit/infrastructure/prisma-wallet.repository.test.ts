/**
 * Integration tests for PrismaWalletRepository
 * 
 * Tests the repository implementation with a real PostgreSQL database.
 * Validates save, find, lock, and transaction operations.
 * 
 * Requirements: 1.4, 4.4, 5.5, 7.2, 7.4, 11.3
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { PrismaWalletRepository } from '../../../src/infrastructure/database/prisma-wallet.repository';
import { Wallet } from '../../../src/domain/wallet';
import { WalletId } from '../../../src/domain/wallet-id';
import { PlayerId } from '../../../src/domain/player-id';
import { Money } from '../../../src/domain/money';

describe('PrismaWalletRepository Integration Tests', () => {
  let prisma: PrismaService;
  let repository: PrismaWalletRepository;

  beforeAll(async () => {
    // Initialize Prisma service
    prisma = new PrismaService();
    await prisma.$connect();
    
    // Initialize repository
    repository = new PrismaWalletRepository(prisma);
  });

  afterAll(async () => {
    // Disconnect from database
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up wallets table before each test
    await prisma.wallet.deleteMany({});
  });

  describe('save()', () => {
    it('should create a new wallet', async () => {
      // Arrange
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-123');
      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      const wallet = new Wallet(
        walletId,
        playerIdResult.value,
        Money.zero(),
        new Date(),
        new Date()
      );

      // Act
      await repository.save(wallet);

      // Assert
      const found = await repository.findById(walletId);
      expect(found).not.toBeNull();
      expect(found?.getId().toString()).toBe(walletId.toString());
      expect(found?.getPlayerId().toString()).toBe('player-123');
      expect(found?.getBalance().toCentavos()).toBe(0n);
    });

    it('should update an existing wallet', async () => {
      // Arrange - Create initial wallet
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-456');
      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      const initialWallet = new Wallet(
        walletId,
        playerIdResult.value,
        Money.zero(),
        new Date(),
        new Date()
      );
      await repository.save(initialWallet);

      // Act - Update wallet balance
      const creditResult = Money.fromCentavos(10000n);
      expect(creditResult.ok).toBe(true);
      if (!creditResult.ok) return;

      initialWallet.credit(creditResult.value);
      await repository.save(initialWallet);

      // Assert
      const found = await repository.findById(walletId);
      expect(found).not.toBeNull();
      expect(found?.getBalance().toCentavos()).toBe(10000n);
    });

    it('should support transaction context', async () => {
      // Arrange
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-789');
      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      const wallet = new Wallet(
        walletId,
        playerIdResult.value,
        Money.zero(),
        new Date(),
        new Date()
      );

      // Act - Save within a transaction
      await prisma.$transaction(async (tx) => {
        // Create a repository instance with the transaction client
        const txRepository = new PrismaWalletRepository(tx as any);
        await txRepository.save(wallet);
      });

      // Assert
      const found = await repository.findById(walletId);
      expect(found).not.toBeNull();
      expect(found?.getId().toString()).toBe(walletId.toString());
    });
  });

  describe('findById()', () => {
    it('should return wallet when found', async () => {
      // Arrange
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-find-1');
      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      const wallet = new Wallet(
        walletId,
        playerIdResult.value,
        Money.zero(),
        new Date(),
        new Date()
      );
      await repository.save(wallet);

      // Act
      const found = await repository.findById(walletId);

      // Assert
      expect(found).not.toBeNull();
      expect(found?.getId().toString()).toBe(walletId.toString());
      expect(found?.getPlayerId().toString()).toBe('player-find-1');
    });

    it('should return null when wallet not found', async () => {
      // Arrange
      const nonExistentId = WalletId.create();

      // Act
      const found = await repository.findById(nonExistentId);

      // Assert
      expect(found).toBeNull();
    });

    it('should map domain model correctly', async () => {
      // Arrange
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-map-test');
      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      const balanceResult = Money.fromCentavos(50000n);
      expect(balanceResult.ok).toBe(true);
      if (!balanceResult.ok) return;

      const createdAt = new Date('2024-01-15T10:00:00Z');
      const updatedAt = new Date('2024-01-15T11:00:00Z');

      const wallet = new Wallet(
        walletId,
        playerIdResult.value,
        balanceResult.value,
        createdAt,
        updatedAt
      );
      await repository.save(wallet);

      // Act
      const found = await repository.findById(walletId);

      // Assert
      expect(found).not.toBeNull();
      expect(found?.getBalance().toCentavos()).toBe(50000n);
      expect(found?.getCreatedAt().toISOString()).toBe(createdAt.toISOString());
    });
  });

  describe('findByPlayerId()', () => {
    it('should return wallet for valid player ID', async () => {
      // Arrange
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-unique-1');
      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      const wallet = new Wallet(
        walletId,
        playerIdResult.value,
        Money.zero(),
        new Date(),
        new Date()
      );
      await repository.save(wallet);

      // Act
      const found = await repository.findByPlayerId(playerIdResult.value);

      // Assert
      expect(found).not.toBeNull();
      expect(found?.getPlayerId().toString()).toBe('player-unique-1');
      expect(found?.getId().toString()).toBe(walletId.toString());
    });

    it('should return null when player has no wallet', async () => {
      // Arrange
      const playerIdResult = PlayerId.fromString('player-no-wallet');
      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      // Act
      const found = await repository.findByPlayerId(playerIdResult.value);

      // Assert
      expect(found).toBeNull();
    });
  });

  describe('findByPlayerIdForUpdate()', () => {
    it('should acquire lock and return wallet', async () => {
      // Arrange
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-lock-1');
      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      const balanceResult = Money.fromCentavos(10000n);
      expect(balanceResult.ok).toBe(true);
      if (!balanceResult.ok) return;

      const wallet = new Wallet(
        walletId,
        playerIdResult.value,
        balanceResult.value,
        new Date(),
        new Date()
      );
      await repository.save(wallet);

      // Act - Use within transaction to test lock
      const result = await prisma.$transaction(async (tx) => {
        const txRepository = new PrismaWalletRepository(tx as any);
        const lockedWallet = await txRepository.findByPlayerIdForUpdate(playerIdResult.value);
        return lockedWallet;
      });

      // Assert
      expect(result).not.toBeNull();
      expect(result?.getPlayerId().toString()).toBe('player-lock-1');
      expect(result?.getBalance().toCentavos()).toBe(10000n);
    });

    it('should return null when player has no wallet', async () => {
      // Arrange
      const playerIdResult = PlayerId.fromString('player-no-lock');
      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      // Act
      const result = await prisma.$transaction(async (tx) => {
        const txRepository = new PrismaWalletRepository(tx as any);
        return await txRepository.findByPlayerIdForUpdate(playerIdResult.value);
      });

      // Assert
      expect(result).toBeNull();
    });

    it('should prevent concurrent modifications with lock', async () => {
      // Arrange
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-concurrent');
      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      const balanceResult = Money.fromCentavos(10000n);
      expect(balanceResult.ok).toBe(true);
      if (!balanceResult.ok) return;

      const wallet = new Wallet(
        walletId,
        playerIdResult.value,
        balanceResult.value,
        new Date(),
        new Date()
      );
      await repository.save(wallet);

      // Act - Simulate concurrent operations
      const operation1 = prisma.$transaction(async (tx) => {
        const txRepository = new PrismaWalletRepository(tx as any);
        const lockedWallet = await txRepository.findByPlayerIdForUpdate(playerIdResult.value);
        
        if (lockedWallet) {
          const debitAmount = Money.fromCentavos(5000n);
          if (debitAmount.ok) {
            lockedWallet.debit(debitAmount.value);
            await txRepository.save(lockedWallet);
          }
        }
      });

      const operation2 = prisma.$transaction(async (tx) => {
        const txRepository = new PrismaWalletRepository(tx as any);
        const lockedWallet = await txRepository.findByPlayerIdForUpdate(playerIdResult.value);
        
        if (lockedWallet) {
          const creditAmount = Money.fromCentavos(3000n);
          if (creditAmount.ok) {
            lockedWallet.credit(creditAmount.value);
            await txRepository.save(lockedWallet);
          }
        }
      });

      // Wait for both operations to complete
      await Promise.all([operation1, operation2]);

      // Assert - Final balance should be consistent
      const finalWallet = await repository.findByPlayerId(playerIdResult.value);
      expect(finalWallet).not.toBeNull();
      // Balance should be either 5000 (debit first) or 8000 (credit first)
      // but never an inconsistent value
      const finalBalance = finalWallet?.getBalance().toCentavos();
      expect(finalBalance === 5000n || finalBalance === 8000n).toBe(true);
    });
  });

  describe('existsByPlayerId()', () => {
    it('should return true when wallet exists', async () => {
      // Arrange
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-exists-1');
      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      const wallet = new Wallet(
        walletId,
        playerIdResult.value,
        Money.zero(),
        new Date(),
        new Date()
      );
      await repository.save(wallet);

      // Act
      const exists = await repository.existsByPlayerId(playerIdResult.value);

      // Assert
      expect(exists).toBe(true);
    });

    it('should return false when wallet does not exist', async () => {
      // Arrange
      const playerIdResult = PlayerId.fromString('player-not-exists');
      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      // Act
      const exists = await repository.existsByPlayerId(playerIdResult.value);

      // Assert
      expect(exists).toBe(false);
    });
  });

  describe('transaction rollback', () => {
    it('should rollback on error', async () => {
      // Arrange
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-rollback');
      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      const wallet = new Wallet(
        walletId,
        playerIdResult.value,
        Money.zero(),
        new Date(),
        new Date()
      );

      // Act - Attempt transaction that will fail
      try {
        await prisma.$transaction(async (tx) => {
          const txRepository = new PrismaWalletRepository(tx as any);
          await txRepository.save(wallet);
          
          // Force an error to trigger rollback
          throw new Error('Simulated error');
        });
      } catch (error) {
        // Expected error
      }

      // Assert - Wallet should not exist due to rollback
      const found = await repository.findById(walletId);
      expect(found).toBeNull();
    });
  });

  describe('unique constraint on playerId', () => {
    it('should enforce unique player ID constraint', async () => {
      // Arrange
      const walletId1 = WalletId.create();
      const walletId2 = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-duplicate');
      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      const wallet1 = new Wallet(
        walletId1,
        playerIdResult.value,
        Money.zero(),
        new Date(),
        new Date()
      );

      const wallet2 = new Wallet(
        walletId2,
        playerIdResult.value,
        Money.zero(),
        new Date(),
        new Date()
      );

      // Act & Assert
      await repository.save(wallet1);
      
      // Attempting to save a second wallet with the same playerId should fail
      try {
        await repository.save(wallet2);
        // If we reach here, the test should fail
        expect(true).toBe(false); // Force failure
      } catch (error: any) {
        // Expect a unique constraint violation error
        expect(error.code).toBe('P2002'); // Prisma unique constraint error code
      }
    });
  });
});
