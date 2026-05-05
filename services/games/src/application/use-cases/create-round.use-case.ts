import { Injectable, Inject } from '@nestjs/common';
import { IRoundRepository, IEventPublisher } from '../../infrastructure/infrastructure.module';
import { ProvablyFairService } from '../../domain/services/provably-fair.service';
import { Round } from '../../domain/entities/round';
import { RoundCreated } from '../../domain/events/round-created';

/**
 * Create Round Use Case
 * Creates a new round with provably fair initialization
 */
@Injectable()
export class CreateRoundUseCase {
  constructor(
    @Inject(IRoundRepository)
    private readonly roundRepository: any,
    private readonly provablyFairService: ProvablyFairService,
    @Inject(IEventPublisher)
    private readonly eventPublisher: any,
  ) {}

  /**
   * Execute the use case
   * @returns Created round
   * @throws Error if creation fails
   */
  async execute(): Promise<Round> {
    // Create new round using provably fair service
    const round = Round.create(this.provablyFairService);

    console.log(`Created new round ${round.getId().toString()} with crash point: ${round.getCrashPoint().toNumber()}x`);

    // Save round to repository
    await this.roundRepository.save(round);

    // Publish RoundCreated event
    const event = new RoundCreated(
      round.getId(),
      round.getServerSeedHash(),
      round.getCrashPoint(),
    );
    await this.eventPublisher.publish(event);

    return round;
  }
}
