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

/**
 * Auth Store: Manages authentication state
 * Requirement 2.1.1: JWT token storage and user information
 * Requirement 3.2.1: Secure token storage (httpOnly cookies preferred, localStorage as fallback)
 */
export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  playerId: null,
  email: null,
  token: null,

  login: (token, playerId, email) => {
    console.log('AuthStore.login called with:', {
      hasToken: !!token,
      playerId,
      email
    });

    set({
      isAuthenticated: true,
      token,
      playerId,
      email,
    });
    
    // Store user info in localStorage (non-sensitive data)
    localStorage.setItem('playerId', playerId);
    localStorage.setItem('email', email);
    localStorage.setItem('isAuthenticated', 'true');
    
    // Note: In production, JWT tokens should be stored in httpOnly cookies
    // For development, we store in localStorage as a fallback
    localStorage.setItem('token', token);

    console.log('AuthStore.login completed, localStorage updated');
    
    // Verify localStorage was updated
    console.log('Verification - localStorage contents:', {
      token: !!localStorage.getItem('token'),
      playerId: localStorage.getItem('playerId'),
      email: localStorage.getItem('email'),
      isAuthenticated: localStorage.getItem('isAuthenticated')
    });
  },

  logout: () => {
    set({
      isAuthenticated: false,
      token: null,
      playerId: null,
      email: null,
    });
    
    // Clear all auth-related data
    localStorage.removeItem('token');
    localStorage.removeItem('playerId');
    localStorage.removeItem('email');
    localStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('refresh_token');
  },

  setToken: (token) => {
    set({ 
      token,
      isAuthenticated: true 
    });
    localStorage.setItem('token', token);
    localStorage.setItem('isAuthenticated', 'true');
  },

  setAuthenticated: (isAuthenticated) => {
    set({ isAuthenticated });
    if (isAuthenticated) {
      localStorage.setItem('isAuthenticated', 'true');
    } else {
      localStorage.removeItem('isAuthenticated');
    }
  },
}));
