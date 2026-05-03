import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge Component', () => {
  describe('Variants', () => {
    it('should render primary variant by default', () => {
      const { container } = render(<Badge>Primary</Badge>);
      const badge = container.firstChild as HTMLElement;

      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('should render success variant', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      const badge = container.firstChild as HTMLElement;

      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should render danger variant', () => {
      const { container } = render(<Badge variant="danger">Danger</Badge>);
      const badge = container.firstChild as HTMLElement;

      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should render warning variant', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      const badge = container.firstChild as HTMLElement;

      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should render info variant', () => {
      const { container } = render(<Badge variant="info">Info</Badge>);
      const badge = container.firstChild as HTMLElement;

      expect(badge).toHaveClass('bg-cyan-100', 'text-cyan-800');
    });
  });

  describe('Dark mode support', () => {
    it('should have dark mode classes for primary', () => {
      const { container } = render(<Badge>Primary</Badge>);
      const badge = container.firstChild as HTMLElement;

      expect(badge).toHaveClass('dark:bg-blue-900', 'dark:text-blue-200');
    });

    it('should have dark mode classes for success', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      const badge = container.firstChild as HTMLElement;

      expect(badge).toHaveClass('dark:bg-green-900', 'dark:text-green-200');
    });

    it('should have dark mode classes for danger', () => {
      const { container } = render(<Badge variant="danger">Danger</Badge>);
      const badge = container.firstChild as HTMLElement;

      expect(badge).toHaveClass('dark:bg-red-900', 'dark:text-red-200');
    });

    it('should have dark mode classes for warning', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      const badge = container.firstChild as HTMLElement;

      expect(badge).toHaveClass('dark:bg-yellow-900', 'dark:text-yellow-200');
    });

    it('should have dark mode classes for info', () => {
      const { container } = render(<Badge variant="info">Info</Badge>);
      const badge = container.firstChild as HTMLElement;

      expect(badge).toHaveClass('dark:bg-cyan-900', 'dark:text-cyan-200');
    });
  });

  describe('Styling', () => {
    it('should have badge styling classes', () => {
      const { container } = render(<Badge>Badge</Badge>);
      const badge = container.firstChild as HTMLElement;

      expect(badge).toHaveClass('inline-flex', 'items-center', 'px-2.5', 'py-0.5', 'rounded-full', 'text-xs', 'font-medium');
    });
  });

  describe('Content rendering', () => {
    it('should render text content', () => {
      render(<Badge>Badge Text</Badge>);
      expect(screen.getByText('Badge Text')).toBeInTheDocument();
    });

    it('should render element content', () => {
      render(
        <Badge>
          <span>Icon</span> Text
        </Badge>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should accept custom className', () => {
      const { container } = render(<Badge className="custom-class">Badge</Badge>);
      const badge = container.firstChild as HTMLElement;

      expect(badge).toHaveClass('custom-class');
    });

    it('should merge custom className with default classes', () => {
      const { container } = render(<Badge className="custom-class">Badge</Badge>);
      const badge = container.firstChild as HTMLElement;

      expect(badge).toHaveClass('inline-flex', 'custom-class');
    });
  });

  describe('HTML attributes', () => {
    it('should accept data attributes', () => {
      const { container } = render(
        <Badge data-testid="custom-badge">Badge</Badge>
      );
      const badge = container.firstChild as HTMLElement;

      expect(badge).toHaveAttribute('data-testid', 'custom-badge');
    });

    it('should accept aria attributes', () => {
      const { container } = render(
        <Badge aria-label="Status badge">Active</Badge>
      );
      const badge = container.firstChild as HTMLElement;

      expect(badge).toHaveAttribute('aria-label', 'Status badge');
    });
  });

  describe('Ref forwarding', () => {
    it('should forward ref to span element', () => {
      const ref = { current: null };
      const { container } = render(
        <Badge ref={ref}>Badge</Badge>
      );

      expect(ref.current).toBe(container.firstChild);
    });
  });

  describe('Status indicators', () => {
    it('should display success status', () => {
      render(<Badge variant="success">Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should display error status', () => {
      render(<Badge variant="danger">Error</Badge>);
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should display warning status', () => {
      render(<Badge variant="warning">Pending</Badge>);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });
});
