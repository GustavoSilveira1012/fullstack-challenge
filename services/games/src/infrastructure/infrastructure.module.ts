import { Module } from '@nestjs/common';
import { EnvironmentConfig } from './config/environment.config';
import { PrismaModule } from './database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EnvironmentConfig],
  exports: [EnvironmentConfig, PrismaModule],
})
export class InfrastructureModule {}
