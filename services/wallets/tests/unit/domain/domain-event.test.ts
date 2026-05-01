import { describe, it, expect } from 'bun:test';
import {
  DomainEvent,
  WalletCreated,
  BalanceCredited,
  BalanceDebited,
  InsufficientBalanceErrorEvent,
} from '../../../src/domain/domain-event';
import { WalletId } from '../../../src/domain/wallet-id';
import { PlayerId } from '../../../src/domain/player-id';
import { Money } from '../../../src/domain/money';

describe('Domain Events', () => {
  describe('WalletCreated', () => {
    it('should create event with required fields', () => {
      // Arrange
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-123');
      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      // Act
      const event = new WalletCreated(walletId, playerIdResult.value);

      // Assert
      expect(event.eventId).toBeDefined();
      expect(typeof event.eventId).toBe('string');
      expect(event.eventId.length).toBeGreaterThan(0);
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.walletId).toBe(walletId);
      expect(event.playerId).toBe(playerIdResult.value);
    });

    it('should generate unique event IDs', () => {
      // Arrange
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-123');
      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      // Act
      const event1 = new WalletCreated(walletId, playerIdResult.value);
      const event2 = new WalletCreated(walletId, playerIdResult.value);

      // Assert
      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should have occurredAt timestamp close to creation time', () => {
      // Arrange
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-123');
      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      const before = new Date();

      // Act
      const event = new WalletCreated(walletId, playerIdResult.value);

      const after = new Date();

      // Assert
      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should have readonly properties enforced by TypeScript', () => {
      // Arrange
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-123');
      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      // Act
      const event = new WalletCreated(walletId, playerIdResult.value);

      // Assert - TypeScript enforces immutability at compile time
      // The following would cause TypeScript compilation errors:
      // event.eventId = 'new-id';
      // event.occurredAt = new Date();
      // event.walletId = WalletId.create();
      // event.playerId = PlayerId.fromString('other-player');

      // Verify properties are accessible
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.walletId).toBe(walletId);
      expect(event.playerId).toBe(playerIdResult.value);
    });

    it('should serialize to JSON correctly', () => {
      // Arrange
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-123');
      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      const event = new WalletCreated(walletId, playerIdResult.value);

      // Act
      const json = event.toJSON();

      // Assert
      expect(json.eventId).toBe(event.eventId);
      expect(json.occurredAt).toBe(event.occurredAt.toISOString());
      expect(json.walletId).toBe(walletId.toString());
      expect(json.playerId).toBe('player-123');
    });
  });

  describe('BalanceCredited', () => {
    it('should create event with required fields', () => {
      // Arrange
      const walletId = WalletId.create();
      const amountResult = Money.fromCentavos(10000n);
      const newBalanceResult = Money.fromCentavos(15000n);
      expect(amountResult.ok).toBe(true);
      expect(newBalanceResult.ok).toBe(true);
      if (!amountResult.ok || !newBalanceResult.ok) return;

      // Act
      const event = new BalanceCredited(
        walletId,
        amountResult.value,
        newBalanceResult.value
      );

      // Assert
      expect(event.eventId).toBeDefined();
      expect(typeof event.eventId).toBe('string');
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.walletId).toBe(walletId);
      expect(event.amount).toBe(amountResult.value);
      expect(event.newBalance).toBe(newBalanceResult.value);
    });

    it('should generate unique event IDs', () => {
      // Arrange
      const walletId = WalletId.create();
      const amountResult = Money.fromCentavos(10000n);
      const newBalanceResult = Money.fromCentavos(15000n);
      expect(amountResult.ok).toBe(true);
      expect(newBalanceResult.ok).toBe(true);
      if (!amountResult.ok || !newBalanceResult.ok) return;

      // Act
      const event1 = new BalanceCredited(
        walletId,
        amountResult.value,
        newBalanceResult.value
      );
      const event2 = new BalanceCredited(
        walletId,
        amountResult.value,
        newBalanceResult.value
      );

      // Assert
      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should have readonly properties enforced by TypeScript', () => {
      // Arrange
      const walletId = WalletId.create();
      const amountResult = Money.fromCentavos(10000n);
      const newBalanceResult = Money.fromCentavos(15000n);
      expect(amountResult.ok).toBe(true);
      expect(newBalanceResult.ok).toBe(true);
      if (!amountResult.ok || !newBalanceResult.ok) return;

      // Act
      const event = new BalanceCredited(
        walletId,
        amountResult.value,
        newBalanceResult.value
      );

      // Assert - TypeScript enforces immutability at compile time
      // The following would cause TypeScript compilation errors:
      // event.eventId = 'new-id';
      // event.amount = Money.fromCentavos(5000n);
      // event.newBalance = Money.fromCentavos(20000n);

      // Verify properties are accessible
      expect(event.eventId).toBeDefined();
      expect(event.amount).toBe(amountResult.value);
      expect(event.newBalance).toBe(newBalanceResult.value);
    });

    it('should serialize to JSON correctly', () => {
      // Arrange
      const walletId = WalletId.create();
      const amountResult = Money.fromCentavos(10000n);
      const newBalanceResult = Money.fromCentavos(15000n);
      expect(amountResult.ok).toBe(true);
      expect(newBalanceResult.ok).toBe(true);
      if (!amountResult.ok || !newBalanceResult.ok) return;

      const event = new BalanceCredited(
        walletId,
        amountResult.value,
        newBalanceResult.value
      );

      // Act
      const json = event.toJSON();

      // Assert
      expect(json.eventId).toBe(event.eventId);
      expect(json.occurredAt).toBe(event.occurredAt.toISOString());
      expect(json.walletId).toBe(walletId.toString());
      expect(json.amount).toBe('10000');
      expect(json.newBalance).toBe('15000');
    });
  });

  describe('BalanceDebited', () => {
    it('should create event with required fields', () => {
      // Arrange
      const walletId = WalletId.create();
      const amountResult = Money.fromCentavos(5000n);
      const newBalanceResult = Money.fromCentavos(10000n);
      expect(amountResult.ok).toBe(true);
      expect(newBalanceResult.ok).toBe(true);
      if (!amountResult.ok || !newBalanceResult.ok) return;

      // Act
      const event = new BalanceDebited(
        walletId,
        amountResult.value,
        newBalanceResult.value
      );

      // Assert
      expect(event.eventId).toBeDefined();
      expect(typeof event.eventId).toBe('string');
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.walletId).toBe(walletId);
      expect(event.amount).toBe(amountResult.value);
      expect(event.newBalance).toBe(newBalanceResult.value);
    });

    it('should generate unique event IDs', () => {
      // Arrange
      const walletId = WalletId.create();
      const amountResult = Money.fromCentavos(5000n);
      const newBalanceResult = Money.fromCentavos(10000n);
      expect(amountResult.ok).toBe(true);
      expect(newBalanceResult.ok).toBe(true);
      if (!amountResult.ok || !newBalanceResult.ok) return;

      // Act
      const event1 = new BalanceDebited(
        walletId,
        amountResult.value,
        newBalanceResult.value
      );
      const event2 = new BalanceDebited(
        walletId,
        amountResult.value,
        newBalanceResult.value
      );

      // Assert
      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should have readonly properties enforced by TypeScript', () => {
      // Arrange
      const walletId = WalletId.create();
      const amountResult = Money.fromCentavos(5000n);
      const newBalanceResult = Money.fromCentavos(10000n);
      expect(amountResult.ok).toBe(true);
      expect(newBalanceResult.ok).toBe(true);
      if (!amountResult.ok || !newBalanceResult.ok) return;

      // Act
      const event = new BalanceDebited(
        walletId,
        amountResult.value,
        newBalanceResult.value
      );

      // Assert - TypeScript enforces immutability at compile time
      // The following would cause TypeScript compilation errors:
      // event.eventId = 'new-id';
      // event.amount = Money.fromCentavos(3000n);
      // event.newBalance = Money.fromCentavos(7000n);

      // Verify properties are accessible
      expect(event.eventId).toBeDefined();
      expect(event.amount).toBe(amountResult.value);
      expect(event.newBalance).toBe(newBalanceResult.value);
    });

    it('should serialize to JSON correctly', () => {
      // Arrange
      const walletId = WalletId.create();
      const amountResult = Money.fromCentavos(5000n);
      const newBalanceResult = Money.fromCentavos(10000n);
      expect(amountResult.ok).toBe(true);
      expect(newBalanceResult.ok).toBe(true);
      if (!amountResult.ok || !newBalanceResult.ok) return;

      const event = new BalanceDebited(
        walletId,
        amountResult.value,
        newBalanceResult.value
      );

      // Act
      const json = event.toJSON();

      // Assert
      expect(json.eventId).toBe(event.eventId);
      expect(json.occurredAt).toBe(event.occurredAt.toISOString());
      expect(json.walletId).toBe(walletId.toString());
      expect(json.amount).toBe('5000');
      expect(json.newBalance).toBe('10000');
    });
  });

  describe('InsufficientBalanceErrorEvent', () => {
    it('should create event with required fields', () => {
      // Arrange
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-123');
      const requestedAmountResult = Money.fromCentavos(10000n);
      const currentBalanceResult = Money.fromCentavos(5000n);
      expect(playerIdResult.ok).toBe(true);
      expect(requestedAmountResult.ok).toBe(true);
      expect(currentBalanceResult.ok).toBe(true);
      if (
        !playerIdResult.ok ||
        !requestedAmountResult.ok ||
        !currentBalanceResult.ok
      )
        return;

      // Act
      const event = new InsufficientBalanceErrorEvent(
        walletId,
        playerIdResult.value,
        requestedAmountResult.value,
        currentBalanceResult.value
      );

      // Assert
      expect(event.eventId).toBeDefined();
      expect(typeof event.eventId).toBe('string');
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.walletId).toBe(walletId);
      expect(event.playerId).toBe(playerIdResult.value);
      expect(event.requestedAmount).toBe(requestedAmountResult.value);
      expect(event.currentBalance).toBe(currentBalanceResult.value);
    });

    it('should generate unique event IDs', () => {
      // Arrange
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-123');
      const requestedAmountResult = Money.fromCentavos(10000n);
      const currentBalanceResult = Money.fromCentavos(5000n);
      expect(playerIdResult.ok).toBe(true);
      expect(requestedAmountResult.ok).toBe(true);
      expect(currentBalanceResult.ok).toBe(true);
      if (
        !playerIdResult.ok ||
        !requestedAmountResult.ok ||
        !currentBalanceResult.ok
      )
        return;

      // Act
      const event1 = new InsufficientBalanceErrorEvent(
        walletId,
        playerIdResult.value,
        requestedAmountResult.value,
        currentBalanceResult.value
      );
      const event2 = new InsufficientBalanceErrorEvent(
        walletId,
        playerIdResult.value,
        requestedAmountResult.value,
        currentBalanceResult.value
      );

      // Assert
      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should have readonly properties enforced by TypeScript', () => {
      // Arrange
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-123');
      const requestedAmountResult = Money.fromCentavos(10000n);
      const currentBalanceResult = Money.fromCentavos(5000n);
      expect(playerIdResult.ok).toBe(true);
      expect(requestedAmountResult.ok).toBe(true);
      expect(currentBalanceResult.ok).toBe(true);
      if (
        !playerIdResult.ok ||
        !requestedAmountResult.ok ||
        !currentBalanceResult.ok
      )
        return;

      // Act
      const event = new InsufficientBalanceErrorEvent(
        walletId,
        playerIdResult.value,
        requestedAmountResult.value,
        currentBalanceResult.value
      );

      // Assert - TypeScript enforces immutability at compile time
      // The following would cause TypeScript compilation errors:
      // event.eventId = 'new-id';
      // event.playerId = PlayerId.fromString('other-player');
      // event.requestedAmount = Money.fromCentavos(20000n);
      // event.currentBalance = Money.fromCentavos(15000n);

      // Verify properties are accessible
      expect(event.eventId).toBeDefined();
      expect(event.playerId).toBe(playerIdResult.value);
      expect(event.requestedAmount).toBe(requestedAmountResult.value);
      expect(event.currentBalance).toBe(currentBalanceResult.value);
    });

    it('should serialize to JSON correctly', () => {
      // Arrange
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-123');
      const requestedAmountResult = Money.fromCentavos(10000n);
      const currentBalanceResult = Money.fromCentavos(5000n);
      expect(playerIdResult.ok).toBe(true);
      expect(requestedAmountResult.ok).toBe(true);
      expect(currentBalanceResult.ok).toBe(true);
      if (
        !playerIdResult.ok ||
        !requestedAmountResult.ok ||
        !currentBalanceResult.ok
      )
        return;

      const event = new InsufficientBalanceErrorEvent(
        walletId,
        playerIdResult.value,
        requestedAmountResult.value,
        currentBalanceResult.value
      );

      // Act
      const json = event.toJSON();

      // Assert
      expect(json.eventId).toBe(event.eventId);
      expect(json.occurredAt).toBe(event.occurredAt.toISOString());
      expect(json.walletId).toBe(walletId.toString());
      expect(json.playerId).toBe('player-123');
      expect(json.requestedAmount).toBe('10000');
      expect(json.currentBalance).toBe('5000');
    });
  });

  describe('DomainEvent interface compliance', () => {
    it('WalletCreated should implement DomainEvent interface', () => {
      // Arrange
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-123');
      expect(playerIdResult.ok).toBe(true);
      if (!playerIdResult.ok) return;

      // Act
      const event: DomainEvent = new WalletCreated(walletId, playerIdResult.value);

      // Assert
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
    });

    it('BalanceCredited should implement DomainEvent interface', () => {
      // Arrange
      const walletId = WalletId.create();
      const amountResult = Money.fromCentavos(10000n);
      const newBalanceResult = Money.fromCentavos(15000n);
      expect(amountResult.ok).toBe(true);
      expect(newBalanceResult.ok).toBe(true);
      if (!amountResult.ok || !newBalanceResult.ok) return;

      // Act
      const event: DomainEvent = new BalanceCredited(
        walletId,
        amountResult.value,
        newBalanceResult.value
      );

      // Assert
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
    });

    it('BalanceDebited should implement DomainEvent interface', () => {
      // Arrange
      const walletId = WalletId.create();
      const amountResult = Money.fromCentavos(5000n);
      const newBalanceResult = Money.fromCentavos(10000n);
      expect(amountResult.ok).toBe(true);
      expect(newBalanceResult.ok).toBe(true);
      if (!amountResult.ok || !newBalanceResult.ok) return;

      // Act
      const event: DomainEvent = new BalanceDebited(
        walletId,
        amountResult.value,
        newBalanceResult.value
      );

      // Assert
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
    });

    it('InsufficientBalanceErrorEvent should implement DomainEvent interface', () => {
      // Arrange
      const walletId = WalletId.create();
      const playerIdResult = PlayerId.fromString('player-123');
      const requestedAmountResult = Money.fromCentavos(10000n);
      const currentBalanceResult = Money.fromCentavos(5000n);
      expect(playerIdResult.ok).toBe(true);
      expect(requestedAmountResult.ok).toBe(true);
      expect(currentBalanceResult.ok).toBe(true);
      if (
        !playerIdResult.ok ||
        !requestedAmountResult.ok ||
        !currentBalanceResult.ok
      )
        return;

      // Act
      const event: DomainEvent = new InsufficientBalanceErrorEvent(
        walletId,
        playerIdResult.value,
        requestedAmountResult.value,
        currentBalanceResult.value
      );

      // Assert
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
    });
  });
});
