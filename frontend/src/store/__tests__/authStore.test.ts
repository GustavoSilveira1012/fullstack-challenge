import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAuthStore } from '../authStore';

/**
 * AuthStore Unit Tests
 * Requirement 2.1.2: Display current user's wallet balance
 * Validates: Requirements 2.1.2
 */
describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      isAuthenticated: false,
      playerId: null,
      email: null,
      token: null,
    });
    // Clear localStorage mock
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.playerId).toBe(null);
      expect(state.email).toBe(null);
      expect(state.token).toBe(null);
    });

    it('should have login action', () => {
      const state = useAuthStore.getState();
      expect(typeof state.login).toBe('function');
    });

    it('should have logout action', () => {
      const state = useAuthStore.getState();
      expect(typeof state.logout).toBe('function');
    });

    it('should have setToken action', () => {
      const state = useAuthStore.getState();
      expect(typeof state.setToken).toBe('function');
    });

    it('should have setAuthenticated action', () => {
      const state = useAuthStore.getState();
      expect(typeof state.setAuthenticated).toBe('function');
    });
  });

  describe('Login Action', () => {
    it('should set authentication state when login is called', () => {
      const token = 'test-token-123';
      const playerId = 'player-456';
      const email = 'user@example.com';

      useAuthStore.getState().login(token, playerId, email);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe(token);
      expect(state.playerId).toBe(playerId);
      expect(state.email).toBe(email);
    });

    it('should persist token to localStorage on login', () => {
      const token = 'test-token-123';
      const playerId = 'player-456';
      const email = 'user@example.com';

      useAuthStore.getState().login(token, playerId, email);

      expect(localStorage.setItem).toHaveBeenCalledWith('token', token);
      expect(localStorage.setItem).toHaveBeenCalledWith('playerId', playerId);
      expect(localStorage.setItem).toHaveBeenCalledWith('email', email);
    });

    it('should handle login with different token formats', () => {
      const tokens = [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
        'short-token',
        'token-with-special-chars-!@#$%',
      ];

      tokens.forEach((token) => {
        useAuthStore.setState({
          isAuthenticated: false,
          token: null,
        });

        useAuthStore.getState().login(token, 'player-id', 'email@test.com');
        expect(useAuthStore.getState().token).toBe(token);
      });
    });

    it('should handle login with different email formats', () => {
      const emails = [
        'user@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com',
      ];

      emails.forEach((email) => {
        useAuthStore.setState({
          isAuthenticated: false,
          email: null,
        });

        useAuthStore.getState().login('token', 'player-id', email);
        expect(useAuthStore.getState().email).toBe(email);
      });
    });
  });

  describe('Logout Action', () => {
    it('should clear authentication state when logout is called', () => {
      // First login
      useAuthStore.getState().login('token', 'player-id', 'user@example.com');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Then logout
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBe(null);
      expect(state.playerId).toBe(null);
      expect(state.email).toBe(null);
    });

    it('should remove token from localStorage on logout', () => {
      useAuthStore.getState().login('token', 'player-id', 'user@example.com');
      vi.clearAllMocks();

      useAuthStore.getState().logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('playerId');
      expect(localStorage.removeItem).toHaveBeenCalledWith('email');
    });

    it('should handle logout when not authenticated', () => {
      // Should not throw error
      expect(() => {
        useAuthStore.getState().logout();
      }).not.toThrow();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('SetToken Action', () => {
    it('should update token when setToken is called', () => {
      const newToken = 'new-token-789';

      useAuthStore.getState().setToken(newToken);

      expect(useAuthStore.getState().token).toBe(newToken);
    });

    it('should persist new token to localStorage', () => {
      const newToken = 'new-token-789';

      useAuthStore.getState().setToken(newToken);

      expect(localStorage.setItem).toHaveBeenCalledWith('token', newToken);
    });

    it('should update token without affecting other state', () => {
      useAuthStore.getState().login('old-token', 'player-id', 'user@example.com');
      const oldState = useAuthStore.getState();

      useAuthStore.getState().setToken('new-token');

      const newState = useAuthStore.getState();
      expect(newState.token).toBe('new-token');
      expect(newState.playerId).toBe(oldState.playerId);
      expect(newState.email).toBe(oldState.email);
      expect(newState.isAuthenticated).toBe(oldState.isAuthenticated);
    });
  });

  describe('SetAuthenticated Action', () => {
    it('should update isAuthenticated flag', () => {
      useAuthStore.getState().setAuthenticated(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      useAuthStore.getState().setAuthenticated(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should update isAuthenticated without affecting other state', () => {
      useAuthStore.getState().login('token', 'player-id', 'user@example.com');
      const oldState = useAuthStore.getState();

      useAuthStore.getState().setAuthenticated(false);

      const newState = useAuthStore.getState();
      expect(newState.isAuthenticated).toBe(false);
      expect(newState.token).toBe(oldState.token);
      expect(newState.playerId).toBe(oldState.playerId);
      expect(newState.email).toBe(oldState.email);
    });
  });

  describe('State Immutability', () => {
    it('should not mutate state directly', () => {
      const state1 = useAuthStore.getState();
      useAuthStore.getState().login('token', 'player-id', 'user@example.com');
      const state2 = useAuthStore.getState();

      expect(state1).not.toBe(state2);
    });

    it('should create new state object on each update', () => {
      const state1 = useAuthStore.getState();
      useAuthStore.getState().setToken('new-token');
      const state2 = useAuthStore.getState();

      expect(state1).not.toBe(state2);
    });
  });

  describe('Multiple Sequential Operations', () => {
    it('should handle login followed by token update', () => {
      useAuthStore.getState().login('token-1', 'player-id', 'user@example.com');
      expect(useAuthStore.getState().token).toBe('token-1');

      useAuthStore.getState().setToken('token-2');
      expect(useAuthStore.getState().token).toBe('token-2');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('should handle login followed by logout followed by login', () => {
      useAuthStore.getState().login('token-1', 'player-1', 'user1@example.com');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      useAuthStore.getState().logout();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);

      useAuthStore.getState().login('token-2', 'player-2', 'user2@example.com');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().playerId).toBe('player-2');
      expect(useAuthStore.getState().email).toBe('user2@example.com');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string values', () => {
      useAuthStore.getState().login('', '', '');

      const state = useAuthStore.getState();
      expect(state.token).toBe('');
      expect(state.playerId).toBe('');
      expect(state.email).toBe('');
    });

    it('should handle very long token strings', () => {
      const longToken = 'x'.repeat(10000);
      useAuthStore.getState().login(longToken, 'player-id', 'user@example.com');

      expect(useAuthStore.getState().token).toBe(longToken);
    });

    it('should handle special characters in email', () => {
      const specialEmail = 'user+tag@sub.example.co.uk';
      useAuthStore.getState().login('token', 'player-id', specialEmail);

      expect(useAuthStore.getState().email).toBe(specialEmail);
    });
  });
});
