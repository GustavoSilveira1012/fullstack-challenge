import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotification } from '../useNotification';
import { useUIStore } from '@store/uiStore';

/**
 * useNotification Hook Unit Tests
 * Requirement 2.8.3: Display success notifications
 * Validates: Requirements 2.8.3
 */
describe('useNotification Hook', () => {
  beforeEach(() => {
    useUIStore.setState({
      notifications: [],
      theme: 'light',
      soundEnabled: true,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial notification state', () => {
      const { result } = renderHook(() => useNotification());

      expect(result.current.notifications).toEqual([]);
    });

    it('should have all required actions', () => {
      const { result } = renderHook(() => useNotification());

      expect(typeof result.current.showSuccess).toBe('function');
      expect(typeof result.current.showError).toBe('function');
      expect(typeof result.current.showWarning).toBe('function');
      expect(typeof result.current.showInfo).toBe('function');
      expect(typeof result.current.show).toBe('function');
      expect(typeof result.current.remove).toBe('function');
      expect(typeof result.current.clear).toBe('function');
    });
  });

  describe('Show Success Notification', () => {
    it('should show success notification', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showSuccess('Operation successful');
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].type).toBe('success');
      expect(result.current.notifications[0].message).toBe('Operation successful');
    });

    it('should use default duration for success', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showSuccess('Success message');
      });

      expect(result.current.notifications[0].duration).toBe(3000);
    });

    it('should use custom duration if provided', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showSuccess('Success message', 5000);
      });

      expect(result.current.notifications[0].duration).toBe(5000);
    });
  });

  describe('Show Error Notification', () => {
    it('should show error notification', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showError('An error occurred');
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].type).toBe('error');
      expect(result.current.notifications[0].message).toBe('An error occurred');
    });

    it('should use default duration for error', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showError('Error message');
      });

      expect(result.current.notifications[0].duration).toBe(5000);
    });
  });

  describe('Show Warning Notification', () => {
    it('should show warning notification', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showWarning('Warning message');
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].type).toBe('warning');
      expect(result.current.notifications[0].message).toBe('Warning message');
    });

    it('should use default duration for warning', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showWarning('Warning message');
      });

      expect(result.current.notifications[0].duration).toBe(4000);
    });
  });

  describe('Show Info Notification', () => {
    it('should show info notification', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showInfo('Info message');
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].type).toBe('info');
      expect(result.current.notifications[0].message).toBe('Info message');
    });

    it('should use default duration for info', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showInfo('Info message');
      });

      expect(result.current.notifications[0].duration).toBe(3000);
    });
  });

  describe('Show Custom Notification', () => {
    it('should show custom notification', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.show({
          type: 'success',
          message: 'Custom notification',
          duration: 2000,
        });
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].type).toBe('success');
      expect(result.current.notifications[0].message).toBe('Custom notification');
      expect(result.current.notifications[0].duration).toBe(2000);
    });
  });

  describe('Remove Notification', () => {
    it('should remove notification by ID', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showSuccess('Message 1');
        result.current.showSuccess('Message 2');
      });

      expect(result.current.notifications).toHaveLength(2);

      const firstNotificationId = result.current.notifications[0].id;

      act(() => {
        result.current.remove(firstNotificationId);
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].message).toBe('Message 2');
    });

    it('should handle removing non-existent notification', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showSuccess('Message');
      });

      expect(result.current.notifications).toHaveLength(1);

      act(() => {
        result.current.remove('non-existent-id');
      });

      // Should still have the original notification
      expect(result.current.notifications).toHaveLength(1);
    });
  });

  describe('Clear Notifications', () => {
    it('should clear all notifications', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showSuccess('Message 1');
        result.current.showError('Message 2');
        result.current.showWarning('Message 3');
      });

      expect(result.current.notifications).toHaveLength(3);

      act(() => {
        result.current.clear();
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('should handle clearing empty notifications', () => {
      const { result } = renderHook(() => useNotification());

      expect(result.current.notifications).toHaveLength(0);

      act(() => {
        result.current.clear();
      });

      expect(result.current.notifications).toHaveLength(0);
    });
  });

  describe('Multiple Notifications', () => {
    it('should handle multiple notifications of different types', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showSuccess('Success');
        result.current.showError('Error');
        result.current.showWarning('Warning');
        result.current.showInfo('Info');
      });

      expect(result.current.notifications).toHaveLength(4);
      expect(result.current.notifications[0].type).toBe('success');
      expect(result.current.notifications[1].type).toBe('error');
      expect(result.current.notifications[2].type).toBe('warning');
      expect(result.current.notifications[3].type).toBe('info');
    });

    it('should maintain notification order', () => {
      const { result } = renderHook(() => useNotification());

      const messages = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];

      act(() => {
        messages.forEach((msg) => result.current.showSuccess(msg));
      });

      expect(result.current.notifications).toHaveLength(5);
      messages.forEach((msg, index) => {
        expect(result.current.notifications[index].message).toBe(msg);
      });
    });

    it('should handle removing notifications from middle', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showSuccess('First');
        result.current.showSuccess('Second');
        result.current.showSuccess('Third');
      });

      const secondNotificationId = result.current.notifications[1].id;

      act(() => {
        result.current.remove(secondNotificationId);
      });

      expect(result.current.notifications).toHaveLength(2);
      expect(result.current.notifications[0].message).toBe('First');
      expect(result.current.notifications[1].message).toBe('Third');
    });
  });

  describe('Notification IDs', () => {
    it('should generate unique IDs for each notification', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showSuccess('Message 1');
        result.current.showSuccess('Message 2');
        result.current.showSuccess('Message 3');
      });

      const ids = result.current.notifications.map((n) => n.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showSuccess('');
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].message).toBe('');
    });

    it('should handle very long message', () => {
      const { result } = renderHook(() => useNotification());

      const longMessage = 'x'.repeat(1000);

      act(() => {
        result.current.showSuccess(longMessage);
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].message).toBe(longMessage);
    });

    it('should handle special characters in message', () => {
      const { result } = renderHook(() => useNotification());

      const specialMessage = 'Message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';

      act(() => {
        result.current.showSuccess(specialMessage);
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].message).toBe(specialMessage);
    });

    it('should handle zero duration', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showSuccess('Message', 0);
      });

      expect(result.current.notifications[0].duration).toBe(0);
    });

    it('should handle negative duration', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showSuccess('Message', -1000);
      });

      expect(result.current.notifications[0].duration).toBe(-1000);
    });
  });
});
