import apiClient from './api';
import {
  CreateWalletRequest,
  CreateWalletResponse,
  GetWalletResponse,
  HealthCheckResponse,
} from '../types/api';

/**
 * WalletService: Handles all wallet-related API calls
 * Requirement 2.5: Create WalletService class
 */
class WalletService {
  constructor() {
    // Use separate wallet API URL if configured, otherwise use default API URL
    // Note: Currently using the same API client, but this allows for future separation
    void (import.meta.env.VITE_WALLET_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001');
  }

  /**
   * Create a new wallet for a player
   * POST /wallets
   * Requirement 2.1.2: Create wallet
   */
  async createWallet(playerId: string): Promise<CreateWalletResponse> {
    try {
      const request: CreateWalletRequest = { playerId };
      const response = await apiClient.post<CreateWalletResponse>('/wallets', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create wallet');
    }
  }

  /**
   * Get current player's wallet balance
   * GET /wallets/me
   * Requirement 2.1.2: Get wallet balance
   */
  async getBalance(): Promise<GetWalletResponse> {
    try {
      const response = await apiClient.get<GetWalletResponse>('/wallets/me');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch wallet balance');
    }
  }

  /**
   * Get current player's wallet balance (shorthand)
   * Returns just the balance number
   */
  async getBalanceAmount(): Promise<number> {
    try {
      const wallet = await this.getBalance();
      return wallet.balance;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch wallet balance');
    }
  }

  /**
   * Health check endpoint
   * GET /health
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await apiClient.get<HealthCheckResponse>('/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Wallet service health check failed');
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

export const walletService = new WalletService();
export default walletService;
