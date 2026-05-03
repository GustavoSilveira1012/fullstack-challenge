import { create } from 'zustand';

interface WalletState {
  // State
  balance: number;
  lastBetAmount: number;

  // Actions
  setBalance: (balance: number) => void;
  setLastBetAmount: (amount: number) => void;
  updateBalance: (delta: number) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  lastBetAmount: 0,

  setBalance: (balance) => {
    set({ balance });
  },

  setLastBetAmount: (amount) => {
    set({ lastBetAmount: amount });
  },

  updateBalance: (delta) => {
    set((state) => ({
      balance: Math.max(0, state.balance + delta),
    }));
  },
}));
