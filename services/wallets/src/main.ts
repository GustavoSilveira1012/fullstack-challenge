import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { PrismaService } from "./infrastructure/database/prisma.service";
import { GlobalExceptionFilter } from "./presentation/filters";
import { LoggingInterceptor, StructuredLogger } from "./infrastructure/logging";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  
  // CORS completamente aberto para desenvolvimento
  app.enableCors({
    origin: true,
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['*'],
  });
  
  // Register global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  // Register global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());
  
  // Swagger/OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('Crash Game - Wallet Service API')
    .setDescription('API for managing player wallets and balances')
    .setVersion('1.0')
    .addTag('wallets', 'Player wallet management')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token from Keycloak',
      },
      'JWT-auth',
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Wallet Service API',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
  
  // Enable graceful shutdown for Prisma
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
  
  const port = process.env.PORT || 3001;
  await app.listen(port, "0.0.0.0");
  
  // Use structured logger instead of console.log
  const logger = new StructuredLogger('Bootstrap');
  logger.info('Wallets service started successfully', { port });
  logger.info(`Swagger UI available at http://localhost:${port}/api`);
}

bootstrap();
