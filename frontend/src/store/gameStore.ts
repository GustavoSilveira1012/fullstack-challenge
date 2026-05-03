import { create } from 'zustand';
import type { Round, Bet, RoundState } from '../types';

interface GameState {
  // State
  currentRound: Round | null;
  currentMultiplier: number;
  roundState: RoundState;
  playerBet: Bet | null;
  recentRounds: Round[];

  // Actions
  setCurrentRound: (round: Round) => void;
  setMultiplier: (multiplier: number) => void;
  setRoundState: (state: RoundState) => void;
  setPlayerBet: (bet: Bet | null) => void;
  addRecentRound: (round: Round) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentRound: null,
  currentMultiplier: 1.0,
  roundState: 'BETTING',
  playerBet: null,
  recentRounds: [],

  setCurrentRound: (round) => {
    set({ currentRound: round });
  },

  setMultiplier: (multiplier) => {
    set({ currentMultiplier: multiplier });
  },

  setRoundState: (state) => {
    set({ roundState: state });
  },

  setPlayerBet: (bet) => {
    set({ playerBet: bet });
  },

  addRecentRound: (round) => {
    set((state) => ({
      recentRounds: [round, ...state.recentRounds].slice(0, 10),
    }));
  },

  reset: () => {
    set({
      currentRound: null,
      currentMultiplier: 1.0,
      roundState: 'BETTING',
      playerBet: null,
    });
  },
}));
