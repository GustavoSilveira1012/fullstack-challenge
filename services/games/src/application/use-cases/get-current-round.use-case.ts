import { Injectable, Inject } from '@nestjs/common';
import { IRoundRepository, IBetRepository } from '../../infrastructure/infrastructure.module';
import { Round } from '../../domain/entities/round';
import { Bet } from '../../domain/entities/bet';

export class RoundNotFoundError extends Error {
  constructor() {
    super('No active round found');
    this.name = 'RoundNotFoundError';
  }
}

/**
 * Get Current Round Use Case
 * Retrieves the current active round with all its bets
 */
@Injectable()
export class GetCurrentRoundUseCase {
  constructor(
    @Inject(IRoundRepository)
    private readonly roundRepository: any,
    @Inject(IBetRepository)
    private readonly betRepository: any,
  ) {}

  /**
   * Execute the use case
   * @returns Current round with bets
   * @throws RoundNotFoundError if no active round exists
   */
  async execute(): Promise<{ round: Round; bets: Bet[] }> {
    // Find current round
    const round = await this.roundRepository.findCurrent();
    if (!round) {
      throw new RoundNotFoundError();
    }

    // Find all bets for current round
    const bets = await this.betRepository.findByRoundId(round.getId());

    return { round, bets };
  }
}
