import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loading } from '../Loading';

describe('Loading Component', () => {
  describe('Basic rendering', () => {
    it('should render loading spinner', () => {
      const { container } = render(<Loading />);
      const spinner = container.querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });

    it('should have loading status role', () => {
      const { container } = render(<Loading />);
      const status = container.querySelector('[role="status"]');
      expect(status).toBeInTheDocument();
    });

    it('should have aria-label', () => {
      const { container } = render(<Loading />);
      const status = container.querySelector('[role="status"]');
      expect(status).toHaveAttribute('aria-label', 'Loading');
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      const { container } = render(<Loading size="small" />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('w-6', 'h-6');
    });

    it('should render medium size by default', () => {
      const { container } = render(<Loading />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('w-10', 'h-10');
    });

    it('should render large size', () => {
      const { container } = render(<Loading size="large" />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('w-16', 'h-16');
    });
  });

  describe('Text display', () => {
    it('should render text when provided', () => {
      render(<Loading text="Loading data..." />);
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('should not render text when not provided', () => {
      render(<Loading />);
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    it('should render text with spinner', () => {
      const { container } = render(<Loading size="medium" text="Please wait" />);
      expect(screen.getByText('Please wait')).toBeInTheDocument();
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Overlay mode', () => {
    it('should render overlay when overlay prop is true', () => {
      const { container } = render(<Loading overlay />);
      const overlay = container.querySelector('.fixed');
      expect(overlay).toBeInTheDocument();
    });

    it('should have overlay styling', () => {
      const { container } = render(<Loading overlay />);
      const overlay = container.querySelector('.fixed');
      expect(overlay).toHaveClass('inset-0', 'bg-black', 'bg-opacity-50', 'z-50');
    });

    it('should render card background in overlay', () => {
      const { container } = render(<Loading overlay />);
      const card = container.querySelector('.bg-white');
      expect(card).toBeInTheDocument();
    });

    it('should not render overlay by default', () => {
      const { container } = render(<Loading />);
      const overlay = container.querySelector('.fixed');
      expect(overlay).not.toBeInTheDocument();
    });

    it('should render spinner inside card in overlay mode', () => {
      const { container } = render(<Loading overlay />);
      const card = container.querySelector('.bg-white');
      const spinner = card?.querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Spinner animation', () => {
    it('should have animate-spin class', () => {
      const { container } = render(<Loading />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('should have color classes', () => {
      const { container } = render(<Loading />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('text-blue-600', 'dark:text-blue-400');
    });
  });

  describe('Custom className', () => {
    it('should accept custom className', () => {
      const { container } = render(<Loading className="custom-class" />);
      const status = container.querySelector('[role="status"]');
      expect(status).toHaveClass('custom-class');
    });

    it('should accept custom className in overlay mode', () => {
      const { container } = render(<Loading overlay className="custom-overlay" />);
      const overlay = container.querySelector('.fixed');
      expect(overlay).toHaveClass('custom-overlay');
    });
  });

  describe('Dark mode support', () => {
    it('should have dark mode classes', () => {
      const { container } = render(<Loading />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('dark:text-blue-400');
    });

    it('should have dark mode for text', () => {
      const { container } = render(<Loading text="Loading" />);
      const text = container.querySelector('p');
      expect(text).toHaveClass('dark:text-gray-400');
    });

    it('should have dark mode for overlay card', () => {
      const { container } = render(<Loading overlay />);
      const card = container.querySelector('.bg-white');
      expect(card).toHaveClass('dark:bg-gray-800');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-busy attribute', () => {
      const { container } = render(<Loading />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveAttribute('aria-busy', 'true');
    });

    it('should have aria-label on spinner', () => {
      const { container } = render(<Loading />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    it('should have proper role for status', () => {
      const { container } = render(<Loading />);
      const status = container.querySelector('[role="status"]');
      expect(status).toHaveAttribute('role', 'status');
    });
  });

  describe('Spinner SVG structure', () => {
    it('should render SVG with proper structure', () => {
      const { container } = render(<Loading />);
      const svg = container.querySelector('svg');
      expect(svg?.tagName).toBe('svg');
    });

    it('should have circle and path elements', () => {
      const { container } = render(<Loading />);
      const svg = container.querySelector('svg');
      const circles = svg?.querySelectorAll('circle');
      const paths = svg?.querySelectorAll('path');

      expect(circles?.length).toBeGreaterThan(0);
      expect(paths?.length).toBeGreaterThan(0);
    });
  });

  describe('Layout', () => {
    it('should center content', () => {
      const { container } = render(<Loading />);
      const status = container.querySelector('[role="status"]');
      expect(status).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should have gap between spinner and text', () => {
      const { container } = render(<Loading text="Loading" />);
      const innerDiv = container.querySelector('.flex.flex-col');
      expect(innerDiv).toHaveClass('gap-3');
    });
  });
});
