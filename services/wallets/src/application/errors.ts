/**
 * Application Layer Errors
 * 
 * Domain-specific errors that can occur during use case execution.
 */

/**
 * WalletAlreadyExistsError
 * 
 * Thrown when attempting to create a wallet for a player who already has one.
 */
export class WalletAlreadyExistsError extends Error {
  constructor(playerId: string) {
    super(`Wallet already exists for player ${playerId}`);
    this.name = 'WalletAlreadyExistsError';
  }
}

/**
 * WalletNotFoundError
 * 
 * Thrown when attempting to access a wallet that doesn't exist.
 */
export class WalletNotFoundError extends Error {
  constructor(playerId: string) {
    super(`Wallet not found for player ${playerId}`);
    this.name = 'WalletNotFoundError';
  }
}
