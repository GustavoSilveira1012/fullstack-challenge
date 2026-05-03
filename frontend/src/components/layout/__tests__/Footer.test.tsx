import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '../Footer';

describe('Footer Component', () => {
  it('should render footer', () => {
    const { container } = render(<Footer />);

    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('should display brand information', () => {
    render(<Footer />);

    expect(screen.getByText('Crash Game')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Experience the thrill of real-time multiplier gaming with fair and transparent gameplay.'
      )
    ).toBeInTheDocument();
  });

  it('should display quick links section', () => {
    render(<Footer />);

    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('How to Play')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('Statistics')).toBeInTheDocument();
  });

  it('should display legal links section', () => {
    render(<Footer />);

    expect(screen.getByText('Legal')).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Cookie Policy')).toBeInTheDocument();
    expect(screen.getByText('Responsible Gaming')).toBeInTheDocument();
  });

  it('should display support section', () => {
    render(<Footer />);

    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByText('support@crashgame.com')).toBeInTheDocument();
    expect(screen.getByText('Help Center')).toBeInTheDocument();
  });

  it('should display social media links', () => {
    render(<Footer />);

    const twitterLink = screen.getByLabelText('Twitter');
    const discordLink = screen.getByLabelText('Discord');
    const telegramLink = screen.getByLabelText('Telegram');

    expect(twitterLink).toBeInTheDocument();
    expect(discordLink).toBeInTheDocument();
    expect(telegramLink).toBeInTheDocument();
  });

  it('should display copyright information', () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} Crash Game. All rights reserved.`)).toBeInTheDocument();
  });

  it('should display responsible gaming notice', () => {
    render(<Footer />);

    expect(screen.getByText('Play responsibly. 18+ only.')).toBeInTheDocument();
  });

  it('should have proper link structure', () => {
    render(<Footer />);

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);

    // Check that all links have href attribute
    links.forEach((link) => {
      expect(link).toHaveAttribute('href');
    });
  });

  it('should have proper accessibility attributes', () => {
    const { container } = render(<Footer />);

    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();

    // Check for semantic HTML
    const headings = container.querySelectorAll('h3, h4');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('should have social media links with aria-labels', () => {
    render(<Footer />);

    const socialLinks = [
      screen.getByLabelText('Twitter'),
      screen.getByLabelText('Discord'),
      screen.getByLabelText('Telegram'),
    ];

    socialLinks.forEach((link) => {
      expect(link).toHaveAttribute('aria-label');
    });
  });

  it('should display all footer sections', () => {
    render(<Footer />);

    const sections = [
      'Quick Links',
      'Legal',
      'Support',
    ];

    sections.forEach((section) => {
      expect(screen.getByText(section)).toBeInTheDocument();
    });
  });

  it('should have responsive grid layout', () => {
    const { container } = render(<Footer />);

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-4');
  });

  it('should have proper dark mode support', () => {
    const { container } = render(<Footer />);

    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('dark:bg-gray-900');
  });

  it('should display email link correctly', () => {
    render(<Footer />);

    const emailLink = screen.getByText('support@crashgame.com');
    expect(emailLink).toHaveAttribute('href', 'mailto:support@crashgame.com');
  });

  it('should have proper focus states for accessibility', () => {
    render(<Footer />);

    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    });
  });
});
