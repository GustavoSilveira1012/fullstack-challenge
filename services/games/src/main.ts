import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { WsAdapter } from "@nestjs/platform-ws";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { EnvironmentConfig } from "./infrastructure/config/environment.config";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  
  // CORS completamente aberto para desenvolvimento
  app.enableCors({
    origin: true,
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['*'],
  });
  
  app.useWebSocketAdapter(new WsAdapter(app));
  
  // Swagger/OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('Crash Game - Game Service API')
    .setDescription('API for managing game rounds, bets, and provably fair verification')
    .setVersion('1.0')
    .addTag('games', 'Game rounds and gameplay')
    .addTag('bets', 'Player bets and cash outs')
    .addTag('verification', 'Provably fair verification')
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
    customSiteTitle: 'Game Service API',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
  
  const envConfig = app.get(EnvironmentConfig);
  await app.listen(envConfig.port, "0.0.0.0");
  console.log(`Games service running on port ${envConfig.port}`);
  console.log(`Swagger UI available at http://localhost:${envConfig.port}/api`);
}

bootstrap().catch((error: Error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
