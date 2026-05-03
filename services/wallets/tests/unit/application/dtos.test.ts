/**
 * Unit tests for DTO validation
 * 
 * Tests validation decorators on DTOs to ensure proper input validation.
 */

import { describe, it, expect } from 'bun:test';
import { validate } from 'class-validator';
import {
  CreateWalletDto,
  WalletResponseDto,
  BetPlacedEventDto,
  CashoutEventDto,
  BetLostEventDto,
  InsufficientBalanceErrorDto,
} from '../../../src/application/dtos';

describe('CreateWalletDto', () => {
  it('should be instantiable (empty DTO - playerId from JWT)', () => {
    const dto = new CreateWalletDto();
    expect(dto).toBeDefined();
    expect(dto).toBeInstanceOf(CreateWalletDto);
  });
});

describe('WalletResponseDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = new WalletResponseDto(
      '123e4567-e89b-12d3-a456-426614174000',
      'player-123',
      '10000',
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject empty id', async () => {
    const dto = new WalletResponseDto(
      '',
      'player-123',
      '10000',
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('id');
  });

  it('should reject empty playerId', async () => {
    const dto = new WalletResponseDto(
      '123e4567-e89b-12d3-a456-426614174000',
      '',
      '10000',
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('playerId');
  });

  it('should reject invalid balance (negative)', async () => {
    const dto = new WalletResponseDto(
      '123e4567-e89b-12d3-a456-426614174000',
      'player-123',
      '-10000',
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'balance')).toBe(true);
  });

  it('should reject invalid balance (non-numeric)', async () => {
    const dto = new WalletResponseDto(
      '123e4567-e89b-12d3-a456-426614174000',
      'player-123',
      'abc',
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'balance')).toBe(true);
  });

  it('should accept zero balance', async () => {
    const dto = new WalletResponseDto(
      '123e4567-e89b-12d3-a456-426614174000',
      'player-123',
      '0',
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid ISO8601 timestamp for createdAt', async () => {
    const dto = new WalletResponseDto(
      '123e4567-e89b-12d3-a456-426614174000',
      'player-123',
      '10000',
      'invalid-date',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'createdAt')).toBe(true);
  });

  it('should reject invalid ISO8601 timestamp for updatedAt', async () => {
    const dto = new WalletResponseDto(
      '123e4567-e89b-12d3-a456-426614174000',
      'player-123',
      '10000',
      '2024-01-15T10:30:00.000Z',
      'invalid-date'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'updatedAt')).toBe(true);
  });
});

describe('BetPlacedEventDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = new BetPlacedEventDto(
      'event-123',
      'player-123',
      'bet-123',
      '10000',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject empty eventId', async () => {
    const dto = new BetPlacedEventDto(
      '',
      'player-123',
      'bet-123',
      '10000',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('eventId');
  });

  it('should reject empty playerId', async () => {
    const dto = new BetPlacedEventDto(
      'event-123',
      '',
      'bet-123',
      '10000',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('playerId');
  });

  it('should reject empty betId', async () => {
    const dto = new BetPlacedEventDto(
      'event-123',
      'player-123',
      '',
      '10000',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('betId');
  });

  it('should reject zero amount', async () => {
    const dto = new BetPlacedEventDto(
      'event-123',
      'player-123',
      'bet-123',
      '0',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'amount')).toBe(true);
  });

  it('should reject negative amount', async () => {
    const dto = new BetPlacedEventDto(
      'event-123',
      'player-123',
      'bet-123',
      '-10000',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'amount')).toBe(true);
  });

  it('should reject non-numeric amount', async () => {
    const dto = new BetPlacedEventDto(
      'event-123',
      'player-123',
      'bet-123',
      'abc',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'amount')).toBe(true);
  });

  it('should reject decimal amount', async () => {
    const dto = new BetPlacedEventDto(
      'event-123',
      'player-123',
      'bet-123',
      '100.50',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'amount')).toBe(true);
  });

  it('should reject invalid ISO8601 timestamp', async () => {
    const dto = new BetPlacedEventDto(
      'event-123',
      'player-123',
      'bet-123',
      '10000',
      'invalid-date'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'timestamp')).toBe(true);
  });
});

