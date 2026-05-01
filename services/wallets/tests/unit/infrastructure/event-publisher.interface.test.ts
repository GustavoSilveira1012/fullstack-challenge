/**
 * Unit tests for IEventPublisher interface
 * 
 * These tests verify that the IEventPublisher interface can be properly implemented
 * and that implementations conform to the expected contract.
 */

import { describe, it, expect } from 'bun:test';
import { IEventPublisher } from '../../../src/infrastructure/messaging/event-publisher.interface';
import { DomainEvent, WalletCreated } from '../../../src/domain/domain-event';
import { WalletId } from '../../../src/domain/wallet-id';
import { PlayerId } from '../../../src/domain/player-id';

describe('IEventPublisher Interface', () => {
  it('should be implementable by a concrete class', () => {
    // Arrange: Create a mock implementation
    class MockEventPublisher implements IEventPublisher {
      private publishedEvents: DomainEvent[] = [];

      async publish(event: DomainEvent): Promise<void> {
        this.publishedEvents.push(event);
      }

      getPublishedEvents(): DomainEvent[] {
        return this.publishedEvents;
      }
    }

    const publisher = new MockEventPublisher();

    // Assert: Verify the mock implements the interface
    expect(publisher).toBeDefined();
    expect(typeof publisher.publish).toBe('function');
  });

  it('should accept domain events in publish method', async () => {
    // Arrange: Create a mock implementation
    class MockEventPublisher implements IEventPublisher {
      private publishedEvents: DomainEvent[] = [];

      async publish(event: DomainEvent): Promise<void> {
        this.publishedEvents.push(event);
      }

      getPublishedEvents(): DomainEvent[] {
        return this.publishedEvents;
      }
    }

    const publisher = new MockEventPublisher();
    const walletId = WalletId.create();
    const playerIdResult = PlayerId.fromString('player-123');
    if (!playerIdResult.ok) {
      throw playerIdResult.error;
    }
    const playerId = playerIdResult.value;
    const event = new WalletCreated(walletId, playerId);

    // Act: Publish the event
    await publisher.publish(event);

    // Assert: Verify the event was published
    const publishedEvents = publisher.getPublishedEvents();
    expect(publishedEvents).toHaveLength(1);
    expect(publishedEvents[0]).toBe(event);
  });

  it('should return a Promise from publish method', () => {
    // Arrange: Create a mock implementation
    class MockEventPublisher implements IEventPublisher {
      async publish(event: DomainEvent): Promise<void> {
        // No-op
      }
    }

    const publisher = new MockEventPublisher();
    const walletId = WalletId.create();
    const playerIdResult = PlayerId.fromString('player-123');
    if (!playerIdResult.ok) {
      throw playerIdResult.error;
    }
    const playerId = playerIdResult.value;
    const event = new WalletCreated(walletId, playerId);

    // Act: Call publish
    const result = publisher.publish(event);

    // Assert: Verify it returns a Promise
    expect(result).toBeInstanceOf(Promise);
  });
});
