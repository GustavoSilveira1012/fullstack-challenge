import { Injectable, Inject } from '@nestjs/common';
import { IRoundRepository, IBetRepository, IEventPublisher } from '../../infrastructure/infrastructure.module';
import { RoundId } from '../../domain/value-objects/round-id';
import { RoundCrashed } from '../../domain/events/round-crashed';
import { BetLost } from '../../domain/events/bet-lost';

export class RoundNotFoundError extends Error {
  constructor(roundId: string) {
    super(`Round not found: ${roundId}`);
    this.name = 'RoundNotFoundError';
  }
}

/**
 * Process Round Crash Use Case
 * Handles round crash event and marks all active bets as lost
 */
@Injectable()
export class ProcessRoundCrashUseCase {
  constructor(
    @Inject(IRoundRepository)
    private readonly roundRepository: any,
    @Inject(IBetRepository)
    private readonly betRepository: any,
    @Inject(IEventPublisher)
    private readonly eventPublisher: any,
  ) {}

  /**
   * Execute the use case
   * @param roundId - ID of round that crashed
   * @throws RoundNotFoundError if round not found
   * @throws InvalidStateTransitionError if round cannot crash
   */
  async execute(roundId: RoundId): Promise<void> {
    // Find round by ID
    const round = await this.roundRepository.findById(roundId);
    if (!round) {
      throw new RoundNotFoundError(roundId.toString());
    }

    // Transition round to CRASHED state
    const crashResult = round.crash();
    if (!crashResult.ok) {
      throw crashResult.error;
    }

    // Find all ACTIVE bets for round
    const activeBets = await this.betRepository.findActiveByRoundId(roundId);

    // Transition all active bets to LOST state
    for (const bet of activeBets) {
      const lostResult = bet.markAsLost();
      if (!lostResult.ok) {
        throw lostResult.error;
      }
      await this.betRepository.save(bet);

      // Publish BetLost event for each lost bet
      const event = new BetLost(
        bet.getId(),
        bet.getRoundId(),
        bet.getPlayerId(),
        bet.getAmount(),
      );
      await this.eventPublisher.publish(event);
    }

    // Save round
    await this.roundRepository.save(round);

    // Publish RoundCrashed event
    const event = new RoundCrashed(
      roundId,
      round.getCrashPoint(),
      round.getServerSeed(),
      round.getCrashedAt()!,
    );
    await this.eventPublisher.publish(event);
  }
}
