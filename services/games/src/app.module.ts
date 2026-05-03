import { Module } from "@nestjs/common";
import { GamesController } from "./presentation/controllers/games.controller";
import { InfrastructureModule } from "./infrastructure/infrastructure.module";
import { ApplicationModule } from "./application/application.module";

@Module({
  imports: [InfrastructureModule, ApplicationModule],
  controllers: [GamesController],
})
export class AppModule {}
