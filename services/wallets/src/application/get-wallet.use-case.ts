/**
 * GetWalletUseCase
 * 
 * Use case for retrieving a wallet by player ID.
 * 
 * Requirements: 2.1, 2.2, 2.3
 */

import { Injectable, Inject } from '@nestjs/common';
import type { IWalletRepository } from '../domain/wallet-repository';
import { PlayerId } from '../domain/player-id';
import { WalletResponseDto } from './dtos';
import { WalletNotFoundError } from './errors';

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

@Injectable()
export class GetWalletUseCase {
  constructor(@Inject('IWalletRepository') private readonly walletRepository: IWalletRepository) {}

  /**
   * Executes the get wallet use case.
   * 
   * @param playerId - The player ID whose wallet to retrieve
   * @returns Result with WalletResponseDto on success or WalletNotFoundError on failure
   */
  async execute(
    playerId: PlayerId
  ): Promise<Result<WalletResponseDto, WalletNotFoundError>> {
    // Find wallet by playerId
    const wallet = await this.walletRepository.findByPlayerId(playerId);

    // Return WalletNotFoundError if wallet doesn't exist
    if (!wallet) {
      return {
        ok: false,
        error: new WalletNotFoundError(playerId.toString()),
      };
    }

    // Map wallet entity to WalletResponseDto
    return {
      ok: true,
      value: new WalletResponseDto(
        wallet.getId().toString(),
        wallet.getPlayerId().toString(),
        wallet.getBalance().toCentavos().toString(),
        wallet.getCreatedAt().toISOString(),
        wallet.getUpdatedAt().toISOString()
      ),
    };
  }
}
