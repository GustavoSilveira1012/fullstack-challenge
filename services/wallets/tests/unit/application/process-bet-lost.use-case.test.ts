/**
 * Unit Tests for ProcessBetLostUseCase
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { ProcessBetLostUseCase } from '../../../src/application/process-bet-lost.use-case';
import type { IWalletRepository } from '../../../src/domain/wallet-repository';
import { Wallet } from '../../../src/domain/wallet';
import { WalletId } from '../../../src/domain/wallet-id';
import { PlayerId } from '../../../src/domain/player-id';
import { Money } from '../../../src/domain/money';
import { BetLostEventDto } from '../../../src/application/dtos';
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

describe('ProcessBetLostUseCase', () => {
  let repository: MockWalletRepository;
  let useCase: ProcessBetLostUseCase;

  beforeEach(() => {
    repository = new MockWalletRepository();
    useCase = new ProcessBetLostUseCase(repository);
  });

  it('should process bet lost event without modifying balance', async () => {
    // Arrange
    const playerIdResult = PlayerId.fromString('player-123');
    expect(playerIdResult.ok).toBe(true);
    const playerId = playerIdResult.value;

    const walletId = WalletId.create();
    const balanceResult = Money.fromCentavos(50000n);
    expect(balanceResult.ok).toBe(true);
    const balance = balanceResult.value;

    const now = new Date();
    const wallet = new Wallet(walletId, playerId, balance, now, now);
    repository.setWallet(wallet);

    const eventDto = new BetLostEventDto(
      'event-123',
      'player-123',
      'bet-456',
      '10000',
      new Date().toISOString()
    );

    // Act
    const result = await useCase.execute(eventDto);

    // Assert
    expect(result.ok).toBe(true);

    // Verify balance was NOT modified
    const updatedWallet = await repository.findByPlayerId(playerId);
    expect(updatedWallet).not.toBeNull();
    expect(updatedWallet!.getBalance().toCentavos()).toBe(50000n);
  });

  it('should return error when wallet does not exist', async () => {
    // Arrange
    const eventDto = new BetLostEventDto(
      'event-123',
      'player-999',
      'bet-456',
      '10000',
      new Date().toISOString()
    );

    // Act
    const result = await useCase.execute(eventDto);

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(WalletNotFoundError);
    }
  });

  it('should process bet lost event with zero balance wallet', async () => {
    // Arrange
    const playerIdResult = PlayerId.fromString('player-123');
    expect(playerIdResult.ok).toBe(true);
    const playerId = playerIdResult.value;

    const walletId = WalletId.create();
    const balance = Money.zero();

    const now = new Date();
    const wallet = new Wallet(walletId, playerId, balance, now, now);
    repository.setWallet(wallet);

    const eventDto = new BetLostEventDto(
      'event-123',
      'player-123',
      'bet-456',
      '10000',
      new Date().toISOString()
    );

    // Act
    const result = await useCase.execute(eventDto);

    // Assert
    expect(result.ok).toBe(true);

    // Verify balance remains zero
    const updatedWallet = await repository.findByPlayerId(playerId);
    expect(updatedWallet).not.toBeNull();
    expect(updatedWallet!.getBalance().toCentavos()).toBe(0n);
  });

  it('should process bet lost event with large balance wallet', async () => {
    // Arrange
    const playerIdResult = PlayerId.fromString('player-123');
    expect(playerIdResult.ok).toBe(true);
    const playerId = playerIdResult.value;

    const walletId = WalletId.create();
    const balanceResult = Money.fromCentavos(999999999n);
    expect(balanceResult.ok).toBe(true);
    const balance = balanceResult.value;

    const now = new Date();
    const wallet = new Wallet(walletId, playerId, balance, now, now);
    repository.setWallet(wallet);

    const eventDto = new BetLostEventDto(
      'event-123',
      'player-123',
      'bet-456',
      '10000',
      new Date().toISOString()
    );

    // Act
    const result = await useCase.execute(eventDto);

    // Assert
    expect(result.ok).toBe(true);

    // Verify balance remains unchanged
    const updatedWallet = await repository.findByPlayerId(playerId);
    expect(updatedWallet).not.toBeNull();
    expect(updatedWallet!.getBalance().toCentavos()).toBe(999999999n);
  });
});
