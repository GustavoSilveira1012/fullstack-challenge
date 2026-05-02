/**
 * Prisma Service
 * 
 * Manages the Prisma Client lifecycle with proper connection management.
 * Implements NestJS lifecycle hooks for initialization and cleanup.
 * 
 * Requirements: 11.1, 11.3
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { environmentConfig } from '../config/environment.config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    // Create PostgreSQL connection pool
    const pool = new Pool({
      connectionString: environmentConfig.databaseUrl,
    });

    // Create Prisma adapter
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: environmentConfig.isDevelopment() 
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
      errorFormat: 'pretty',
    });

    this.pool = pool;
  }

  /**
   * Connect to the database when the module initializes
   */
  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Connecting to PostgreSQL database...');
      await this.$connect();
      this.logger.log('Successfully connected to PostgreSQL database');
    } catch (error) {
      this.logger.error('Failed to connect to PostgreSQL database', error);
      throw error;
    }
  }

  /**
   * Disconnect from the database when the module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    try {
      this.logger.log('Disconnecting from PostgreSQL database...');
      await this.$disconnect();
      await this.pool.end();
      this.logger.log('Successfully disconnected from PostgreSQL database');
    } catch (error) {
      this.logger.error('Error disconnecting from PostgreSQL database', error);
      throw error;
    }
  }

  /**
   * Enable graceful shutdown
   * Ensures all pending queries complete before disconnecting
   */
  async enableShutdownHooks(app: any): Promise<void> {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
