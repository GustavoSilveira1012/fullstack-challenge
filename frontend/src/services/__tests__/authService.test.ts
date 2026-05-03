import { describe, it, expect } from 'vitest';
import authService from '../authService';

/**
 * AuthService Unit Tests
 * Requirement 2.7: Write unit tests for API services
 */
describe('AuthService', () => {
  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(authService).toBeDefined();
    });

    it('should have getLoginUrl method', () => {
      expect(authService.getLoginUrl).toBeDefined();
      expect(typeof authService.getLoginUrl).toBe('function');
    });

    it('should have getLogoutUrl method', () => {
      expect(authService.getLogoutUrl).toBeDefined();
      expect(typeof authService.getLogoutUrl).toBe('function');
    });

    it('should have decodeToken method', () => {
      expect(authService.decodeToken).toBeDefined();
      expect(typeof authService.decodeToken).toBe('function');
    });

    it('should have isTokenExpired method', () => {
      expect(authService.isTokenExpired).toBeDefined();
      expect(typeof authService.isTokenExpired).toBe('function');
    });

    it('should have exchangeCodeForToken method', () => {
      expect(authService.exchangeCodeForToken).toBeDefined();
      expect(typeof authService.exchangeCodeForToken).toBe('function');
    });

    it('should have getUserInfo method', () => {
      expect(authService.getUserInfo).toBeDefined();
      expect(typeof authService.getUserInfo).toBe('function');
    });

    it('should have refreshToken method', () => {
      expect(authService.refreshToken).toBeDefined();
      expect(typeof authService.refreshToken).toBe('function');
    });

    it('should have login method', () => {
      expect(authService.login).toBeDefined();
      expect(typeof authService.login).toBe('function');
    });

    it('should have logout method', () => {
      expect(authService.logout).toBeDefined();
      expect(typeof authService.logout).toBe('function');
    });

    it('should have handleCallback method', () => {
      expect(authService.handleCallback).toBeDefined();
      expect(typeof authService.handleCallback).toBe('function');
    });
  });

  describe('URL Generation', () => {
    it('getLoginUrl should return a string', () => {
      const url = authService.getLoginUrl();
      expect(typeof url).toBe('string');
      expect(url.length).toBeGreaterThan(0);
    });

    it('getLoginUrl should contain Keycloak protocol endpoint', () => {
      const url = authService.getLoginUrl();
      expect(url).toContain('protocol/openid-connect/auth');
    });

    it('getLoginUrl should contain client_id parameter', () => {
      const url = authService.getLoginUrl();
      expect(url).toContain('client_id=');
    });

    it('getLoginUrl should contain redirect_uri parameter', () => {
      const url = authService.getLoginUrl();
      expect(url).toContain('redirect_uri=');
    });

    it('getLoginUrl should contain response_type parameter', () => {
      const url = authService.getLoginUrl();
      expect(url).toContain('response_type=code');
    });

    it('getLogoutUrl should return a string', () => {
      const url = authService.getLogoutUrl();
      expect(typeof url).toBe('string');
      expect(url.length).toBeGreaterThan(0);
    });

    it('getLogoutUrl should contain Keycloak logout endpoint', () => {
      const url = authService.getLogoutUrl();
      expect(url).toContain('protocol/openid-connect/logout');
    });
  });

  describe('Token Decoding', () => {
    it('decodeToken should throw error for invalid token format', () => {
      expect(() => authService.decodeToken('invalid-token')).toThrow();
    });

    it('decodeToken should throw error for malformed JWT', () => {
      expect(() => authService.decodeToken('header.invalid.signature')).toThrow();
    });

    it('decodeToken should decode valid JWT token', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: 'user-123', email: 'user@example.com' }));
      const token = `${header}.${payload}.signature`;

      const decoded = authService.decodeToken(token);
      expect(decoded.sub).toBe('user-123');
      expect(decoded.email).toBe('user@example.com');
    });
  });

  describe('Token Expiration', () => {
    it('isTokenExpired should return true for invalid token', () => {
      const result = authService.isTokenExpired('invalid-token');
      expect(result).toBe(true);
    });

    it('isTokenExpired should return true for expired token', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: 'user-123', exp: pastExp }));
      const token = `${header}.${payload}.signature`;

      const result = authService.isTokenExpired(token);
      expect(result).toBe(true);
    });

    it('isTokenExpired should return false for valid token', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: 'user-123', exp: futureExp }));
      const token = `${header}.${payload}.signature`;

      const result = authService.isTokenExpired(token);
      expect(result).toBe(false);
    });
  });

  describe('Method Signatures', () => {
    it('exchangeCodeForToken should accept code parameter', () => {
      const method = authService.exchangeCodeForToken;
      expect(method.length).toBeGreaterThanOrEqual(1);
    });

    it('getUserInfo should accept token parameter', () => {
      const method = authService.getUserInfo;
      expect(method.length).toBeGreaterThanOrEqual(1);
    });

    it('refreshToken should accept refreshToken parameter', () => {
      const method = authService.refreshToken;
      expect(method.length).toBeGreaterThanOrEqual(1);
    });

    it('handleCallback should accept code parameter', () => {
      const method = authService.handleCallback;
      expect(method.length).toBeGreaterThanOrEqual(1);
    });
  });
});
