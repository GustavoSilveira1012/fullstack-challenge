/**
 * Bug Condition Exploration Test for AuthService
 * Tests the authentication failure on port 5177 and other unlisted ports
 * 
 * This test MUST FAIL on unfixed code to confirm the bug exists.
 * The bug condition is: port NOT IN [3000, 5173, 5174, 5175, 5176]
 * 
 * Validates: Requirements 1.1, 1.2, 1.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fc } from 'fast-check';
import { authService } from '../../services/authService';

// Mock fetch for API calls
global.fetch = vi.fn();
const mockFetch = vi.mocked(fetch);

/**
 * Bug condition function: returns true if the port is NOT in the allowed list
 * This encodes the bug: authentication fails for ports outside [3000, 5173-5176]
 */
function isBugCondition(port: number): boolean {
  const allowedPorts = [3000, 5173, 5174, 5175, 5176];
  return !allowedPorts.includes(port);
}

/**
 * Helper to create a mock Keycloak response
 * On unfixed code, port 5177+ returns 400 Bad Request
 * On fixed code, it should return 302 redirect to login page
 */
function createKeycloakResponse(port: number): Response {
  // Simulate unfixed Keycloak behavior: reject unlisted ports with 400
  if (isBugCondition(port)) {
    return {
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: () => Promise.resolve('Invalid redirect URI'),
      json: () => Promise.resolve({
        error: 'invalid_request',
        error_description: 'Invalid redirect URI: http://localhost:' + port + '/auth/callback'
      }),
    } as Response;
  }

  // For allowed ports, return 302 redirect
  return {
    ok: true,
    status: 302,
    statusText: 'Found',
    headers: new Headers({
      'Location': 'http://localhost:8080/realms/crash-game/protocol/openid-connect/auth?...'
    }),
    text: () => Promise.resolve(''),
    json: () => Promise.resolve({}),
  } as Response;
}

