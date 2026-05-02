/**
 * HealthController
 * 
 * REST controller for health check endpoint.
 * Verifies connectivity to critical dependencies (PostgreSQL and RabbitMQ).
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RabbitMQConsumer } from '../../infrastructure/messaging/rabbitmq-consumer';
import { HealthCheckResponseDto } from '../dtos/health-check-response.dto';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly rabbitMQConsumer: RabbitMQConsumer
  ) {}

  /**
   * GET /health
   * 
   * Performs health checks on all critical dependencies:
   * - PostgreSQL database connectivity
   * - RabbitMQ message broker connectivity
   * 
   * @returns HealthCheckResponseDto with 200 OK if all dependencies are healthy
   * @throws ServiceUnavailableException (503) if any dependency is unhealthy
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async check(): Promise<HealthCheckResponseDto> {
    const checks: { name: string; healthy: boolean; error?: string }[] = [];

    // Check database connectivity
    const dbHealthy = await this.checkDatabase();
    checks.push({
      name: 'database',
      healthy: dbHealthy.healthy,
      error: dbHealthy.error,
    });

    // Check RabbitMQ connectivity
    const rabbitMQHealthy = await this.checkRabbitMQ();
    checks.push({
      name: 'rabbitmq',
      healthy: rabbitMQHealthy.healthy,
      error: rabbitMQHealthy.error,
    });

    // Determine overall health status
    const allHealthy = checks.every((check) => check.healthy);

    if (!allHealthy) {
      const failedChecks = checks
        .filter((check) => !check.healthy)
        .map((check) => `${check.name}: ${check.error || 'unhealthy'}`)
        .join(', ');

      this.logger.error(`Health check failed: ${failedChecks}`);

      throw new ServiceUnavailableException({
        error: {
          code: 'SERVICE_UNHEALTHY',
          message: 'One or more dependencies are unhealthy',
          details: checks,
          timestamp: new Date().toISOString(),
        },
      });
    }

    this.logger.debug('Health check passed: all dependencies healthy');

    return {
      status: 'healthy',
      service: 'wallet-service',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  /**
   * Checks PostgreSQL database connectivity.
   * Executes a simple query to verify the connection is working.
   * 
   * @returns Object with healthy status and optional error message
   */
  private async checkDatabase(): Promise<{ healthy: boolean; error?: string }> {
    try {
      // Execute a simple query to verify database connectivity
      // Using $queryRaw to execute a lightweight query
      await this.prismaService.$queryRaw`SELECT 1`;
      return { healthy: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      this.logger.error(`Database health check failed: ${errorMessage}`);
      return { healthy: false, error: errorMessage };
    }
  }

  /**
   * Checks RabbitMQ connectivity.
   * Verifies that the consumer is connected to the message broker.
   * 
   * @returns Object with healthy status and optional error message
   */
  private async checkRabbitMQ(): Promise<{ healthy: boolean; error?: string }> {
    try {
      const isConnected = this.rabbitMQConsumer.isConnected();
      
      if (!isConnected) {
        return { healthy: false, error: 'RabbitMQ consumer not connected' };
      }

      return { healthy: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown RabbitMQ error';
      this.logger.error(`RabbitMQ health check failed: ${errorMessage}`);
      return { healthy: false, error: errorMessage };
    }
  }
}
