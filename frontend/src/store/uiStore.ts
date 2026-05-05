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
  animationSpeed: 'slow' | 'normal' | 'fast';
  notifications: Notification[];

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSound: () => void;
  setAnimationSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>((set) => {
  // Initialize theme from localStorage with fallback
  const getInitialTheme = (): 'light' | 'dark' => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      
      // Check system preference if no saved theme
      if (typeof window !== 'undefined' && window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
      }
      
      return 'light';
    } catch (error) {
      console.warn('Failed to read theme from localStorage:', error);
      return 'light';
    }
  };

  // Initialize sound preference from localStorage
  const getInitialSoundEnabled = (): boolean => {
    try {
      const savedSound = localStorage.getItem('soundEnabled');
      return savedSound !== 'false';
    } catch (error) {
      console.warn('Failed to read sound preference from localStorage:', error);
      return true;
    }
  };

  // Initialize animation speed from localStorage
  const getInitialAnimationSpeed = (): 'slow' | 'normal' | 'fast' => {
    try {
      const savedSpeed = localStorage.getItem('animationSpeed');
      if (savedSpeed === 'slow' || savedSpeed === 'normal' || savedSpeed === 'fast') {
        return savedSpeed;
      }
      return 'normal';
    } catch (error) {
      console.warn('Failed to read animation speed from localStorage:', error);
      return 'normal';
    }
  };

  const initialTheme = getInitialTheme();
  const initialSoundEnabled = getInitialSoundEnabled();
  const initialAnimationSpeed = getInitialAnimationSpeed();

  return {
    theme: initialTheme,
    soundEnabled: initialSoundEnabled,
    animationSpeed: initialAnimationSpeed,
    notifications: [],

    setTheme: (theme) => {
      set({ theme });
      try {
        localStorage.setItem('theme', theme);
      } catch (error) {
        console.warn('Failed to save theme to localStorage:', error);
      }
    },

    toggleSound: () => {
      set((state) => {
        const newValue = !state.soundEnabled;
        try {
          localStorage.setItem('soundEnabled', String(newValue));
          
          // Update sound service
          if (typeof window !== 'undefined') {
            import('@services/soundService').then(({ soundService }) => {
              soundService.setEnabled(newValue);
            });
          }
        } catch (error) {
          console.warn('Failed to save sound preference to localStorage:', error);
        }
        return { soundEnabled: newValue };
      });
    },

    setAnimationSpeed: (speed) => {
      set({ animationSpeed: speed });
      try {
        localStorage.setItem('animationSpeed', speed);
      } catch (error) {
        console.warn('Failed to save animation speed to localStorage:', error);
      }
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
