import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VerifyPage } from '../../pages/VerifyPage';
import { gameService } from '../../services/gameService';

// Mock the game service
vi.mock('../../services/gameService');

// Mock React Router hooks
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/verify' }),
}));

/**
 * E2E Tests for VerifyPage component
 * Requirement 13.5: Write E2E tests for history and verification
 */

describe('Verify Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display provably fair verification page', async () => {
    render(<VerifyPage />);

    // Check page title and description
    expect(screen.getByText('Provably Fair Verification')).toBeInTheDocument();
    expect(screen.getByText(/Verify the fairness of any game round/)).toBeInTheDocument();

    // Check "How It Works" section
    expect(screen.getByText('How Provably Fair Works')).toBeInTheDocument();
    expect(screen.getByText(/Server Seed:/)).toBeInTheDocument();
    expect(screen.getByText(/Client Seed:/)).toBeInTheDocument();
    expect(screen.getByText(/Crash Point Calculation:/)).toBeInTheDocument();
    expect(screen.getByText(/Verification:/)).toBeInTheDocument();
  });

  it('should display verification form with all required fields', async () => {
    render(<VerifyPage />);

    // Check form title
    expect(screen.getByText('Verify Round')).toBeInTheDocument();

    // Check form fields
    expect(screen.getByLabelText('Round ID')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/123e4567/)).toBeInTheDocument();

    expect(screen.getByLabelText('Server Seed Hash')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/a1b2c3d4/)).toBeInTheDocument();

    expect(screen.getByLabelText('Client Seed')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/MyRandomSeed123/)).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Verify Round')).toBeInTheDocument();
    expect(screen.getByText('Clear Form')).toBeInTheDocument();
    expect(screen.getByText('Generate Random Seed')).toBeInTheDocument();
  });

  it('should generate random client seed', async () => {
    const user = userEvent.setup();
    render(<VerifyPage />);

    const clientSeedInput = screen.getByPlaceholderText(/MyRandomSeed123/);
    
    // Initially empty
    expect(clientSeedInput).toHaveValue('');
    
    // Click generate button
    const generateButton = screen.getByText('Generate Random Seed');
    await user.click(generateButton);
    
    // Should now have a value
    const value = (clientSeedInput as HTMLInputElement).value;
    expect(value).toBeTruthy();
    expect(value.length).toBeGreaterThan(0);
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<VerifyPage />);

    // Try to submit empty form
    const submitButton = screen.getByText('Verify Round');
    await user.click(submitButton);
    
    // Check validation errors
    await waitFor(() => {
      expect(screen.getByText('Round ID is required')).toBeInTheDocument();
      expect(screen.getByText('Server seed hash is required')).toBeInTheDocument();
      expect(screen.getByText('Client seed is required')).toBeInTheDocument();
    });
  });

  it('should validate Round ID format', async () => {
    const user = userEvent.setup();
    render(<VerifyPage />);

    // Enter invalid Round ID
    const roundIdInput = screen.getByPlaceholderText(/123e4567/);
    await user.type(roundIdInput, 'invalid-uuid');
    
    const submitButton = screen.getByText('Verify Round');
    await user.click(submitButton);
    
    // Check validation error
    await waitFor(() => {
      expect(screen.getByText('Round ID must be a valid UUID format')).toBeInTheDocument();
    });
  });

  it('should validate Server Seed Hash format', async () => {
    const user = userEvent.setup();
    render(<VerifyPage />);

    // Enter valid Round ID
    const roundIdInput = screen.getByPlaceholderText(/123e4567/);
    await user.type(roundIdInput, '123e4567-e89b-12d3-a456-426614174000');
    
    // Enter invalid Server Seed Hash
    const serverSeedInput = screen.getByPlaceholderText(/a1b2c3d4/);
    await user.type(serverSeedInput, 'invalid-hash');
    
    const submitButton = screen.getByText('Verify Round');
    await user.click(submitButton);
    
    // Check validation error
    await waitFor(() => {
      expect(screen.getByText('Server seed hash must be a 64-character hexadecimal string')).toBeInTheDocument();
    });
  });

  it('should clear form when Clear Form button is clicked', async () => {
    const user = userEvent.setup();
    render(<VerifyPage />);

    // Fill form with data
    const roundIdInput = screen.getByPlaceholderText(/123e4567/);
    const serverSeedInput = screen.getByPlaceholderText(/a1b2c3d4/);
    const clientSeedInput = screen.getByPlaceholderText(/MyRandomSeed123/);
    
    await user.type(roundIdInput, '123e4567-e89b-12d3-a456-426614174000');
    await user.type(serverSeedInput, 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456');
    await user.type(clientSeedInput, 'TestSeed123');
    
    // Click clear form
    const clearButton = screen.getByText('Clear Form');
    await user.click(clearButton);
    
    // Check that all fields are cleared
    expect(roundIdInput).toHaveValue('');
    expect(serverSeedInput).toHaveValue('');
    expect(clientSeedInput).toHaveValue('');
  });

  it('should handle successful verification', async () => {
    const user = userEvent.setup();
    
    // Mock successful verification API response
    (gameService.verifyRound as any).mockResolvedValue({
      verified: true,
      crashPoint: 2.45,
      serverSeedHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
      clientSeed: 'TestSeed123',
      message: 'Round verified successfully'
    });

    render(<VerifyPage />);

    // Fill valid form data
    const roundIdInput = screen.getByPlaceholderText(/123e4567/);
    const serverSeedInput = screen.getByPlaceholderText(/a1b2c3d4/);
    const clientSeedInput = screen.getByPlaceholderText(/MyRandomSeed123/);
    
    await user.type(roundIdInput, '123e4567-e89b-12d3-a456-426614174000');
    await user.type(serverSeedInput, 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456');
    await user.type(clientSeedInput, 'TestSeed123');
    
    // Submit form
    const submitButton = screen.getByText('Verify Round');
    await user.click(submitButton);
    
    // Check success result
    await waitFor(() => {
      expect(screen.getByText('Round Verified Successfully')).toBeInTheDocument();
      expect(screen.getByText('Round verified successfully')).toBeInTheDocument();
      expect(screen.getByText('2.45x')).toBeInTheDocument();
      expect(screen.getByText('VERIFIED ✓')).toBeInTheDocument();
    });
    
    // Check technical details
    expect(screen.getByText('Technical Details')).toBeInTheDocument();
    expect(screen.getByText('Server Seed Hash:')).toBeInTheDocument();
    expect(screen.getByText('Client Seed:')).toBeInTheDocument();
  });

  it('should handle failed verification', async () => {
    const user = userEvent.setup();
    
    // Mock failed verification API response
    (gameService.verifyRound as any).mockResolvedValue({
      verified: false,
      crashPoint: 0,
      serverSeedHash: 'invalid-hash',
      clientSeed: 'TestSeed123',
      message: 'Verification failed: Invalid server seed hash'
    });

    render(<VerifyPage />);

    // Fill valid form data
    const roundIdInput = screen.getByPlaceholderText(/123e4567/);
    const serverSeedInput = screen.getByPlaceholderText(/a1b2c3d4/);
    const clientSeedInput = screen.getByPlaceholderText(/MyRandomSeed123/);
    
    await user.type(roundIdInput, '123e4567-e89b-12d3-a456-426614174000');
    await user.type(serverSeedInput, 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456');
    await user.type(clientSeedInput, 'TestSeed123');
    
    // Submit form
    const submitButton = screen.getByText('Verify Round');
    await user.click(submitButton);
    
    // Check failure result
    await waitFor(() => {
      expect(screen.getByText('Verification Failed')).toBeInTheDocument();
      expect(screen.getByText('Verification failed: Invalid server seed hash')).toBeInTheDocument();
      expect(screen.getByText('FAILED ✗')).toBeInTheDocument();
    });
  });

  it('should handle API errors', async () => {
    const user = userEvent.setup();
    
    // Mock API error
    (gameService.verifyRound as any).mockRejectedValue(new Error('Round not found'));

    render(<VerifyPage />);

    // Fill valid form data
    const roundIdInput = screen.getByPlaceholderText(/123e4567/);
    const serverSeedInput = screen.getByPlaceholderText(/a1b2c3d4/);
    const clientSeedInput = screen.getByPlaceholderText(/MyRandomSeed123/);
    
    await user.type(roundIdInput, '123e4567-e89b-12d3-a456-426614174000');
    await user.type(serverSeedInput, 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456');
    await user.type(clientSeedInput, 'TestSeed123');
    
    // Submit form
    const submitButton = screen.getByText('Verify Round');
    await user.click(submitButton);
    
    // Check error message
    await waitFor(() => {
      expect(screen.getByText('Verification Failed')).toBeInTheDocument();
      expect(screen.getByText('Round not found')).toBeInTheDocument();
    });
  });

  it('should display FAQ section', async () => {
    render(<VerifyPage />);

    // Check FAQ section
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    
    // Check FAQ items
    expect(screen.getByText('Where can I find the round information?')).toBeInTheDocument();
    expect(screen.getByText('What is a client seed?')).toBeInTheDocument();
    expect(screen.getByText('Why might verification fail?')).toBeInTheDocument();
    expect(screen.getByText('Is this system really fair?')).toBeInTheDocument();
  });

  it('should clear validation errors when user starts typing', async () => {
    const user = userEvent.setup();
    render(<VerifyPage />);

    // Submit empty form to trigger validation errors
    const submitButton = screen.getByText('Verify Round');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Round ID is required')).toBeInTheDocument();
    });
    
    // Start typing in Round ID field
    const roundIdInput = screen.getByPlaceholderText(/123e4567/);
    await user.type(roundIdInput, '1');
    
    // Error should disappear
    await waitFor(() => {
      expect(screen.queryByText('Round ID is required')).not.toBeInTheDocument();
    });
  });
});