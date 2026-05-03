/**
 * Place Bet DTO
 * Request body for placing a bet
 */
export class PlaceBetDto {
  /**
   * Bet amount in centavos (100 = 1.00)
   * Must be between 100 and 100000
   */
  amount!: number;
}
