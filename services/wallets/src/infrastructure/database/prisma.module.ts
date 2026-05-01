/**
 * Prisma Module
 * 
 * NestJS module that provides the PrismaService for dependency injection.
 * Exports PrismaService to make it available to other modules.
 * 
 * Requirements: 11.1, 11.3
 */

import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
