/**
 * E2E Tests for WalletsController
 * 
 * Tests the complete request/response flow for wallet REST endpoints including:
 * - JWT authentication
 * - Request validation
 * - Use case execution
 * - HTTP status codes and response formats
 * 
 * Validates Requirements: 17.1, 17.2, 17.3, 17.4, 17.5
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { environmentConfig } from '../../src/infrastructure/config/environment.config';
import { RabbitMQConsumer } from '../../src/infrastructure/messaging/rabbitmq-consumer';
import { EVENT_PUBLISHER } from '../../src/infrastructure/infrastructure.module';

describe('WalletsController E2E', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  /**
   * Helper function to generate a valid JWT token for testing.
   * Uses the same secret and issuer as the application.
   */
  function generateValidJWT(playerId: string): string {
    return jwt.sign(
      { sub: playerId },
      environmentConfig.jwtSecret,
      {
        issuer: environmentConfig.jwtIssuer,
        expiresIn: '1h',
      }
    );
  }

  /**
   * Helper function to make HTTP requests to the test application.
   * Returns a promise that resolves with the response.
   */
  async function makeRequest(
    method: 'GET' | 'POST',
    path: string,
    token?: string
  ): Promise<Response> {
    const url = await app.getUrl();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${url}${path}`, {
      method,
      headers,
    });
  }

  beforeAll(async () => {
    // Create mock RabbitMQ services to avoid needing RabbitMQ running
    const mockRabbitMQConsumer = {
      start: mock(() => Promise.resolve()),
      stop: mock(() => Promise.resolve()),
      onModuleInit: mock(() => Promise.resolve()),
      onModuleDestroy: mock(() => Promise.resolve()),
    };

    const mockEventPublisher = {
      publish: mock(() => Promise.resolve()),
    };

    // Create NestJS testing module with mocked RabbitMQ
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

    // Apply global validation pipe (same as production)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );

    // Get PrismaService for database cleanup
    prismaService = app.get<PrismaService>(PrismaService);

    // Initialize the application
    await app.init();

    // Start listening on a random port
    await app.listen(0);
  });

  afterAll(async () => {
    // Close the application and database connections
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prismaService.wallet.deleteMany({});
  });

  describe('POST /wallets', () => {
    it('should create wallet for authenticated player with valid JWT (201)', async () => {
      // Arrange
      const playerId = 'player-123';
      const token = generateValidJWT(playerId);

      // Act
      const response = await makeRequest('POST', '/wallets', token);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(body).toMatchObject({
        playerId: playerId,
        balance: '0',
      });
      expect(body.id).toBeDefined();
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();

      // Verify database persistence
      const wallet = await prismaService.wallet.findUnique({
        where: { playerId: playerId },
      });
      expect(wallet).not.toBeNull();
      expect(wallet?.balance).toBe(0n);
      expect(wallet?.playerId).toBe(playerId);
    });

    it('should return 401 when JWT is missing', async () => {
      // Act
      const response = await makeRequest('POST', '/wallets');
      const body = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body.message).toBeDefined();
    });

    it('should return 401 when JWT is invalid', async () => {
      // Arrange
      const invalidToken = 'invalid.jwt.token';

      // Act
      const response = await makeRequest('POST', '/wallets', invalidToken);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body.message).toBeDefined();
    });

    it('should return 401 when JWT has invalid signature', async () => {
      // Arrange
      const playerId = 'player-123';
      const token = jwt.sign(
        { sub: playerId },
        'wrong-secret', // Wrong secret
        {
          issuer: environmentConfig.jwtIssuer,
          expiresIn: '1h',
        }
      );

      // Act
      const response = await makeRequest('POST', '/wallets', token);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body.message).toContain('Invalid token signature');
    });

    it('should return 401 when JWT has expired', async () => {
      // Arrange
      const playerId = 'player-123';
      const token = jwt.sign(
        { sub: playerId },
        environmentConfig.jwtSecret,
        {
          issuer: environmentConfig.jwtIssuer,
          expiresIn: '-1h', // Expired 1 hour ago
        }
      );

      // Act
      const response = await makeRequest('POST', '/wallets', token);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body.message).toContain('expired');
    });

    it('should return 401 when JWT has wrong issuer', async () => {
      // Arrange
      const playerId = 'player-123';
      const token = jwt.sign(
        { sub: playerId },
        environmentConfig.jwtSecret,
        {
          issuer: 'http://wrong-issuer.com',
          expiresIn: '1h',
        }
      );

      // Act
      const response = await makeRequest('POST', '/wallets', token);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body.message).toBeDefined();
    });

    it('should return 409 when wallet already exists for player', async () => {
      // Arrange
      const playerId = 'player-123';
      const token = generateValidJWT(playerId);

      // Create wallet first
      await prismaService.wallet.create({
        data: {
          playerId: playerId,
          balance: 0n,
        },
      });

      // Act
      const response = await makeRequest('POST', '/wallets', token);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe('WALLET_ALREADY_EXISTS');
      expect(body.error.message).toContain('already exists');
    });

    it('should create separate wallets for different players', async () => {
      // Arrange
      const playerId1 = 'player-123';
      const playerId2 = 'player-456';
      const token1 = generateValidJWT(playerId1);
      const token2 = generateValidJWT(playerId2);

      // Act
      const response1 = await makeRequest('POST', '/wallets', token1);
      const response2 = await makeRequest('POST', '/wallets', token2);
      const body1 = await response1.json();
      const body2 = await response2.json();

      // Assert
      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(body1.playerId).toBe(playerId1);
      expect(body2.playerId).toBe(playerId2);
      expect(body1.id).not.toBe(body2.id);

      // Verify both wallets exist in database
      const wallet1 = await prismaService.wallet.findUnique({
        where: { playerId: playerId1 },
      });
      const wallet2 = await prismaService.wallet.findUnique({
        where: { playerId: playerId2 },
      });
      expect(wallet1).not.toBeNull();
      expect(wallet2).not.toBeNull();
    });

    it('should handle UUID format player IDs', async () => {
      // Arrange
      const playerId = '550e8400-e29b-41d4-a716-446655440000';
      const token = generateValidJWT(playerId);

      // Act
      const response = await makeRequest('POST', '/wallets', token);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(body.playerId).toBe(playerId);
    });

    it('should handle alphanumeric player IDs', async () => {
      // Arrange
      const playerId = 'player-abc-123-xyz';
      const token = generateValidJWT(playerId);

      // Act
      const response = await makeRequest('POST', '/wallets', token);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(body.playerId).toBe(playerId);
    });
  });

  describe('GET /wallets/me', () => {
    it('should retrieve wallet for authenticated player with valid JWT (200)', async () => {
      // Arrange
      const playerId = 'player-123';
      const token = generateValidJWT(playerId);

      // Create wallet in database
      const createdWallet = await prismaService.wallet.create({
        data: {
          playerId: playerId,
          balance: 50000n, // 50000 centavos
        },
      });

      // Act
      const response = await makeRequest('GET', '/wallets/me', token);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body).toMatchObject({
        id: createdWallet.id,
        playerId: playerId,
        balance: '50000',
      });
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();
    });

    it('should return 401 when JWT is missing', async () => {
      // Act
      const response = await makeRequest('GET', '/wallets/me');
      const body = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body.message).toBeDefined();
    });

    it('should return 401 when JWT is invalid', async () => {
      // Arrange
      const invalidToken = 'invalid.jwt.token';

      // Act
      const response = await makeRequest('GET', '/wallets/me', invalidToken);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body.message).toBeDefined();
    });

    it('should return 401 when JWT has invalid signature', async () => {
      // Arrange
      const playerId = 'player-123';
      const token = jwt.sign(
        { sub: playerId },
        'wrong-secret', // Wrong secret
        {
          issuer: environmentConfig.jwtIssuer,
          expiresIn: '1h',
        }
      );

      // Act
      const response = await makeRequest('GET', '/wallets/me', token);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body.message).toContain('Invalid token signature');
    });

    it('should return 401 when JWT has expired', async () => {
      // Arrange
      const playerId = 'player-123';
      const token = jwt.sign(
        { sub: playerId },
        environmentConfig.jwtSecret,
        {
          issuer: environmentConfig.jwtIssuer,
          expiresIn: '-1h', // Expired 1 hour ago
        }
      );

      // Act
      const response = await makeRequest('GET', '/wallets/me', token);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body.message).toContain('expired');
    });

    it('should return 404 when wallet does not exist for player', async () => {
      // Arrange
      const playerId = 'player-nonexistent';
      const token = generateValidJWT(playerId);

      // Act
      const response = await makeRequest('GET', '/wallets/me', token);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe('WALLET_NOT_FOUND');
      expect(body.error.message).toContain('not found');
    });

    it('should return correct balance for wallet with zero balance', async () => {
      // Arrange
      const playerId = 'player-123';
      const token = generateValidJWT(playerId);

      // Create wallet with zero balance
      await prismaService.wallet.create({
        data: {
          playerId: playerId,
          balance: 0n,
        },
      });

      // Act
      const response = await makeRequest('GET', '/wallets/me', token);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.balance).toBe('0');
    });

    it('should return correct balance for wallet with large balance', async () => {
      // Arrange
      const playerId = 'player-123';
      const token = generateValidJWT(playerId);

      // Create wallet with large balance (1 million centavos = 10,000 currency units)
      await prismaService.wallet.create({
        data: {
          playerId: playerId,
          balance: 1000000n,
        },
      });

      // Act
      const response = await makeRequest('GET', '/wallets/me', token);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.balance).toBe('1000000');
    });

    it('should only return wallet for authenticated player (authorization)', async () => {
      // Arrange
      const playerId1 = 'player-123';
      const playerId2 = 'player-456';
      const token1 = generateValidJWT(playerId1);
      const token2 = generateValidJWT(playerId2);

      // Create wallets for both players
      const wallet1 = await prismaService.wallet.create({
        data: {
          playerId: playerId1,
          balance: 10000n,
        },
      });
      const wallet2 = await prismaService.wallet.create({
        data: {
          playerId: playerId2,
          balance: 20000n,
        },
      });

      // Act - Player 1 retrieves their wallet
      const response1 = await makeRequest('GET', '/wallets/me', token1);
      const body1 = await response1.json();

      // Act - Player 2 retrieves their wallet
      const response2 = await makeRequest('GET', '/wallets/me', token2);
      const body2 = await response2.json();

      // Assert - Each player gets only their own wallet
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(body1.id).toBe(wallet1.id);
      expect(body1.playerId).toBe(playerId1);
      expect(body1.balance).toBe('10000');
      expect(body2.id).toBe(wallet2.id);
      expect(body2.playerId).toBe(playerId2);
      expect(body2.balance).toBe('20000');
    });

    it('should return ISO 8601 formatted timestamps', async () => {
      // Arrange
      const playerId = 'player-123';
      const token = generateValidJWT(playerId);

      // Create wallet
      await prismaService.wallet.create({
        data: {
          playerId: playerId,
          balance: 0n,
        },
      });

      // Act
      const response = await makeRequest('GET', '/wallets/me', token);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      
      // Verify timestamps are valid dates
      expect(new Date(body.createdAt).toString()).not.toBe('Invalid Date');
      expect(new Date(body.updatedAt).toString()).not.toBe('Invalid Date');
    });
  });

  describe('Integration: Create and Retrieve Wallet', () => {
    it('should create wallet and then retrieve it successfully', async () => {
      // Arrange
      const playerId = 'player-integration-test';
      const token = generateValidJWT(playerId);

      // Act - Create wallet
      const createResponse = await makeRequest('POST', '/wallets', token);
      const createBody = await createResponse.json();

      // Act - Retrieve wallet
      const getResponse = await makeRequest('GET', '/wallets/me', token);
      const getBody = await getResponse.json();

      // Assert
      expect(createResponse.status).toBe(201);
      expect(getResponse.status).toBe(200);
      expect(createBody.id).toBe(getBody.id);
      expect(createBody.playerId).toBe(getBody.playerId);
      expect(createBody.balance).toBe('0');
      expect(getBody.balance).toBe('0');
    });
  });
});
