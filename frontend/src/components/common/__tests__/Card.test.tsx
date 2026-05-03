import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from '../Card';

describe('Card Component', () => {
  describe('Basic rendering', () => {
    it('should render card element', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should render children', () => {
      render(
        <Card>
          <h2>Title</h2>
          <p>Content</p>
        </Card>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should have card styling classes', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('bg-white', 'dark:bg-gray-800', 'rounded-lg', 'shadow-md');
    });
  });

  describe('Padding and spacing', () => {
    it('should have responsive padding', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('p-4', 'md:p-6');
    });
  });

  describe('Interactive cards', () => {
    it('should handle click events', () => {
      const handleClick = vi.fn();
      const { container } = render(<Card onClick={handleClick}>Clickable</Card>);
      const card = container.firstChild as HTMLElement;

      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('should have hover effect when clickable', () => {
      const { container } = render(<Card onClick={() => {}}>Clickable</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('cursor-pointer', 'hover:shadow-lg');
    });

    it('should not have hover effect when not clickable', () => {
      const { container } = render(<Card>Not clickable</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).not.toHaveClass('cursor-pointer');
    });
  });

  describe('Custom className', () => {
    it('should accept custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('custom-class');
    });

    it('should merge custom className with default classes', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('bg-white', 'custom-class');
    });
  });

  describe('Dark mode support', () => {
    it('should have dark mode classes', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('dark:bg-gray-800');
    });
  });

  describe('HTML attributes', () => {
    it('should accept data attributes', () => {
      const { container } = render(
        <Card data-testid="custom-card">Content</Card>
      );
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveAttribute('data-testid', 'custom-card');
    });

    it('should accept aria attributes', () => {
      const { container } = render(
        <Card aria-label="Card label">Content</Card>
      );
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveAttribute('aria-label', 'Card label');
    });
  });

  describe('Ref forwarding', () => {
    it('should forward ref to div element', () => {
      const ref = { current: null };
      const { container } = render(
        <Card ref={ref}>Content</Card>
      );

      expect(ref.current).toBe(container.firstChild);
    });
  });

  describe('Complex content', () => {
    it('should render complex nested content', () => {
      render(
        <Card>
          <div>
            <h2>Title</h2>
            <p>Description</p>
            <button>Action</button>
          </div>
        </Card>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
    });
  });

  describe('Transitions', () => {
    it('should have transition classes', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('transition-all', 'duration-200');
    });
  });
});
