import { Injectable, Inject } from '@nestjs/common';
import { IRoundRepository } from '../../infrastructure/infrastructure.module';
import { ProvablyFairService } from '../../domain/services/provably-fair.service';
import { RoundId } from '../../domain/value-objects/round-id';

export class RoundNotFoundError extends Error {
  constructor(roundId: string) {
    super(`Round not found: ${roundId}`);
    this.name = 'RoundNotFoundError';
  }
}

export class RoundNotCrashedError extends Error {
  constructor() {
    super('Round has not crashed yet, server seed not revealed');
    this.name = 'RoundNotCrashedError';
  }
}

/**
 * Verify Round Use Case
 * Allows players to verify the fairness of a crashed round
 */
@Injectable()
export class VerifyRoundUseCase {
  constructor(
    @Inject(IRoundRepository)
    private readonly roundRepository: any,
    private readonly provablyFairService: ProvablyFairService,
  ) {}

  /**
   * Execute the use case
   * @param roundId - ID of round to verify
   * @returns Verification data
   * @throws RoundNotFoundError if round not found
   * @throws RoundNotCrashedError if round has not crashed
   */
  async execute(
    roundId: RoundId,
  ): Promise<{
    roundId: string;
    serverSeed: string;
    serverSeedHash: string;
    crashPoint: number;
    algorithm: string;
    verified: boolean;
  }> {
    // Find round by ID
    const round = await this.roundRepository.findById(roundId);
    if (!round) {
      throw new RoundNotFoundError(roundId.toString());
    }

    // Verify round has crashed (serverSeed is revealed)
    if (!round.hasCrashed()) {
      throw new RoundNotCrashedError();
    }

    // Verify crash point using provably fair service
    const verified = this.provablyFairService.verifyCrashPoint(
      round.getServerSeed(),
      round.getCrashPoint(),
    );

    return {
      roundId: round.getId().toString(),
      serverSeed: round.getServerSeed().toString(),
      serverSeedHash: round.getServerSeedHash().toString(),
      crashPoint: round.getCrashPoint().toNumber(),
      algorithm:
        'HMAC-SHA256 with 3% house edge. Formula: crashPoint = 99 / (1 - hashValue) * (1 - 0.03)',
      verified,
    };
  }
}
