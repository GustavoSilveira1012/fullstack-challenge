import { useGameStore } from '../store/gameStore';
import { useWalletStore } from '../store/walletStore';
import { useUIStore } from '../store/uiStore';
import { rateLimiter, sanitizeText } from '../utils/security';
import {
  MultiplierUpdateMessage,
  RoundStateChangeMessage,
  BetConfirmedMessage,
  BetCashedOutMessage,
  WebSocketMessage,
} from '../types/api';

/**
 * WebSocketService: Manages real-time WebSocket connection to game server
 * Requirement 2.5.1: Establish WebSocket connection with automatic reconnection
 * Requirement 2.5.2: Handle multiplier updates
 * Requirement 2.5.3: Handle round state changes
 * Requirement 2.5.4: Handle wallet balance updates
 * Requirement 3.2.3: Secure WebSocket connection (WSS)
 * Requirement 3.2.4: Rate limiting for WebSocket messages
 */
class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, (message: any) => void> = new Map();
  private isIntentionallyClosed: boolean = false;

  constructor(url: string, token: string) {
    // Ensure secure WebSocket connection in production
    this.url = this.ensureSecureUrl(url);
    this.token = sanitizeText(token); // Sanitize token
    this.setupMessageHandlers();
  }

  /**
   * Ensure WebSocket URL uses secure connection (WSS) in production
   * Requirement 3.2.3: Use HTTPS/WSS for all communication
   */
  private ensureSecureUrl(url: string): string {
    // In production, always use WSS
    if (import.meta.env.PROD && url.startsWith('ws://')) {
      return url.replace('ws://', 'wss://');
    }
    
    // In development, allow WS for localhost
    if (import.meta.env.DEV && (url.includes('localhost') || url.includes('127.0.0.1'))) {
      return url;
    }
    
    // Default to secure connection
    if (url.startsWith('ws://')) {
      return url.replace('ws://', 'wss://');
    }
    
    return url;
  }

  /**
   * Setup message handlers for different message types
   * Requirement 2.5.2, 2.5.3, 2.5.4: Message handlers
   */
  private setupMessageHandlers(): void {
    this.messageHandlers.set('MULTIPLIER_UPDATE', this.handleMultiplierUpdate.bind(this));
    this.messageHandlers.set('ROUND_STATE_CHANGE', this.handleRoundStateChange.bind(this));
    this.messageHandlers.set('ROUND_CRASHED', this.handleRoundCrashed.bind(this));
    this.messageHandlers.set('BET_CONFIRMED', this.handleBetConfirmed.bind(this));
    this.messageHandlers.set('BET_CASHED_OUT', this.handleBetCashedOut.bind(this));
  }

  /**
   * Connect to WebSocket server
   * Requirement 2.5.1: Establish WebSocket connection
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.isIntentionallyClosed = false;
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.reconnectAttempts = 0;
          this.sendAuth();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Disconnected');
          if (!this.isIntentionallyClosed) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   * Requirement 2.5.1: Exponential backoff (1s, 2s, 4s, 8s, max 30s)
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      const uiStore = useUIStore.getState();
      uiStore.addNotification({
        type: 'error',
        message: 'WebSocket connection failed. Please refresh the page.',
        duration: 0, // Don't auto-dismiss
      });
      return;
    }

    this.reconnectAttempts++;
    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[WebSocket] Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Send authentication message
   */
  private sendAuth(): void {
    this.send({
      type: 'AUTH',
      token: this.token,
    });
  }

  /**
   * Handle incoming WebSocket message with security validation
   * Requirement 3.2.2: Validate all incoming data
   */
  private handleMessage(message: WebSocketMessage): void {
    try {
      // Validate message structure
      if (!message || typeof message !== 'object' || !message.type) {
        console.warn('[WebSocket] Invalid message format:', message);
        return;
      }

      // Sanitize message type
      const messageType = sanitizeText(message.type);
      
      const handler = this.messageHandlers.get(messageType);
      if (handler) {
        handler(message);
      } else {
        console.warn(`[WebSocket] Unknown message type: ${messageType}`);
      }
    } catch (error) {
      console.error('[WebSocket] Error handling message:', error);
    }
  }

  /**
   * Handle MULTIPLIER_UPDATE message
   * Requirement 2.5.2: Update multiplier in real-time
   */
  private handleMultiplierUpdate(message: MultiplierUpdateMessage): void {
    const gameStore = useGameStore.getState();
    gameStore.setMultiplier(message.multiplier);
  }

  /**
   * Handle ROUND_STATE_CHANGE message
   * Requirement 2.5.3: Update round state
   */
  private handleRoundStateChange(message: RoundStateChangeMessage): void {
    const gameStore = useGameStore.getState();
    gameStore.setRoundState(message.state);
  }

  /**
   * Handle ROUND_CRASHED message
   * Requirement 2.5.3: Handle crash event
   */
  private handleRoundCrashed(): void {
    const gameStore = useGameStore.getState();
    gameStore.setRoundState('CRASHED');
    
    // Play crash sound if enabled
    const uiStore = useUIStore.getState();
    if (uiStore.soundEnabled) {
      this.playSound('crash');
    }
  }

  /**
   * Handle BET_CONFIRMED message
   * Requirement 2.5.4: Update bet status
   */
  private handleBetConfirmed(message: BetConfirmedMessage): void {
    const gameStore = useGameStore.getState();
    gameStore.setPlayerBet(message.bet as any);

    // Play bet placed sound if enabled
    const uiStore = useUIStore.getState();
    if (uiStore.soundEnabled) {
      this.playSound('bet-placed');
    }
  }

  /**
   * Handle BET_CASHED_OUT message
   * Requirement 2.5.4: Update wallet balance
   */
  private handleBetCashedOut(message: BetCashedOutMessage): void {
    const walletStore = useWalletStore.getState();
    // Update balance with payout
    walletStore.updateBalance(message.payout);

    // Play cash out sound if enabled
    const uiStore = useUIStore.getState();
    if (uiStore.soundEnabled) {
      this.playSound('cash-out');
    }
  }

  /**
   * Send message to WebSocket server with rate limiting
   * Requirement 3.2.4: Rate limiting for WebSocket messages
   */
  send(message: any): void {
    // Check rate limit for WebSocket messages
    if (!rateLimiter.isAllowed('websocket-messages')) {
      console.warn('[WebSocket] Rate limit exceeded for WebSocket messages');
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[WebSocket] Error sending message:', error);
      }
    } else {
      console.warn('[WebSocket] Cannot send message: WebSocket not connected');
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Play sound effect
   */
  private playSound(soundName: string): void {
    try {
      // Create audio element and play sound
      const audio = new Audio(`/sounds/${soundName}.mp3`);
      audio.volume = 0.5;
      audio.play().catch((error) => {
        console.warn(`[WebSocket] Failed to play sound ${soundName}:`, error);
      });
    } catch (error) {
      console.warn(`[WebSocket] Error playing sound:`, error);
    }
  }
}

export default WebSocketService;
