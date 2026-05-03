import { Injectable, Inject } from '@nestjs/common';
import { IRoundRepository, IBetRepository, IEventPublisher } from '../../infrastructure/infrastructure.module';
import { RoundId } from '../../domain/value-objects/round-id';
import { RoundStarted } from '../../domain/events/round-started';

export class RoundNotFoundError extends Error {
  constructor(roundId: string) {
    super(`Round not found: ${roundId}`);
    this.name = 'RoundNotFoundError';
  }
}

/**
 * Start Round Use Case
 * Transitions a round from BETTING to RUNNING state
 * Activates all pending bets
 */
@Injectable()
export class StartRoundUseCase {
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
   * @param roundId - ID of round to start
   * @throws RoundNotFoundError if round not found
   * @throws InvalidStateTransitionError if round cannot be started
   */
  async execute(roundId: RoundId): Promise<void> {
    // Find round by ID
    const round = await this.roundRepository.findById(roundId);
    if (!round) {
      throw new RoundNotFoundError(roundId.toString());
    }

    // Transition round to RUNNING state
    const startResult = round.start();
    if (!startResult.ok) {
      throw startResult.error;
    }

    // Find all PENDING bets for round
    const bets = await this.betRepository.findByRoundId(roundId);

    // Transition all bets to ACTIVE state
    for (const bet of bets) {
      const activateResult = bet.activate();
      if (!activateResult.ok) {
        throw activateResult.error;
      }
      await this.betRepository.save(bet);
    }

    // Save round
    await this.roundRepository.save(round);

    // Publish RoundStarted event
    const event = new RoundStarted(roundId, round.getStartedAt()!);
    await this.eventPublisher.publish(event);
  }
}