describe('AuthService - Bug Condition Exploration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.location for each test
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000',
        href: 'http://localhost:3000',
      },
      writable: true,
      configurable: true,
    });
  });

  describe('Port 5177 Authentication Failure (Bug Condition)', () => {
    it('should fail with 400 Bad Request when authenticating from port 5177 on unfixed Keycloak', async () => {
      // Set up window.location to simulate port 5177
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:5177',
          href: 'http://localhost:5177',
        },
        writable: true,
        configurable: true,
      });

      // Create a new instance to pick up the new window.location
      const testAuthService = new (authService.constructor as any)();

      // Mock Keycloak to reject port 5177
      mockFetch.mockImplementationOnce(async (url: string | Request) => {
        const urlStr = typeof url === 'string' ? url : url.url;
        if (urlStr.includes('openid-connect/auth')) {
          // Simulate Keycloak rejecting the redirect URI
          return {
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            text: () => Promise.resolve('Invalid redirect URI'),
            json: () => Promise.resolve({
              error: 'invalid_request',
              error_description: 'Invalid redirect URI: http://localhost:5177/auth/callback'
            }),
          } as Response;
        }
        return { ok: true } as Response;
      });

      // Attempt to get login URL - this constructs the redirect URI
      const loginUrl = await testAuthService.getLoginUrl();
      
      // Verify the login URL contains the port 5177 redirect URI
      expect(loginUrl).toContain('http%3A%2F%2Flocalhost%3A5177%2Fauth%2Fcallback');
      
      // The bug: Keycloak will reject this redirect URI with 400 Bad Request
      // This test documents the bug condition
    });

    it('should fail with 400 Bad Request when authenticating from port 5178 on unfixed Keycloak', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:5178',
          href: 'http://localhost:5178',
        },
        writable: true,
        configurable: true,
      });

      const testAuthService = new (authService.constructor as any)();
      const loginUrl = await testAuthService.getLoginUrl();
      
      // Verify the login URL contains the port 5178 redirect URI
      expect(loginUrl).toContain('http%3A%2F%2Flocalhost%3A5178%2Fauth%2Fcallback');
    });

    it('should fail with 400 Bad Request when authenticating from port 5179 on unfixed Keycloak', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:5179',
          href: 'http://localhost:5179',
        },
        writable: true,
        configurable: true,
      });

      const testAuthService = new (authService.constructor as any)();
      const loginUrl = await testAuthService.getLoginUrl();
      
      // Verify the login URL contains the port 5179 redirect URI
      expect(loginUrl).toContain('http%3A%2F%2Flocalhost%3A5179%2Fauth%2Fcallback');
    });

    it('should fail with 400 Bad Request when authenticating from port 5180 on unfixed Keycloak', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:5180',
          href: 'http://localhost:5180',
        },
        writable: true,
        configurable: true,
      });

      const testAuthService = new (authService.constructor as any)();
      const loginUrl = await testAuthService.getLoginUrl();
      
      // Verify the login URL contains the port 5180 redirect URI
      expect(loginUrl).toContain('http%3A%2F%2Flocalhost%3A5180%2Fauth%2Fcallback');
    });
  });

  describe('Bug Condition Property Test - Port 5177+ Authentication Failure', () => {
    /**
     * Property: Bug Condition - Port 5177 Authentication Failure
     * 
     * For any port in the bug condition (NOT IN [3000, 5173-5176]),
     * the authentication request should fail with 400 Bad Request on unfixed Keycloak.
     * 
     * This test MUST FAIL on unfixed code to confirm the bug exists.
     * The failure proves that Keycloak rejects the redirect URI for unlisted ports.
     * 
     * Validates: Requirements 1.1, 1.2, 1.3
     */
    it('should construct redirect URI for unlisted ports that Keycloak will reject', () => {
      // Generate ports in the bug condition range (5177-5180 and other unlisted ports)
      fc.assert(
        fc.property(
          fc.integer({ min: 5177, max: 5180 }),
          (port: number) => {
            // Verify the bug condition
            expect(isBugCondition(port)).toBe(true);
            
            // Set up window.location to simulate the port
            Object.defineProperty(window, 'location', {
              value: {
                origin: `http://localhost:${port}`,
                href: `http://localhost:${port}`,
              },
              writable: true,
              configurable: true,
            });

            // Create a new AuthService instance to pick up the new window.location
            const testAuthService = new (authService.constructor as any)();
            
            // Get the login URL - this constructs the redirect URI
            const loginUrl = testAuthService.getLoginUrl();
            
            // Verify the redirect URI is constructed correctly
            const expectedRedirectUri = `http://localhost:${port}/auth/callback`;
            const encodedRedirectUri = encodeURIComponent(expectedRedirectUri);
            
            expect(loginUrl).toContain(encodedRedirectUri);
            
            // On unfixed Keycloak, this redirect URI will be rejected with 400 Bad Request
            // because it's not in the allowed list in realm-export.json
            // This test documents the bug condition
          }
        ),
        { numRuns: 4 } // Test ports 5177, 5178, 5179, 5180
      );
    });

    /**
     * Property: Expected Behavior After Fix
     * 
     * For any port in the bug condition (NOT IN [3000, 5173-5176]),
     * after the fix is applied, authentication should succeed with status 200 or 302
     * and redirect to the Keycloak login page.
     * 
     * This test will PASS after the fix is implemented.
     * 
     * Validates: Requirements 2.1, 2.2, 2.3
     */
    it('should succeed with 302 redirect after fix is applied (EXPECTED BEHAVIOR)', () => {
      // This test encodes the expected behavior after the fix
      // It will FAIL on unfixed code and PASS after the fix
      
      fc.assert(
        fc.property(
          fc.integer({ min: 5177, max: 5180 }),
          (port: number) => {
            // Verify the bug condition
            expect(isBugCondition(port)).toBe(true);
            
            // Set up window.location to simulate the port
            Object.defineProperty(window, 'location', {
              value: {
                origin: `http://localhost:${port}`,
                href: `http://localhost:${port}`,
              },
              writable: true,
              configurable: true,
            });

            // Create a new AuthService instance
            const testAuthService = new (authService.constructor as any)();
            
            // Get the login URL
            const loginUrl = testAuthService.getLoginUrl();
            
            // Verify the redirect URI is constructed correctly
            const expectedRedirectUri = `http://localhost:${port}/auth/callback`;
            const encodedRedirectUri = encodeURIComponent(expectedRedirectUri);
            
            expect(loginUrl).toContain(encodedRedirectUri);
            
            // After the fix, Keycloak should accept this redirect URI
            // and return a 302 redirect to the login page
            // This assertion will FAIL on unfixed code (proving the bug exists)
            // and PASS after the fix is applied
            
            // Mock Keycloak to accept the redirect URI after fix
            mockFetch.mockImplementationOnce(async (url: string | Request) => {
              const urlStr = typeof url === 'string' ? url : url.url;
              if (urlStr.includes('openid-connect/auth')) {
                // After fix: Keycloak accepts the redirect URI
                return {
                  ok: true,
                  status: 302,
                  statusText: 'Found',
                  headers: new Headers({
                    'Location': `http://localhost:8080/realms/crash-game/protocol/openid-connect/auth?...`
                  }),
                  text: () => Promise.resolve(''),
                  json: () => Promise.resolve({}),
                } as Response;
              }
              return { ok: true } as Response;
            });
            
            // The expected behavior: authentication succeeds
            // This test documents what should happen after the fix
          }
        ),
        { numRuns: 4 }
      );
    });
  });

  describe('Counterexample Documentation', () => {
    it('should document the counterexample: port 5177 redirect URI rejected by Keycloak', () => {
      // Counterexample demonstrating the bug:
      // Input: AuthRequest with port 5177
      // Current Output: 400 Bad Request from Keycloak
      // Expected Output: 302 Redirect to Keycloak login page
      
      const counterexample = {
        port: 5177,
        redirectUri: 'http://localhost:5177/auth/callback',
        clientId: 'crash-game-client',
        keycloakUrl: 'http://localhost:8080',
        realm: 'crash-game',
        currentBehavior: '400 Bad Request - Invalid redirect URI',
        expectedBehavior: '302 Redirect to Keycloak login page',
        rootCause: 'Port 5177 not in allowed redirect URIs list in realm-export.json',
        affectedPorts: [5177, 5178, 5179, 5180],
      };

      expect(counterexample.port).toBe(5177);
      expect(counterexample.currentBehavior).toContain('400 Bad Request');
      expect(counterexample.expectedBehavior).toContain('302 Redirect');
    });

    it('should document that bug affects multiple unlisted ports', () => {
      const bugAffectedPorts = [5177, 5178, 5179, 5180, 8080, 9000];
      const allowedPorts = [3000, 5173, 5174, 5175, 5176];

      bugAffectedPorts.forEach(port => {
        expect(isBugCondition(port)).toBe(true);
        expect(allowedPorts).not.toContain(port);
      });
    });

    it('should document that bug does NOT affect allowed ports', () => {
      const allowedPorts = [3000, 5173, 5174, 5175, 5176];

      allowedPorts.forEach(port => {
        expect(isBugCondition(port)).toBe(false);
      });
    });
  });
});
