import apiClient from './api';
import { useAuthStore } from '../store/authStore';
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
  private walletBaseUrl: string;

  constructor() {
    // Use separate wallet API URL if configured, otherwise use default API URL
    this.walletBaseUrl = import.meta.env.VITE_WALLET_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000';
  }

  /**
   * Create a new wallet for a player
   * POST /wallets
   */
  async createWallet(playerId: string): Promise<CreateWalletResponse> {
    try {
      const request: CreateWalletRequest = { playerId };
      const response = await apiClient.post<CreateWalletResponse>('/wallets', request, {
        baseURL: this.walletBaseUrl,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create wallet');
    }
  }

  /**
   * Get current player's wallet balance
   * GET /wallets/me
   */
  async getBalance(): Promise<GetWalletResponse> {
    try {
      console.log('[WalletService] Fetching balance from:', `${this.walletBaseUrl}/wallets/me`);
      const response = await apiClient.get<GetWalletResponse>('/wallets/me', {
        baseURL: this.walletBaseUrl,
      });
      console.log('[WalletService] Balance response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[WalletService] Error fetching balance:', error);
      // If wallet not found (404), attempt to create it automatically
      if (error.status === 404) {
        console.log('Wallet not found, creating new wallet for player...');
        try {
          // We don't strictly need playerId here as the backend extracts it from the JWT
          const newWallet = await this.createWallet('');
          console.log('[WalletService] New wallet created:', newWallet);
          return {
            id: newWallet.id,
            playerId: newWallet.playerId,
            balance: newWallet.balance, // This should already be a string from the API
            createdAt: newWallet.createdAt,
            updatedAt: newWallet.updatedAt
          };
        } catch (createError) {
          console.error('Failed to auto-create wallet:', createError);
          throw this.handleError(createError, 'Failed to create wallet after 404');
        }
      }
      throw this.handleError(error, 'Failed to fetch wallet balance');
    }
  }

  /**
   * Get current player's wallet balance (shorthand)
   * Returns just the balance number
   */
  async getBalanceAmount(): Promise<number> {
    try {
      console.log('[WalletService] getBalanceAmount called');
      const wallet = await this.getBalance();
      console.log('[WalletService] getBalanceAmount raw response:', wallet);
      
      // Parse balance from string to number (backend returns balance as string in centavos)
      const balanceNumber = parseInt(wallet.balance.toString(), 10);
      console.log('[WalletService] getBalanceAmount parsed balance:', balanceNumber);
      
      return balanceNumber;
    } catch (error) {
      console.error('[WalletService] getBalanceAmount error:', error);
      throw this.handleError(error, 'Failed to fetch wallet balance');
    }
  }

  /**
   * Health check endpoint
   * GET /health
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await apiClient.get<HealthCheckResponse>('/health', {
        baseURL: this.walletBaseUrl,
      });
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
