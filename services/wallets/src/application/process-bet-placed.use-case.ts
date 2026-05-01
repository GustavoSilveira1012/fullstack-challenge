/**
 * ProcessBetPlacedUseCase
 * 
 * Use case for processing bet placed events from the Game Service.
 * Debits the wallet balance when a player places a bet.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 7.1, 7.2
 */

import { Injectable } from '@nestjs/common';
import type { IWalletRepository } from '../domain/wallet-repository';
import type { IEventPublisher } from '../infrastructure/messaging/event-publisher.interface';
import { PlayerId } from '../domain/player-id';
import { Money } from '../domain/money';
import { BalanceDebited, InsufficientBalanceErrorEvent } from '../domain/domain-event';
import { InsufficientBalanceError } from '../domain/wallet';
import { BetPlacedEventDto } from './dtos';
import { WalletNotFoundError } from './errors';

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

@Injectable()
export class ProcessBetPlacedUseCase {
  constructor(
    private readonly walletRepository: IWalletRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  /**
   * Executes the process bet placed use case.
   * 
   * @param eventDto - The bet placed event DTO from Game Service
   * @returns Result with void on success or error on failure
   */
  async execute(
    eventDto: BetPlacedEventDto
  ): Promise<Result<void, WalletNotFoundError | InsufficientBalanceError>> {
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

    // Call wallet.debit(amount)
    const debitResult = wallet.debit(amount);

    // If debit succeeds, save wallet and publish BalanceDebited event
    if (debitResult.ok) {
      await this.walletRepository.save(wallet);

      const event = new BalanceDebited(
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

    // If debit fails (insufficient balance), publish InsufficientBalanceError event
    const errorEvent = new InsufficientBalanceErrorEvent(
      wallet.getId(),
      playerId,
      amount,
      wallet.getBalance()
    );
    await this.eventPublisher.publish(errorEvent);

    return {
      ok: false,
      error: debitResult.error,
    };
  }
}
