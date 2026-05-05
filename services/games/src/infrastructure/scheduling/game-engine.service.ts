import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { CreateRoundUseCase } from '../../application/use-cases/create-round.use-case';
import { StartRoundUseCase } from '../../application/use-cases/start-round.use-case';
import { ProcessRoundCrashUseCase } from '../../application/use-cases/process-round-crash.use-case';
import { GetCurrentRoundUseCase, RoundNotFoundError } from '../../application/use-cases/get-current-round.use-case';
import { MultiplierService } from '../../domain/services/multiplier.service';
import { GameGateway } from '../../presentation/gateways/game.gateway';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class GameEngineService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GameEngineService.name);
  private isRunning = false;
  private currentTimeout: NodeJS.Timeout | null = null;
  private multiplierInterval: NodeJS.Timeout | null = null;
  
  private readonly BETTING_DURATION_MS = 10000; // 10 seconds
  private readonly FINISHED_DURATION_MS = 5000; // 5 seconds
  private readonly MULTIPLIER_TICK_MS = 100; // 100ms updates to clients

  constructor(
    private readonly createRoundUseCase: CreateRoundUseCase,
    private readonly startRoundUseCase: StartRoundUseCase,
    private readonly processRoundCrashUseCase: ProcessRoundCrashUseCase,
    private readonly getCurrentRoundUseCase: GetCurrentRoundUseCase,
    private readonly multiplierService: MultiplierService,
    private readonly gameGateway: GameGateway,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting Game Engine...');
    this.isRunning = true;
    this.runLoop();
  }

  onModuleDestroy() {
    this.logger.log('Stopping Game Engine...');
    this.isRunning = false;
    this.clearTimers();
  }

  private clearTimers() {
    if (this.currentTimeout) clearTimeout(this.currentTimeout);
    if (this.multiplierInterval) clearInterval(this.multiplierInterval);
  }

  private async runLoop() {
    if (!this.isRunning) return;

    try {
      let currentRound = null;
      
      try {
        const result = await this.getCurrentRoundUseCase.execute();
        currentRound = result.round;
      } catch (error) {
        if (error instanceof RoundNotFoundError) {
          // No active round, create one
          currentRound = await this.createRoundUseCase.execute();
        } else {
          throw error;
        }
      }

      const state = currentRound.getState();
      
      if (state === 'BETTING') {
        await this.handleBettingPhase(currentRound);
      } else if (state === 'RUNNING') {
        await this.handleRunningPhase(currentRound);
      } else if (state === 'CRASHED') {
        await this.handleCrashedPhase(currentRound);
      } else {
        // If it's finished, create a new one
        await this.createRoundUseCase.execute();
        // Continue loop immediately
        setTimeout(() => this.runLoop(), 0);
      }
    } catch (error) {
      this.logger.error(`Error in game loop: ${error.message}`, error.stack);
      // Wait a bit and try again
      this.currentTimeout = setTimeout(() => this.runLoop(), 5000);
    }
  }

  private async handleBettingPhase(round: any) {
    this.logger.log(`Round ${round.getId().toString()} is in BETTING phase`);
    
    // Broadcast event to clients
    this.gameGateway.broadcast('round:betting', {
      roundId: round.getId().toString(),
      serverSeedHash: round.getServerSeedHash().toString(),
      duration: this.BETTING_DURATION_MS,
      createdAt: round.getCreatedAt().toISOString(),
    });

    const createdAt = round.getCreatedAt().getTime();
    const now = Date.now();
    const elapsed = now - createdAt;
    const remainingTime = Math.max(0, this.BETTING_DURATION_MS - elapsed);

    this.currentTimeout = setTimeout(async () => {
      try {
        await this.startRoundUseCase.execute(round.getId());
        this.runLoop();
      } catch (e) {
        this.logger.error(`Failed to start round: ${e.message}`, e.stack);
        this.currentTimeout = setTimeout(() => this.runLoop(), 1000);
      }
    }, remainingTime);
  }

  private async handleRunningPhase(round: any) {
    this.logger.log(`Round ${round.getId().toString()} is in RUNNING phase`);
    
    const startedAt = round.getStartedAt()!;
    
    this.gameGateway.broadcast('round:started', {
      roundId: round.getId().toString(),
      startedAt: startedAt.toISOString(),
    });

    const timeUntilCrash = this.multiplierService.getTimeUntilCrash(startedAt, round.getCrashPoint());
    
    const now = Date.now();
    const elapsed = now - startedAt.getTime();
    const remainingTime = Math.max(0, timeUntilCrash - elapsed);

    // Setup interval to broadcast multiplier updates
    this.multiplierInterval = setInterval(() => {
      const currentNow = new Date();
      const currentMultiplier = this.multiplierService.calculateMultiplier(startedAt, currentNow, round.getCrashPoint());
      
      this.gameGateway.broadcast('multiplier:update', {
        roundId: round.getId().toString(),
        multiplier: currentMultiplier.toNumber(),
      });
    }, this.MULTIPLIER_TICK_MS);

    this.currentTimeout = setTimeout(async () => {
      if (this.multiplierInterval) clearInterval(this.multiplierInterval);
      
      try {
        await this.processRoundCrashUseCase.execute(round.getId());
        this.runLoop();
      } catch (e) {
        this.logger.error(`Failed to crash round: ${e.message}`, e.stack);
        this.currentTimeout = setTimeout(() => this.runLoop(), 1000);
      }
    }, remainingTime);
  }

  private async handleCrashedPhase(round: any) {
    this.logger.log(`Round ${round.getId().toString()} crashed at ${round.getCrashPoint().toNumber()}x`);
    
    this.gameGateway.broadcast('round:crashed', {
      roundId: round.getId().toString(),
      crashPoint: round.getCrashPoint().toNumber(),
      serverSeed: round.getServerSeed().toString(),
      crashedAt: round.getCrashedAt()?.toISOString(),
    });

    this.currentTimeout = setTimeout(async () => {
      try {
        // Finish round manually via Prisma since there's no use case for it
        await this.prisma.round.update({
          where: { id: round.getId().toString() },
          data: {
            state: 'FINISHED',
            finishedAt: new Date(),
            version: { increment: 1 }
          }
        });
        
        // Loop back to start a new round
        this.runLoop();
      } catch (e) {
        this.logger.error(`Failed to finish round: ${e.message}`, e.stack);
        this.currentTimeout = setTimeout(() => this.runLoop(), 1000);
      }
    }, this.FINISHED_DURATION_MS);
  }
}