describe('CashoutEventDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = new CashoutEventDto(
      'event-123',
      'player-123',
      'bet-123',
      '25000',
      '2.50',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject empty eventId', async () => {
    const dto = new CashoutEventDto(
      '',
      'player-123',
      'bet-123',
      '25000',
      '2.50',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('eventId');
  });

  it('should reject zero amount', async () => {
    const dto = new CashoutEventDto(
      'event-123',
      'player-123',
      'bet-123',
      '0',
      '2.50',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'amount')).toBe(true);
  });

  it('should reject negative amount', async () => {
    const dto = new CashoutEventDto(
      'event-123',
      'player-123',
      'bet-123',
      '-25000',
      '2.50',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'amount')).toBe(true);
  });

  it('should reject invalid multiplier format (no decimal places)', async () => {
    const dto = new CashoutEventDto(
      'event-123',
      'player-123',
      'bet-123',
      '25000',
      '2',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'multiplier')).toBe(true);
  });

  it('should reject invalid multiplier format (one decimal place)', async () => {
    const dto = new CashoutEventDto(
      'event-123',
      'player-123',
      'bet-123',
      '25000',
      '2.5',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'multiplier')).toBe(true);
  });

  it('should reject invalid multiplier format (three decimal places)', async () => {
    const dto = new CashoutEventDto(
      'event-123',
      'player-123',
      'bet-123',
      '25000',
      '2.500',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'multiplier')).toBe(true);
  });

  it('should accept valid multiplier with two decimal places', async () => {
    const dto = new CashoutEventDto(
      'event-123',
      'player-123',
      'bet-123',
      '25000',
      '10.00',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid ISO8601 timestamp', async () => {
    const dto = new CashoutEventDto(
      'event-123',
      'player-123',
      'bet-123',
      '25000',
      '2.50',
      'invalid-date'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'timestamp')).toBe(true);
  });
});

describe('BetLostEventDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = new BetLostEventDto(
      'event-123',
      'player-123',
      'bet-123',
      '10000',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject empty eventId', async () => {
    const dto = new BetLostEventDto(
      '',
      'player-123',
      'bet-123',
      '10000',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('eventId');
  });

  it('should reject zero amount', async () => {
    const dto = new BetLostEventDto(
      'event-123',
      'player-123',
      'bet-123',
      '0',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'amount')).toBe(true);
  });

  it('should reject negative amount', async () => {
    const dto = new BetLostEventDto(
      'event-123',
      'player-123',
      'bet-123',
      '-10000',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'amount')).toBe(true);
  });

  it('should reject non-numeric amount', async () => {
    const dto = new BetLostEventDto(
      'event-123',
      'player-123',
      'bet-123',
      'abc',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'amount')).toBe(true);
  });

  it('should reject invalid ISO8601 timestamp', async () => {
    const dto = new BetLostEventDto(
      'event-123',
      'player-123',
      'bet-123',
      '10000',
      'invalid-date'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'timestamp')).toBe(true);
  });
});

describe('InsufficientBalanceErrorDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = new InsufficientBalanceErrorDto(
      'event-123',
      'player-123',
      'bet-123',
      '10000',
      '5000',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject empty eventId', async () => {
    const dto = new InsufficientBalanceErrorDto(
      '',
      'player-123',
      'bet-123',
      '10000',
      '5000',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('eventId');
  });

  it('should reject zero requestedAmount', async () => {
    const dto = new InsufficientBalanceErrorDto(
      'event-123',
      'player-123',
      'bet-123',
      '0',
      '5000',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'requestedAmount')).toBe(true);
  });

  it('should reject negative requestedAmount', async () => {
    const dto = new InsufficientBalanceErrorDto(
      'event-123',
      'player-123',
      'bet-123',
      '-10000',
      '5000',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'requestedAmount')).toBe(true);
  });

  it('should accept zero currentBalance', async () => {
    const dto = new InsufficientBalanceErrorDto(
      'event-123',
      'player-123',
      'bet-123',
      '10000',
      '0',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject negative currentBalance', async () => {
    const dto = new InsufficientBalanceErrorDto(
      'event-123',
      'player-123',
      'bet-123',
      '10000',
      '-5000',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'currentBalance')).toBe(true);
  });

  it('should reject non-numeric requestedAmount', async () => {
    const dto = new InsufficientBalanceErrorDto(
      'event-123',
      'player-123',
      'bet-123',
      'abc',
      '5000',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'requestedAmount')).toBe(true);
  });

  it('should reject non-numeric currentBalance', async () => {
    const dto = new InsufficientBalanceErrorDto(
      'event-123',
      'player-123',
      'bet-123',
      '10000',
      'abc',
      '2024-01-15T10:30:00.000Z'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'currentBalance')).toBe(true);
  });

  it('should reject invalid ISO8601 timestamp', async () => {
    const dto = new InsufficientBalanceErrorDto(
      'event-123',
      'player-123',
      'bet-123',
      '10000',
      '5000',
      'invalid-date'
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'timestamp')).toBe(true);
  });
});
