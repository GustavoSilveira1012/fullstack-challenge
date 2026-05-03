import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { PrismaService } from "./infrastructure/database/prisma.service";
import { GlobalExceptionFilter } from "./presentation/filters";
import { LoggingInterceptor, StructuredLogger } from "./infrastructure/logging";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  
  // Register global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  // Register global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());
  
  // Enable graceful shutdown for Prisma
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
  
  const port = process.env.PORT || 3001;
  await app.listen(port, "0.0.0.0");
  
  // Use structured logger instead of console.log
  const logger = new StructuredLogger('Bootstrap');
  logger.info('Wallets service started successfully', { port });
}

bootstrap();
