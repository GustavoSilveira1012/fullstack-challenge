import apiClient from './api';
import {
  PlaceBetRequest,
  PlaceBetResponse,
  CashOutResponse,
  CurrentRoundResponse,
  RoundHistoryResponse,
  PlayerBetHistoryResponse,
  VerifyRoundResponse,
  HealthCheckResponse,
} from '../types/api';

/**
 * GameService: Handles all game-related API calls
 * Requirement 2.4: Create GameService class with all endpoints
 */
class GameService {
  /**
   * Place a bet for the current round
   * POST /games/bet
   * Requirement 2.3.3: Place bet endpoint
   */
  async placeBet(amount: number): Promise<PlaceBetResponse> {
    try {
      const request: PlaceBetRequest = { amount };
      const response = await apiClient.post<PlaceBetResponse>('/games/bet', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to place bet');
    }
  }

  /**
   * Cash out the current active bet
   * POST /games/bet/cashout
   * Requirement 2.4.2: Cash out endpoint
   */
  async cashOut(): Promise<CashOutResponse> {
    try {
      const response = await apiClient.post<CashOutResponse>('/games/bet/cashout');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to cash out');
    }
  }

  /**
   * Get the current round information
   * GET /games/rounds/current
   * Requirement 2.2.1: Get current round
   */
  async getCurrentRound(): Promise<CurrentRoundResponse> {
    try {
      const response = await apiClient.get<CurrentRoundResponse>('/games/rounds/current');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch current round');
    }
  }

  /**
   * Get round history with pagination
   * GET /games/rounds/history
   * Requirement 2.2.4: Get round history
   */
  async getRoundHistory(page: number = 1, pageSize: number = 10): Promise<RoundHistoryResponse> {
    try {
      const response = await apiClient.get<RoundHistoryResponse>('/games/rounds/history', {
        params: { page, pageSize },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch round history');
    }
  }

  /**
   * Get player's bet history with pagination
   * GET /games/bets/me
   * Requirement 2.6.1: Get player bet history
   */
  async getPlayerBetHistory(page: number = 1, pageSize: number = 50): Promise<PlayerBetHistoryResponse> {
    try {
      const response = await apiClient.get<PlayerBetHistoryResponse>('/games/bets/me', {
        params: { page, pageSize },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch bet history');
    }
  }

  /**
   * Verify round fairness (provably fair)
   * GET /games/rounds/:roundId/verify
   * Requirement 2.6.3: Verify round fairness
   */
  async verifyRound(
    roundId: string,
    serverSeedHash: string,
    clientSeed: string
  ): Promise<VerifyRoundResponse> {
    try {
      const response = await apiClient.get<VerifyRoundResponse>(
        `/games/rounds/${roundId}/verify`,
        {
          params: { serverSeedHash, clientSeed },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to verify round');
    }
  }

  /**
   * Health check endpoint
   * GET /games/health
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await apiClient.get<HealthCheckResponse>('/games/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Health check failed');
    }
  }

  /**
   * Handle API errors and provide meaningful error messages
   */
  private handleError(error: any, defaultMessage: string): Error {
    if (error.status !== undefined) {
      // API error response
      const message = error.message || defaultMessage;
      const apiError = new Error(message);
      (apiError as any).status = error.status;
      (apiError as any).data = error.data;
      return apiError;
    }

    // Network or other error
    return new Error(error.message || defaultMessage);
  }
}

export const gameService = new GameService();
export default gameService;
