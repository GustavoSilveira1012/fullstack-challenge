/**
 * Domain Module
 * 
 * NestJS module representing the domain layer of the Wallet Service.
 * Contains pure business logic including entities, value objects, and domain interfaces.
 * 
 * This module has no providers as the domain layer consists of pure TypeScript classes
 * and interfaces that are imported directly where needed. The domain layer is
 * infrastructure-agnostic and contains no dependencies on external frameworks.
 * 
 * Requirements: 14.2
 */

import { Module } from '@nestjs/common';

@Module({
  providers: [],
  exports: [],
})
export class DomainModule {}
