/**
 * ProcessBetLostUseCase
 * 
 * Use case for processing bet lost events from the Game Service.
 * Logs the event for audit purposes but does not modify the balance
 * (balance was already debited when the bet was placed).
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */

import { Injectable, Logger } from '@nestjs/common';
import type { IWalletRepository } from '../domain/wallet-repository';
import { PlayerId } from '../domain/player-id';
import { BetLostEventDto } from './dtos';
import { WalletNotFoundError } from './errors';

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

@Injectable()
export class ProcessBetLostUseCase {
  private readonly logger = new Logger(ProcessBetLostUseCase.name);

  constructor(private readonly walletRepository: IWalletRepository) {}

  /**
   * Executes the process bet lost use case.
   * 
   * @param eventDto - The bet lost event DTO from Game Service
   * @returns Result with void on success or WalletNotFoundError on failure
   */
  async execute(
    eventDto: BetLostEventDto
  ): Promise<Result<void, WalletNotFoundError>> {
    // Parse playerId from event DTO
    const playerIdResult = PlayerId.fromString(eventDto.playerId);
    if (!playerIdResult.ok) {
      throw new Error(`Invalid player ID in event: ${eventDto.playerId}`);
    }
    const playerId = playerIdResult.value;

    // Find wallet by playerId to verify it exists
    const wallet = await this.walletRepository.findByPlayerId(playerId);

    // Return WalletNotFoundError if wallet doesn't exist
    if (!wallet) {
      return {
        ok: false,
        error: new WalletNotFoundError(playerId.toString()),
      };
    }

    // Log the event for audit purposes (no balance modification)
    this.logger.log({
      message: 'Bet lost event processed',
      eventId: eventDto.eventId,
      playerId: eventDto.playerId,
      betId: eventDto.betId,
      amount: eventDto.amount,
      timestamp: eventDto.timestamp,
      currentBalance: wallet.getBalance().toCentavos().toString(),
    });

    return {
      ok: true,
      value: undefined,
    };
  }
}
