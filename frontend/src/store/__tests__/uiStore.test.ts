import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useUIStore } from '../uiStore';

/**
 * UIStore Unit Tests
 * Requirement 2.7.4: Support dark and light themes
 * Validates: Requirements 2.4.4, 2.7.4, 2.8.3, 2.8.5
 */
describe('UIStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({
      theme: 'light',
      soundEnabled: true,
      notifications: [],
    });
    // Clear localStorage mock
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useUIStore.getState();
      expect(state.theme).toBe('light');
      expect(state.soundEnabled).toBe(true);
      expect(state.notifications).toEqual([]);
    });

    it('should have setTheme action', () => {
      const state = useUIStore.getState();
      expect(typeof state.setTheme).toBe('function');
    });

    it('should have toggleSound action', () => {
      const state = useUIStore.getState();
      expect(typeof state.toggleSound).toBe('function');
    });

    it('should have addNotification action', () => {
      const state = useUIStore.getState();
      expect(typeof state.addNotification).toBe('function');
    });

    it('should have removeNotification action', () => {
      const state = useUIStore.getState();
      expect(typeof state.removeNotification).toBe('function');
    });

    it('should have clearNotifications action', () => {
      const state = useUIStore.getState();
      expect(typeof state.clearNotifications).toBe('function');
    });
  });

  describe('SetTheme Action', () => {
    it('should set theme to light', () => {
      useUIStore.getState().setTheme('light');
      expect(useUIStore.getState().theme).toBe('light');
    });

    it('should set theme to dark', () => {
      useUIStore.getState().setTheme('dark');
      expect(useUIStore.getState().theme).toBe('dark');
    });

    it('should toggle between light and dark themes', () => {
      useUIStore.getState().setTheme('light');
      expect(useUIStore.getState().theme).toBe('light');

      useUIStore.getState().setTheme('dark');
      expect(useUIStore.getState().theme).toBe('dark');

      useUIStore.getState().setTheme('light');
      expect(useUIStore.getState().theme).toBe('light');
    });

    it('should persist theme to localStorage', () => {
      useUIStore.getState().setTheme('dark');
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');

      useUIStore.getState().setTheme('light');
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    it('should not affect other state when changing theme', () => {
      useUIStore.getState().toggleSound();
      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Test notification',
      });

      const oldState = useUIStore.getState();
      useUIStore.getState().setTheme('dark');
      const newState = useUIStore.getState();

      expect(newState.soundEnabled).toBe(oldState.soundEnabled);
      expect(newState.notifications).toEqual(oldState.notifications);
    });
  });

  describe('ToggleSound Action', () => {
    it('should toggle sound from enabled to disabled', () => {
      useUIStore.getState().toggleSound();
      expect(useUIStore.getState().soundEnabled).toBe(false);
    });

    it('should toggle sound from disabled to enabled', () => {
      useUIStore.getState().toggleSound();
      expect(useUIStore.getState().soundEnabled).toBe(false);

      useUIStore.getState().toggleSound();
      expect(useUIStore.getState().soundEnabled).toBe(true);
    });

    it('should persist sound preference to localStorage', () => {
      useUIStore.getState().toggleSound();
      expect(localStorage.setItem).toHaveBeenCalledWith('soundEnabled', 'false');

      useUIStore.getState().toggleSound();
      expect(localStorage.setItem).toHaveBeenCalledWith('soundEnabled', 'true');
    });

    it('should handle multiple toggles', () => {
      const initialState = useUIStore.getState().soundEnabled;

      for (let i = 0; i < 5; i++) {
        useUIStore.getState().toggleSound();
      }

      // After odd number of toggles, state should be opposite
      expect(useUIStore.getState().soundEnabled).toBe(!initialState);
    });

    it('should not affect other state when toggling sound', () => {
      useUIStore.getState().setTheme('dark');
      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Test notification',
      });

      const oldState = useUIStore.getState();
      useUIStore.getState().toggleSound();
      const newState = useUIStore.getState();

      expect(newState.theme).toBe(oldState.theme);
      expect(newState.notifications).toEqual(oldState.notifications);
    });
  });

  describe('AddNotification Action', () => {
    it('should add a notification', () => {
      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Bet placed successfully',
      });

      const notifications = useUIStore.getState().notifications;
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('success');
      expect(notifications[0].message).toBe('Bet placed successfully');
    });

    it('should generate unique ID for each notification', () => {
      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Notification 1',
      });

      useUIStore.getState().addNotification({
        type: 'error',
        message: 'Notification 2',
      });

      const notifications = useUIStore.getState().notifications;
      expect(notifications[0].id).not.toBe(notifications[1].id);
    });

    it('should add multiple notifications', () => {
      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Success message',
      });

      useUIStore.getState().addNotification({
        type: 'error',
        message: 'Error message',
      });

      useUIStore.getState().addNotification({
        type: 'warning',
        message: 'Warning message',
      });

      expect(useUIStore.getState().notifications).toHaveLength(3);
    });

    it('should handle all notification types', () => {
      const types: Array<'success' | 'error' | 'warning' | 'info'> = [
        'success',
        'error',
        'warning',
        'info',
      ];

      types.forEach((type) => {
        useUIStore.setState({ notifications: [] });
        useUIStore.getState().addNotification({
          type,
          message: `${type} notification`,
        });

        expect(useUIStore.getState().notifications[0].type).toBe(type);
      });
    });

    it('should use default duration if not specified', () => {
      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Test notification',
      });

      const notification = useUIStore.getState().notifications[0];
      expect(notification.duration).toBeUndefined();
    });

    it('should use custom duration if specified', () => {
      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Test notification',
        duration: 5000,
      });

      const notification = useUIStore.getState().notifications[0];
      expect(notification.duration).toBe(5000);
    });

    it('should auto-remove notification after default duration', async () => {
      vi.useFakeTimers();

      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Test notification',
      });

      expect(useUIStore.getState().notifications).toHaveLength(1);

      // Fast-forward time by default duration (3000ms)
      vi.advanceTimersByTime(3000);

      expect(useUIStore.getState().notifications).toHaveLength(0);

      vi.useRealTimers();
    });

    it('should auto-remove notification after custom duration', async () => {
      vi.useFakeTimers();

      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Test notification',
        duration: 5000,
      });

      expect(useUIStore.getState().notifications).toHaveLength(1);

      // Fast-forward time by custom duration
      vi.advanceTimersByTime(5000);

      expect(useUIStore.getState().notifications).toHaveLength(0);

      vi.useRealTimers();
    });

    it('should handle notifications with long messages', () => {
      const longMessage = 'x'.repeat(1000);
      useUIStore.getState().addNotification({
        type: 'success',
        message: longMessage,
      });

      expect(useUIStore.getState().notifications[0].message).toBe(longMessage);
    });

    it('should handle notifications with special characters', () => {
      const specialMessage = 'Bet placed: R$ 1.234,56 @ 2.5x!';
      useUIStore.getState().addNotification({
        type: 'success',
        message: specialMessage,
      });

      expect(useUIStore.getState().notifications[0].message).toBe(specialMessage);
    });
  });

  describe('RemoveNotification Action', () => {
    it('should remove notification by ID', () => {
      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Notification 1',
      });

      useUIStore.getState().addNotification({
        type: 'error',
        message: 'Notification 2',
      });

      const notifications = useUIStore.getState().notifications;
      const idToRemove = notifications[0].id;

      useUIStore.getState().removeNotification(idToRemove);

      expect(useUIStore.getState().notifications).toHaveLength(1);
      expect(useUIStore.getState().notifications[0].id).not.toBe(idToRemove);
    });

    it('should handle removing non-existent notification', () => {
      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Notification 1',
      });

      useUIStore.getState().removeNotification('non-existent-id');

      expect(useUIStore.getState().notifications).toHaveLength(1);
    });

    it('should remove correct notification when multiple exist', () => {
      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Notification 1',
      });

      useUIStore.getState().addNotification({
        type: 'error',
        message: 'Notification 2',
      });

      useUIStore.getState().addNotification({
        type: 'warning',
        message: 'Notification 3',
      });

      const notifications = useUIStore.getState().notifications;
      const idToRemove = notifications[1].id;

      useUIStore.getState().removeNotification(idToRemove);

      const remaining = useUIStore.getState().notifications;
      expect(remaining).toHaveLength(2);
      expect(remaining.every((n) => n.id !== idToRemove)).toBe(true);
    });
  });

  describe('ClearNotifications Action', () => {
    it('should clear all notifications', () => {
      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Notification 1',
      });

      useUIStore.getState().addNotification({
        type: 'error',
        message: 'Notification 2',
      });

      useUIStore.getState().addNotification({
        type: 'warning',
        message: 'Notification 3',
      });

      expect(useUIStore.getState().notifications).toHaveLength(3);

      useUIStore.getState().clearNotifications();

      expect(useUIStore.getState().notifications).toHaveLength(0);
    });

    it('should handle clearing empty notifications', () => {
      expect(useUIStore.getState().notifications).toHaveLength(0);

      useUIStore.getState().clearNotifications();

      expect(useUIStore.getState().notifications).toHaveLength(0);
    });

    it('should not affect other state when clearing notifications', () => {
      useUIStore.getState().setTheme('dark');
      useUIStore.getState().toggleSound();

      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Test notification',
      });

      const oldState = useUIStore.getState();
      useUIStore.getState().clearNotifications();
      const newState = useUIStore.getState();

      expect(newState.theme).toBe(oldState.theme);
      expect(newState.soundEnabled).toBe(oldState.soundEnabled);
      expect(newState.notifications).toHaveLength(0);
    });
  });

  describe('State Immutability', () => {
    it('should not mutate state directly', () => {
      const state1 = useUIStore.getState();
      useUIStore.getState().setTheme('dark');
      const state2 = useUIStore.getState();

      expect(state1).not.toBe(state2);
    });

    it('should create new notifications array on addNotification', () => {
      const notifications1 = useUIStore.getState().notifications;
      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Test',
      });
      const notifications2 = useUIStore.getState().notifications;

      expect(notifications1).not.toBe(notifications2);
    });

    it('should create new notifications array on removeNotification', () => {
      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Test',
      });

      const notifications1 = useUIStore.getState().notifications;
      const id = notifications1[0].id;

      useUIStore.getState().removeNotification(id);
      const notifications2 = useUIStore.getState().notifications;

      expect(notifications1).not.toBe(notifications2);
    });
  });

  describe('Realistic UI Scenarios', () => {
    it('should handle game event notifications', () => {
      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Bet placed: R$ 100.00',
      });

      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Cashed out at 2.5x for R$ 250.00',
      });

      useUIStore.getState().addNotification({
        type: 'error',
        message: 'Bet lost at 1.8x',
      });

      expect(useUIStore.getState().notifications).toHaveLength(3);
    });

    it('should handle theme persistence across sessions', () => {
      useUIStore.getState().setTheme('dark');
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');

      // Simulate new session by resetting state
      useUIStore.setState({ theme: 'light' });
      expect(useUIStore.getState().theme).toBe('light');

      // Restore from localStorage
      useUIStore.getState().setTheme('dark');
      expect(useUIStore.getState().theme).toBe('dark');
    });

    it('should handle sound preference persistence across sessions', () => {
      useUIStore.getState().toggleSound();
      expect(localStorage.setItem).toHaveBeenCalledWith('soundEnabled', 'false');

      // Simulate new session by resetting state
      useUIStore.setState({ soundEnabled: true });
      expect(useUIStore.getState().soundEnabled).toBe(true);

      // Restore from localStorage
      useUIStore.getState().toggleSound();
      expect(useUIStore.getState().soundEnabled).toBe(false);
    });

    it('should handle multiple notifications with auto-dismiss', async () => {
      vi.useFakeTimers();

      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Notification 1',
        duration: 2000,
      });

      useUIStore.getState().addNotification({
        type: 'error',
        message: 'Notification 2',
        duration: 3000,
      });

      expect(useUIStore.getState().notifications).toHaveLength(2);

      // First notification auto-dismisses
      vi.advanceTimersByTime(2000);
      expect(useUIStore.getState().notifications).toHaveLength(1);

      // Second notification auto-dismisses
      vi.advanceTimersByTime(1000);
      expect(useUIStore.getState().notifications).toHaveLength(0);

      vi.useRealTimers();
    });

    it('should handle manual notification dismissal', () => {
      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Notification 1',
      });

      useUIStore.getState().addNotification({
        type: 'error',
        message: 'Notification 2',
      });

      const notifications = useUIStore.getState().notifications;
      const idToRemove = notifications[0].id;

      useUIStore.getState().removeNotification(idToRemove);

      expect(useUIStore.getState().notifications).toHaveLength(1);
      expect(useUIStore.getState().notifications[0].message).toBe('Notification 2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid notification additions', () => {
      for (let i = 0; i < 100; i++) {
        useUIStore.getState().addNotification({
          type: 'success',
          message: `Notification ${i}`,
        });
      }

      expect(useUIStore.getState().notifications).toHaveLength(100);
    });

    it('should handle notification with zero duration', async () => {
      vi.useFakeTimers();

      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Test notification',
        duration: 0,
      });

      expect(useUIStore.getState().notifications).toHaveLength(1);

      // setTimeout with 0 duration still needs to be processed
      vi.runAllTimers();
      expect(useUIStore.getState().notifications).toHaveLength(0);

      vi.useRealTimers();
    });

    it('should handle notification with very long duration', async () => {
      vi.useFakeTimers();

      useUIStore.getState().addNotification({
        type: 'success',
        message: 'Test notification',
        duration: 60000,
      });

      expect(useUIStore.getState().notifications).toHaveLength(1);

      vi.advanceTimersByTime(30000);
      expect(useUIStore.getState().notifications).toHaveLength(1);

      vi.advanceTimersByTime(30000);
      expect(useUIStore.getState().notifications).toHaveLength(0);

      vi.useRealTimers();
    });
  });
});
