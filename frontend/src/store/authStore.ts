import { create } from 'zustand';

interface AuthState {
  // State
  isAuthenticated: boolean;
  playerId: string | null;
  email: string | null;
  token: string | null;

  // Actions
  login: (token: string, playerId: string, email: string) => void;
  logout: () => void;
  setToken: (token: string) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  playerId: null,
  email: null,
  token: null,

  login: (token, playerId, email) => {
    set({
      isAuthenticated: true,
      token,
      playerId,
      email,
    });
    localStorage.setItem('token', token);
    localStorage.setItem('playerId', playerId);
    localStorage.setItem('email', email);
  },

  logout: () => {
    set({
      isAuthenticated: false,
      token: null,
      playerId: null,
      email: null,
    });
    localStorage.removeItem('token');
    localStorage.removeItem('playerId');
    localStorage.removeItem('email');
  },

  setToken: (token) => {
    set({ token });
    localStorage.setItem('token', token);
  },

  setAuthenticated: (isAuthenticated) => {
    set({ isAuthenticated });
  },
}));
