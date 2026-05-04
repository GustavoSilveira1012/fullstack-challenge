/**
 * Integration Tests for AuthService
 * Tests the Keycloak OAuth2 integration functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../../services/authService';

// Mock fetch for API calls
global.fetch = vi.fn();
const mockFetch = vi.mocked(fetch);

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000',
  },
  writable: true,
});

describe('AuthService Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLoginUrl', () => {
    it('should generate correct Keycloak login URL', () => {
      const loginUrl = authService.getLoginUrl();
      
      expect(loginUrl).toContain('http://localhost:8080/realms/crash-game/protocol/openid-connect/auth');
      expect(loginUrl).toContain('client_id=crash-game-frontend');
      expect(loginUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback');
      expect(loginUrl).toContain('response_type=code');
      expect(loginUrl).toContain('scope=openid+profile+email');
      expect(loginUrl).toContain('state=');
    });
  });

  describe('getLogoutUrl', () => {
    it('should generate correct Keycloak logout URL', () => {
      const logoutUrl = authService.getLogoutUrl();
      
      expect(logoutUrl).toContain('http://localhost:8080/realms/crash-game/protocol/openid-connect/logout');
      expect(logoutUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Flogin');
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should exchange authorization code for tokens successfully', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      } as Response);

      const result = await authService.exchangeCodeForToken('test-auth-code');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/realms/crash-game/protocol/openid-connect/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );

      expect(result).toEqual(mockTokenResponse);
    });

    it('should throw error when token exchange fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

      await expect(authService.exchangeCodeForToken('invalid-code')).rejects.toThrow(
        'Token exchange failed: Failed to exchange code for token'
      );
    });
  });

  describe('getUserInfo', () => {
    it('should fetch user info successfully', async () => {
      const mockUserInfo = {
        sub: 'test-user-id',
        email: 'test@example.com',
        email_verified: true,
        name: 'Test User',
        preferred_username: 'testuser',
        given_name: 'Test',
        family_name: 'User',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      } as Response);

      const result = await authService.getUserInfo('test-access-token');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/realms/crash-game/protocol/openid-connect/userinfo',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-access-token',
          },
        })
      );

      expect(result).toEqual(mockUserInfo);
    });

    it('should throw error when user info fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      await expect(authService.getUserInfo('invalid-token')).rejects.toThrow(
        'Failed to fetch user info: Failed to fetch user info'
      );
    });
  });

  describe('decodeToken', () => {
    it('should decode JWT token correctly', () => {
      // Create a simple JWT token for testing
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ 
        sub: 'test-user-id',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      }));
      const signature = 'test-signature';
      const token = `${header}.${payload}.${signature}`;

      const decoded = authService.decodeToken(token);

      expect(decoded.sub).toBe('test-user-id');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should throw error for invalid token format', () => {
      expect(() => authService.decodeToken('invalid-token')).toThrow(
        'Failed to decode token: Invalid token format'
      );
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ 
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      }));
      const signature = 'test-signature';
      const token = `${header}.${payload}.${signature}`;

      expect(authService.isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ 
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      }));
      const signature = 'test-signature';
      const token = `${header}.${payload}.${signature}`;

      expect(authService.isTokenExpired(token)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(authService.isTokenExpired('invalid-token')).toBe(true);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockTokenResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      } as Response);

      const result = await authService.refreshToken('test-refresh-token');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/realms/crash-game/protocol/openid-connect/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );

      expect(result).toEqual(mockTokenResponse);
    });

    it('should throw error when token refresh fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

      await expect(authService.refreshToken('invalid-refresh-token')).rejects.toThrow(
        'Token refresh failed: Failed to refresh token'
      );
    });
  });

  describe('handleCallback', () => {
    it('should handle OAuth2 callback successfully', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      const mockUserInfo = {
        sub: 'test-user-id',
        email: 'test@example.com',
        email_verified: true,
        name: 'Test User',
        preferred_username: 'testuser',
        given_name: 'Test',
        family_name: 'User',
      };

      // Mock token exchange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      } as Response);

      // Mock user info fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      } as Response);

      await authService.handleCallback('test-auth-code');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      // Verify token exchange call
      expect(mockFetch).toHaveBeenNthCalledWith(1,
        'http://localhost:8080/realms/crash-game/protocol/openid-connect/token',
        expect.any(Object)
      );

      // Verify user info call
      expect(mockFetch).toHaveBeenNthCalledWith(2,
        'http://localhost:8080/realms/crash-game/protocol/openid-connect/userinfo',
        expect.any(Object)
      );
    });

    it('should throw error when callback handling fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

      await expect(authService.handleCallback('invalid-code')).rejects.toThrow(
        'Authentication callback failed'
      );
    });
  });
});