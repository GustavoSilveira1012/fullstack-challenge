import { Injectable, Inject } from '@nestjs/common';
import { IRoundRepository, IBetRepository, IEventPublisher } from '../../infrastructure/infrastructure.module';
import { MultiplierService } from '../../domain/services/multiplier.service';
import { PlayerId } from '../../domain/value-objects/player-id';
import { BetCashedOut } from '../../domain/events/bet-cashed-out';

export class RoundNotFoundError extends Error {
  constructor() {
    super('No active round found');
    this.name = 'RoundNotFoundError';
  }
}

export class RoundNotRunningError extends Error {
  constructor() {
    super('Round is not in running phase');
    this.name = 'RoundNotRunningError';
  }
}

export class NoBetFoundError extends Error {
  constructor() {
    super('Player has no active bet in current round');
    this.name = 'NoBetFoundError';
  }
}

/**
 * Cash Out Use Case
 * Allows a player to cash out their bet at the current multiplier
 */
@Injectable()
export class CashOutUseCase {
  constructor(
    @Inject(IRoundRepository)
    private readonly roundRepository: any,
    @Inject(IBetRepository)
    private readonly betRepository: any,
    private readonly multiplierService: MultiplierService,
    @Inject(IEventPublisher)
    private readonly eventPublisher: any,
  ) {}

  /**
   * Execute the use case
   * @param playerId - ID of player cashing out
   * @returns Cash out details
   * @throws Various errors if cash out cannot be processed
   */
  async execute(
    playerId: PlayerId,
  ): Promise<{ multiplier: number; payout: bigint }> {
    // Find current round
    const round = await this.roundRepository.findCurrent();
    if (!round) {
      throw new RoundNotFoundError();
    }

    // Validate round is in RUNNING state
    if (!round.isRunning()) {
      throw new RoundNotRunningError();
    }

    // Find player's active bet in current round
    const bet = await this.betRepository.findByRoundIdAndPlayerId(
      round.getId(),
      playerId,
    );

    if (!bet || !bet.canCashOut()) {
      throw new NoBetFoundError();
    }

    // Calculate current multiplier
    const now = new Date();
    const multiplier = this.multiplierService.calculateMultiplier(
      round.getStartedAt()!,
      now,
      round.getCrashPoint(),
    );

    // Calculate payout
    const payout = bet.getAmount().multiplyBy(multiplier.toNumber());

    // Transition bet to CASHED_OUT state
    const cashOutResult = bet.cashOut(multiplier);
    if (!cashOutResult.ok) {
      throw cashOutResult.error;
    }

    // Save bet
    await this.betRepository.save(bet);

    // Publish BetCashedOut event (to RabbitMQ for wallet credit)
    const event = new BetCashedOut(
      bet.getId(),
      bet.getRoundId(),
      bet.getPlayerId(),
      bet.getAmount(),
      multiplier,
      payout,
    );
    await this.eventPublisher.publish(event);

    return {
      multiplier: multiplier.toNumber(),
      payout: payout.toCentavos(),
    };
  }
}
