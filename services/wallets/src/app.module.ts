/**
 * AppModule
 * 
 * Root NestJS module that wires together all layers of the Wallet Service.
 * Imports ApplicationModule and InfrastructureModule to compose the complete application.
 * 
 * This module:
 * - Imports ApplicationModule (use cases)
 * - Imports InfrastructureModule (repositories, messaging, database)
 * - Registers presentation layer controllers (WalletsController, HealthController)
 * - Registers JwtAuthGuard for authentication
 * - Configures global exception filter via main.ts
 * - Configures request ID middleware for request tracing
 * - RabbitMQ consumer lifecycle hooks (OnModuleInit, OnModuleDestroy) are handled
 *   automatically by the consumer itself
 * 
 * Requirements: 14.1
 */

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ApplicationModule } from './application/application.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { WalletsController } from './presentation/controllers/wallets.controller';
import { HealthController } from './presentation/controllers/health.controller';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { GlobalExceptionFilter } from './presentation/filters/global-exception.filter';
import { RequestIdMiddleware } from './infrastructure/logging';

@Module({
  imports: [
    // Import ApplicationModule for use cases
    ApplicationModule,
    
    // Import InfrastructureModule for repositories, messaging, and database
    InfrastructureModule,
  ],
  controllers: [
    // Register presentation layer controllers
    WalletsController,
    HealthController,
  ],
  providers: [
    // Register JwtAuthGuard for authentication
    JwtAuthGuard,
    
    // Register global exception filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * Configure middleware for the application.
   * Applies RequestIdMiddleware to all routes for request tracing.
   */
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes('*');
  }
}
