import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { PrismaService } from "./infrastructure/database/prisma.service";
import { GlobalExceptionFilter } from "./presentation/filters";
import { LoggingInterceptor } from "./infrastructure/logging";

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
  console.log(`Wallets service running on port ${port}`);
}

bootstrap();
