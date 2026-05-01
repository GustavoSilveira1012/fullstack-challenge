/**
 * Unit tests for IWalletRepository interface
 * 
 * These tests verify that the interface is properly defined and can be implemented.
 * The actual implementation tests will be in the infrastructure layer tests.
 */

import { describe, it, expect } from 'bun:test';
import type { IWalletRepository } from '../../../src/domain/wallet-repository.interface';
import { Wallet } from '../../../src/domain/wallet';
import { WalletId } from '../../../src/domain/wallet-id';
import { PlayerId } from '../../../src/domain/player-id';
import { Money } from '../../../src/domain/money';

describe('IWalletRepository Interface', () => {
  it('should define save method', () => {
    const mockRepo: IWalletRepository = {
      save: async (wallet: Wallet): Promise<void> => {},
      findById: async (id: WalletId): Promise<Wallet | null> => null,
      findByPlayerId: async (playerId: PlayerId): Promise<Wallet | null> => null,
      findByPlayerIdForUpdate: async (playerId: PlayerId): Promise<Wallet | null> => null,
      existsByPlayerId: async (playerId: PlayerId): Promise<boolean> => false,
    };

    expect(mockRepo.save).toBeDefined();
    expect(typeof mockRepo.save).toBe('function');
  });

  it('should define findById method', () => {
    const mockRepo: IWalletRepository = {
      save: async (wallet: Wallet): Promise<void> => {},
      findById: async (id: WalletId): Promise<Wallet | null> => null,
      findByPlayerId: async (playerId: PlayerId): Promise<Wallet | null> => null,
      findByPlayerIdForUpdate: async (playerId: PlayerId): Promise<Wallet | null> => null,
      existsByPlayerId: async (playerId: PlayerId): Promise<boolean> => false,
    };

    expect(mockRepo.findById).toBeDefined();
    expect(typeof mockRepo.findById).toBe('function');
  });

  it('should define findByPlayerId method', () => {
    const mockRepo: IWalletRepository = {
      save: async (wallet: Wallet): Promise<void> => {},
      findById: async (id: WalletId): Promise<Wallet | null> => null,
      findByPlayerId: async (playerId: PlayerId): Promise<Wallet | null> => null,
      findByPlayerIdForUpdate: async (playerId: PlayerId): Promise<Wallet | null> => null,
      existsByPlayerId: async (playerId: PlayerId): Promise<boolean> => false,
    };

    expect(mockRepo.findByPlayerId).toBeDefined();
    expect(typeof mockRepo.findByPlayerId).toBe('function');
  });

  it('should define findByPlayerIdForUpdate method', () => {
    const mockRepo: IWalletRepository = {
      save: async (wallet: Wallet): Promise<void> => {},
      findById: async (id: WalletId): Promise<Wallet | null> => null,
      findByPlayerId: async (playerId: PlayerId): Promise<Wallet | null> => null,
      findByPlayerIdForUpdate: async (playerId: PlayerId): Promise<Wallet | null> => null,
      existsByPlayerId: async (playerId: PlayerId): Promise<boolean> => false,
    };

    expect(mockRepo.findByPlayerIdForUpdate).toBeDefined();
    expect(typeof mockRepo.findByPlayerIdForUpdate).toBe('function');
  });

  it('should define existsByPlayerId method', () => {
    const mockRepo: IWalletRepository = {
      save: async (wallet: Wallet): Promise<void> => {},
      findById: async (id: WalletId): Promise<Wallet | null> => null,
      findByPlayerId: async (playerId: PlayerId): Promise<Wallet | null> => null,
      findByPlayerIdForUpdate: async (playerId: PlayerId): Promise<Wallet | null> => null,
      existsByPlayerId: async (playerId: PlayerId): Promise<boolean> => false,
    };

    expect(mockRepo.existsByPlayerId).toBeDefined();
    expect(typeof mockRepo.existsByPlayerId).toBe('function');
  });

  it('should allow implementation with all required methods', async () => {
    // Create a mock implementation
    const mockRepo: IWalletRepository = {
      save: async (wallet: Wallet): Promise<void> => {
        // Mock implementation
      },
      findById: async (id: WalletId): Promise<Wallet | null> => {
        return null;
      },
      findByPlayerId: async (playerId: PlayerId): Promise<Wallet | null> => {
        return null;
      },
      findByPlayerIdForUpdate: async (playerId: PlayerId): Promise<Wallet | null> => {
        return null;
      },
      existsByPlayerId: async (playerId: PlayerId): Promise<boolean> => {
        return false;
      },
    };

    // Verify all methods can be called
    const walletId = WalletId.create();
    const playerIdResult = PlayerId.fromString('test-player-123');
    expect(playerIdResult.ok).toBe(true);
    
    if (playerIdResult.ok) {
      const playerId = playerIdResult.value;
      const moneyResult = Money.fromCentavos(0n);
      expect(moneyResult.ok).toBe(true);
      
      if (moneyResult.ok) {
        const wallet = new Wallet(
          walletId,
          playerId,
          moneyResult.value,
          new Date(),
          new Date()
        );

        await mockRepo.save(wallet);
        const foundById = await mockRepo.findById(walletId);
        const foundByPlayerId = await mockRepo.findByPlayerId(playerId);
        const foundForUpdate = await mockRepo.findByPlayerIdForUpdate(playerId);
        const exists = await mockRepo.existsByPlayerId(playerId);

        expect(foundById).toBeNull();
        expect(foundByPlayerId).toBeNull();
        expect(foundForUpdate).toBeNull();
        expect(exists).toBe(false);
      }
    }
  });
});
