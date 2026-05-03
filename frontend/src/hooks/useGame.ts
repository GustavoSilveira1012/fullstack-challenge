import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '@store/gameStore';
import { gameService } from '@services/gameService';
import { useUIStore } from '@store/uiStore';
import { RoundState } from '@types/index';

/**
 * useGame Hook: Manages game logic and state
 * Requirement 2.2.1, 2.3.3, 2.4.2: Game state management
 */
export const useGame = () => {
  const {
    currentRound,
    currentMultiplier,
    roundState,
    playerBet,
    recentRounds,
    setCurrentRound,
    setMultiplier,
    setRoundState,
    setPlayerBet,
    reset,
  } = useGameStore();

  const { addNotification } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch current round on mount
   */
  useEffect(() => {
    const fetchCurrentRound = async () => {
      try {
        setIsLoading(true);
        const round = await gameService.getCurrentRound();
        setCurrentRound(round);
        setRoundState(round.state);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch current round';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentRound();
  }, [setCurrentRound, setRoundState]);

  /**
   * Place a bet for the current round
   * Requirement 2.3.3: Place bet endpoint
   */
  const placeBet = useCallback(
    async (amount: number) => {
      try {
        setIsLoading(true);
        setError(null);

        const bet = await gameService.placeBet(amount);
        setPlayerBet(bet);

        addNotification({
          type: 'success',
          message: `Bet placed: R$ ${(amount / 100).toFixed(2)}`,
        });

        return bet;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to place bet';
        setError(errorMessage);
        addNotification({
          type: 'error',
          message: errorMessage,
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [setPlayerBet, addNotification]
  );

  /**
   * Cash out the current active bet
   * Requirement 2.4.2: Cash out endpoint
   */
  const cashOut = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await gameService.cashOut();

      addNotification({
        type: 'success',
        message: `Cashed out at ${result.multiplier.toFixed(2)}x for R$ ${(result.payout / 100).toFixed(2)}`,
      });

      // Clear player bet
      setPlayerBet(null);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cash out';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setPlayerBet, addNotification]);

  /**
   * Fetch round history
   */
  const fetchRoundHistory = useCallback(
    async (page: number = 1, pageSize: number = 10) => {
      try {
        setIsLoading(true);
        setError(null);

        const history = await gameService.getRoundHistory(page, pageSize);
        return history;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch round history';
        setError(errorMessage);
        addNotification({
          type: 'error',
          message: errorMessage,
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [addNotification]
  );

  /**
   * Fetch player bet history
   */
  const fetchPlayerBetHistory = useCallback(
    async (page: number = 1, pageSize: number = 50) => {
      try {
        setIsLoading(true);
        setError(null);

        const history = await gameService.getPlayerBetHistory(page, pageSize);
        return history;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bet history';
        setError(errorMessage);
        addNotification({
          type: 'error',
          message: errorMessage,
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [addNotification]
  );

  /**
   * Verify round fairness (provably fair)
   */
  const verifyRound = useCallback(
    async (roundId: string, serverSeedHash: string, clientSeed: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await gameService.verifyRound(roundId, serverSeedHash, clientSeed);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to verify round';
        setError(errorMessage);
        addNotification({
          type: 'error',
          message: errorMessage,
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [addNotification]
  );

  /**
   * Update multiplier (called from WebSocket)
   */
  const updateMultiplier = useCallback(
    (multiplier: number) => {
      setMultiplier(multiplier);
    },
    [setMultiplier]
  );

  /**
   * Update round state (called from WebSocket)
   */
  const updateRoundState = useCallback(
    (state: RoundState) => {
      setRoundState(state);
    },
    [setRoundState]
  );

  /**
   * Handle round crash (called from WebSocket)
   */
  const handleRoundCrash = useCallback(
    (crashPoint: number) => {
      setRoundState('CRASHED');

      // If player had an active bet and didn't cash out, they lost
      if (playerBet && playerBet.state === 'ACTIVE') {
        addNotification({
          type: 'error',
          message: `Bet lost at ${crashPoint.toFixed(2)}x`,
          duration: 3000,
        });
        setPlayerBet(null);
      }
    },
    [playerBet, setRoundState, setPlayerBet, addNotification]
  );

  /**
   * Reset game state for new round
   */
  const resetGame = useCallback(() => {
    reset();
    setError(null);
  }, [reset]);

  return {
    // State
    currentRound,
    currentMultiplier,
    roundState,
    playerBet,
    recentRounds,
    isLoading,
    error,

    // Actions
    placeBet,
    cashOut,
    fetchRoundHistory,
    fetchPlayerBetHistory,
    verifyRound,
    updateMultiplier,
    updateRoundState,
    handleRoundCrash,
    resetGame,
  };
};
