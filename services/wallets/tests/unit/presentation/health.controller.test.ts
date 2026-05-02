/**
 * Unit Tests for HealthController
 * 
 * Tests health check endpoint with database and RabbitMQ connectivity checks.
 * Validates Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from '../../../src/presentation/controllers/health.controller';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { RabbitMQConsumer } from '../../../src/infrastructure/messaging/rabbitmq-consumer';

describe('HealthController', () => {
  let controller: HealthController;
  let mockPrismaService: Partial<PrismaService>;
  let mockRabbitMQConsumer: Partial<RabbitMQConsumer>;

  beforeEach(() => {
    // Create mock PrismaService
    mockPrismaService = {
      $queryRaw: mock(async () => [{ '?column?': 1 }]),
    };

    // Create mock RabbitMQConsumer
    mockRabbitMQConsumer = {
      isConnected: mock(() => true),
    };

    controller = new HealthController(
      mockPrismaService as PrismaService,
      mockRabbitMQConsumer as RabbitMQConsumer
    );
  });

  describe('check', () => {
    it('should return healthy status when all dependencies are healthy', async () => {
      // Act
      const result = await controller.check();

      // Assert
      expect(result.status).toBe('healthy');
      expect(result.service).toBe('wallet-service');
      expect(result.timestamp).toBeDefined();
      expect(result.checks).toHaveLength(2);
      
      const dbCheck = result.checks.find((c) => c.name === 'database');
      expect(dbCheck).toBeDefined();
      expect(dbCheck?.healthy).toBe(true);
      expect(dbCheck?.error).toBeUndefined();

      const rabbitCheck = result.checks.find((c) => c.name === 'rabbitmq');
      expect(rabbitCheck).toBeDefined();
      expect(rabbitCheck?.healthy).toBe(true);
      expect(rabbitCheck?.error).toBeUndefined();

      // Verify mocks were called
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
      expect(mockRabbitMQConsumer.isConnected).toHaveBeenCalled();
    });

    it('should throw ServiceUnavailableException when database is unhealthy', async () => {
      // Arrange
      const dbError = new Error('Connection refused');
      mockPrismaService.$queryRaw = mock(async () => {
        throw dbError;
      });

      // Act & Assert
      try {
        await controller.check();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceUnavailableException);
        const response = (error as ServiceUnavailableException).getResponse() as any;
        expect(response.error.code).toBe('SERVICE_UNHEALTHY');
        expect(response.error.message).toBe('One or more dependencies are unhealthy');
        expect(response.error.details).toHaveLength(2);
        
        const dbCheck = response.error.details.find((c: any) => c.name === 'database');
        expect(dbCheck.healthy).toBe(false);
        expect(dbCheck.error).toBe('Connection refused');
      }
    });

    it('should throw ServiceUnavailableException when RabbitMQ is unhealthy', async () => {
      // Arrange
      mockRabbitMQConsumer.isConnected = mock(() => false);

      // Act & Assert
      try {
        await controller.check();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceUnavailableException);
        const response = (error as ServiceUnavailableException).getResponse() as any;
        expect(response.error.code).toBe('SERVICE_UNHEALTHY');
        expect(response.error.details).toHaveLength(2);
        
        const rabbitCheck = response.error.details.find((c: any) => c.name === 'rabbitmq');
        expect(rabbitCheck.healthy).toBe(false);
        expect(rabbitCheck.error).toBe('RabbitMQ consumer not connected');
      }
    });

    it('should throw ServiceUnavailableException when both dependencies are unhealthy', async () => {
      // Arrange
      mockPrismaService.$queryRaw = mock(async () => {
        throw new Error('Database timeout');
      });
      mockRabbitMQConsumer.isConnected = mock(() => false);

      // Act & Assert
      try {
        await controller.check();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceUnavailableException);
        const response = (error as ServiceUnavailableException).getResponse() as any;
        expect(response.error.code).toBe('SERVICE_UNHEALTHY');
        expect(response.error.details).toHaveLength(2);
        
        const dbCheck = response.error.details.find((c: any) => c.name === 'database');
        expect(dbCheck.healthy).toBe(false);
        expect(dbCheck.error).toBe('Database timeout');
        
        const rabbitCheck = response.error.details.find((c: any) => c.name === 'rabbitmq');
        expect(rabbitCheck.healthy).toBe(false);
        expect(rabbitCheck.error).toBe('RabbitMQ consumer not connected');
      }
    });

    it('should handle database query errors gracefully', async () => {
      // Arrange
      mockPrismaService.$queryRaw = mock(async () => {
        throw new Error('Query execution failed');
      });

      // Act & Assert
      try {
        await controller.check();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceUnavailableException);
        const response = (error as ServiceUnavailableException).getResponse() as any;
        
        const dbCheck = response.error.details.find((c: any) => c.name === 'database');
        expect(dbCheck.healthy).toBe(false);
        expect(dbCheck.error).toBe('Query execution failed');
      }
    });

    it('should handle RabbitMQ connection check errors gracefully', async () => {
      // Arrange
      mockRabbitMQConsumer.isConnected = mock(() => {
        throw new Error('Connection check failed');
      });

      // Act & Assert
      try {
        await controller.check();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceUnavailableException);
        const response = (error as ServiceUnavailableException).getResponse() as any;
        
        const rabbitCheck = response.error.details.find((c: any) => c.name === 'rabbitmq');
        expect(rabbitCheck.healthy).toBe(false);
        expect(rabbitCheck.error).toBe('Connection check failed');
      }
    });

    it('should include timestamp in response', async () => {
      // Arrange
      const beforeTimestamp = new Date().toISOString();

      // Act
      const result = await controller.check();

      // Assert
      const afterTimestamp = new Date().toISOString();
      expect(result.timestamp).toBeDefined();
      expect(result.timestamp >= beforeTimestamp).toBe(true);
      expect(result.timestamp <= afterTimestamp).toBe(true);
    });

    it('should include timestamp in error response', async () => {
      // Arrange
      mockPrismaService.$queryRaw = mock(async () => {
        throw new Error('Database error');
      });
      const beforeTimestamp = new Date().toISOString();

      // Act & Assert
      try {
        await controller.check();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        const afterTimestamp = new Date().toISOString();
        const response = (error as ServiceUnavailableException).getResponse() as any;
        expect(response.error.timestamp).toBeDefined();
        expect(response.error.timestamp >= beforeTimestamp).toBe(true);
        expect(response.error.timestamp <= afterTimestamp).toBe(true);
      }
    });

    it('should handle non-Error exceptions from database', async () => {
      // Arrange
      mockPrismaService.$queryRaw = mock(async () => {
        throw 'String error'; // Non-Error exception
      });

      // Act & Assert
      try {
        await controller.check();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceUnavailableException);
        const response = (error as ServiceUnavailableException).getResponse() as any;
        
        const dbCheck = response.error.details.find((c: any) => c.name === 'database');
        expect(dbCheck.healthy).toBe(false);
        expect(dbCheck.error).toBe('Unknown database error');
      }
    });

    it('should handle non-Error exceptions from RabbitMQ', async () => {
      // Arrange
      mockRabbitMQConsumer.isConnected = mock(() => {
        throw 'String error'; // Non-Error exception
      });

      // Act & Assert
      try {
        await controller.check();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceUnavailableException);
        const response = (error as ServiceUnavailableException).getResponse() as any;
        
        const rabbitCheck = response.error.details.find((c: any) => c.name === 'rabbitmq');
        expect(rabbitCheck.healthy).toBe(false);
        expect(rabbitCheck.error).toBe('Unknown RabbitMQ error');
      }
    });
  });
});
