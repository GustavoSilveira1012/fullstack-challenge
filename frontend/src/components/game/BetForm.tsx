import React, { useState, useCallback, useMemo } from 'react';
import { LoadingButton } from '@components/common/Loading';
import { Input } from '@components/common/Input';
import { useGameStore } from '@store/gameStore';
import { useWallet } from '@hooks/useWallet';
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
  const { balance, formatBalance, deductBetAmount, getMaxBetAmount, validateBetAmount, calculateQuickBet } = useWallet();
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
  const { execute: placeBet, loading: isPlacingBet, error: placeBetError } = useAsyncCallback(
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
    return formatBalance(centavos);
  }, [formatBalance]);

  /**
   * Convert reais string to centavos with sanitization
   * Requirement 3.2.2: Input validation and sanitization
   */
  /**
   * Converts reais (user input) to centavos (API format) by multiplying by 100
   */
  const parseCurrency = useCallback((value: string): number => {
    // Convert comma to period for decimal separator (Brazilian format)
    const normalizedValue = value.replace(',', '.');
    
    const sanitized = sanitizeNumericInput(normalizedValue, {
      min: 0,
      max: Infinity, // Don't limit here, validation will check centavos limits
      allowDecimals: true,
      allowNegative: false,
    });
    
    return sanitized ? sanitized * 100 : 0;
  }, []);

  /**
   * Validate bet amount with enhanced security
   * Requirement 3.2.2: Input validation to prevent attacks
   */
  const validation = useMemo(() => {
    if (!betAmount) {
      return { isValid: false, error: '' };
    }

    // Convert reais input to centavos first
    const centavos = parseCurrency(betAmount);
    
    // Use the wallet's validation function
    const result = validateBetAmount(centavos);
    
    return { 
      isValid: result.valid, 
      error: result.error || '' 
    };
  }, [betAmount, validateBetAmount, parseCurrency]);

  /**
   * Check if betting is allowed
   */
  const canPlaceBet = useMemo(() => {
    return roundState === 'BETTING' && !playerBet && validation.isValid;
  }, [roundState, playerBet, validation.isValid]);

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
    const newAmount = calculateQuickBet(multiplier);
    if (newAmount > 0) {
      setQuickBetAmount(newAmount);
    }
  }, [calculateQuickBet, setQuickBetAmount]);

  const handleMaxBet = useCallback(() => {
    const maxAmount = getMaxBetAmount();
    setQuickBetAmount(maxAmount);
  }, [getMaxBetAmount, setQuickBetAmount]);

  /**
   * Simple bet placement function for debugging
   */
  const handlePlaceBetDirect = useCallback(async () => {
    if (!canPlaceBet) return;

    const amount = parseCurrency(betAmount);
    console.log('[BetForm] Direct bet placement - amount:', amount);

    try {
      // Initialize audio on first user interaction
      await initializeAudio();
      
      console.log('[BetForm] About to call gameService.placeBet directly');
      
      // Call gameService directly without useAsyncCallback wrapper
      const response = await gameService.placeBet(amount);
      
      console.log('[BetForm] Direct API response:', response);
      
      if (response) {
        // Deduct bet amount from wallet balance
        deductBetAmount(amount);
        
        // Clear form
        setBetAmount('');
        
        // Play bet placed sound
        await playSound('bet-placed');
        
        // Show success notification
        showSuccess(`Bet placed: ${formatCurrency(amount)}`);

        // Call callback
        onBetPlaced?.(amount);
      } else {
        throw new Error('No response from API');
      }
    } catch (error: any) {
      console.error('[BetForm] Direct bet placement error:', error);
      const errorMessage = error?.message || error?.data?.message || 'Failed to place bet';
      showError(errorMessage);
    }
  }, [canPlaceBet, betAmount, parseCurrency, deductBetAmount, formatCurrency, showSuccess, showError, onBetPlaced, playSound, initializeAudio]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handlePlaceBetDirect();
  }, [handlePlaceBetDirect]);

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
              disabled={calculateQuickBet(1) === 0 || roundState !== 'BETTING' || !!playerBet}
              onClick={() => handleQuickBet(1)}
              aria-label={`Repeat last bet: ${formatCurrency(calculateQuickBet(1))}`}
            >
              1x
            </LoadingButton>
            <LoadingButton
              type="button"
              variant="secondary"
              size="small"
              disabled={calculateQuickBet(2) === 0 || roundState !== 'BETTING' || !!playerBet}
              onClick={() => handleQuickBet(2)}
              aria-label={`Double last bet: ${formatCurrency(calculateQuickBet(2))}`}
            >
              2x
            </LoadingButton>
            <LoadingButton
              type="button"
              variant="secondary"
              size="small"
              disabled={calculateQuickBet(5) === 0 || roundState !== 'BETTING' || !!playerBet}
              onClick={() => handleQuickBet(5)}
              aria-label={`Five times last bet: ${formatCurrency(calculateQuickBet(5))}`}
            >
              5x
            </LoadingButton>
            <LoadingButton
              type="button"
              variant="secondary"
              size="small"
              disabled={balance === 0 || roundState !== 'BETTING' || !!playerBet}
              onClick={handleMaxBet}
              aria-label={`Maximum bet: ${formatCurrency(getMaxBetAmount())}`}
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
          loading={false}
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