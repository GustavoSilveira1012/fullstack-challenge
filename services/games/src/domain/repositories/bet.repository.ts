import { Bet } from '../entities/bet';
import { BetId } from '../value-objects/bet-id';
import { RoundId } from '../value-objects/round-id';
import { PlayerId } from '../value-objects/player-id';

/**
 * IBetRepository
 * Repository interface for Bet entity persistence
 */
export interface IBetRepository {
  /**
   * Save a bet (create or update)
   * @param bet - Bet entity to save
   * @returns Promise that resolves when save is complete
   */
  save(bet: Bet): Promise<void>;

  /**
   * Find a bet by ID
   * @param id - BetId to search for
   * @returns Promise resolving to Bet or null if not found
   */
  findById(id: BetId): Promise<Bet | null>;

  /**
   * Find all bets for a specific round
   * @param roundId - RoundId to search for
   * @returns Promise resolving to array of Bets
   */
  findByRoundId(roundId: RoundId): Promise<Bet[]>;

  /**
   * Find all bets for a specific player with pagination
   * @param playerId - PlayerId to search for
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of bets per page
   * @returns Promise resolving to paginated results
   */
  findByPlayerId(
    playerId: PlayerId,
    page: number,
    pageSize: number
  ): Promise<{ bets: Bet[]; total: number }>;

  /**
   * Find a bet by round and player (should be unique)
   * @param roundId - RoundId to search for
   * @param playerId - PlayerId to search for
   * @returns Promise resolving to Bet or null if not found
   */
  findByRoundIdAndPlayerId(
    roundId: RoundId,
    playerId: PlayerId
  ): Promise<Bet | null>;

  /**
   * Find all active bets for a specific round
   * Active bets are those in ACTIVE state
   * @param roundId - RoundId to search for
   * @returns Promise resolving to array of active Bets
   */
  findActiveByRoundId(roundId: RoundId): Promise<Bet[]>;

  /**
   * Check if a bet exists for a specific round and player
   * @param roundId - RoundId to check
   * @param playerId - PlayerId to check
   * @returns Promise resolving to true if bet exists
   */
  existsByRoundIdAndPlayerId(
    roundId: RoundId,
    playerId: PlayerId
  ): Promise<boolean>;
}
