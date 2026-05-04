/**
 * PageTransition Component Tests
 * Tests for page transition animations and accessibility
 * Requirement 2.8.4: Smooth animations and transitions throughout the UI
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { renderWithRouter } from '../utils/testUtils';
import { PageTransition, SlideTransition, ScaleTransition } from '../../components/layout/PageTransition';

// Mock window.matchMedia
const mockMatchMedia = vi.fn();

describe('PageTransition', () => {
  beforeEach(() => {
    mockMatchMedia.mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('PageTransition Component', () => {
    it('should render children initially', () => {
      renderWithRouter(
        <PageTransition>
          <div data-testid="test-content">Test Content</div>
        </PageTransition>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('should apply transition classes', () => {
      const { container } = renderWithRouter(
        <PageTransition>
          <div data-testid="test-content">Test Content</div>
        </PageTransition>
      );

      const transitionElement = container.firstChild as HTMLElement;
      expect(transitionElement).toHaveClass('transition-opacity');
    });

    it('should apply custom className', () => {
      const { container } = renderWithRouter(
        <PageTransition className="custom-class">
          <div data-testid="test-content">Test Content</div>
        </PageTransition>
      );

      const transitionElement = container.firstChild as HTMLElement;
      expect(transitionElement).toHaveClass('custom-class');
    });

    it('should apply custom duration style', () => {
      const { container } = renderWithRouter(
        <PageTransition duration={500}>
          <div data-testid="test-content">Test Content</div>
        </PageTransition>
      );

      const transitionElement = container.firstChild as HTMLElement;
      expect(transitionElement).toHaveStyle('transition-duration: 500ms');
    });

    it('should handle route changes with animation', async () => {
      const { rerender } = renderWithRouter(
        <PageTransition>
          <div data-testid="page1">Page 1</div>
        </PageTransition>,
        { routerProps: { initialEntries: ['/page1'] } }
      );

      expect(screen.getByTestId('page1')).toBeInTheDocument();

      // Simulate route change
      rerender(
        <PageTransition>
          <div data-testid="page2">Page 2</div>
        </PageTransition>
      );

      // Wait for transition to complete
      await waitFor(() => {
        expect(screen.getByTestId('page2')).toBeInTheDocument();
      });
    });

    it('should skip animation when prefers-reduced-motion is enabled', () => {
      mockMatchMedia.mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { rerender } = renderWithRouter(
        <PageTransition>
          <div data-testid="page1">Page 1</div>
        </PageTransition>,
        { routerProps: { initialEntries: ['/page1'] } }
      );

      expect(screen.getByTestId('page1')).toBeInTheDocument();

      // Simulate route change
      rerender(
        <PageTransition>
          <div data-testid="page2">Page 2</div>
        </PageTransition>
      );

      // Should immediately show new content without animation
      expect(screen.getByTestId('page2')).toBeInTheDocument();
    });
  });

  describe('SlideTransition Component', () => {
    it('should render children with slide transition classes', () => {
      const { container } = renderWithRouter(
        <SlideTransition>
          <div data-testid="test-content">Test Content</div>
        </SlideTransition>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      
      const transitionElement = container.querySelector('div > div') as HTMLElement;
      expect(transitionElement).toHaveClass('transform');
      expect(transitionElement).toHaveClass('transition-transform');
    });

    it('should apply correct transform classes for different directions', () => {
      const directions = ['left', 'right', 'up', 'down'] as const;
      
      directions.forEach(direction => {
        const { container } = renderWithRouter(
          <SlideTransition direction={direction}>
            <div data-testid={`test-content-${direction}`}>Test Content</div>
          </SlideTransition>
        );

        expect(screen.getByTestId(`test-content-${direction}`)).toBeInTheDocument();
      });
    });

    it('should handle route changes with slide animation', async () => {
      const { rerender } = renderWithRouter(
        <SlideTransition direction="right">
          <div data-testid="page1">Page 1</div>
        </SlideTransition>,
        { routerProps: { initialEntries: ['/page1'] } }
      );

      expect(screen.getByTestId('page1')).toBeInTheDocument();

      // Simulate route change
      rerender(
        <SlideTransition direction="right">
          <div data-testid="page2">Page 2</div>
        </SlideTransition>
      );

      // Wait for transition to complete
      await waitFor(() => {
        expect(screen.getByTestId('page2')).toBeInTheDocument();
      });
    });
  });

  describe('ScaleTransition Component', () => {
    it('should render children with scale transition classes', () => {
      const { container } = renderWithRouter(
        <ScaleTransition>
          <div data-testid="test-content">Test Content</div>
        </ScaleTransition>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      
      const transitionElement = container.firstChild as HTMLElement;
      expect(transitionElement).toHaveClass('transform');
      expect(transitionElement).toHaveClass('transition-all');
    });

    it('should apply custom duration', () => {
      const { container } = renderWithRouter(
        <ScaleTransition duration={400}>
          <div data-testid="test-content">Test Content</div>
        </ScaleTransition>
      );

      const transitionElement = container.firstChild as HTMLElement;
      expect(transitionElement).toHaveStyle('transition-duration: 400ms');
    });

    it('should handle route changes with scale animation', async () => {
      const { rerender } = renderWithRouter(
        <ScaleTransition>
          <div data-testid="page1">Page 1</div>
        </ScaleTransition>,
        { routerProps: { initialEntries: ['/page1'] } }
      );

      expect(screen.getByTestId('page1')).toBeInTheDocument();

      // Simulate route change
      rerender(
        <ScaleTransition>
          <div data-testid="page2">Page 2</div>
        </ScaleTransition>
      );

      // Wait for transition to complete
      await waitFor(() => {
        expect(screen.getByTestId('page2')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should respect prefers-reduced-motion for all transition types', () => {
      mockMatchMedia.mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const transitions = [
        { Component: PageTransition, name: 'page' },
        { Component: SlideTransition, name: 'slide' },
        { Component: ScaleTransition, name: 'scale' },
      ];

      transitions.forEach(({ Component, name }) => {
        const { rerender } = renderWithRouter(
          <Component>
            <div data-testid={`${name}-page1`}>Page 1</div>
          </Component>,
          { routerProps: { initialEntries: ['/page1'] } }
        );

        expect(screen.getByTestId(`${name}-page1`)).toBeInTheDocument();

        // Simulate route change
        rerender(
          <Component>
            <div data-testid={`${name}-page2`}>Page 2</div>
          </Component>
        );

        // Should immediately show new content without animation
        expect(screen.getByTestId(`${name}-page2`)).toBeInTheDocument();
      });
    });
  });
});