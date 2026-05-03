import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IBetRepository } from '../../domain/repositories/bet.repository';
import { Bet, BetState } from '../../domain/entities/bet';
import { BetId } from '../../domain/value-objects/bet-id';
import { RoundId } from '../../domain/value-objects/round-id';
import { PlayerId } from '../../domain/value-objects/player-id';
import { Money } from '../../domain/value-objects/money';
import { Multiplier } from '../../domain/value-objects/multiplier';

/**
 * Prisma implementation of IBetRepository
 * Handles persistence of Bet entities to PostgreSQL via Prisma
 */
@Injectable()
export class PrismaBetRepository implements IBetRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Save a bet to the database
   * Uses upsert to handle both create and update scenarios
   * @param bet - Bet entity to save
   * @throws Error if database operation fails
   */
  async save(bet: Bet): Promise<void> {
    const persistenceModel = this.toPersistence(bet);

    await this.prisma.$transaction(async (tx: any) => {
      await tx.bet.upsert({
        where: { id: persistenceModel.id },
        update: {
          state: persistenceModel.state,
          cashOutMultiplier: persistenceModel.cashOutMultiplier,
          payout: persistenceModel.payout,
          updatedAt: persistenceModel.updatedAt,
        },
        create: persistenceModel,
      });
    });
  }

  /**
   * Find a bet by ID
   * @param id - BetId to search for
   * @returns Bet entity or null if not found
   */
  async findById(id: BetId): Promise<Bet | null> {
    const record = await this.prisma.bet.findUnique({
      where: { id: id.toString() },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  /**
   * Find all bets for a specific round
   * @param roundId - RoundId to search for
   * @returns Array of Bet entities
   */
  async findByRoundId(roundId: RoundId): Promise<Bet[]> {
    const records = await this.prisma.bet.findMany({
      where: { roundId: roundId.toString() },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record: any) => this.toDomain(record));
  }

  /**
   * Find bets for a specific player with pagination
   * @param playerId - PlayerId to search for
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of bets per page
   * @returns Object with bets array and total count
   */
  async findByPlayerId(
    playerId: PlayerId,
    page: number,
    pageSize: number,
  ): Promise<{ bets: Bet[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const [records, total] = await Promise.all([
      this.prisma.bet.findMany({
        where: { playerId: playerId.toString() },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.bet.count({
        where: { playerId: playerId.toString() },
      }),
    ]);

    const bets = records.map((record: any) => this.toDomain(record));

    return { bets, total };
  }

  /**
   * Find a bet for a specific player in a specific round
   * @param roundId - RoundId to search for
   * @param playerId - PlayerId to search for
   * @returns Bet entity or null if not found
   */
  async findByRoundIdAndPlayerId(
    roundId: RoundId,
    playerId: PlayerId,
  ): Promise<Bet | null> {
    const record = await this.prisma.bet.findUnique({
      where: {
        roundId_playerId: {
          roundId: roundId.toString(),
          playerId: playerId.toString(),
        },
      },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  /**
   * Find all active bets for a specific round
   * Used during crash processing to identify bets that lost
   * @param roundId - RoundId to search for
   * @returns Array of active Bet entities
   */
  async findActiveByRoundId(roundId: RoundId): Promise<Bet[]> {
    const records = await this.prisma.bet.findMany({
      where: {
        roundId: roundId.toString(),
        state: BetState.ACTIVE,
      },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record: any) => this.toDomain(record));
  }

  /**
   * Check if a bet exists for a player in a round
   * @param roundId - RoundId to check
   * @param playerId - PlayerId to check
   * @returns true if bet exists, false otherwise
   */
  async existsByRoundIdAndPlayerId(
    roundId: RoundId,
    playerId: PlayerId,
  ): Promise<boolean> {
    const count = await this.prisma.bet.count({
      where: {
        roundId: roundId.toString(),
        playerId: playerId.toString(),
      },
    });

    return count > 0;
  }

  /**
   * Map Prisma record to Bet domain entity
   * @param record - Prisma bet record
   * @returns Bet domain entity
   * @private
   */
  private toDomain(record: any): Bet {
    const betIdResult = BetId.fromString(record.id);
    if (!betIdResult.ok) {
      throw new Error(`Invalid bet ID: ${record.id}`);
    }

    const roundIdResult = RoundId.fromString(record.roundId);
    if (!roundIdResult.ok) {
      throw new Error(`Invalid round ID: ${record.roundId}`);
    }

    const playerIdResult = PlayerId.fromString(record.playerId);
    if (!playerIdResult.ok) {
      throw new Error(`Invalid player ID: ${record.playerId}`);
    }

    const amountResult = Money.fromCentavos(BigInt(record.amount));
    if (!amountResult.ok) {
      throw new Error(`Invalid bet amount: ${record.amount}`);
    }

    let cashOutMultiplier: Multiplier | null = null;
    if (record.cashOutMultiplier !== null) {
      const multiplierResult = Multiplier.fromNumber(
        Number(record.cashOutMultiplier),
      );
      if (!multiplierResult.ok) {
        throw new Error(
          `Invalid cash out multiplier: ${record.cashOutMultiplier}`,
        );
      }
      cashOutMultiplier = multiplierResult.value;
    }

    let payout: Money | null = null;
    if (record.payout !== null) {
      const payoutResult = Money.fromCentavos(BigInt(record.payout));
      if (!payoutResult.ok) {
        throw new Error(`Invalid payout: ${record.payout}`);
      }
      payout = payoutResult.value;
    }

    return new Bet(
      betIdResult.value,
      roundIdResult.value,
      playerIdResult.value,
      amountResult.value,
      record.state as BetState,
      cashOutMultiplier,
      payout,
      record.createdAt,
      record.updatedAt,
    );
  }

  /**
   * Map Bet domain entity to Prisma persistence model
   * @param bet - Bet domain entity
   * @returns Object ready for Prisma persistence
   * @private
   */
  private toPersistence(bet: Bet): any {
    return {
      id: bet.getId().toString(),
      roundId: bet.getRoundId().toString(),
      playerId: bet.getPlayerId().toString(),
      amount: bet.getAmount().toCentavos(),
      state: bet.getState(),
      cashOutMultiplier:
        bet.getCashOutMultiplier() !== null
          ? bet.getCashOutMultiplier()!.toNumber()
          : null,
      payout: bet.getPayout() !== null ? bet.getPayout()!.toCentavos() : null,
      createdAt: bet.getCreatedAt(),
      updatedAt: bet.getUpdatedAt(),
    };
  }
}
