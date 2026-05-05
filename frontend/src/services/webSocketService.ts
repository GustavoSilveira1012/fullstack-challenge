/**
 * WebSocket Service
 * Handles real-time communication with the game server
 */

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface MultiplierUpdateMessage extends WebSocketMessage {
  type: 'MULTIPLIER_UPDATE';
  multiplier: number;
  timestamp: number;
}

export interface RoundStateChangeMessage extends WebSocketMessage {
  type: 'ROUND_STATE_CHANGE';
  state: 'BETTING' | 'RUNNING' | 'CRASHED';
  roundId: string;
}

export interface RoundCrashedMessage extends WebSocketMessage {
  type: 'ROUND_CRASHED';
  crashPoint: number;
  roundId: string;
}

export interface BetConfirmedMessage extends WebSocketMessage {
  type: 'BET_CONFIRMED';
  bet: {
    id: string;
    roundId: string;
    amount: number;
    state: 'ACTIVE' | 'WON' | 'LOST';
  };
}

export interface BetCashedOutMessage extends WebSocketMessage {
  type: 'BET_CASHED_OUT';
  multiplier: number;
  payout: number;
  betId: string;
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor() {
    this.connect();
  }

  /**
   * Connect to WebSocket server
   */
  private connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/games';
    
    console.log('[WebSocket] Connecting to:', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Send auth message if needed
        this.send('AUTH', { timestamp: Date.now() });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('[WebSocket] Received:', message);
          this.handleMessage(message);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.ws = null;
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.handlers.get(message.type) || [];
    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('[WebSocket] Handler error:', error);
      }
    });
  }

  /**
   * Send message to server
   */
  private send(type: string, data: any = {}): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, ...data });
      this.ws.send(message);
    } else {
      console.warn('[WebSocket] Cannot send message, not connected');
    }
  }

  /**
   * Subscribe to message type
   */
  on(messageType: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(messageType)) {
      this.handlers.set(messageType, []);
    }
    
    this.handlers.get(messageType)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(messageType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

export default websocketService;