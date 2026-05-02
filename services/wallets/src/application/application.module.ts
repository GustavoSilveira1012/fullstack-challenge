/**
 * Application Module
 * 
 * NestJS module representing the application layer of the Wallet Service.
 * Contains all use cases that orchestrate domain logic and infrastructure services.
 * 
 * This module:
 * - Imports InfrastructureModule to access repository and event publisher implementations
 * - Registers all use cases as providers
 * - Exports use cases for use in the presentation layer
 * 
 * Requirements: 14.3
 */

import { Module } from '@nestjs/common';
import { InfrastructureModule, WALLET_REPOSITORY, EVENT_PUBLISHER } from '../infrastructure/infrastructure.module';
import { CreateWalletUseCase } from './create-wallet.use-case';
import { GetWalletUseCase } from './get-wallet.use-case';
import { ProcessBetPlacedUseCase } from './process-bet-placed.use-case';
import { ProcessCashoutUseCase } from './process-cashout.use-case';
import { ProcessBetLostUseCase } from './process-bet-lost.use-case';

@Module({
  imports: [
    // Import InfrastructureModule to access repository and event publisher
    InfrastructureModule,
  ],
  providers: [
    // Register all use cases as providers
    CreateWalletUseCase,
    GetWalletUseCase,
    ProcessBetPlacedUseCase,
    ProcessCashoutUseCase,
    ProcessBetLostUseCase,
  ],
  exports: [
    // Export use cases for use in presentation layer (controllers)
    CreateWalletUseCase,
    GetWalletUseCase,
    ProcessBetPlacedUseCase,
    ProcessCashoutUseCase,
    ProcessBetLostUseCase,
  ],
})
export class ApplicationModule {}
