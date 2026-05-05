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
  balance: 0, // Start with 0, will be updated by API call
  lastBetAmount: 1000, // R$ 10.00 em centavos para habilitar os botões quick bet

  setBalance: (balance) => {
    const validBalance = typeof balance === 'number' && !isNaN(balance) ? balance : 0;
    console.log('[WalletStore] setBalance called with:', balance, 'type:', typeof balance, 'valid balance:', validBalance);
    set({ balance: validBalance });
  },

  setLastBetAmount: (amount) => {
    const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    set({ lastBetAmount: validAmount });
  },

  updateBalance: (delta) => {
    set((state) => {
      const currentBalance = typeof state.balance === 'number' && !isNaN(state.balance) ? state.balance : 0;
      const validDelta = typeof delta === 'number' && !isNaN(delta) ? delta : 0;
      return {
        balance: Math.max(0, currentBalance + validDelta),
      };
    });
  },
}));
