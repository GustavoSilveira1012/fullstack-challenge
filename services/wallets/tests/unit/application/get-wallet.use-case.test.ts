/**
 * Unit Tests for GetWalletUseCase
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { GetWalletUseCase } from '../../../src/application/get-wallet.use-case';
import type { IWalletRepository } from '../../../src/domain/wallet-repository';
import { Wallet } from '../../../src/domain/wallet';
import { WalletId } from '../../../src/domain/wallet-id';
import { PlayerId } from '../../../src/domain/player-id';
import { Money } from '../../../src/domain/money';
import { WalletNotFoundError } from '../../../src/application/errors';

// Mock repository implementation
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

describe('GetWalletUseCase', () => {
  let repository: MockWalletRepository;
  let useCase: GetWalletUseCase;

  beforeEach(() => {
    repository = new MockWalletRepository();
    useCase = new GetWalletUseCase(repository);
  });

  it('should retrieve wallet successfully', async () => {
    // Arrange
    const playerIdResult = PlayerId.fromString('player-123');
    expect(playerIdResult.ok).toBe(true);
    const playerId = playerIdResult.value;

    const walletId = WalletId.create();
    const balanceResult = Money.fromCentavos(50000n);
    expect(balanceResult.ok).toBe(true);
    const balance = balanceResult.value;

    const createdAt = new Date('2024-01-15T10:00:00Z');
    const updatedAt = new Date('2024-01-15T10:30:00Z');
    const wallet = new Wallet(walletId, playerId, balance, createdAt, updatedAt);

    repository.setWallet(wallet);

    // Act
    const result = await useCase.execute(playerId);

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(walletId.toString());
      expect(result.value.playerId).toBe('player-123');
      expect(result.value.balance).toBe('50000');
      expect(result.value.createdAt).toBe(createdAt.toISOString());
      expect(result.value.updatedAt).toBe(updatedAt.toISOString());
    }
  });

  it('should return error when wallet does not exist', async () => {
    // Arrange
    const playerIdResult = PlayerId.fromString('player-999');
    expect(playerIdResult.ok).toBe(true);
    const playerId = playerIdResult.value;

    // Act
    const result = await useCase.execute(playerId);

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(WalletNotFoundError);
      expect(result.error.message).toContain('player-999');
    }
  });

  it('should retrieve wallet with zero balance', async () => {
    // Arrange
    const playerIdResult = PlayerId.fromString('player-456');
    expect(playerIdResult.ok).toBe(true);
    const playerId = playerIdResult.value;

    const walletId = WalletId.create();
    const balance = Money.zero();
    const now = new Date();
    const wallet = new Wallet(walletId, playerId, balance, now, now);

    repository.setWallet(wallet);

    // Act
    const result = await useCase.execute(playerId);

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.balance).toBe('0');
    }
  });

  it('should retrieve wallet with large balance', async () => {
    // Arrange
    const playerIdResult = PlayerId.fromString('player-789');
    expect(playerIdResult.ok).toBe(true);
    const playerId = playerIdResult.value;

    const walletId = WalletId.create();
    const balanceResult = Money.fromCentavos(999999999999n);
    expect(balanceResult.ok).toBe(true);
    const balance = balanceResult.value;

    const now = new Date();
    const wallet = new Wallet(walletId, playerId, balance, now, now);

    repository.setWallet(wallet);

    // Act
    const result = await useCase.execute(playerId);

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.balance).toBe('999999999999');
    }
  });
});
