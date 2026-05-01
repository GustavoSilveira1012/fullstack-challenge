/**
 * Unit Tests for CreateWalletUseCase
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { CreateWalletUseCase } from '../../../src/application/create-wallet.use-case';
import type { IWalletRepository } from '../../../src/domain/wallet-repository';
import type { IEventPublisher } from '../../../src/infrastructure/messaging/event-publisher.interface';
import { Wallet } from '../../../src/domain/wallet';
import { WalletId } from '../../../src/domain/wallet-id';
import { PlayerId } from '../../../src/domain/player-id';
import { Money } from '../../../src/domain/money';
import { DomainEvent } from '../../../src/domain/domain-event';
import { WalletAlreadyExistsError } from '../../../src/application/errors';

// Mock repository implementation
class MockWalletRepository implements IWalletRepository {
  private wallets: Map<string, Wallet> = new Map();
  private existsMap: Map<string, boolean> = new Map();

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
    return this.existsMap.get(playerId.toString()) || false;
  }

  // Helper methods for testing
  setExists(playerId: string, exists: boolean): void {
    this.existsMap.set(playerId, exists);
  }

  getSavedWallet(playerId: string): Wallet | undefined {
    return this.wallets.get(playerId);
  }
}

// Mock event publisher implementation
class MockEventPublisher implements IEventPublisher {
  public publishedEvents: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.publishedEvents.push(event);
  }
}

describe('CreateWalletUseCase', () => {
  let repository: MockWalletRepository;
  let eventPublisher: MockEventPublisher;
  let useCase: CreateWalletUseCase;

  beforeEach(() => {
    repository = new MockWalletRepository();
    eventPublisher = new MockEventPublisher();
    useCase = new CreateWalletUseCase(repository, eventPublisher);
  });

  it('should create wallet with zero balance', async () => {
    // Arrange
    const playerIdResult = PlayerId.fromString('player-123');
    expect(playerIdResult.ok).toBe(true);
    const playerId = playerIdResult.value;

    repository.setExists('player-123', false);

    // Act
    const result = await useCase.execute(playerId);

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.playerId).toBe('player-123');
      expect(result.value.balance).toBe('0');
      expect(result.value.id).toBeDefined();
      expect(result.value.createdAt).toBeDefined();
      expect(result.value.updatedAt).toBeDefined();
    }

    // Verify wallet was saved
    const savedWallet = repository.getSavedWallet('player-123');
    expect(savedWallet).toBeDefined();
    expect(savedWallet!.getBalance().toCentavos()).toBe(0n);

    // Verify event was published
    expect(eventPublisher.publishedEvents.length).toBe(1);
    expect(eventPublisher.publishedEvents[0]).toHaveProperty('walletId');
    expect(eventPublisher.publishedEvents[0]).toHaveProperty('playerId');
  });

  it('should return error when wallet already exists', async () => {
    // Arrange
    const playerIdResult = PlayerId.fromString('player-123');
    expect(playerIdResult.ok).toBe(true);
    const playerId = playerIdResult.value;

    repository.setExists('player-123', true);

    // Act
    const result = await useCase.execute(playerId);

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(WalletAlreadyExistsError);
      expect(result.error.message).toContain('player-123');
    }

    // Verify no wallet was saved
    const savedWallet = repository.getSavedWallet('player-123');
    expect(savedWallet).toBeUndefined();

    // Verify no event was published
    expect(eventPublisher.publishedEvents.length).toBe(0);
  });

  it('should create wallet with valid timestamps', async () => {
    // Arrange
    const playerIdResult = PlayerId.fromString('player-456');
    expect(playerIdResult.ok).toBe(true);
    const playerId = playerIdResult.value;

    repository.setExists('player-456', false);

    const beforeCreate = new Date();

    // Act
    const result = await useCase.execute(playerId);

    const afterCreate = new Date();

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      const createdAt = new Date(result.value.createdAt);
      const updatedAt = new Date(result.value.updatedAt);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(updatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    }
  });
});
