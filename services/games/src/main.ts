import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { WsAdapter } from "@nestjs/platform-ws";
import { AppModule } from "./app.module";
import { EnvironmentConfig } from "./infrastructure/config/environment.config";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  app.useWebSocketAdapter(new WsAdapter(app));
  
  const config = app.get(EnvironmentConfig);
  await app.listen(config.port, "0.0.0.0");
  console.log(`Games service running on port ${config.port}`);
}

bootstrap().catch((error: Error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
