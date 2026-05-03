import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UIState {
  // State
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  notifications: Notification[];

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSound: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>((set) => {
  // Initialize theme from localStorage
  const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  const savedSound = localStorage.getItem('soundEnabled') !== 'false';

  return {
    theme: savedTheme,
    soundEnabled: savedSound,
    notifications: [],

    setTheme: (theme) => {
      set({ theme });
      localStorage.setItem('theme', theme);
    },

    toggleSound: () => {
      set((state) => {
        const newValue = !state.soundEnabled;
        localStorage.setItem('soundEnabled', String(newValue));
        return { soundEnabled: newValue };
      });
    },

    addNotification: (notification) => {
      const id = `${Date.now()}-${Math.random()}`;
      set((state) => ({
        notifications: [...state.notifications, { ...notification, id }],
      }));

      // Auto-remove notification after duration
      const duration = notification.duration || 3000;
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, duration);
    },

    removeNotification: (id) => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    },

    clearNotifications: () => {
      set({ notifications: [] });
    },
  };
});
