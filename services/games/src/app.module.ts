import { Module } from "@nestjs/common";
import { GamesController } from "./presentation/controllers/games.controller";
import { InfrastructureModule } from "./infrastructure/infrastructure.module";

@Module({
  imports: [InfrastructureModule],
  controllers: [GamesController],
})
export class AppModule {}
