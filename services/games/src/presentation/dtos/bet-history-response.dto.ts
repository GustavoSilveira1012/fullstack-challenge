import { PaginationDto } from './round-history-response.dto';
import { BetState } from '../../domain/entities/bet';

/**
 * Bet History Item DTO
 * Summary of a player's bet
 */
export class BetHistoryItemDto {
  readonly id: string;
  readonly roundId: string;
  readonly amount: string;
  readonly state: BetState;
  readonly cashOutMultiplier?: string;
  readonly payout?: string;
  readonly createdAt: string;

  constructor(
    id: string,
    roundId: string,
    amount: string,
    state: BetState,
    createdAt: string,
    cashOutMultiplier?: string,
    payout?: string,
  ) {
    this.id = id;
    this.roundId = roundId;
    this.amount = amount;
    this.state = state;
    this.createdAt = createdAt;
    this.cashOutMultiplier = cashOutMultiplier;
    this.payout = payout;
  }
}

/**
 * Bet History Response DTO
 * Response body for bet history retrieval
 */
export class BetHistoryResponseDto {
  readonly bets: BetHistoryItemDto[];
  readonly pagination: PaginationDto;

  constructor(bets: BetHistoryItemDto[], pagination: PaginationDto) {
    this.bets = bets;
    this.pagination = pagination;
  }
}
