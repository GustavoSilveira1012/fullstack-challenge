# Prisma Database Module

This module provides the Prisma Client integration for the Wallet Service with proper lifecycle management.

## Components

### PrismaService

The `PrismaService` extends `PrismaClient` and implements NestJS lifecycle hooks:

- **onModuleInit**: Connects to the database when the module initializes
- **onModuleDestroy**: Disconnects from the database when the module is destroyed
- **enableShutdownHooks**: Enables graceful shutdown on process termination

### PrismaModule

The `PrismaModule` is a global NestJS module that provides the `PrismaService` for dependency injection throughout the application.

## Configuration

### Connection Pool Settings

Connection pool and query timeout settings are configured via the `DATABASE_URL` environment variable using query parameters:

```
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=5&connect_timeout=5
```

**Parameters:**
- `connection_limit`: Maximum number of connections in the pool (default: 10)
- `pool_timeout`: Maximum time (in seconds) to wait for a connection from the pool (default: 5)
- `connect_timeout`: Maximum time (in seconds) to wait for a new connection (default: 5)

### Logging

The service automatically configures logging based on the environment:

- **Development**: Logs queries, info, warnings, and errors
- **Production**: Logs only warnings and errors

## Usage

### Importing the Module

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from './infrastructure/database/prisma.module';

@Module({
  imports: [PrismaModule],
  // ...
})
export class AppModule {}
```

### Injecting the Service

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './infrastructure/database/prisma.service';

@Injectable()
export class MyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.wallet.findMany();
  }
}
```

## Requirements

This module satisfies the following requirements:

- **Requirement 11.1**: Database connection management
- **Requirement 11.3**: Connection pool and query timeout configuration
