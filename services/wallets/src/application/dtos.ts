import { IsString, IsNotEmpty, IsISO8601, Matches } from 'class-validator';export class CreateWalletDto {
}

export class WalletResponseDto {
  @IsString()
  @IsNotEmpty()
  readonly id: string;

  @IsString()
  @IsNotEmpty()
  readonly playerId: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]+$/, { message: 'balance must be a positive integer string' })
  readonly balance: string; // String representation of centavos

  @IsISO8601()
  readonly createdAt: string; // ISO 8601

  @IsISO8601()
  readonly updatedAt: string; // ISO 8601

  constructor(
    id: string,
    playerId: string,
    balance: string,
    createdAt: string,
    updatedAt: string
  ) {
    this.id = id;
    this.playerId = playerId;
    this.balance = balance;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
export class BetPlacedEventDto {
  @IsString()
  @IsNotEmpty()
  readonly eventId: string;

  @IsString()
  @IsNotEmpty()
  readonly playerId: string;

  @IsString()
  @IsNotEmpty()
  readonly betId: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[1-9][0-9]*$/, { message: 'amount must be a positive integer string' })
  readonly amount: string; // Centavos as string

  @IsISO8601()
  readonly timestamp: string; // ISO 8601

  constructor(
    eventId: string,
    playerId: string,
    betId: string,
    amount: string,
    timestamp: string
  ) {
    this.eventId = eventId;
    this.playerId = playerId;
    this.betId = betId;
    this.amount = amount;
    this.timestamp = timestamp;
  }
}
export class CashoutEventDto {
  @IsString()
  @IsNotEmpty()
  readonly eventId: string;

  @IsString()
  @IsNotEmpty()
  readonly playerId: string;

  @IsString()
  @IsNotEmpty()
  readonly betId: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[1-9][0-9]*$/, { message: 'amount must be a positive integer string' })
  readonly amount: string; // Centavos as string

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]+\.[0-9]{2}$/, { message: 'multiplier must be a decimal string with 2 decimal places' })
  readonly multiplier: string; // e.g., "2.50"

  @IsISO8601()
  readonly timestamp: string; // ISO 8601

  constructor(
    eventId: string,
    playerId: string,
    betId: string,
    amount: string,
    multiplier: string,
    timestamp: string
  ) {
    this.eventId = eventId;
    this.playerId = playerId;
    this.betId = betId;
    this.amount = amount;
    this.multiplier = multiplier;
    this.timestamp = timestamp;
  }
}
export class BetLostEventDto {
  @IsString()
  @IsNotEmpty()
  readonly eventId: string;

  @IsString()
  @IsNotEmpty()
  readonly playerId: string;

  @IsString()
  @IsNotEmpty()
  readonly betId: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[1-9][0-9]*$/, { message: 'amount must be a positive integer string' })
  readonly amount: string; // Centavos as string

  @IsISO8601()
  readonly timestamp: string; // ISO 8601

  constructor(
    eventId: string,
    playerId: string,
    betId: string,
    amount: string,
    timestamp: string
  ) {
    this.eventId = eventId;
    this.playerId = playerId;
    this.betId = betId;
    this.amount = amount;
    this.timestamp = timestamp;
  }
}

export class InsufficientBalanceErrorDto {
  @IsString()
  @IsNotEmpty()
  readonly eventId: string;

  @IsString()
  @IsNotEmpty()
  readonly playerId: string;

  @IsString()
  @IsNotEmpty()
  readonly betId: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[1-9][0-9]*$/, { message: 'requestedAmount must be a positive integer string' })
  readonly requestedAmount: string; // Centavos as string

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]+$/, { message: 'currentBalance must be a positive integer string' })
  readonly currentBalance: string; // Centavos as string

  @IsISO8601()
  readonly timestamp: string; // ISO 8601

  constructor(
    eventId: string,
    playerId: string,
    betId: string,
    requestedAmount: string,
    currentBalance: string,
    timestamp: string
  ) {
    this.eventId = eventId;
    this.playerId = playerId;
    this.betId = betId;
    this.requestedAmount = requestedAmount;
    this.currentBalance = currentBalance;
    this.timestamp = timestamp;
  }
}
