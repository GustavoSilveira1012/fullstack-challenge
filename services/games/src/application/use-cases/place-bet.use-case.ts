import { Injectable, Inject } from '@nestjs/common';
import { IRoundRepository, IBetRepository, IEventPublisher } from '../../infrastructure/infrastructure.module';
import { PlayerId } from '../../domain/value-objects/player-id';
import { Money } from '../../domain/value-objects/money';
import { Bet } from '../../domain/entities/bet';
import { BetPlaced } from '../../domain/events/bet-placed';

export class RoundNotFoundError extends Error {
  constructor() {
    super('No active round found');
    this.name = 'RoundNotFoundError';
  }
}

export class BettingPhaseClosedError extends Error {
  constructor() {
    super('Betting phase is closed');
    this.name = 'BettingPhaseClosedError';
  }
}

export class InvalidBetAmountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBetAmountError';
  }
}

export class DuplicateBetError extends Error {
  constructor() {
    super('Player already has a bet in this round');
    this.name = 'DuplicateBetError';
  }
}

/**
 * Place Bet Use Case
 * Allows a player to place a bet during the betting phase
 */
@Injectable()
export class PlaceBetUseCase {
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
   * @param playerId - ID of player placing bet
   * @param amount - Bet amount in centavos
   * @returns Created bet
   * @throws Various errors if bet cannot be placed
   */
  async execute(playerId: PlayerId, amount: Money): Promise<Bet> {
    // Find current round
    const round = await this.roundRepository.findCurrent();
    if (!round) {
      throw new RoundNotFoundError();
    }

    // Validate round is in BETTING state
    if (!round.canAcceptBets()) {
      throw new BettingPhaseClosedError();
    }

    // Validate amount is within limits (100-100000 centavos)
    const minAmount = 100n;
    const maxAmount = 100000n;
    const centavos = amount.toCentavos();

    if (centavos < minAmount) {
      throw new InvalidBetAmountError(
        `Bet amount must be at least 100 centavos (1.00)`,
      );
    }

    if (centavos > maxAmount) {
      throw new InvalidBetAmountError(
        `Bet amount must be at most 100000 centavos (1000.00)`,
      );
    }

    // Check player doesn't already have a bet in this round
    const existingBet = await this.betRepository.findByRoundIdAndPlayerId(
      round.getId(),
      playerId,
    );

    if (existingBet) {
      throw new DuplicateBetError();
    }

    // Create bet entity
    const bet = Bet.create(round.getId(), playerId, amount);

    // Save bet
    await this.betRepository.save(bet);

    // Publish BetPlaced event (to RabbitMQ for wallet debit)
    const event = new BetPlaced(
      bet.getId(),
      bet.getRoundId(),
      bet.getPlayerId(),
      bet.getAmount(),
    );
    await this.eventPublisher.publish(event);

    return bet;
  }
}
