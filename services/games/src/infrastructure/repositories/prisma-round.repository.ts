import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IRoundRepository } from '../../domain/repositories/round.repository';
import { Round, RoundState } from '../../domain/entities/round';
import { RoundId } from '../../domain/value-objects/round-id';
import { ServerSeed } from '../../domain/value-objects/server-seed';
import { ServerSeedHash } from '../../domain/value-objects/server-seed-hash';
import { CrashPoint } from '../../domain/value-objects/crash-point';
import { Multiplier } from '../../domain/value-objects/multiplier';

/**
 * Prisma implementation of IRoundRepository
 * Handles persistence of Round entities to PostgreSQL via Prisma
 */
@Injectable()
export class PrismaRoundRepository implements IRoundRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Save a round to the database
   * Uses upsert to handle both create and update scenarios
   * @param round - Round entity to save
   * @throws Error if database operation fails
   */
  async save(round: Round): Promise<void> {
    const persistenceModel = this.toPersistence(round);

    await this.prisma.$transaction(async (tx: any) => {
      await tx.round.upsert({
        where: { id: persistenceModel.id },
        update: {
          state: persistenceModel.state,
          startedAt: persistenceModel.startedAt,
          crashedAt: persistenceModel.crashedAt,
          finishedAt: persistenceModel.finishedAt,
          version: persistenceModel.version,
        },
        create: persistenceModel,
      });
    });
  }

  /**
   * Find a round by ID
   * @param id - RoundId to search for
   * @returns Round entity or null if not found
   */
  async findById(id: RoundId): Promise<Round | null> {
    const record = await this.prisma.round.findUnique({
      where: { id: id.toString() },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  /**
   * Find the current active round
   * Returns the most recent round that is not finished
   * Priority: RUNNING > CRASHED > BETTING
   * @returns Round entity or null if no active round exists
   */
  async findCurrent(): Promise<Round | null> {
    // First try to find a RUNNING round
    let record = await this.prisma.round.findFirst({
      where: { state: RoundState.RUNNING },
      orderBy: { createdAt: 'desc' },
    });

    // If no RUNNING round, try CRASHED
    if (!record) {
      record = await this.prisma.round.findFirst({
        where: { state: RoundState.CRASHED },
        orderBy: { createdAt: 'desc' },
      });
    }

    // If no CRASHED round, try BETTING
    if (!record) {
      record = await this.prisma.round.findFirst({
        where: { state: RoundState.BETTING },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  /**
   * Find finished rounds with pagination
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of rounds per page
   * @returns Object with rounds array and total count
   */
  async findFinished(
    page: number,
    pageSize: number,
  ): Promise<{ rounds: Round[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const [records, total] = await Promise.all([
      this.prisma.round.findMany({
        where: { state: RoundState.FINISHED },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.round.count({
        where: { state: RoundState.FINISHED },
      }),
    ]);

    const rounds = records.map((record: any) => this.toDomain(record));

    return { rounds, total };
  }

  /**
   * Check if a round exists by ID
   * @param id - RoundId to check
   * @returns true if round exists, false otherwise
   */
  async existsById(id: RoundId): Promise<boolean> {
    const count = await this.prisma.round.count({
      where: { id: id.toString() },
    });

    return count > 0;
  }

  /**
   * Map Prisma record to Round domain entity
   * @param record - Prisma round record
   * @returns Round domain entity
   * @private
   */
  private toDomain(record: any): Round {
    const roundIdResult = RoundId.fromString(record.id);
    if (!roundIdResult.ok) {
      throw new Error(`Invalid round ID: ${record.id}`);
    }

    const serverSeedResult = ServerSeed.fromString(record.serverSeed);
    if (!serverSeedResult.ok) {
      throw new Error(`Invalid server seed: ${record.serverSeed}`);
    }

    const serverSeedHashResult = ServerSeedHash.fromString(
      record.serverSeedHash,
    );
    if (!serverSeedHashResult.ok) {
      throw new Error(`Invalid server seed hash: ${record.serverSeedHash}`);
    }

    const multiplierResult = Multiplier.fromNumber(
      Number(record.crashPoint),
    );
    if (!multiplierResult.ok) {
      throw new Error(`Invalid crash point: ${record.crashPoint}`);
    }

    const crashPoint = CrashPoint.fromMultiplier(multiplierResult.value);
    if (!crashPoint.ok) {
      throw new Error(`Invalid crash point multiplier: ${record.crashPoint}`);
    }

    return new Round(
      roundIdResult.value,
      serverSeedResult.value,
      serverSeedHashResult.value,
      crashPoint.value,
      record.state as RoundState,
      record.createdAt,
      record.startedAt,
      record.crashedAt,
      record.finishedAt,
      record.version,
    );
  }

  /**
   * Map Round domain entity to Prisma persistence model
   * @param round - Round domain entity
   * @returns Object ready for Prisma persistence
   * @private
   */
  private toPersistence(round: Round): any {
    return {
      id: round.getId().toString(),
      serverSeed: round.getServerSeed().toString(),
      serverSeedHash: round.getServerSeedHash().toString(),
      crashPoint: round.getCrashPoint().toNumber(),
      state: round.getState(),
      createdAt: round.getCreatedAt(),
      startedAt: round.getStartedAt(),
      crashedAt: round.getCrashedAt(),
      finishedAt: round.getFinishedAt(),
      version: round.getVersion(),
    };
  }
}
