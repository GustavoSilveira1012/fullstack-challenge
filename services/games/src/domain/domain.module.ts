import { Module } from '@nestjs/common';
import { ProvablyFairService } from './services/provably-fair.service';
import { MultiplierService } from './services/multiplier.service';

@Module({
  providers: [ProvablyFairService, MultiplierService],
  exports: [ProvablyFairService, MultiplierService],
})
export class DomainModule {}
