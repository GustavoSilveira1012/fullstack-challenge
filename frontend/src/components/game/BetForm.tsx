import React, { useState, useCallback, useMemo } from 'react';
import { LoadingButton } from '@components/common/Loading';
import { Input } from '@components/common/Input';
import { useGameStore } from '@store/gameStore';
import { useWalletStore } from '@store/walletStore';
import { gameService } from '@services/gameService';
import { useNotification } from '@hooks/useNotification';
import { useAsyncCallback } from '@hooks/useAsyncState';
import { useErrorRecovery } from '@hooks/useErrorRecovery';
import { useSound } from '@hooks/useSound';
import { rateLimiter, validateInput, sanitizeNumericInput } from '@utils/security';

/**
 * BetForm Component
 * Provides bet placement form with amount input, validation, and quick buttons
 * Requirements: 2.3.1, 2.3.2, 2.3.3, 2.3.4, 2.8.1, 3.4.2
 */
interface BetFormProps {
  /**
   * Optional className for custom styling
   */
  className?: string;
  /**
   * Callback when bet is successfully placed
   */
  onBetPlaced?: (amount: number) => void;
}

export const BetForm: React.FC<BetFormProps> = ({ className = '', onBetPlaced }) => {
  const { roundState, playerBet } = useGameStore();
  const { balance, lastBetAmount, setLastBetAmount } = useWalletStore();
  const { showSuccess, showError } = useNotification();
  const { withRetry, executeWhenOnline } = useErrorRecovery();
  const { playSound, initializeAudio } = useSound();

  const [betAmount, setBetAmount] = useState<string>('');

  // Minimum and maximum bet amounts in centavos
  const MIN_BET = 100; // R$ 1.00
  const MAX_BET = 100000; // R$ 1.000,00

  /**
   * Async callback for placing bet with error recovery and rate limiting
   * Requirement 3.2.4: Rate limiting on client side
   */
  const { execute: placeBet, loading: isPlacingBet } = useAsyncCallback(
    async (amount: number) => {
      // Check rate limit before making request
      if (!rateLimiter.isAllowed('bet-placement')) {
        const timeUntilReset = rateLimiter.getTimeUntilReset('bet-placement');
        throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds.`);
      }

      // Execute when online with retry logic
      return await executeWhenOnline(async () => {
        return await withRetry(
          () => gameService.placeBet(amount),
          {
            maxAttempts: 3,
            delay: 1000,
            backoffMultiplier: 2,
          }
        );
      });
    },
    [executeWhenOnline, withRetry]
  );

  /**
   * Convert centavos to reais for display
   */
  const formatCurrency = useCallback((centavos: number): string => {
    const reais = (centavos / 100).toFixed(2);
    const formatted = parseFloat(reais).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `R$ ${formatted}`;
  }, []);

  /**
   * Convert reais string to centavos with sanitization
   * Requirement 3.2.2: Input validation and sanitization
   */
  const parseCurrency = useCallback((value: string): number => {
    const sanitized = sanitizeNumericInput(value, {
      min: 0,
      max: 100000,
      allowDecimals: true,
      allowNegative: false,
    });
    
    return sanitized || 0;
  }, []);

  /**
   * Validate bet amount with enhanced security
   * Requirement 3.2.2: Input validation to prevent attacks
   */
  const validation = useMemo(() => {
    if (!betAmount) {
      return { isValid: false, error: '' };
    }

    // Use security validation utility
    const result = validateInput.betAmount(betAmount);
    
    if (!result.isValid) {
      return { isValid: false, error: result.error || 'Invalid amount' };
    }

    const amount = result.sanitized!;

    if (amount > balance) {
      return { 
        isValid: false, 
        error: `Insufficient balance. You have ${formatCurrency(balance)}, but need ${formatCurrency(amount)}` 
      };
    }

    return { isValid: true, error: '' };
  }, [betAmount, balance, formatCurrency]);

  /**
   * Check if betting is allowed
   */
  const canPlaceBet = useMemo(() => {
    return roundState === 'BETTING' && !playerBet && validation.isValid && !isPlacingBet;
  }, [roundState, playerBet, validation.isValid, isPlacingBet]);

  /**
   * Handle bet amount input change
   */
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers, comma, and decimal point
    if (/^[\d,]*\.?\d*$/.test(value) || value === '') {
      setBetAmount(value);
    }
  }, []);

  /**
   * Set bet amount from quick buttons
   */
  const setQuickBetAmount = useCallback((amount: number) => {
    const formattedAmount = (amount / 100).toFixed(2).replace('.', ',');
    setBetAmount(formattedAmount);
  }, []);

  /**
   * Quick bet button handlers
   */
  const handleQuickBet = useCallback((multiplier: number) => {
    if (lastBetAmount > 0) {
      const newAmount = Math.min(lastBetAmount * multiplier, MAX_BET);
      setQuickBetAmount(newAmount);
    }
  }, [lastBetAmount, setQuickBetAmount]);

  const handleMaxBet = useCallback(() => {
    const maxAmount = Math.min(balance, MAX_BET);
    setQuickBetAmount(maxAmount);
  }, [balance, setQuickBetAmount]);

  /**
   * Place bet with enhanced error handling
   */
  const handlePlaceBet = useCallback(async () => {
    if (!canPlaceBet) return;

    const amount = parseCurrency(betAmount);

    try {
      // Initialize audio on first user interaction
      await initializeAudio();
      
      const response = await placeBet(amount);
      
      if (response) {
        // Update last bet amount
        setLastBetAmount(amount);
        
        // Clear form
        setBetAmount('');
        
        // Play bet placed sound
        await playSound('bet-placed');
        
        // Show success notification
        showSuccess(`Bet placed: ${formatCurrency(amount)}`);

        // Call callback
        onBetPlaced?.(amount);
      } else {
        throw new Error('Failed to place bet');
      }
    } catch (error: any) {
      // Error is already handled by useAsyncCallback and useErrorRecovery
      console.error('Bet placement failed:', error);
    }
  }, [canPlaceBet, betAmount, parseCurrency, placeBet, setLastBetAmount, formatCurrency, showSuccess, onBetPlaced, playSound, initializeAudio]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handlePlaceBet();
  }, [handlePlaceBet]);

  /**
   * Get disabled state message
   */
  const getDisabledMessage = useCallback(() => {
    if (roundState !== 'BETTING') {
      return 'Betting is closed for this round';
    }
    if (playerBet) {
      return 'You already have an active bet';
    }
    return '';
  }, [roundState, playerBet]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg ${className}`}>
      <h3 
        className="text-lg font-semibold text-gray-900 dark:text-white mb-4"
        id="bet-form-title"
      >
        Place Your Bet
      </h3>

      <form 
        onSubmit={handleSubmit} 
        className="space-y-4"
        role="form"
        aria-labelledby="bet-form-title"
        aria-describedby="bet-form-description"
      >
        {/* Bet Amount Input */}
        <div>
          <Input
            label="Bet Amount"
            type="text"
            value={betAmount}
            onChange={handleAmountChange}
            placeholder="0,00"
            error={validation.error}
            disabled={roundState !== 'BETTING' || !!playerBet}
            className="text-lg font-mono"
            aria-label="Enter bet amount in reais"
            aria-describedby="bet-amount-help balance-display"
            aria-required="true"
            autoComplete="off"
          />
          <div 
            className="mt-1 text-sm text-gray-500 dark:text-gray-400"
            id="balance-display"
            aria-label={`Available balance: ${formatCurrency(balance)}`}
          >
            Balance: {formatCurrency(balance)}
          </div>
          <div 
            className="sr-only"
            id="bet-amount-help"
          >
            Enter amount between {formatCurrency(MIN_BET)} and {formatCurrency(MAX_BET)}
          </div>
        </div>

        {/* Quick Bet Buttons */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Quick Bet
          </label>
          <div className="grid grid-cols-4 gap-2">
            <LoadingButton
              type="button"
              variant="secondary"
              size="small"
              disabled={!lastBetAmount || roundState !== 'BETTING' || !!playerBet}
              onClick={() => handleQuickBet(1)}
              aria-label={`Repeat last bet: ${formatCurrency(lastBetAmount)}`}
            >
              1x
            </LoadingButton>
            <LoadingButton
              type="button"
              variant="secondary"
              size="small"
              disabled={!lastBetAmount || roundState !== 'BETTING' || !!playerBet}
              onClick={() => handleQuickBet(2)}
              aria-label={`Double last bet: ${formatCurrency(lastBetAmount * 2)}`}
            >
              2x
            </LoadingButton>
            <LoadingButton
              type="button"
              variant="secondary"
              size="small"
              disabled={!lastBetAmount || roundState !== 'BETTING' || !!playerBet}
              onClick={() => handleQuickBet(5)}
              aria-label={`Five times last bet: ${formatCurrency(lastBetAmount * 5)}`}
            >
              5x
            </LoadingButton>
            <LoadingButton
              type="button"
              variant="secondary"
              size="small"
              disabled={balance === 0 || roundState !== 'BETTING' || !!playerBet}
              onClick={handleMaxBet}
              aria-label={`Maximum bet: ${formatCurrency(Math.min(balance, MAX_BET))}`}
            >
              Max
            </LoadingButton>
          </div>
        </div>

        {/* Place Bet Button */}
        <LoadingButton
          type="submit"
          variant="primary"
          size="large"
          disabled={!canPlaceBet}
          loading={isPlacingBet}
          loadingText="Placing Bet..."
          className="w-full"
          aria-label={canPlaceBet ? `Place bet of ${betAmount || '0,00'}` : getDisabledMessage()}
        >
          Place Bet
        </LoadingButton>

        {/* Status Message */}
        {getDisabledMessage() && (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {getDisabledMessage()}
          </div>
        )}
      </form>
    </div>
  );
};

export default BetForm;