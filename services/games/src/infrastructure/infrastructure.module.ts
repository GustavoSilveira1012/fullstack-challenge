import { Module } from '@nestjs/common';
import { EnvironmentConfig } from './config/environment.config';
import { PrismaModule } from './database/prisma.module';
import { PrismaRoundRepository } from './repositories/prisma-round.repository';
import { PrismaBetRepository } from './repositories/prisma-bet.repository';
import { RabbitMQPublisher } from './messaging/rabbitmq-publisher';

// Tokens for dependency injection (using Symbol.for for global access)
export const IRoundRepository = Symbol.for('IRoundRepository');
export const IBetRepository = Symbol.for('IBetRepository');
export const IEventPublisher = Symbol.for('IEventPublisher');

@Module({
  imports: [PrismaModule],
  providers: [
    EnvironmentConfig,
    {
      provide: IRoundRepository,
      useClass: PrismaRoundRepository,
    },
    {
      provide: IBetRepository,
      useClass: PrismaBetRepository,
    },
    {
      provide: IEventPublisher,
      useClass: RabbitMQPublisher,
    },
    RabbitMQPublisher,
  ],
  exports: [
    EnvironmentConfig,
    PrismaModule,
    IRoundRepository,
    IBetRepository,
    IEventPublisher,
  ],
})
export class InfrastructureModule {}
