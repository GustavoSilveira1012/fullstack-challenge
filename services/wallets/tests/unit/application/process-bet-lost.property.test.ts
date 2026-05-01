/**
 * Property-Based Tests for ProcessBetLostUseCase
 * 
 * Feature: wallet-service, Property 7: Bet Lost Event Idempotency
 * 
 * **Validates: Requirements 8.7, 10.4**
 * 
 * For any Wallet with balance B and any Bet_Lost_Event, processing the event
 * SHALL leave the balance unchanged at B centavos, and processing the same event
 * multiple times SHALL have the same effect as processing it once.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import fc from 'fast-check';
import { ProcessBetLostUseCase } from '../../../src/application/process-bet-lost.use-case';
import type { IWalletRepository } from '../../../src/domain/wallet-repository';
import { Wallet } from '../../../src/domain/wallet';
import { WalletId } from '../../../src/domain/wallet-id';
import { PlayerId } from '../../../src/domain/player-id';
import { Money } from '../../../src/domain/money';
import { BetLostEventDto } from '../../../src/application/dtos';

// Mock repository implementation for testing
class MockWalletRepository implements IWalletRepository {
  private wallets: Map<string, Wallet> = new Map();

  async save(wallet: Wallet): Promise<void> {
    this.wallets.set(wallet.getPlayerId().toString(), wallet);
  }

  async findById(id: WalletId): Promise<Wallet | null> {
    for (const wallet of this.wallets.values()) {
      if (wallet.getId().equals(id)) {
        return wallet;
      }
    }
    return null;
  }

  async findByPlayerId(playerId: PlayerId): Promise<Wallet | null> {
    return this.wallets.get(playerId.toString()) || null;
  }

  async findByPlayerIdForUpdate(playerId: PlayerId): Promise<Wallet | null> {
    return this.findByPlayerId(playerId);
  }

  async existsByPlayerId(playerId: PlayerId): Promise<boolean> {
    return this.wallets.has(playerId.toString());
  }

  // Helper method for testing
  setWallet(wallet: Wallet): void {
    this.wallets.set(wallet.getPlayerId().toString(), wallet);
  }
}

describe('Property 7: Bet Lost Event Idempotency', () => {
  it('should leave balance unchanged when processing bet lost event', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 1000000000n }), // Initial balance
        fc.string({ minLength: 10, maxLength: 50, unit: 'grapheme' }).filter(s => /^[a-zA-Z0-9]+$/.test(s)), // Player ID (alphanumeric)
        fc.string({ minLength: 5, maxLength: 50, unit: 'grapheme' }).filter(s => /^[a-zA-Z0-9]+$/.test(s)), // Bet ID
        fc.bigInt({ min: 1n, max: 100000n }), // Bet amount
        async (initialBalanceCentavos, playerIdStr, betId, betAmount) => {
          // Create fresh repository and use case for each iteration
          const testRepository = new MockWalletRepository();
          const testUseCase = new ProcessBetLostUseCase(testRepository);

          // Arrange: Create wallet with initial balance
          const playerIdResult = PlayerId.fromString(playerIdStr);
          if (!playerIdResult.ok) return; // Skip invalid player IDs

          const playerId = playerIdResult.value;
          const walletId = WalletId.create();
          const balanceResult = Money.fromCentavos(initialBalanceCentavos);
          if (!balanceResult.ok) return; // Skip invalid balances

          const balance = balanceResult.value;
          const now = new Date();
          const wallet = new Wallet(walletId, playerId, balance, now, now);
          testRepository.setWallet(wallet);

          // Create bet lost event DTO
          const eventDto = new BetLostEventDto(
            'event-123',
            playerId.toString(),
            betId,
            betAmount.toString(),
            new Date().toISOString()
          );

          // Act: Process the bet lost event
          const result = await testUseCase.execute(eventDto);

          // Assert: Operation succeeded
          expect(result.ok).toBe(true);

          // Assert: Balance remains unchanged
          const updatedWallet = await testRepository.findByPlayerId(playerId);
          expect(updatedWallet).not.toBeNull();
          expect(updatedWallet!.getBalance().toCentavos()).toBe(
            initialBalanceCentavos
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be idempotent - processing same event multiple times has same effect', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 1000000000n }), // Initial balance
        fc.string({ minLength: 10, maxLength: 50, unit: 'grapheme' }).filter(s => /^[a-zA-Z0-9]+$/.test(s)), // Player ID (alphanumeric)
        fc.string({ minLength: 5, maxLength: 50, unit: 'grapheme' }).filter(s => /^[a-zA-Z0-9]+$/.test(s)), // Bet ID
        fc.bigInt({ min: 1n, max: 100000n }), // Bet amount
        fc.integer({ min: 2, max: 5 }), // Number of times to process event
        async (
          initialBalanceCentavos,
          playerIdStr,
          betId,
          betAmount,
          numProcessings
        ) => {
          // Create fresh repository and use case for each iteration
          const testRepository = new MockWalletRepository();
          const testUseCase = new ProcessBetLostUseCase(testRepository);

          // Arrange: Create wallet with initial balance
          const playerIdResult = PlayerId.fromString(playerIdStr);
          if (!playerIdResult.ok) return; // Skip invalid player IDs

          const playerId = playerIdResult.value;
          const walletId = WalletId.create();
          const balanceResult = Money.fromCentavos(initialBalanceCentavos);
          if (!balanceResult.ok) return; // Skip invalid balances

          const balance = balanceResult.value;
          const now = new Date();
          const wallet = new Wallet(walletId, playerId, balance, now, now);
          testRepository.setWallet(wallet);

          // Create bet lost event DTO
          const eventDto = new BetLostEventDto(
            'event-123',
            playerId.toString(),
            betId,
            betAmount.toString(),
            new Date().toISOString()
          );

          // Act: Process the same event multiple times
          for (let i = 0; i < numProcessings; i++) {
            const result = await testUseCase.execute(eventDto);
            expect(result.ok).toBe(true);
          }

          // Assert: Balance remains unchanged after all processings
          const finalWallet = await testRepository.findByPlayerId(playerId);
          expect(finalWallet).not.toBeNull();
          expect(finalWallet!.getBalance().toCentavos()).toBe(
            initialBalanceCentavos
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
