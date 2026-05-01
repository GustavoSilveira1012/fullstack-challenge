/**
 * PrismaWalletRepository
 * 
 * Implements IWalletRepository using Prisma ORM for PostgreSQL persistence.
 * Handles mapping between domain entities and database records.
 * 
 * Requirements: 1.4, 4.4, 5.5, 7.2, 7.4, 11.3
 */

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IWalletRepository } from '../../domain/wallet-repository';
import { Wallet } from '../../domain/wallet';
import { WalletId } from '../../domain/wallet-id';
import { PlayerId } from '../../domain/player-id';
import { Money } from '../../domain/money';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaWalletRepository implements IWalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Saves a wallet to the database.
   * Uses upsert logic to create new wallet or update existing wallet.
   * Supports transaction context for atomic operations.
   * 
   * @param wallet - The wallet entity to save
   * @returns Promise that resolves when the wallet is saved
   */
  async save(wallet: Wallet): Promise<void> {
    const persistence = this.toPersistence(wallet);

    await this.prisma.wallet.upsert({
      where: { id: persistence.id },
      create: persistence,
      update: {
        balance: persistence.balance,
        updatedAt: persistence.updatedAt,
      },
    });
  }

  /**
   * Finds a wallet by its unique wallet ID.
   * 
   * @param id - The wallet ID to search for
   * @returns Promise that resolves to the wallet if found, or null if not found
   */
  async findById(id: WalletId): Promise<Wallet | null> {
    const record = await this.prisma.wallet.findUnique({
      where: { id: id.toString() },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  /**
   * Finds a wallet by the player ID.
   * 
   * @param playerId - The player ID to search for
   * @returns Promise that resolves to the wallet if found, or null if not found
   */
  async findByPlayerId(playerId: PlayerId): Promise<Wallet | null> {
    const record = await this.prisma.wallet.findUnique({
      where: { playerId: playerId.toString() },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  /**
   * Finds a wallet by player ID and acquires a database lock for update.
   * Uses SELECT FOR UPDATE to prevent concurrent modifications.
   * Must be used within a transaction for the lock to be effective.
   * 
   * @param playerId - The player ID to search for
   * @returns Promise that resolves to the wallet if found, or null if not found
   */
  async findByPlayerIdForUpdate(playerId: PlayerId): Promise<Wallet | null> {
    // Use raw query with FOR UPDATE clause for pessimistic locking
    const records = await this.prisma.$queryRaw<Array<{
      id: string;
      player_id: string;
      balance: bigint;
      created_at: Date;
      updated_at: Date;
    }>>`
      SELECT id, player_id, balance, created_at, updated_at
      FROM wallets
      WHERE player_id = ${playerId.toString()}
      FOR UPDATE
    `;

    if (records.length === 0) {
      return null;
    }

    const record = records[0];
    
    // Map snake_case to camelCase for toDomain method
    return this.toDomain({
      id: record.id,
      playerId: record.player_id,
      balance: record.balance,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    });
  }

  /**
   * Checks if a wallet exists for the given player ID.
   * Uses efficient count query without loading the full record.
   * 
   * @param playerId - The player ID to check
   * @returns Promise that resolves to true if a wallet exists, false otherwise
   */
  async existsByPlayerId(playerId: PlayerId): Promise<boolean> {
    const count = await this.prisma.wallet.count({
      where: { playerId: playerId.toString() },
    });

    return count > 0;
  }

  /**
   * Maps a Prisma database record to a Wallet domain entity.
   * 
   * @param record - The Prisma wallet record
   * @returns Wallet domain entity
   */
  private toDomain(record: {
    id: string;
    playerId: string;
    balance: bigint;
    createdAt: Date;
    updatedAt: Date;
  }): Wallet {
    // Parse value objects from database primitives
    const walletIdResult = WalletId.fromString(record.id);
    if (!walletIdResult.ok) {
      throw new Error(`Invalid wallet ID in database: ${record.id}`);
    }

    const playerIdResult = PlayerId.fromString(record.playerId);
    if (!playerIdResult.ok) {
      throw new Error(`Invalid player ID in database: ${record.playerId}`);
    }

    const moneyResult = Money.fromCentavos(record.balance);
    if (!moneyResult.ok) {
      throw new Error(`Invalid balance in database: ${record.balance}`);
    }

    // Create and return domain entity
    return new Wallet(
      walletIdResult.value,
      playerIdResult.value,
      moneyResult.value,
      record.createdAt,
      record.updatedAt
    );
  }

  /**
   * Maps a Wallet domain entity to a Prisma persistence record.
   * 
   * @param wallet - The wallet domain entity
   * @returns Prisma wallet record data
   */
  private toPersistence(wallet: Wallet): {
    id: string;
    playerId: string;
    balance: bigint;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: wallet.getId().toString(),
      playerId: wallet.getPlayerId().toString(),
      balance: wallet.getBalance().toCentavos(),
      createdAt: wallet.getCreatedAt(),
      updatedAt: wallet.getUpdatedAt(),
    };
  }
}
