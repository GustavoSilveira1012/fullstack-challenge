import { Injectable, Inject } from '@nestjs/common';
import { IRoundRepository } from '../../infrastructure/infrastructure.module';
import { Round } from '../../domain/entities/round';

export class InvalidPaginationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPaginationError';
  }
}

/**
 * Get Round History Use Case
 * Retrieves finished rounds with pagination
 */
@Injectable()
export class GetRoundHistoryUseCase {
  private readonly maxPageSize = 100;
  private readonly defaultPageSize = 20;

  constructor(
    @Inject(IRoundRepository)
    private readonly roundRepository: any,
  ) {}

  /**
   * Execute the use case
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of rounds per page
   * @returns Paginated rounds
   * @throws InvalidPaginationError if parameters are invalid
   */
  async execute(
    page: number,
    pageSize: number,
  ): Promise<{ rounds: Round[]; total: number; page: number; pageSize: number }> {
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

    // Find finished rounds with pagination
    const { rounds, total } = await this.roundRepository.findFinished(
      page,
      validPageSize,
    );

    return { rounds, total, page, pageSize: validPageSize };
  }
}
