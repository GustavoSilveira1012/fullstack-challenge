import { Injectable, Inject } from '@nestjs/common';
import { IBetRepository } from '../../infrastructure/infrastructure.module';
import { PlayerId } from '../../domain/value-objects/player-id';
import { Bet } from '../../domain/entities/bet';

export class InvalidPaginationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPaginationError';
  }
}

/**
 * Get Player Bet History Use Case
 * Retrieves a player's bet history with pagination
 */
@Injectable()
export class GetPlayerBetHistoryUseCase {
  private readonly maxPageSize = 100;
  private readonly defaultPageSize = 20;

  constructor(
    @Inject(IBetRepository)
    private readonly betRepository: any,
  ) {}

  /**
   * Execute the use case
   * @param playerId - ID of player
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of bets per page
   * @returns Paginated bets
   * @throws InvalidPaginationError if parameters are invalid
   */
  async execute(
    playerId: PlayerId,
    page: number,
    pageSize: number,
  ): Promise<{ bets: Bet[]; total: number; page: number; pageSize: number }> {
    // Validate pagination parameters
    if (page < 1) {
      throw new InvalidPaginationError('Page must be >= 1');
    }

    let validPageSize = pageSize;
    if (validPageSize < 1) {
      validPageSize = this.defaultPageSize;
    }
    if (validPageSize > this.maxPageSize) {
      validPageSize = this.maxPageSize;
    }

    // Find bets for player with pagination
    const { bets, total } = await this.betRepository.findByPlayerId(
      playerId,
      page,
      validPageSize,
    );

    return { bets, total, page, pageSize: validPageSize };
  }
}
