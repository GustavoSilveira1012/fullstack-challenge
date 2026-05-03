import { BetState } from '../../domain/entities/bet';

/**
 * Bet Response DTO
 * Response body for bet operations
 */
export class BetResponseDto {
  readonly id: string;
  readonly roundId: string;
  readonly playerId: string;
  readonly amount: string; // Centavos as string
  readonly state: BetState;
  readonly cashOutMultiplier?: string;
  readonly payout?: string;
  readonly createdAt: string; // ISO 8601

  constructor(
    id: string,
    roundId: string,
    playerId: string,
    amount: string,
    state: BetState,
    createdAt: string,
    cashOutMultiplier?: string,
    payout?: string,
  ) {
    this.id = id;
    this.roundId = roundId;
    this.playerId = playerId;
    this.amount = amount;
    this.state = state;
    this.createdAt = createdAt;
    this.cashOutMultiplier = cashOutMultiplier;
    this.payout = payout;
  }
}
