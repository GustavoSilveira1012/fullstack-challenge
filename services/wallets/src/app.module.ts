import { Module } from "@nestjs/common";
import { WalletsController } from "./presentation/controllers/wallets.controller";
import { PrismaModule } from "./infrastructure/database/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [WalletsController],
})
export class AppModule {}
