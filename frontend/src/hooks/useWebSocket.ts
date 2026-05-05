import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@store/gameStore';
import { useUIStore } from '@store/uiStore';
import websocketService from '@services/webSocketService';
import { WebSocketMessage } from '../types/api';

/**
 * useWebSocket Hook: Manages WebSocket connection for real-time updates
 * Requirement 2.5.1, 2.5.2, 2.5.3, 2.5.4: WebSocket connection and real-time updates
 */
export const useWebSocket = (token: string | null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubscribersRef = useRef<(() => void)[]>([]);

  const { setMultiplier, setRoundState, setPlayerBet } = useGameStore();
  const { addNotification } = useUIStore();

  /**
   * Setup message handlers
   */
  useEffect(() => {
    if (!token) {
      setError('No authentication token available');
      return;
    }

    // Clear previous subscriptions
    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];

    // Subscribe to MULTIPLIER_UPDATE
    const unsubMultiplier = websocketService.on('MULTIPLIER_UPDATE', (message: any) => {
      console.log('[WebSocket] MULTIPLIER_UPDATE received:', message);
      
      // Validate multiplier from message
      const multiplier = message.multiplier;
      const validMultiplier = typeof multiplier === 'number' && 
                             !isNaN(multiplier) && 
                             isFinite(multiplier) && 
                             multiplier >= 1.0 
                             ? multiplier 
                             : null;
      
      if (validMultiplier !== null) {
        setMultiplier(validMultiplier);
      } else {
        console.warn('[WebSocket] Invalid multiplier received:', multiplier);
      }
    });
    unsubscribersRef.current.push(unsubMultiplier);

    // Subscribe to ROUND_STATE_CHANGE
    const unsubRoundState = websocketService.on('ROUND_STATE_CHANGE', (message: any) => {
      console.log('[WebSocket] ROUND_STATE_CHANGE received:', message);
      const newState = message.state;
      
      setRoundState(newState);
      
      // Only reset multiplier when entering BETTING state
      if (newState === 'BETTING') {
        console.log('[WebSocket] Resetting multiplier to 1.0 (BETTING state)');
        setMultiplier(1.0);
      }
    });
    unsubscribersRef.current.push(unsubRoundState);

    // Subscribe to ROUND_CRASHED
    const unsubRoundCrashed = websocketService.on('ROUND_CRASHED', (message: any) => {
      console.log('[WebSocket] ROUND_CRASHED received:', message);
      setRoundState('CRASHED');
      
      // Set final multiplier to crash point
      if (typeof message.crashPoint === 'number' && message.crashPoint >= 1.0) {
        setMultiplier(message.crashPoint);
      }
      
      addNotification({
        type: 'info',
        message: `Round crashed at ${message.crashPoint.toFixed(2)}x`,
        duration: 2000,
      });
    });
    unsubscribersRef.current.push(unsubRoundCrashed);

    // Subscribe to BET_CONFIRMED
    const unsubBetConfirmed = websocketService.on('BET_CONFIRMED', (message: any) => {
      setPlayerBet(message.bet);
    });
    unsubscribersRef.current.push(unsubBetConfirmed);

    // Subscribe to BET_CASHED_OUT
    const unsubBetCashedOut = websocketService.on('BET_CASHED_OUT', () => {
      setPlayerBet(null);
    });
    unsubscribersRef.current.push(unsubBetCashedOut);

    // Update connection status
    setIsConnected(websocketService.isConnected());
    setError(null);

    // Cleanup on unmount
    return () => {
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, [token, setMultiplier, setRoundState, setPlayerBet, addNotification]);

  /**
   * Check connection status periodically
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(websocketService.isConnected());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Connect to WebSocket (manual trigger)
   */
  const connect = useCallback(() => {
    // WebSocket connects automatically via singleton
    setIsConnected(websocketService.isConnected());
  }, []);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    websocketService.disconnect();
    setIsConnected(false);
    setError(null);
  }, []);

  /**
   * Send message through WebSocket
   */
  const send = useCallback((message: WebSocketMessage) => {
    if (!websocketService.isConnected()) {
      console.warn('WebSocket is not connected');
      return;
    }

    try {
      // Note: websocketService.send is private, we need to expose it or use a different approach
      console.warn('Send method not implemented in singleton service');
    } catch (err) {
      console.error('Error sending WebSocket message:', err);
    }
  }, []);

  return {
    // State
    isConnected,
    isConnecting: false,
    error,

    // Actions
    connect,
    disconnect,
    send,
  };
};
