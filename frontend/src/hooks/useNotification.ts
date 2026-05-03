import { useCallback } from 'react';
import { useUIStore, type Notification } from '@store/uiStore';

/**
 * useNotification Hook: Manages notifications
 * Requirement 2.8.3: Display success notifications
 */
export const useNotification = () => {
  const { notifications, addNotification, removeNotification, clearNotifications } = useUIStore();

  /**
   * Show success notification
   */
  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      addNotification({
        type: 'success',
        message,
        duration: duration || 3000,
      });
    },
    [addNotification]
  );

  /**
   * Show error notification
   */
  const showError = useCallback(
    (message: string, duration?: number) => {
      addNotification({
        type: 'error',
        message,
        duration: duration || 5000,
      });
    },
    [addNotification]
  );

  /**
   * Show warning notification
   */
  const showWarning = useCallback(
    (message: string, duration?: number) => {
      addNotification({
        type: 'warning',
        message,
        duration: duration || 4000,
      });
    },
    [addNotification]
  );

  /**
   * Show info notification
   */
  const showInfo = useCallback(
    (message: string, duration?: number) => {
      addNotification({
        type: 'info',
        message,
        duration: duration || 3000,
      });
    },
    [addNotification]
  );

  /**
   * Show custom notification
   */
  const show = useCallback(
    (notification: Omit<Notification, 'id'>) => {
      addNotification(notification);
    },
    [addNotification]
  );

  /**
   * Remove notification by ID
   */
  const remove = useCallback(
    (id: string) => {
      removeNotification(id);
    },
    [removeNotification]
  );

  /**
   * Clear all notifications
   */
  const clear = useCallback(() => {
    clearNotifications();
  }, [clearNotifications]);

  return {
    // State
    notifications,

    // Actions
    showSuccess,
    showError,
    showWarning,
    showInfo,
    show,
    remove,
    clear,
  };
};
