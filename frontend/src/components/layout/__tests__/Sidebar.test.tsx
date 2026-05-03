import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '../Sidebar';

// Mock hooks
vi.mock('@hooks/useGame', () => ({
  useGame: () => ({
    fetchRoundHistory: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'round-1',
          crashPoint: 2.45,
          createdAt: new Date().toISOString(),
          playerCount: 5,
          totalWagered: 10000,
        },
        {
          id: 'round-2',
          crashPoint: 1.89,
          createdAt: new Date().toISOString(),
          playerCount: 3,
          totalWagered: 5000,
        },
      ],
    }),
  }),
}));

describe('Sidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const onClose = vi.fn();
    const { container } = render(<Sidebar isOpen={false} onClose={onClose} />);

    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('translate-x-full');
  });

  it('should render when isOpen is true', async () => {
    const onClose = vi.fn();
    render(<Sidebar isOpen={true} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Game History')).toBeInTheDocument();
    });
  });

  it('should display recent rounds', async () => {
    const onClose = vi.fn();
    render(<Sidebar isOpen={true} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Recent Rounds')).toBeInTheDocument();
    });
  });

  it('should display crash points for rounds', async () => {
    const onClose = vi.fn();
    render(<Sidebar isOpen={true} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('2.45x')).toBeInTheDocument();
      expect(screen.getByText('1.89x')).toBeInTheDocument();
    });
  });

  it('should display player count for rounds', async () => {
    const onClose = vi.fn();
    render(<Sidebar isOpen={true} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('5 players')).toBeInTheDocument();
      expect(screen.getByText('3 players')).toBeInTheDocument();
    });
  });

  it('should display statistics section', async () => {
    const onClose = vi.fn();
    render(<Sidebar isOpen={true} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Statistics')).toBeInTheDocument();
      expect(screen.getByText('Total Rounds')).toBeInTheDocument();
      expect(screen.getByText('Avg. Crash Point')).toBeInTheDocument();
      expect(screen.getByText('Total Wagered')).toBeInTheDocument();
    });
  });

  it('should calculate average crash point correctly', async () => {
    const onClose = vi.fn();
    render(<Sidebar isOpen={true} onClose={onClose} />);

    await waitFor(() => {
      // Average of 2.45 and 1.89 = 2.17
      expect(screen.getByText('2.17x')).toBeInTheDocument();
    });
  });

  it('should display navigation links', async () => {
    const onClose = vi.fn();
    render(<Sidebar isOpen={true} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Bet History')).toBeInTheDocument();
      expect(screen.getByText('Verify Fairness')).toBeInTheDocument();
    });
  });

  it('should call onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<Sidebar isOpen={true} onClose={onClose} />);

    await waitFor(() => {
      const closeButton = screen.getByLabelText('Close sidebar');
      userEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('should call onClose when navigation item is clicked', async () => {
    const onClose = vi.fn();
    render(<Sidebar isOpen={true} onClose={onClose} />);

    await waitFor(() => {
      const dashboardButton = screen.getByText('Dashboard');
      userEvent.click(dashboardButton);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('should have proper accessibility attributes', async () => {
    const onClose = vi.fn();
    const { container } = render(<Sidebar isOpen={true} onClose={onClose} />);

    await waitFor(() => {
      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveAttribute('role', 'complementary');
      expect(sidebar).toHaveAttribute('aria-label', 'Game history and statistics');
    });
  });

  it('should display loading state initially', () => {
    const onClose = vi.fn();
    const { container } = render(<Sidebar isOpen={true} onClose={onClose} />);

    // Check for loading spinner
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render responsive classes', () => {
    const onClose = vi.fn();
    const { container } = render(<Sidebar isOpen={true} onClose={onClose} />);

    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('fixed', 'md:relative', 'md:shadow-none');
  });

  it('should display overlay on mobile when open', () => {
    const onClose = vi.fn();
    const { container } = render(<Sidebar isOpen={true} onClose={onClose} />);

    const overlay = container.querySelector('[role="presentation"]');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('md:hidden');
  });

  it('should call onClose when overlay is clicked', async () => {
    const onClose = vi.fn();
    const { container } = render(<Sidebar isOpen={true} onClose={onClose} />);

    await waitFor(() => {
      const overlay = container.querySelector('[role="presentation"]');
      if (overlay) {
        userEvent.click(overlay);
        expect(onClose).toHaveBeenCalled();
      }
    });
  });

  it('should display total wagered in correct format', async () => {
    const onClose = vi.fn();
    render(<Sidebar isOpen={true} onClose={onClose} />);

    await waitFor(() => {
      // Total wagered: 10000 + 5000 = 15000 centavos = R$ 150.00
      expect(screen.getByText('R$ 150.00')).toBeInTheDocument();
    });
  });

  it('should display correct number of rounds', async () => {
    const onClose = vi.fn();
    render(<Sidebar isOpen={true} onClose={onClose} />);

    await waitFor(() => {
      const totalRoundsElement = screen.getByText('2');
      expect(totalRoundsElement).toBeInTheDocument();
    });
  });
});
