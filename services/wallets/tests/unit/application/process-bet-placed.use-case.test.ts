/**
 * Unit Tests for ProcessBetPlacedUseCase
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { ProcessBetPlacedUseCase } from '../../../src/application/process-bet-placed.use-case';
import type { IWalletRepository } from '../../../src/domain/wallet-repository';
import type { IEventPublisher } from '../../../src/infrastructure/messaging/event-publisher.interface';
import { Wallet } from '../../../src/domain/wallet';
import { WalletId } from '../../../src/domain/wallet-id';
import { PlayerId } from '../../../src/domain/player-id';
import { Money } from '../../../src/domain/money';
import { DomainEvent } from '../../../src/domain/domain-event';
import { BetPlacedEventDto } from '../../../src/application/dtos';
import { WalletNotFoundError } from '../../../src/application/errors';
import { InsufficientBalanceError } from '../../../src/domain/wallet';

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

describe('ProcessBetPlacedUseCase', () => {
  let repository: MockWalletRepository;
  let eventPublisher: MockEventPublisher;
  let useCase: ProcessBetPlacedUseCase;

  beforeEach(() => {
    repository = new MockWalletRepository();
    eventPublisher = new MockEventPublisher();
    useCase = new ProcessBetPlacedUseCase(repository, eventPublisher);
  });

  it('should debit wallet with sufficient balance', async () => {
    // Arrange
    const playerIdResult = PlayerId.fromString('player-123');
    expect(playerIdResult.ok).toBe(true);
    const playerId = playerIdResult.value;

    const walletId = WalletId.create();
    const balanceResult = Money.fromCentavos(100000n);
    expect(balanceResult.ok).toBe(true);
    const balance = balanceResult.value;

    const now = new Date();
    const wallet = new Wallet(walletId, playerId, balance, now, now);
    repository.setWallet(wallet);

    const eventDto = new BetPlacedEventDto(
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

    // Verify balance was debited
    const updatedWallet = repository.getSavedWallet('player-123');
    expect(updatedWallet).toBeDefined();
    expect(updatedWallet!.getBalance().toCentavos()).toBe(90000n);

    // Verify BalanceDebited event was published
    expect(eventPublisher.publishedEvents.length).toBe(1);
    expect(eventPublisher.publishedEvents[0]).toHaveProperty('amount');
    expect(eventPublisher.publishedEvents[0]).toHaveProperty('newBalance');
  });

  it('should return error with insufficient balance', async () => {
    // Arrange
    const playerIdResult = PlayerId.fromString('player-123');
    expect(playerIdResult.ok).toBe(true);
    const playerId = playerIdResult.value;

    const walletId = WalletId.create();
    const balanceResult = Money.fromCentavos(5000n);
    expect(balanceResult.ok).toBe(true);
    const balance = balanceResult.value;

    const now = new Date();
    const wallet = new Wallet(walletId, playerId, balance, now, now);
    repository.setWallet(wallet);

    const eventDto = new BetPlacedEventDto(
      'event-123',
      'player-123',
      'bet-456',
      '10000',
      new Date().toISOString()
    );

    // Act
    const result = await useCase.execute(eventDto);

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(InsufficientBalanceError);
    }

    // Verify balance was NOT changed
    const updatedWallet = repository.getSavedWallet('player-123');
    expect(updatedWallet).toBeDefined();
    expect(updatedWallet!.getBalance().toCentavos()).toBe(5000n);

    // Verify InsufficientBalanceError event was published
    expect(eventPublisher.publishedEvents.length).toBe(1);
    expect(eventPublisher.publishedEvents[0]).toHaveProperty('requestedAmount');
    expect(eventPublisher.publishedEvents[0]).toHaveProperty('currentBalance');
  });

  it('should return error when wallet does not exist', async () => {
    // Arrange
    const eventDto = new BetPlacedEventDto(
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

    // Verify no events were published
    expect(eventPublisher.publishedEvents.length).toBe(0);
  });

  it('should handle exact balance debit', async () => {
    // Arrange
    const playerIdResult = PlayerId.fromString('player-123');
    expect(playerIdResult.ok).toBe(true);
    const playerId = playerIdResult.value;

    const walletId = WalletId.create();
    const balanceResult = Money.fromCentavos(10000n);
    expect(balanceResult.ok).toBe(true);
    const balance = balanceResult.value;

    const now = new Date();
    const wallet = new Wallet(walletId, playerId, balance, now, now);
    repository.setWallet(wallet);

    const eventDto = new BetPlacedEventDto(
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

    // Verify balance is now zero
    const updatedWallet = repository.getSavedWallet('player-123');
    expect(updatedWallet).toBeDefined();
    expect(updatedWallet!.getBalance().toCentavos()).toBe(0n);

    // Verify BalanceDebited event was published
    expect(eventPublisher.publishedEvents.length).toBe(1);
  });
});
