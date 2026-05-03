/**
 * E2E Tests for HealthController
 * 
 * Tests the health check endpoint to verify service and dependency status.
 * Validates that the endpoint correctly reports:
 * - 200 OK when all dependencies (PostgreSQL and RabbitMQ) are healthy
 * - 503 Service Unavailable when any dependency is unhealthy
 * 
 * Validates Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { describe, it, expect, beforeAll, afterAll, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { RabbitMQConsumer } from '../../src/infrastructure/messaging/rabbitmq-consumer';
import { EVENT_PUBLISHER } from '../../src/infrastructure/infrastructure.module';

describe('HealthController E2E', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let rabbitMQConsumer: RabbitMQConsumer;

  /**
   * Helper function to make HTTP requests to the test application.
   * Returns a promise that resolves with the response.
   */
  async function makeRequest(path: string): Promise<Response> {
    const url = await app.getUrl();
    return fetch(`${url}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Creates a test application with healthy dependencies.
   * Both PostgreSQL and RabbitMQ are functional.
   */
  async function createHealthyApp(): Promise<void> {
    // Create mock RabbitMQ services with healthy status
    const mockRabbitMQConsumer = {
      start: mock(() => Promise.resolve()),
      stop: mock(() => Promise.resolve()),
      onModuleInit: mock(() => Promise.resolve()),
      onModuleDestroy: mock(() => Promise.resolve()),
      isConnected: mock(() => true), // Healthy RabbitMQ
    };

    const mockEventPublisher = {
      publish: mock(() => Promise.resolve()),
    };

    // Create NestJS testing module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RabbitMQConsumer)
      .useValue(mockRabbitMQConsumer)
      .overrideProvider(EVENT_PUBLISHER)
      .useValue(mockEventPublisher)
      .compile();

    // Create the application instance
    app = moduleFixture.createNestApplication();

    // Get services for testing
    prismaService = app.get<PrismaService>(PrismaService);
    rabbitMQConsumer = app.get<RabbitMQConsumer>(RabbitMQConsumer);

    // Initialize and start the application
    await app.init();
    await app.listen(0);
  }

  /**
   * Creates a test application with unhealthy database.
   * RabbitMQ is functional but PostgreSQL is down.
   */
  async function createAppWithUnhealthyDatabase(): Promise<void> {
    // Create mock RabbitMQ services with healthy status
    const mockRabbitMQConsumer = {
      start: mock(() => Promise.resolve()),
      stop: mock(() => Promise.resolve()),
      onModuleInit: mock(() => Promise.resolve()),
      onModuleDestroy: mock(() => Promise.resolve()),
      isConnected: mock(() => true), // Healthy RabbitMQ
    };

    const mockEventPublisher = {
      publish: mock(() => Promise.resolve()),
    };

    // Create mock PrismaService that simulates database failure
    const mockPrismaService = {
      $queryRaw: mock(() => {
        throw new Error('Database connection failed');
      }),
      $connect: mock(() => Promise.resolve()),
      $disconnect: mock(() => Promise.resolve()),
      onModuleInit: mock(() => Promise.resolve()),
      onModuleDestroy: mock(() => Promise.resolve()),
    };

    // Create NestJS testing module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RabbitMQConsumer)
      .useValue(mockRabbitMQConsumer)
      .overrideProvider(EVENT_PUBLISHER)
      .useValue(mockEventPublisher)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    // Create the application instance
    app = moduleFixture.createNestApplication();

    // Get services for testing
    prismaService = app.get<PrismaService>(PrismaService);
    rabbitMQConsumer = app.get<RabbitMQConsumer>(RabbitMQConsumer);

    // Initialize and start the application
    await app.init();
    await app.listen(0);
  }

  /**
   * Creates a test application with unhealthy RabbitMQ.
   * PostgreSQL is functional but RabbitMQ is down.
   */
  async function createAppWithUnhealthyRabbitMQ(): Promise<void> {
    // Create mock RabbitMQ services with unhealthy status
    const mockRabbitMQConsumer = {
      start: mock(() => Promise.resolve()),
      stop: mock(() => Promise.resolve()),
      onModuleInit: mock(() => Promise.resolve()),
      onModuleDestroy: mock(() => Promise.resolve()),
      isConnected: mock(() => false), // Unhealthy RabbitMQ
    };

    const mockEventPublisher = {
      publish: mock(() => Promise.resolve()),
    };

    // Create NestJS testing module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RabbitMQConsumer)
      .useValue(mockRabbitMQConsumer)
      .overrideProvider(EVENT_PUBLISHER)
      .useValue(mockEventPublisher)
      .compile();

    // Create the application instance
    app = moduleFixture.createNestApplication();

    // Get services for testing
    prismaService = app.get<PrismaService>(PrismaService);
    rabbitMQConsumer = app.get<RabbitMQConsumer>(RabbitMQConsumer);

    // Initialize and start the application
    await app.init();
    await app.listen(0);
  }

  describe('GET /health with healthy dependencies', () => {
    beforeAll(async () => {
      await createHealthyApp();
    });

    afterAll(async () => {
      if (app) {
        await app.close();
      }
    });

    it('should return 200 OK when all dependencies are healthy', async () => {
      // Act
      const response = await makeRequest('/health');
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body).toMatchObject({
        status: 'healthy',
        service: 'wallet-service',
      });
      expect(body.timestamp).toBeDefined();
      expect(body.checks).toBeDefined();
      expect(Array.isArray(body.checks)).toBe(true);
    });

    it('should include database check with healthy status', async () => {
      // Act
      const response = await makeRequest('/health');
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      const databaseCheck = body.checks.find((check: any) => check.name === 'database');
      expect(databaseCheck).toBeDefined();
      expect(databaseCheck.healthy).toBe(true);
      expect(databaseCheck.error).toBeUndefined();
    });

    it('should include RabbitMQ check with healthy status', async () => {
      // Act
      const response = await makeRequest('/health');
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      const rabbitMQCheck = body.checks.find((check: any) => check.name === 'rabbitmq');
      expect(rabbitMQCheck).toBeDefined();
      expect(rabbitMQCheck.healthy).toBe(true);
      expect(rabbitMQCheck.error).toBeUndefined();
    });

    it('should return ISO 8601 formatted timestamp', async () => {
      // Act
      const response = await makeRequest('/health');
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('should verify database connectivity by executing query', async () => {
      // Act
      const response = await makeRequest('/health');

      // Assert
      expect(response.status).toBe(200);
      // Verify that $queryRaw was called (database connectivity check)
      expect(prismaService.$queryRaw).toBeDefined();
    });

    it('should verify RabbitMQ connectivity by checking connection status', async () => {
      // Act
      const response = await makeRequest('/health');

      // Assert
      expect(response.status).toBe(200);
      // Verify that isConnected was called (RabbitMQ connectivity check)
      expect(rabbitMQConsumer.isConnected).toBeDefined();
    });
  });

  describe('GET /health with database down', () => {
    beforeAll(async () => {
      await createAppWithUnhealthyDatabase();
    });

    afterAll(async () => {
      if (app) {
        await app.close();
      }
    });

    it('should return 503 Service Unavailable when database is down', async () => {
      // Act
      const response = await makeRequest('/health');
      const body = await response.json();

      // Assert
      expect(response.status).toBe(503);
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe('SERVICE_UNHEALTHY');
      expect(body.error.message).toContain('One or more dependencies are unhealthy');
    });

    it('should include database check with unhealthy status and error message', async () => {
      // Act
      const response = await makeRequest('/health');
      const body = await response.json();

      // Assert
      expect(response.status).toBe(503);
      const databaseCheck = body.error.details.find((check: any) => check.name === 'database');
      expect(databaseCheck).toBeDefined();
      expect(databaseCheck.healthy).toBe(false);
      expect(databaseCheck.error).toBeDefined();
      expect(databaseCheck.error).toContain('Database connection failed');
    });

    it('should include RabbitMQ check with healthy status', async () => {
      // Act
      const response = await makeRequest('/health');
      const body = await response.json();

      // Assert
      expect(response.status).toBe(503);
      const rabbitMQCheck = body.error.details.find((check: any) => check.name === 'rabbitmq');
      expect(rabbitMQCheck).toBeDefined();
      expect(rabbitMQCheck.healthy).toBe(true);
      expect(rabbitMQCheck.error).toBeUndefined();
    });

    it('should return error response with timestamp', async () => {
      // Act
      const response = await makeRequest('/health');
      const body = await response.json();

      // Assert
      expect(response.status).toBe(503);
      expect(body.error.timestamp).toBeDefined();
      expect(body.error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(new Date(body.error.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('should include all dependency checks in error details', async () => {
      // Act
      const response = await makeRequest('/health');
      const body = await response.json();

      // Assert
      expect(response.status).toBe(503);
      expect(body.error.details).toBeDefined();
      expect(Array.isArray(body.error.details)).toBe(true);
      expect(body.error.details.length).toBe(2); // database and rabbitmq
    });
  });

  describe('GET /health with RabbitMQ down', () => {
    beforeAll(async () => {
      await createAppWithUnhealthyRabbitMQ();
    });

    afterAll(async () => {
      if (app) {
        await app.close();
      }
    });

    it('should return 503 Service Unavailable when RabbitMQ is down', async () => {
      // Act
      const response = await makeRequest('/health');
      const body = await response.json();

      // Assert
      expect(response.status).toBe(503);
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe('SERVICE_UNHEALTHY');
      expect(body.error.message).toContain('One or more dependencies are unhealthy');
    });

    it('should include RabbitMQ check with unhealthy status and error message', async () => {
      // Act
      const response = await makeRequest('/health');
      const body = await response.json();

      // Assert
      expect(response.status).toBe(503);
      const rabbitMQCheck = body.error.details.find((check: any) => check.name === 'rabbitmq');
      expect(rabbitMQCheck).toBeDefined();
      expect(rabbitMQCheck.healthy).toBe(false);
      expect(rabbitMQCheck.error).toBeDefined();
      expect(rabbitMQCheck.error).toContain('RabbitMQ consumer not connected');
    });

    it('should include database check with healthy status', async () => {
      // Act
      const response = await makeRequest('/health');
      const body = await response.json();

      // Assert
      expect(response.status).toBe(503);
      const databaseCheck = body.error.details.find((check: any) => check.name === 'database');
      expect(databaseCheck).toBeDefined();
      expect(databaseCheck.healthy).toBe(true);
      expect(databaseCheck.error).toBeUndefined();
    });

    it('should return error response with timestamp', async () => {
      // Act
      const response = await makeRequest('/health');
      const body = await response.json();

      // Assert
      expect(response.status).toBe(503);
      expect(body.error.timestamp).toBeDefined();
      expect(body.error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(new Date(body.error.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('should include all dependency checks in error details', async () => {
      // Act
      const response = await makeRequest('/health');
      const body = await response.json();

      // Assert
      expect(response.status).toBe(503);
      expect(body.error.details).toBeDefined();
      expect(Array.isArray(body.error.details)).toBe(true);
      expect(body.error.details.length).toBe(2); // database and rabbitmq
    });
  });
});
