// Auth Types
export interface AuthState {
  isAuthenticated: boolean;
  playerId: string | null;
  email: string | null;
  token: string | null;
}

// Game Types
export type RoundState = 'BETTING' | 'RUNNING' | 'CRASHED';

export interface Round {
  id: string;
  state: RoundState;
  crashPoint: number | null;
  createdAt: string;
  startedAt: string | null;
  crashedAt: string | null;
  playerCount: number;
  totalWagered: number;
}

export interface Bet {
  id: string;
  roundId: string;
  playerId: string;
  amount: number;
  state: 'ACTIVE' | 'WON' | 'LOST';
  cashedOutAt: number | null;
  payout: number | null;
  createdAt: string;
}

export interface CashOutResult {
  success: boolean;
  multiplier: number;
  payout: number;
  message: string;
}

// Wallet Types
export interface Wallet {
  id: string;
  playerId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Verification Types
export interface VerificationResult {
  verified: boolean;
  crashPoint: number;
  serverSeedHash: string;
  clientSeed: string;
  message: string;
}

// Re-export from api types
export * from './api';

// Dummy export to prevent TypeScript from treating this as a type-only file
export const __typeModule = true;
export const TYPES_VERSION = '1.0.0';
