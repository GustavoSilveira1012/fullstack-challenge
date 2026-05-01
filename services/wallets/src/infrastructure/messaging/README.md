# Messaging Infrastructure

This directory contains messaging-related infrastructure components for the Wallet Service.

## Components

### IEventPublisher Interface

The `IEventPublisher` interface defines the contract for publishing domain events to external systems (e.g., RabbitMQ message broker).

**Location**: `event-publisher.interface.ts`

**Purpose**: 
- Provides an abstraction for event publishing
- Allows the application layer to publish domain events without knowing the underlying messaging implementation
- Will be implemented by `RabbitMQPublisher` to send events to RabbitMQ

**Method**:
```typescript
publish(event: DomainEvent): Promise<void>
```

**Usage Example**:
```typescript
import { IEventPublisher } from './infrastructure/messaging';
import { WalletCreated } from './domain/domain-event';

class CreateWalletUseCase {
  constructor(private readonly eventPublisher: IEventPublisher) {}

  async execute(playerId: PlayerId): Promise<WalletResponseDto> {
    // ... create wallet logic ...
    
    // Publish domain event
    const event = new WalletCreated(wallet.getId(), wallet.getPlayerId());
    await this.eventPublisher.publish(event);
    
    return walletDto;
  }
}
```

## Implementation Notes

- The interface is part of the infrastructure layer, not the domain layer
- Implementations should handle:
  - Event serialization to JSON
  - Routing to appropriate exchanges and queues
  - Connection management and error handling
  - Retry logic for transient failures

## Future Implementations

- `RabbitMQPublisher` - Publishes events to RabbitMQ (Task 10.2)
- `InMemoryEventPublisher` - For testing purposes
- `LoggingEventPublisher` - For development/debugging

## Related Requirements

- **Requirement 8.1**: Message Broker Integration - The Wallet Service SHALL connect to the Message Broker
