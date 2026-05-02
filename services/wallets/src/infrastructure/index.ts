/**
 * Infrastructure Layer Exports
 * 
 * Barrel file for exporting infrastructure module and provider tokens.
 * This simplifies imports in other layers of the application.
 */

export { InfrastructureModule, WALLET_REPOSITORY, EVENT_PUBLISHER } from './infrastructure.module';
export { PrismaService } from './database/prisma.service';
export { PrismaWalletRepository } from './database/prisma-wallet.repository';
export { RabbitMQPublisher } from './messaging/rabbitmq-publisher';
export { RabbitMQConsumer } from './messaging/rabbitmq-consumer';
export type { IEventPublisher } from './messaging/event-publisher.interface';
