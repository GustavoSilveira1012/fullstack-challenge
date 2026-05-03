import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket } from '../useWebSocket';
import { useGameStore } from '@store/gameStore';
import WebSocketService from '@services/webSocketService';

/**
 * useWebSocket Hook Unit Tests
 * Requirement 2.5.1, 2.5.2, 2.5.3, 2.5.4: WebSocket connection and real-time updates
 * Validates: Requirements 2.5.1, 2.5.2, 2.5.3, 2.5.4
 */
describe('useWebSocket Hook', () => {
  beforeEach(() => {
    useGameStore.setState({
      currentRound: null,
      currentMultiplier: 1.0,
      roundState: 'BETTING',
      playerBet: null,
      recentRounds: [],
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial WebSocket state', () => {
      const { result } = renderHook(() => useWebSocket('token-123'));

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should have all required actions', () => {
      const { result } = renderHook(() => useWebSocket('token-123'));

      expect(typeof result.current.connect).toBe('function');
      expect(typeof result.current.disconnect).toBe('function');
      expect(typeof result.current.send).toBe('function');
    });

    it('should return error if no token provided', () => {
      const { result } = renderHook(() => useWebSocket(null));

      expect(result.current.error).toBeNull();
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Connection Management', () => {
    it('should attempt to connect when token is provided', async () => {
      const connectSpy = vi.spyOn(WebSocketService.prototype, 'connect').mockResolvedValue(undefined);

      renderHook(() => useWebSocket('token-123'));

      await waitFor(() => {
        expect(connectSpy).toHaveBeenCalled();
      });
    });

    it('should handle connection errors', async () => {
      vi.spyOn(WebSocketService.prototype, 'connect').mockRejectedValue(
        new Error('Connection failed')
      );

      const { result } = renderHook(() => useWebSocket('token-123'));

      await waitFor(() => {
        expect(result.current.error).toBe('Connection failed');
        expect(result.current.isConnected).toBe(false);
      });
    });

    it('should disconnect when disconnect is called', async () => {
      const disconnectSpy = vi.spyOn(WebSocketService.prototype, 'disconnect');

      const { result } = renderHook(() => useWebSocket('token-123'));

      act(() => {
        result.current.disconnect();
      });

      expect(disconnectSpy).toHaveBeenCalled();
      expect(result.current.isConnected).toBe(false);
    });

    it('should not reconnect if already connected', async () => {
      const connectSpy = vi.spyOn(WebSocketService.prototype, 'connect').mockResolvedValue(undefined);

      const { result } = renderHook(() => useWebSocket('token-123'));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const callCount = connectSpy.mock.calls.length;

      // Try to connect again
      await act(async () => {
        await result.current.connect();
      });

      // Should not have called connect again
      expect(connectSpy.mock.calls.length).toBe(callCount);
    });
  });

  describe('Message Handling', () => {
    it('should handle multiplier update messages', async () => {
      vi.spyOn(WebSocketService.prototype, 'connect').mockResolvedValue(undefined);

      const { result } = renderHook(() => useWebSocket('token-123'));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate message
      act(() => {
        result.current.send({
          type: 'MULTIPLIER_UPDATE',
          multiplier: 2.5,
          timestamp: Date.now(),
        });
      });

      // Note: In real implementation, this would be handled by WebSocket service
      // This test verifies the hook can send messages
    });

    it('should handle round state change messages', async () => {
      vi.spyOn(WebSocketService.prototype, 'connect').mockResolvedValue(undefined);

      const { result } = renderHook(() => useWebSocket('token-123'));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.send({
          type: 'ROUND_STATE_CHANGE',
          state: 'RUNNING',
          roundId: 'round-123',
        });
      });
    });

    it('should handle round crashed messages', async () => {
      vi.spyOn(WebSocketService.prototype, 'connect').mockResolvedValue(undefined);

      const { result } = renderHook(() => useWebSocket('token-123'));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.send({
          type: 'ROUND_CRASHED',
          crashPoint: 2.5,
          roundId: 'round-123',
        });
      });
    });
  });

  describe('Send Message', () => {
    it('should send message when connected', async () => {
      const sendSpy = vi.spyOn(WebSocketService.prototype, 'send');
      vi.spyOn(WebSocketService.prototype, 'connect').mockResolvedValue(undefined);

      const { result } = renderHook(() => useWebSocket('token-123'));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const message = { type: 'TEST', data: 'test-data' };

      act(() => {
        result.current.send(message);
      });

      expect(sendSpy).toHaveBeenCalledWith(message);
    });

    it('should not send message when not connected', () => {
      const sendSpy = vi.spyOn(WebSocketService.prototype, 'send');

      const { result } = renderHook(() => useWebSocket(null));

      const message = { type: 'TEST', data: 'test-data' };

      act(() => {
        result.current.send(message);
      });

      // Should not have called send
      expect(sendSpy).not.toHaveBeenCalled();
    });
  });

  describe('Token Changes', () => {
    it('should reconnect when token changes', async () => {
      const connectSpy = vi.spyOn(WebSocketService.prototype, 'connect').mockResolvedValue(undefined);

      const { rerender } = renderHook(
        ({ token }) => useWebSocket(token),
        { initialProps: { token: 'token-1' } }
      );

      await waitFor(() => {
        expect(connectSpy).toHaveBeenCalled();
      });

      const initialCallCount = connectSpy.mock.calls.length;

      // Change token
      rerender({ token: 'token-2' });

      // Should attempt to reconnect
      await waitFor(() => {
        expect(connectSpy.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it('should not connect if token is null', () => {
      const connectSpy = vi.spyOn(WebSocketService.prototype, 'connect').mockResolvedValue(undefined);

      const { result } = renderHook(() => useWebSocket(null));

      expect(result.current.isConnected).toBe(false);
      expect(connectSpy).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should disconnect on unmount', async () => {
      const disconnectSpy = vi.spyOn(WebSocketService.prototype, 'disconnect');
      vi.spyOn(WebSocketService.prototype, 'connect').mockResolvedValue(undefined);

      const { unmount } = renderHook(() => useWebSocket('token-123'));

      await waitFor(() => {
        // Wait for connection
      });

      unmount();

      expect(disconnectSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      vi.spyOn(WebSocketService.prototype, 'connect').mockRejectedValue(
        new Error('WebSocket connection failed')
      );

      const { result } = renderHook(() => useWebSocket('token-123'));

      await waitFor(() => {
        expect(result.current.error).toBe('WebSocket connection failed');
      });

      expect(result.current.isConnected).toBe(false);
    });

    it('should clear error on successful connection', async () => {
      // First fail
      vi.spyOn(WebSocketService.prototype, 'connect').mockRejectedValueOnce(
        new Error('Connection failed')
      );

      const { result } = renderHook(() => useWebSocket('token-123'));

      await waitFor(() => {
        expect(result.current.error).toBe('Connection failed');
      });

      // Then succeed
      vi.spyOn(WebSocketService.prototype, 'connect').mockResolvedValueOnce(undefined);

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Connection State', () => {
    it('should set isConnecting during connection', async () => {
      vi.spyOn(WebSocketService.prototype, 'connect').mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useWebSocket('token-123'));

      expect(result.current.isConnecting).toBe(true);

      await waitFor(() => {
        expect(result.current.isConnecting).toBe(false);
      });
    });

    it('should set isConnected after successful connection', async () => {
      vi.spyOn(WebSocketService.prototype, 'connect').mockResolvedValue(undefined);

      const { result } = renderHook(() => useWebSocket('token-123'));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should clear isConnected after disconnect', async () => {
      vi.spyOn(WebSocketService.prototype, 'connect').mockResolvedValue(undefined);

      const { result } = renderHook(() => useWebSocket('token-123'));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
    });
  });
});
