import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

// Dynamic import to handle Prisma client
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client: any;

  constructor() {
    // Initialize Prisma client dynamically
    this.initializeClient();
  }

  private initializeClient(): void {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require('@prisma/client');
    this.client = new PrismaClient({
      log: ['error', 'warn'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }

  // Proxy methods to the underlying Prisma client
  get round() {
    return this.client.round;
  }

  get bet() {
    return this.client.bet;
  }

  async $transaction(callback: (prisma: any) => Promise<any>): Promise<any> {
    return this.client.$transaction(callback);
  }
}
