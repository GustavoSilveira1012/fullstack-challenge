import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Notification, NotificationContainer } from '../Notification';

describe('Notification Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Notification', () => {
    it('should render notification with message', () => {
      const onClose = vi.fn();
      render(
        <Notification
          id="1"
          type="success"
          message="Test message"
          onClose={onClose}
        />
      );

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should render different notification types', () => {
      const onClose = vi.fn();
      const types: Array<'success' | 'error' | 'warning' | 'info'> = [
        'success',
        'error',
        'warning',
        'info',
      ];

      types.forEach((type) => {
        const { unmount } = render(
          <Notification
            id="1"
            type={type}
            message={`${type} message`}
            onClose={onClose}
          />
        );

        expect(screen.getByText(`${type} message`)).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
        unmount();
      });
    });

    it('should have proper accessibility attributes', () => {
      const onClose = vi.fn();
      render(
        <Notification
          id="1"
          type="success"
          message="Test message"
          onClose={onClose}
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
      expect(alert).toHaveAttribute('aria-atomic', 'true');
    });

    it('should call onClose when dismiss button is clicked', async () => {
      const onClose = vi.fn();
      render(
        <Notification
          id="1"
          type="success"
          message="Test message"
          onClose={onClose}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss notification');
      await userEvent.click(dismissButton);

      expect(onClose).toHaveBeenCalledWith('1');
    });

    it('should auto-dismiss after default duration', async () => {
      const onClose = vi.fn();
      render(
        <Notification
          id="1"
          type="success"
          message="Test message"
          onClose={onClose}
        />
      );

      vi.advanceTimersByTime(3000);

      expect(onClose).toHaveBeenCalledWith('1');
    });

    it('should auto-dismiss after custom duration', async () => {
      const onClose = vi.fn();
      render(
        <Notification
          id="1"
          type="success"
          message="Test message"
          duration={5000}
          onClose={onClose}
        />
      );

      vi.advanceTimersByTime(5000);

      expect(onClose).toHaveBeenCalledWith('1');
    });

    it('should not auto-dismiss if duration is 0', async () => {
      const onClose = vi.fn();
      render(
        <Notification
          id="1"
          type="success"
          message="Test message"
          duration={0}
          onClose={onClose}
        />
      );

      vi.advanceTimersByTime(10000);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should render success icon for success type', () => {
      const onClose = vi.fn();
      const { container } = render(
        <Notification
          id="1"
          type="success"
          message="Success message"
          onClose={onClose}
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render error icon for error type', () => {
      const onClose = vi.fn();
      const { container } = render(
        <Notification
          id="1"
          type="error"
          message="Error message"
          onClose={onClose}
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('NotificationContainer', () => {
    it('should render multiple notifications', () => {
      const onRemove = vi.fn();
      const notifications = [
        { id: '1', type: 'success' as const, message: 'Success 1' },
        { id: '2', type: 'error' as const, message: 'Error 1' },
        { id: '3', type: 'info' as const, message: 'Info 1' },
      ];

      render(
        <NotificationContainer
          notifications={notifications}
          onRemove={onRemove}
        />
      );

      expect(screen.getByText('Success 1')).toBeInTheDocument();
      expect(screen.getByText('Error 1')).toBeInTheDocument();
      expect(screen.getByText('Info 1')).toBeInTheDocument();
    });

    it('should render empty container when no notifications', () => {
      const onRemove = vi.fn();
      const { container } = render(
        <NotificationContainer notifications={[]} onRemove={onRemove} />
      );

      const region = container.querySelector('[role="region"]');
      expect(region).toBeInTheDocument();
      expect(region?.children.length).toBe(0);
    });

    it('should call onRemove when notification is dismissed', async () => {
      const onRemove = vi.fn();
      const notifications = [
        { id: '1', type: 'success' as const, message: 'Success 1' },
      ];

      render(
        <NotificationContainer
          notifications={notifications}
          onRemove={onRemove}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss notification');
      await userEvent.click(dismissButton);

      expect(onRemove).toHaveBeenCalledWith('1');
    });

    it('should have proper accessibility attributes', () => {
      const onRemove = vi.fn();
      const notifications = [
        { id: '1', type: 'success' as const, message: 'Success 1' },
      ];

      const { container } = render(
        <NotificationContainer
          notifications={notifications}
          onRemove={onRemove}
        />
      );

      const region = container.querySelector('[role="region"]');
      expect(region).toHaveAttribute('aria-label', 'Notifications');
      expect(region).toHaveAttribute('aria-live', 'polite');
      expect(region).toHaveAttribute('aria-atomic', 'false');
    });

    it('should stack notifications vertically', () => {
      const onRemove = vi.fn();
      const notifications = [
        { id: '1', type: 'success' as const, message: 'Success 1' },
        { id: '2', type: 'error' as const, message: 'Error 1' },
      ];

      const { container } = render(
        <NotificationContainer
          notifications={notifications}
          onRemove={onRemove}
        />
      );

      const region = container.querySelector('[role="region"]');
      expect(region).toHaveClass('flex', 'flex-col', 'gap-2');
    });
  });
});
