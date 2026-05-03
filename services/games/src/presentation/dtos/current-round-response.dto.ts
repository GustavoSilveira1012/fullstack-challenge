import { RoundResponseDto } from './round-response.dto';
import { BetState } from '../../domain/entities/bet';

/**
 * Bet Summary DTO
 * Summary of a bet in current round
 */
export class BetSummaryDto {
  readonly playerId: string;
  readonly amount: string;
  readonly state: BetState;
  readonly cashOutMultiplier?: string;
  readonly payout?: string;

  constructor(
    playerId: string,
    amount: string,
    state: BetState,
    cashOutMultiplier?: string,
    payout?: string,
  ) {
    this.playerId = playerId;
    this.amount = amount;
    this.state = state;
    this.cashOutMultiplier = cashOutMultiplier;
    this.payout = payout;
  }
}

/**
 * Current Round Response DTO
 * Response body for current round retrieval
 */
export class CurrentRoundResponseDto {
  readonly round: RoundResponseDto;
  readonly bets: BetSummaryDto[];
  readonly remainingBettingTime?: number; // Seconds, only in BETTING state
  readonly currentMultiplier?: string; // Only in RUNNING state

  constructor(
    round: RoundResponseDto,
    bets: BetSummaryDto[],
    remainingBettingTime?: number,
    currentMultiplier?: string,
  ) {
    this.round = round;
    this.bets = bets;
    this.remainingBettingTime = remainingBettingTime;
    this.currentMultiplier = currentMultiplier;
  }
}
