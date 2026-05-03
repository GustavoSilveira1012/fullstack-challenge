import { describe, it, expect } from 'vitest';
import gameService from '../gameService';

/**
 * GameService Unit Tests
 * Requirement 2.7: Write unit tests for API services
 */
describe('GameService', () => {
  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(gameService).toBeDefined();
    });

    it('should have placeBet method', () => {
      expect(gameService.placeBet).toBeDefined();
      expect(typeof gameService.placeBet).toBe('function');
    });

    it('should have cashOut method', () => {
      expect(gameService.cashOut).toBeDefined();
      expect(typeof gameService.cashOut).toBe('function');
    });

    it('should have getCurrentRound method', () => {
      expect(gameService.getCurrentRound).toBeDefined();
      expect(typeof gameService.getCurrentRound).toBe('function');
    });

    it('should have getRoundHistory method', () => {
      expect(gameService.getRoundHistory).toBeDefined();
      expect(typeof gameService.getRoundHistory).toBe('function');
    });

    it('should have getPlayerBetHistory method', () => {
      expect(gameService.getPlayerBetHistory).toBeDefined();
      expect(typeof gameService.getPlayerBetHistory).toBe('function');
    });

    it('should have verifyRound method', () => {
      expect(gameService.verifyRound).toBeDefined();
      expect(typeof gameService.verifyRound).toBe('function');
    });

    it('should have healthCheck method', () => {
      expect(gameService.healthCheck).toBeDefined();
      expect(typeof gameService.healthCheck).toBe('function');
    });
  });

  describe('Method Signatures', () => {
    it('placeBet should be callable', () => {
      expect(typeof gameService.placeBet).toBe('function');
    });

    it('getRoundHistory should be callable', () => {
      expect(typeof gameService.getRoundHistory).toBe('function');
    });

    it('getPlayerBetHistory should be callable', () => {
      expect(typeof gameService.getPlayerBetHistory).toBe('function');
    });

    it('verifyRound should be callable', () => {
      expect(typeof gameService.verifyRound).toBe('function');
    });
  });
});
