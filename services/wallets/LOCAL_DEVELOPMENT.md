# Local Development Setup Guide

This guide explains how to run the Wallet Service locally for development and testing.

## Prerequisites

- **Bun** v1.3.13 or higher
- **Docker** and **Docker Compose** (for PostgreSQL and RabbitMQ)
- **Node.js** v18+ (optional, for compatibility)

## Quick Start

### 1. Start Infrastructure Services

From the project root (`fullstack-challenge/`), start PostgreSQL and RabbitMQ:

```bash
docker-compose up -d postgres rabbitmq
```

Verify services are running:

```bash
docker-compose ps
```

You should see:

- `postgres` - Running on port 5432
- `rabbitmq` - Running on ports 5672 (AMQP) and 15672 (Management UI)

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cd services/wallets
cp .env.example .env
```

**Important**: For local development, update the `.env` file to use `localhost` instead of Docker hostnames:

```env
# Database - Use localhost for local development
DATABASE_URL=postgresql://admin:admin@localhost:5432/wallets?connection_limit=10&pool_timeout=5&connect_timeout=5

# RabbitMQ - Use localhost for local development
RABBITMQ_URL=amqp://admin:admin@localhost:5672
```

### 3. Install Dependencies

```bash
bun install
```

### 4. Run Database Migrations

```bash
bun run prisma migrate deploy
```

This will create the `wallets` table with the correct schema.

### 5. Start the Service

```bash
bun run start
```

The service will start on port 3001 (or the port specified in `.env`).

You should see logs indicating:

- ✅ PostgreSQL connection established
- ✅ RabbitMQ publisher connected
- ✅ RabbitMQ consumer subscribed to queues
- ✅ Service listening on port 3001

## Verify Installation

### Check Health Endpoint

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{
  "status": "healthy",
  "service": "wallet-service",
  "timestamp": "2026-05-03T...",
  "checks": [
    { "name": "database", "healthy": true },
    { "name": "rabbitmq", "healthy": true }
  ]
}
```

### Run Manual Tests

Test the REST API:

```bash
bun run test-api.ts
```

Test RabbitMQ event processing:

```bash
bun run test-rabbitmq.ts
```

## Development Workflow

### Running Tests

```bash
# Run all tests
bun test

# Run unit tests only
bun test tests/unit

# Run E2E tests only
bun test tests/e2e

# Run property-based tests
bun test tests/unit/**/*.property.test.ts

# Run with coverage
bun test --coverage
```

### Database Management

```bash
# Create a new migration
bun run prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
bun run prisma migrate reset

# Open Prisma Studio (database GUI)
bun run prisma studio
```

### RabbitMQ Management

Access the RabbitMQ Management UI at: <http://localhost:15672>

- **Username**: `admin`
- **Password**: `admin`

You can view:

- Queues: `bet.placed`, `bet.cashout`, `bet.lost`
- Exchanges: `game.events`, `wallet.events`
- Message rates and statistics

### Debugging

Enable debug logging by setting in `.env`:

```env
LOG_LEVEL=debug
```

This will show:

- Detailed SQL queries (Prisma)
- RabbitMQ message processing
- Request/response details

## Common Issues

### Issue: Service fails to start with "ENOTFOUND rabbitmq"

**Cause**: The service is trying to connect to `rabbitmq` hostname (Docker) but running locally.

**Solution**: Update `.env` to use `localhost:5672` instead of `rabbitmq:5672`:

```env
RABBITMQ_URL=amqp://admin:admin@localhost:5672
```

### Issue: RabbitMQ authentication fails (403 ACCESS-REFUSED)

**Cause**: Incorrect credentials in `.env`.

**Solution**: Use the correct credentials from `docker-compose.yml`:

```env
RABBITMQ_URL=amqp://admin:admin@localhost:5672
```

### Issue: Database connection fails

**Cause**: PostgreSQL not running or incorrect credentials.

**Solution**:

1. Verify PostgreSQL is running: `docker-compose ps postgres`
2. Check credentials match `docker-compose.yml`:

   ```env
   DATABASE_URL=postgresql://admin:admin@localhost:5432/wallets
   ```

### Issue: Port 3001 already in use

**Solution**: Change the port in `.env`:

```env
PORT=3002
```

## Docker Deployment

To run the service in Docker (alongside other services):

1. Ensure `.env` uses Docker hostnames:

   ```env
   DATABASE_URL=postgresql://admin:admin@postgres:5432/wallets
   RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
   ```

2. Build and start all services:

   ```bash
   docker-compose up -d
   ```

3. View logs:

   ```bash
   docker-compose logs -f wallets
   ```

## Project Structure

```
services/wallets/
├── src/
│   ├── domain/           # Domain entities, value objects, interfaces
│   ├── application/      # Use cases, DTOs
│   ├── infrastructure/   # Database, messaging, config
│   └── presentation/     # Controllers, guards, filters
├── tests/
│   ├── unit/            # Unit tests
│   └── e2e/             # End-to-end tests
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── .env                 # Environment variables (local)
├── .env.example         # Example environment variables
└── package.json         # Dependencies and scripts
```

## Useful Commands

```bash
# Development
bun run start              # Start the service
bun run dev                # Start with hot reload (if configured)

# Testing
bun test                   # Run all tests
bun test:e2e              # Run E2E tests
bun test --coverage       # Run with coverage

# Database
bun run prisma migrate dev    # Create and apply migration
bun run prisma migrate deploy # Apply migrations (production)
bun run prisma studio         # Open database GUI
bun run prisma generate       # Regenerate Prisma client

# Linting & Formatting
bun run lint              # Run linter
bun run format            # Format code

# Manual Testing
bun run test-api.ts       # Test REST API endpoints
bun run test-rabbitmq.ts  # Test RabbitMQ event processing
```

## Next Steps

- Review the [Design Document](../../.kiro/specs/wallet-service/design.md)
- Review the [Requirements Document](../../.kiro/specs/wallet-service/requirements.md)
- Check the [Manual Testing Results](./MANUAL_TESTING_RESULTS.md)
- Explore the codebase starting with `src/domain/` for business logic

## Support

For issues or questions:

1. Check the logs: `docker-compose logs -f wallets`
2. Verify infrastructure: `docker-compose ps`
3. Review the [Manual Testing Results](./MANUAL_TESTING_RESULTS.md)
4. Check RabbitMQ Management UI: <http://localhost:15672>
