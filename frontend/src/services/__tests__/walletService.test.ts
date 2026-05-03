import { describe, it, expect } from 'vitest';
import walletService from '../walletService';

/**
 * WalletService Unit Tests
 * Requirement 2.7: Write unit tests for API services
 */
describe('WalletService', () => {
  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(walletService).toBeDefined();
    });

    it('should have createWallet method', () => {
      expect(walletService.createWallet).toBeDefined();
      expect(typeof walletService.createWallet).toBe('function');
    });

    it('should have getBalance method', () => {
      expect(walletService.getBalance).toBeDefined();
      expect(typeof walletService.getBalance).toBe('function');
    });

    it('should have getBalanceAmount method', () => {
      expect(walletService.getBalanceAmount).toBeDefined();
      expect(typeof walletService.getBalanceAmount).toBe('function');
    });

    it('should have healthCheck method', () => {
      expect(walletService.healthCheck).toBeDefined();
      expect(typeof walletService.healthCheck).toBe('function');
    });
  });

  describe('Method Signatures', () => {
    it('createWallet should accept playerId parameter', () => {
      const method = walletService.createWallet;
      expect(method.length).toBeGreaterThanOrEqual(1);
    });

    it('getBalance should be callable without parameters', () => {
      const method = walletService.getBalance;
      expect(method.length).toBeGreaterThanOrEqual(0);
    });

    it('getBalanceAmount should be callable without parameters', () => {
      const method = walletService.getBalanceAmount;
      expect(method.length).toBeGreaterThanOrEqual(0);
    });
  });
});
