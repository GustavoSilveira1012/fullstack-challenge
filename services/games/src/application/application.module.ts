import { Module } from '@nestjs/common';
import { CreateRoundUseCase } from './use-cases/create-round.use-case';
import { StartRoundUseCase } from './use-cases/start-round.use-case';
import { PlaceBetUseCase } from './use-cases/place-bet.use-case';
import { CashOutUseCase } from './use-cases/cash-out.use-case';
import { ProcessRoundCrashUseCase } from './use-cases/process-round-crash.use-case';
import { GetCurrentRoundUseCase } from './use-cases/get-current-round.use-case';
import { GetRoundHistoryUseCase } from './use-cases/get-round-history.use-case';
import { GetPlayerBetHistoryUseCase } from './use-cases/get-player-bet-history.use-case';
import { VerifyRoundUseCase } from './use-cases/verify-round.use-case';
import { DomainModule } from '../domain/domain.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

@Module({
  imports: [DomainModule, InfrastructureModule],
  providers: [
    CreateRoundUseCase,
    StartRoundUseCase,
    PlaceBetUseCase,
    CashOutUseCase,
    ProcessRoundCrashUseCase,
    GetCurrentRoundUseCase,
    GetRoundHistoryUseCase,
    GetPlayerBetHistoryUseCase,
    VerifyRoundUseCase,
  ],
  exports: [
    CreateRoundUseCase,
    StartRoundUseCase,
    PlaceBetUseCase,
    CashOutUseCase,
    ProcessRoundCrashUseCase,
    GetCurrentRoundUseCase,
    GetRoundHistoryUseCase,
    GetPlayerBetHistoryUseCase,
    VerifyRoundUseCase,
  ],
})
export class ApplicationModule {}
