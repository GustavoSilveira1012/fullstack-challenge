/**
 * CreateWalletUseCase
 * 
 * Use case for creating a new wallet for a player.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { Injectable } from '@nestjs/common';
import type { IWalletRepository } from '../domain/wallet-repository';
import type { IEventPublisher } from '../infrastructure/messaging/event-publisher.interface';
import { PlayerId } from '../domain/player-id';
import { WalletId } from '../domain/wallet-id';
import { Money } from '../domain/money';
import { Wallet } from '../domain/wallet';
import { WalletCreated } from '../domain/domain-event';
import { WalletResponseDto } from './dtos';
import { WalletAlreadyExistsError } from './errors';

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

@Injectable()
export class CreateWalletUseCase {
  constructor(
    private readonly walletRepository: IWalletRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  /**
   * Executes the create wallet use case.
   * 
   * @param playerId - The player ID for whom to create a wallet
   * @returns Result with WalletResponseDto on success or WalletAlreadyExistsError on failure
   */
  async execute(
    playerId: PlayerId
  ): Promise<Result<WalletResponseDto, WalletAlreadyExistsError>> {
    // Check if wallet already exists
    const exists = await this.walletRepository.existsByPlayerId(playerId);
    if (exists) {
      return {
        ok: false,
        error: new WalletAlreadyExistsError(playerId.toString()),
      };
    }

    // Create new wallet with zero balance
    const walletId = WalletId.create();
    const balance = Money.zero();
    const now = new Date();
    const wallet = new Wallet(walletId, playerId, balance, now, now);

    // Save wallet to repository
    await this.walletRepository.save(wallet);

    // Publish WalletCreated event
    const event = new WalletCreated(walletId, playerId);
    await this.eventPublisher.publish(event);

    // Return WalletResponseDto
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
