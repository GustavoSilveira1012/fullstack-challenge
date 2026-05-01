/**
 * IWalletRepository Type
 * 
 * Repository type that defines the contract for wallet persistence operations.
 * This type is part of the domain layer and will be implemented by the infrastructure layer.
 * 
 * The repository provides methods for:
 * - Saving wallet state (create or update)
 * - Finding wallets by ID or player ID
 * - Acquiring locks for concurrent operations
 * - Checking wallet existence
 * 
 * Validates: Requirements 1.4, 2.1, 7.2, 14.4
 */

import { Wallet } from './wallet';
import { WalletId } from './wallet-id';
import { PlayerId } from './player-id';

export interface IWalletRepository {
  save(wallet: Wallet): Promise<void>;
  findById(id: WalletId): Promise<Wallet | null>;
  findByPlayerId(playerId: PlayerId): Promise<Wallet | null>;
  findByPlayerIdForUpdate(playerId: PlayerId): Promise<Wallet | null>;
  existsByPlayerId(playerId: PlayerId): Promise<boolean>;
}
