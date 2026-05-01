/**
 * Unit tests for PrismaService
 * 
 * Tests the Prisma client lifecycle management and connection handling.
 */

import { describe, it, expect } from 'bun:test';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';

describe('PrismaService', () => {
  it('should have onModuleInit method', () => {
    expect(PrismaService.prototype.onModuleInit).toBeDefined();
    expect(typeof PrismaService.prototype.onModuleInit).toBe('function');
  });

  it('should have onModuleDestroy method', () => {
    expect(PrismaService.prototype.onModuleDestroy).toBeDefined();
    expect(typeof PrismaService.prototype.onModuleDestroy).toBe('function');
  });

  it('should have enableShutdownHooks method', () => {
    expect(PrismaService.prototype.enableShutdownHooks).toBeDefined();
    expect(typeof PrismaService.prototype.enableShutdownHooks).toBe('function');
  });

  it('should extend PrismaClient', () => {
    // Verify that PrismaService has the expected Prisma Client methods
    expect(PrismaService.prototype.$connect).toBeDefined();
    expect(PrismaService.prototype.$disconnect).toBeDefined();
  });
});
