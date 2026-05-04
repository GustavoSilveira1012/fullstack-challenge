import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@store/gameStore';
import { useUIStore } from '@store/uiStore';
import WebSocketService from '@services/webSocketService';
import { WebSocketMessage } from '../types/api';

/**
 * useWebSocket Hook: Manages WebSocket connection for real-time updates
 * Requirement 2.5.1, 2.5.2, 2.5.3, 2.5.4: WebSocket connection and real-time updates
 */
export const useWebSocket = (token: string | null) => {
  const wsRef = useRef<WebSocketService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setMultiplier, setRoundState, setPlayerBet } = useGameStore();
  const { addNotification } = useUIStore();

  /**
   * Handle WebSocket messages
   */
  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      try {
        switch (message.type) {
          case 'MULTIPLIER_UPDATE':
            setMultiplier(message.multiplier);
            break;

          case 'ROUND_STATE_CHANGE':
            setRoundState(message.state);
            break;

          case 'ROUND_CRASHED':
            setRoundState('CRASHED');
            addNotification({
              type: 'info',
              message: `Round crashed at ${message.crashPoint.toFixed(2)}x`,
              duration: 2000,
            });
            break;

          case 'BET_CONFIRMED':
            setPlayerBet(message.bet);
            break;

          case 'BET_CASHED_OUT':
            setPlayerBet(null);
            break;

          default:
            console.warn('Unknown WebSocket message type:', message.type);
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    },
    [setMultiplier, setRoundState, setPlayerBet, addNotification]
  );

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(async () => {
    if (!token) {
      setError('No authentication token available');
      return;
    }

    if (isConnected || isConnecting) {
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:4001/games/ws';
      wsRef.current = new WebSocketService(wsUrl, token);

      // Connect
      await wsRef.current.connect();
      setIsConnected(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to WebSocket';
      setError(errorMessage);
      setIsConnected(false);
      addNotification({
        type: 'error',
        message: `WebSocket connection failed: ${errorMessage}`,
      });
    } finally {
      setIsConnecting(false);
    }
  }, [token, isConnected, isConnecting, handleMessage, addNotification]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    setIsConnected(false);
    setError(null);
  }, []);

  /**
   * Send message through WebSocket
   */
  const send = useCallback((message: WebSocketMessage) => {
    if (!wsRef.current || !isConnected) {
      console.warn('WebSocket is not connected');
      return;
    }

    try {
      wsRef.current.send(message);
    } catch (err) {
      console.error('Error sending WebSocket message:', err);
    }
  }, [isConnected]);

  /**
   * Auto-connect on mount and token change
   */
  useEffect(() => {
    if (token && !isConnected) {
      connect();
    }

    return () => {
      // Don't disconnect on unmount - keep connection alive
      // disconnect();
    };
  }, [token, isConnected, connect]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    isConnected,
    isConnecting,
    error,

    // Actions
    connect,
    disconnect,
    send,
  };
};
