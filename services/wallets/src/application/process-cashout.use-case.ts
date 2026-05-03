/**
 * ProcessCashoutUseCase
 * 
 * Use case for processing cashout events from the Game Service.
 * Credits the wallet balance when a player cashes out.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 7.1, 7.2
 */

import { Injectable, Inject } from '@nestjs/common';
import type { IWalletRepository } from '../domain/wallet-repository';
import type { IEventPublisher } from '../infrastructure/messaging/event-publisher.interface';
import { PlayerId } from '../domain/player-id';
import { Money } from '../domain/money';
import { BalanceCredited } from '../domain/domain-event';
import { CashoutEventDto } from './dtos';
import { WalletNotFoundError } from './errors';

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

@Injectable()
export class ProcessCashoutUseCase {
  constructor(
    @Inject('IWalletRepository') private readonly walletRepository: IWalletRepository,
    @Inject('IEventPublisher') private readonly eventPublisher: IEventPublisher
  ) {}

  /**
   * Executes the process cashout use case.
   * 
   * @param eventDto - The cashout event DTO from Game Service
   * @returns Result with void on success or WalletNotFoundError on failure
   */
  async execute(
    eventDto: CashoutEventDto
  ): Promise<Result<void, WalletNotFoundError>> {
    // Parse playerId from event DTO
    const playerIdResult = PlayerId.fromString(eventDto.playerId);
    if (!playerIdResult.ok) {
      throw new Error(`Invalid player ID in event: ${eventDto.playerId}`);
    }
    const playerId = playerIdResult.value;

    // Parse amount from event DTO to Money value object
    const amountBigInt = BigInt(eventDto.amount);
    const amountResult = Money.fromCentavos(amountBigInt);
    if (!amountResult.ok) {
      throw new Error(`Invalid amount in event: ${eventDto.amount}`);
    }
    const amount = amountResult.value;

    // Find wallet by playerId using findByPlayerIdForUpdate() (acquire lock)
    const wallet = await this.walletRepository.findByPlayerIdForUpdate(playerId);

    // Return WalletNotFoundError if wallet doesn't exist
    if (!wallet) {
      return {
        ok: false,
        error: new WalletNotFoundError(playerId.toString()),
      };
    }

    // Call wallet.credit(amount)
    wallet.credit(amount);

    // Save wallet and publish BalanceCredited event
    await this.walletRepository.save(wallet);

    const event = new BalanceCredited(
      wallet.getId(),
      amount,
      wallet.getBalance()
    );
    await this.eventPublisher.publish(event);

    return {
      ok: true,
      value: undefined,
    };
  }
}
