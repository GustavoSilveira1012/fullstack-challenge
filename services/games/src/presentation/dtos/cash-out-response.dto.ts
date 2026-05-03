/**
 * Cash Out Response DTO
 * Response body for cash out operations
 */
export class CashOutResponseDto {
  readonly betId: string;
  readonly multiplier: string; // e.g., "2.50"
  readonly payout: string; // Centavos as string
  readonly cashedOutAt: string; // ISO 8601

  constructor(
    betId: string,
    multiplier: string,
    payout: string,
    cashedOutAt: string,
  ) {
    this.betId = betId;
    this.multiplier = multiplier;
    this.payout = payout;
    this.cashedOutAt = cashedOutAt;
  }
}
