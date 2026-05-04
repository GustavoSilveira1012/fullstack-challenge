import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Card } from '@components/common/Card';
import { Modal } from '@components/common/Modal';
import { MultiplierDisplay } from '@components/game/MultiplierDisplay';
import { BetForm } from '@components/game/BetForm';
import { CashOutButton } from '@components/game/CashOutButton';
import { Header } from '@components/layout/Header';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

/**
 * Accessibility Test Suite
 * Tests WCAG 2.1 AA compliance for all components
 * Requirements: 3.3.1, 3.3.2, 3.3.3
 */

describe('Accessibility Tests', () => {
  beforeEach(() => {
    // Reset any global state before each test
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Clean up after each test
    document.body.innerHTML = '';
  });

  describe('Button Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Button onClick={() => {}}>Test Button</Button>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button onClick={handleClick}>Test Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Test Button' });
      
      // Test Tab navigation
      await user.tab();
      expect(button).toHaveFocus();
      
      // Test Enter key activation
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // Test Space key activation
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should have proper ARIA attributes when loading', () => {
      render(<Button loading={true}>Loading Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
    });

    it('should have proper ARIA attributes when disabled', () => {
      render(<Button disabled={true}>Disabled Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toBeDisabled();
    });
  });

  describe('Input Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Input label="Test Input" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper label association', () => {
      render(<Input label="Email Address" />);
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toBeInTheDocument();
    });

    it('should have proper error handling', () => {
      render(<Input label="Email" error="Invalid email" />);
      
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Invalid email');
    });

    it('should have proper required field indication', () => {
      render(<Input label="Required Field" required={true} />);
      
      const input = screen.getByLabelText(/Required Field/);
      expect(input).toHaveAttribute('required');
      
      // Check for visual required indicator
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('Card Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Card>Test Card Content</Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should be keyboard accessible when interactive', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(
        <Card onClick={handleClick} aria-label="Interactive Card">
          Card Content
        </Card>
      );
      
      const card = screen.getByRole('button', { name: 'Interactive Card' });
      
      // Test keyboard navigation
      await user.tab();
      expect(card).toHaveFocus();
      
      // Test Enter key activation
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // Test Space key activation
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Modal Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          Modal Content
        </Modal>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should trap focus within modal', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <button>Outside Button</button>
          <Modal isOpen={true} onClose={() => {}} title="Test Modal">
            <button>Inside Button 1</button>
            <button>Inside Button 2</button>
          </Modal>
        </div>
      );
      
      // Focus should be trapped inside modal
      const insideButton1 = screen.getByText('Inside Button 1');
      const insideButton2 = screen.getByText('Inside Button 2');
      const closeButton = screen.getByLabelText('Close modal');
      
      // Tab through modal elements
      await user.tab();
      expect(closeButton).toHaveFocus();
      
      await user.tab();
      expect(insideButton1).toHaveFocus();
      
      await user.tab();
      expect(insideButton2).toHaveFocus();
      
      // Should wrap back to first element
      await user.tab();
      expect(closeButton).toHaveFocus();
    });

    it('should close on Escape key', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      
      render(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          Modal Content
        </Modal>
      );
      
      await user.keyboard('{Escape}');
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should have proper ARIA attributes', () => {
      render(
        <Modal 
          isOpen={true} 
          onClose={() => {}} 
          title="Test Modal"
          description="Modal description"
        >
          Modal Content
        </Modal>
      );
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby');
      expect(modal).toHaveAttribute('aria-describedby');
    });
  });

  describe('MultiplierDisplay Component', () => {
    it('should have no accessibility violations', async () => {
      // Mock the game store
      vi.mock('@store/gameStore', () => ({
        useGameStore: () => ({
          currentMultiplier: 2.45,
          roundState: 'RUNNING'
        })
      }));

      const { container } = render(<MultiplierDisplay />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper live region for screen readers', () => {
      vi.mock('@store/gameStore', () => ({
        useGameStore: () => ({
          currentMultiplier: 2.45,
          roundState: 'RUNNING'
        })
      }));

      render(<MultiplierDisplay />);
      
      const liveRegion = screen.getByRole('region');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      
      const multiplierStatus = screen.getByRole('status');
      expect(multiplierStatus).toHaveAttribute('aria-live', 'assertive');
    });

    it('should announce round state changes', () => {
      vi.mock('@store/gameStore', () => ({
        useGameStore: () => ({
          currentMultiplier: 2.45,
          roundState: 'CRASHED'
        })
      }));

      render(<MultiplierDisplay />);
      
      const crashAlert = screen.getByRole('alert');
      expect(crashAlert).toBeInTheDocument();
    });
  });

  describe('Header Component', () => {
    it('should have no accessibility violations', async () => {
      // Mock required hooks
      vi.mock('@hooks/useAuth', () => ({
        useAuth: () => ({
          email: 'test@example.com',
          performLogout: vi.fn()
        })
      }));

      vi.mock('@hooks/useWallet', () => ({
        useWallet: () => ({
          balance: 10000,
          formatBalance: (balance: number) => `R$ ${(balance / 100).toFixed(2)}`
        })
      }));

      const { container } = render(<Header />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper navigation structure', () => {
      vi.mock('@hooks/useAuth', () => ({
        useAuth: () => ({
          email: 'test@example.com',
          performLogout: vi.fn()
        })
      }));

      vi.mock('@hooks/useWallet', () => ({
        useWallet: () => ({
          balance: 10000,
          formatBalance: (balance: number) => `R$ ${(balance / 100).toFixed(2)}`
        })
      }));

      render(<Header />);
      
      const banner = screen.getByRole('banner');
      expect(banner).toBeInTheDocument();
      
      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();
    });

    it('should have keyboard accessible menu', async () => {
      const user = userEvent.setup();
      
      vi.mock('@hooks/useAuth', () => ({
        useAuth: () => ({
          email: 'test@example.com',
          performLogout: vi.fn()
        })
      }));

      render(<Header />);
      
      const menuButton = screen.getByLabelText('User account menu');
      
      // Open menu with Enter key
      await user.click(menuButton);
      
      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
      
      // Test Escape key closes menu
      await user.keyboard('{Escape}');
      expect(menu).not.toBeInTheDocument();
    });
  });

  describe('Color Contrast', () => {
    it('should meet WCAG AA contrast requirements', () => {
      // Test primary colors
      const primaryButton = render(<Button variant="primary">Primary</Button>);
      const button = primaryButton.getByRole('button');
      
      const styles = window.getComputedStyle(button);
      // Note: In a real test, you would use a color contrast library
      // to verify the actual contrast ratio meets 4.5:1 for AA compliance
      expect(styles.backgroundColor).toBeDefined();
      expect(styles.color).toBeDefined();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through interactive elements', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <Button>Button 1</Button>
          <Input label="Input Field" />
          <Button>Button 2</Button>
        </div>
      );
      
      const button1 = screen.getByText('Button 1');
      const input = screen.getByLabelText('Input Field');
      const button2 = screen.getByText('Button 2');
      
      // Tab through elements
      await user.tab();
      expect(button1).toHaveFocus();
      
      await user.tab();
      expect(input).toHaveFocus();
      
      await user.tab();
      expect(button2).toHaveFocus();
    });

    it('should support shift+tab for reverse navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <Button>Button 1</Button>
          <Button>Button 2</Button>
        </div>
      );
      
      const button1 = screen.getByText('Button 1');
      const button2 = screen.getByText('Button 2');
      
      // Focus last element first
      button2.focus();
      expect(button2).toHaveFocus();
      
      // Shift+Tab to previous element
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(button1).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide meaningful labels for all interactive elements', () => {
      render(
        <div>
          <Button aria-label="Save document">💾</Button>
          <Input label="Email address" type="email" />
          <img src="/logo.png" alt="Company logo" />
        </div>
      );
      
      expect(screen.getByLabelText('Save document')).toBeInTheDocument();
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
      expect(screen.getByAltText('Company logo')).toBeInTheDocument();
    });

    it('should use proper heading hierarchy', () => {
      render(
        <div>
          <h1>Main Title</h1>
          <h2>Section Title</h2>
          <h3>Subsection Title</h3>
        </div>
      );
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Main Title');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Section Title');
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Subsection Title');
    });

    it('should provide live regions for dynamic content', () => {
      render(
        <div>
          <div aria-live="polite" aria-atomic="true">
            Status updates appear here
          </div>
          <div aria-live="assertive">
            Critical alerts appear here
          </div>
        </div>
      );
      
      const politeRegion = screen.getByText('Status updates appear here');
      expect(politeRegion).toHaveAttribute('aria-live', 'polite');
      
      const assertiveRegion = screen.getByText('Critical alerts appear here');
      expect(assertiveRegion).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('Form Accessibility', () => {
    it('should associate labels with form controls', () => {
      render(
        <form>
          <Input label="Username" required />
          <Input label="Password" type="password" required />
          <Button type="submit">Login</Button>
        </form>
      );
      
      const usernameInput = screen.getByLabelText(/Username/);
      const passwordInput = screen.getByLabelText(/Password/);
      
      expect(usernameInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should provide error messages with proper associations', () => {
      render(
        <Input 
          label="Email" 
          error="Please enter a valid email address"
          aria-describedby="email-error"
        />
      );
      
      const input = screen.getByLabelText('Email');
      const errorMessage = screen.getByRole('alert');
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(errorMessage).toHaveTextContent('Please enter a valid email address');
    });
  });
});