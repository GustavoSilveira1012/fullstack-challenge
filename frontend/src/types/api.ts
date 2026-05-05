/**
 * API Response and Request Types
 * Requirement 2.1, 2.2, 2.3: API Client & Services Setup
 */

// ============================================================================
// Game Service Types
// ============================================================================

export interface PlaceBetRequest {
  amount: number;
}

export interface PlaceBetResponse {
  id: string;
  roundId: string;
  playerId: string;
  amount: number;
  state: 'ACTIVE' | 'WON' | 'LOST';
  cashedOutAt: number | null;
  payout: number | null;
  createdAt: string;
}

export interface CashOutRequest {
  // No body required - uses current active bet
}

export interface CashOutResponse {
  success: boolean;
  multiplier: number;
  payout: number;
  message: string;
  betId: string;
}

export interface CurrentRoundResponse {
  id: string;
  state: 'BETTING' | 'RUNNING' | 'CRASHED';
  crashPoint: number | null;
  createdAt: string;
  startedAt: string | null;
  crashedAt: string | null;
  playerCount: number;
  totalWagered: number;
}

export interface RoundHistoryResponse {
  data: Array<{
    id: string;
    state: 'BETTING' | 'RUNNING' | 'CRASHED';
    crashPoint: number | null;
    createdAt: string;
    startedAt: string | null;
    crashedAt: string | null;
    playerCount: number;
    totalWagered: number;
  }>;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PlayerBetHistoryResponse {
  data: Array<{
    id: string;
    roundId: string;
    playerId: string;
    amount: number;
    state: 'ACTIVE' | 'WON' | 'LOST';
    cashedOutAt: number | null;
    payout: number | null;
    createdAt: string;
  }>;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface VerifyRoundRequest {
  serverSeedHash: string;
  clientSeed: string;
}

export interface VerifyRoundResponse {
  verified: boolean;
  crashPoint: number;
  serverSeedHash: string;
  clientSeed: string;
  message: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
}

// ============================================================================
// Wallet Service Types
// ============================================================================

export interface CreateWalletRequest {
  playerId: string;
}

export interface CreateWalletResponse {
  id: string;
  playerId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetWalletResponse {
  id: string;
  playerId: string;
  balance: string; // Backend returns balance as string (centavos)
  currency?: string; // Optional since backend doesn't return this
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Auth Service Types
// ============================================================================

export interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface KeycloakUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
}

// ============================================================================
// WebSocket Message Types
// ============================================================================

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

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  status: number;
  message: string;
  data: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Dummy export to prevent TypeScript from treating this as a type-only file
export const __apiTypeModule = true;
export const API_TYPES_VERSION = '1.0.0';
