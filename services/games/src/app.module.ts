import { Module } from "@nestjs/common";
import { GamesController } from "./presentation/controllers/games.controller";
import { InfrastructureModule } from "./infrastructure/infrastructure.module";
import { ApplicationModule } from "./application/application.module";
import { GameGateway } from "./presentation/gateways/game.gateway";
import { GameEngineService } from "./infrastructure/scheduling/game-engine.service";
import { DomainModule } from "./domain/domain.module";

@Module({
  imports: [InfrastructureModule, ApplicationModule, DomainModule],
  controllers: [GamesController],
  providers: [GameGateway, GameEngineService],
})
export class AppModule {}
