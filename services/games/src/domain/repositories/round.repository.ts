import { Round } from '../entities/round';
import { RoundId } from '../value-objects/round-id';

/**
 * IRoundRepository
 * Repository interface for Round entity persistence
 */
export interface IRoundRepository {
  /**
   * Save a round (create or update)
   * @param round - Round entity to save
   * @returns Promise that resolves when save is complete
   */
  save(round: Round): Promise<void>;

  /**
   * Find a round by ID
   * @param id - RoundId to search for
   * @returns Promise resolving to Round or null if not found
   */
  findById(id: RoundId): Promise<Round | null>;

  /**
   * Find the current round (most recent non-finished round)
   * Searches for rounds in BETTING, RUNNING, or CRASHED state
   * @returns Promise resolving to Round or null if none found
   */
  findCurrent(): Promise<Round | null>;

  /**
   * Find finished rounds with pagination
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of rounds per page
   * @returns Promise resolving to paginated results
   */
  findFinished(
    page: number,
    pageSize: number
  ): Promise<{ rounds: Round[]; total: number }>;

  /**
   * Check if a round exists by ID
   * @param id - RoundId to check
   * @returns Promise resolving to true if round exists
   */
  existsById(id: RoundId): Promise<boolean>;
}
