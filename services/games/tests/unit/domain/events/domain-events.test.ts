import { describe, it, expect, beforeEach } from 'vitest';
import {
  RoundCreated,
  RoundStarted,
  RoundCrashed,
  BetPlaced,
  BetCashedOut,
  BetLost,
  DomainEvent,
} from '../../../../src/domain/events';
import { RoundId } from '../../../../src/domain/value-objects/round-id';
import { BetId } from '../../../../src/domain/value-objects/bet-id';
import { PlayerId } from '../../../../src/domain/value-objects/player-id';
import { Money } from '../../../../src/domain/value-objects/money';
import { Multiplier } from '../../../../src/domain/value-objects/multiplier';
import { CrashPoint } from '../../../../src/domain/value-objects/crash-point';
import { ServerSeed } from '../../../../src/domain/value-objects/server-seed';
import { ServerSeedHash } from '../../../../src/domain/value-objects/server-seed-hash';

describe('Domain Events - Unit Tests', () => {
  let roundId: RoundId;
  let betId: BetId;
  let playerId: PlayerId;
  let amount: Money;
  let multiplier: Multiplier;
  let crashPoint: CrashPoint;
  let serverSeed: ServerSeed;
  let serverSeedHash: ServerSeedHash;
  let now: Date;

  beforeEach(() => {
    roundId = RoundId.create();
    betId = BetId.create();
    playerId = PlayerId.fromString('player-123').value;
    amount = Money.fromCentavos(BigInt(1000)).value; // 10.00
    multiplier = Multiplier.fromNumber(2.5).value;
    crashPoint = CrashPoint.fromMultiplier(multiplier).value;
    serverSeed = ServerSeed.generate();
    serverSeedHash = ServerSeedHash.fromServerSeed(serverSeed);
    now = new Date();
  });

  describe('RoundCreated Event', () => {
    it('should create a RoundCreated event with required fields', () => {
      const event = new RoundCreated(roundId, serverSeedHash, crashPoint, now);

      expect(event).toBeInstanceOf(RoundCreated);
      expect(event.roundId).toEqual(roundId);
      expect(event.serverSeedHash).toEqual(serverSeedHash);
      expect(event.crashPoint).toEqual(crashPoint);
      expect(event.occurredAt).toEqual(now);
      expect(event.eventId).toBeDefined();
      expect(typeof event.eventId).toBe('string');
    });

    it('should generate a unique eventId if not provided', () => {
      const event1 = new RoundCreated(roundId, serverSeedHash, crashPoint);
      const event2 = new RoundCreated(roundId, serverSeedHash, crashPoint);

      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should use current date as occurredAt if not provided', () => {
      const beforeCreation = new Date();
      const event = new RoundCreated(roundId, serverSeedHash, crashPoint);
      const afterCreation = new Date();

      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('should serialize to JSON correctly', () => {
      const event = new RoundCreated(roundId, serverSeedHash, crashPoint, now, 'event-123');
      const json = event.toJSON();

      expect(json.eventId).toBe('event-123');
      expect(json.occurredAt).toBe(now.toISOString());
      expect(json.roundId).toBe(roundId.toString());
      expect(json.serverSeedHash).toBe(serverSeedHash.toString());
      expect(json.crashPoint).toBe(crashPoint.toString());
    });

    it('should implement DomainEvent interface', () => {
      const event = new RoundCreated(roundId, serverSeedHash, crashPoint);

      expect(event).toHaveProperty('eventId');
      expect(event).toHaveProperty('occurredAt');
      expect(typeof event.eventId).toBe('string');
      expect(event.occurredAt).toBeInstanceOf(Date);
    });
  });

  describe('RoundStarted Event', () => {
    it('should create a RoundStarted event with required fields', () => {
      const event = new RoundStarted(roundId, now, now);

      expect(event).toBeInstanceOf(RoundStarted);
      expect(event.roundId).toEqual(roundId);
      expect(event.startedAt).toEqual(now);
      expect(event.occurredAt).toEqual(now);
      expect(event.eventId).toBeDefined();
    });

    it('should serialize to JSON correctly', () => {
      const event = new RoundStarted(roundId, now, now, 'event-456');
      const json = event.toJSON();

      expect(json.eventId).toBe('event-456');
      expect(json.occurredAt).toBe(now.toISOString());
      expect(json.roundId).toBe(roundId.toString());
      expect(json.startedAt).toBe(now.toISOString());
    });
  });

  describe('RoundCrashed Event', () => {
    it('should create a RoundCrashed event with required fields', () => {
      const event = new RoundCrashed(roundId, crashPoint, serverSeed, now, now);

      expect(event).toBeInstanceOf(RoundCrashed);
      expect(event.roundId).toEqual(roundId);
      expect(event.crashPoint).toEqual(crashPoint);
      expect(event.serverSeed).toEqual(serverSeed);
      expect(event.crashedAt).toEqual(now);
      expect(event.occurredAt).toEqual(now);
      expect(event.eventId).toBeDefined();
    });

    it('should serialize to JSON correctly', () => {
      const event = new RoundCrashed(roundId, crashPoint, serverSeed, now, now, 'event-789');
      const json = event.toJSON();

      expect(json.eventId).toBe('event-789');
      expect(json.occurredAt).toBe(now.toISOString());
      expect(json.roundId).toBe(roundId.toString());
      expect(json.crashPoint).toBe(crashPoint.toString());
      expect(json.serverSeed).toBe(serverSeed.toString());
      expect(json.crashedAt).toBe(now.toISOString());
    });
  });

  describe('BetPlaced Event', () => {
    it('should create a BetPlaced event with required fields', () => {
      const event = new BetPlaced(betId, roundId, playerId, amount, now);

      expect(event).toBeInstanceOf(BetPlaced);
      expect(event.betId).toEqual(betId);
      expect(event.roundId).toEqual(roundId);
      expect(event.playerId).toEqual(playerId);
      expect(event.amount).toEqual(amount);
      expect(event.occurredAt).toEqual(now);
      expect(event.eventId).toBeDefined();
    });

    it('should serialize to JSON correctly', () => {
      const event = new BetPlaced(betId, roundId, playerId, amount, now, 'event-111');
      const json = event.toJSON();

      expect(json.eventId).toBe('event-111');
      expect(json.occurredAt).toBe(now.toISOString());
      expect(json.betId).toBe(betId.toString());
      expect(json.roundId).toBe(roundId.toString());
      expect(json.playerId).toBe(playerId.toString());
      expect(json.amount).toBe(amount.toCentavos().toString());
    });

    it('should serialize amount as centavos string', () => {
      const testAmount = Money.fromCentavos(BigInt(12345)).value;
      const event = new BetPlaced(betId, roundId, playerId, testAmount, now);
      const json = event.toJSON();

      expect(json.amount).toBe('12345');
    });
  });

  describe('BetCashedOut Event', () => {
    it('should create a BetCashedOut event with required fields', () => {
      const payout = Money.fromCentavos(BigInt(2500)).value;
      const event = new BetCashedOut(betId, roundId, playerId, amount, multiplier, payout, now);

      expect(event).toBeInstanceOf(BetCashedOut);
      expect(event.betId).toEqual(betId);
      expect(event.roundId).toEqual(roundId);
      expect(event.playerId).toEqual(playerId);
      expect(event.amount).toEqual(amount);
      expect(event.multiplier).toEqual(multiplier);
      expect(event.payout).toEqual(payout);
      expect(event.occurredAt).toEqual(now);
      expect(event.eventId).toBeDefined();
    });

    it('should serialize to JSON correctly', () => {
      const payout = Money.fromCentavos(BigInt(2500)).value;
      const event = new BetCashedOut(
        betId,
        roundId,
        playerId,
        amount,
        multiplier,
        payout,
        now,
        'event-222',
      );
      const json = event.toJSON();

      expect(json.eventId).toBe('event-222');
      expect(json.occurredAt).toBe(now.toISOString());
      expect(json.betId).toBe(betId.toString());
      expect(json.roundId).toBe(roundId.toString());
      expect(json.playerId).toBe(playerId.toString());
      expect(json.amount).toBe(amount.toCentavos().toString());
      expect(json.multiplier).toBe(multiplier.toString());
      expect(json.payout).toBe(payout.toCentavos().toString());
    });

    it('should serialize multiplier as string with decimal places', () => {
      const testMultiplier = Multiplier.fromNumber(3.75).value;
      const payout = Money.fromCentavos(BigInt(3750)).value;
      const event = new BetCashedOut(betId, roundId, playerId, amount, testMultiplier, payout);
      const json = event.toJSON();

      expect(json.multiplier).toBe('3.75x');
    });
  });

  describe('BetLost Event', () => {
    it('should create a BetLost event with required fields', () => {
      const event = new BetLost(betId, roundId, playerId, amount, now);

      expect(event).toBeInstanceOf(BetLost);
      expect(event.betId).toEqual(betId);
      expect(event.roundId).toEqual(roundId);
      expect(event.playerId).toEqual(playerId);
      expect(event.amount).toEqual(amount);
      expect(event.occurredAt).toEqual(now);
      expect(event.eventId).toBeDefined();
    });

    it('should serialize to JSON correctly', () => {
      const event = new BetLost(betId, roundId, playerId, amount, now, 'event-333');
      const json = event.toJSON();

      expect(json.eventId).toBe('event-333');
      expect(json.occurredAt).toBe(now.toISOString());
      expect(json.betId).toBe(betId.toString());
      expect(json.roundId).toBe(roundId.toString());
      expect(json.playerId).toBe(playerId.toString());
      expect(json.amount).toBe(amount.toCentavos().toString());
    });
  });

  describe('Event Immutability', () => {
    it('RoundCreated should have readonly properties declared', () => {
      const event = new RoundCreated(roundId, serverSeedHash, crashPoint);

      // Verify all properties are defined
      expect(event).toHaveProperty('eventId');
      expect(event).toHaveProperty('occurredAt');
      expect(event).toHaveProperty('roundId');
      expect(event).toHaveProperty('serverSeedHash');
      expect(event).toHaveProperty('crashPoint');
    });

    it('BetPlaced should have readonly properties declared', () => {
      const event = new BetPlaced(betId, roundId, playerId, amount);

      // Verify all properties are defined
      expect(event).toHaveProperty('eventId');
      expect(event).toHaveProperty('occurredAt');
      expect(event).toHaveProperty('betId');
      expect(event).toHaveProperty('roundId');
      expect(event).toHaveProperty('playerId');
      expect(event).toHaveProperty('amount');
    });

    it('BetCashedOut should have readonly properties declared', () => {
      const payout = Money.fromCentavos(BigInt(2500)).value;
      const event = new BetCashedOut(betId, roundId, playerId, amount, multiplier, payout);

      // Verify all properties are defined
      expect(event).toHaveProperty('eventId');
      expect(event).toHaveProperty('occurredAt');
      expect(event).toHaveProperty('betId');
      expect(event).toHaveProperty('roundId');
      expect(event).toHaveProperty('playerId');
      expect(event).toHaveProperty('amount');
      expect(event).toHaveProperty('multiplier');
      expect(event).toHaveProperty('payout');
    });
  });

  describe('Event Serialization', () => {
    it('RoundCreated should serialize all fields to JSON', () => {
      const event = new RoundCreated(roundId, serverSeedHash, crashPoint, now, 'test-id');
      const json = event.toJSON();

      expect(Object.keys(json)).toContain('eventId');
      expect(Object.keys(json)).toContain('occurredAt');
      expect(Object.keys(json)).toContain('roundId');
      expect(Object.keys(json)).toContain('serverSeedHash');
      expect(Object.keys(json)).toContain('crashPoint');
    });

    it('BetPlaced should serialize all fields to JSON', () => {
      const event = new BetPlaced(betId, roundId, playerId, amount, now, 'test-id');
      const json = event.toJSON();

      expect(Object.keys(json)).toContain('eventId');
      expect(Object.keys(json)).toContain('occurredAt');
      expect(Object.keys(json)).toContain('betId');
      expect(Object.keys(json)).toContain('roundId');
      expect(Object.keys(json)).toContain('playerId');
      expect(Object.keys(json)).toContain('amount');
    });

    it('BetCashedOut should serialize all fields to JSON', () => {
      const payout = Money.fromCentavos(BigInt(2500)).value;
      const event = new BetCashedOut(
        betId,
        roundId,
        playerId,
        amount,
        multiplier,
        payout,
        now,
        'test-id',
      );
      const json = event.toJSON();

      expect(Object.keys(json)).toContain('eventId');
      expect(Object.keys(json)).toContain('occurredAt');
      expect(Object.keys(json)).toContain('betId');
      expect(Object.keys(json)).toContain('roundId');
      expect(Object.keys(json)).toContain('playerId');
      expect(Object.keys(json)).toContain('amount');
      expect(Object.keys(json)).toContain('multiplier');
      expect(Object.keys(json)).toContain('payout');
    });

    it('should serialize dates as ISO 8601 strings', () => {
      const testDate = new Date('2024-01-15T10:30:00Z');
      const event = new RoundCreated(roundId, serverSeedHash, crashPoint, testDate);
      const json = event.toJSON();

      expect(json.occurredAt).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should serialize monetary values as centavos strings', () => {
      const testAmount = Money.fromCentavos(BigInt(999)).value;
      const event = new BetPlaced(betId, roundId, playerId, testAmount);
      const json = event.toJSON();

      expect(json.amount).toBe('999');
      expect(typeof json.amount).toBe('string');
    });

    it('should be able to parse serialized JSON back to string values', () => {
      const event = new BetPlaced(betId, roundId, playerId, amount, now, 'event-id');
      const json = event.toJSON();
      const jsonString = JSON.stringify(json);
      const parsed = JSON.parse(jsonString);

      expect(parsed.eventId).toBe('event-id');
      expect(parsed.betId).toBe(betId.toString());
      expect(parsed.amount).toBe(amount.toCentavos().toString());
    });
  });

  describe('Event Creation with Default Values', () => {
    it('RoundCreated should generate eventId and use current date if not provided', () => {
      const beforeCreation = new Date();
      const event = new RoundCreated(roundId, serverSeedHash, crashPoint);
      const afterCreation = new Date();

      expect(event.eventId).toBeDefined();
      expect(event.eventId.length).toBeGreaterThan(0);
      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('BetPlaced should generate eventId and use current date if not provided', () => {
      const beforeCreation = new Date();
      const event = new BetPlaced(betId, roundId, playerId, amount);
      const afterCreation = new Date();

      expect(event.eventId).toBeDefined();
      expect(event.eventId.length).toBeGreaterThan(0);
      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('BetCashedOut should generate eventId and use current date if not provided', () => {
      const payout = Money.fromCentavos(BigInt(2500)).value;
      const beforeCreation = new Date();
      const event = new BetCashedOut(betId, roundId, playerId, amount, multiplier, payout);
      const afterCreation = new Date();

      expect(event.eventId).toBeDefined();
      expect(event.eventId.length).toBeGreaterThan(0);
      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });

  describe('Event Interface Compliance', () => {
    it('all events should implement DomainEvent interface', () => {
      const events: DomainEvent[] = [
        new RoundCreated(roundId, serverSeedHash, crashPoint),
        new RoundStarted(roundId, now),
        new RoundCrashed(roundId, crashPoint, serverSeed, now),
        new BetPlaced(betId, roundId, playerId, amount),
        new BetCashedOut(betId, roundId, playerId, amount, multiplier, amount),
        new BetLost(betId, roundId, playerId, amount),
      ];

      events.forEach((event) => {
        expect(event).toHaveProperty('eventId');
        expect(event).toHaveProperty('occurredAt');
        expect(typeof event.eventId).toBe('string');
        expect(event.occurredAt).toBeInstanceOf(Date);
      });
    });

    it('all events should have toJSON method', () => {
      const events = [
        new RoundCreated(roundId, serverSeedHash, crashPoint),
        new RoundStarted(roundId, now),
        new RoundCrashed(roundId, crashPoint, serverSeed, now),
        new BetPlaced(betId, roundId, playerId, amount),
        new BetCashedOut(betId, roundId, playerId, amount, multiplier, amount),
        new BetLost(betId, roundId, playerId, amount),
      ];

      events.forEach((event) => {
        expect(typeof event.toJSON).toBe('function');
        const json = event.toJSON();
        expect(typeof json).toBe('object');
        expect(json).not.toBeNull();
      });
    });
  });
});
