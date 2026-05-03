import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGame } from '../useGame';
import { useGameStore } from '@store/gameStore';
import * as gameService from '@services/gameService';
import { Round, Bet } from '@types/index';

/**
 * useGame Hook Unit Tests
 * Requirement 2.2.1, 2.3.3, 2.4.2: Game state management
 * Validates: Requirements 2.2.1, 2.3.3, 2.4.2
 */
describe('useGame Hook', () => {
  const mockRound: Round = {
    id: 'round-123',
    state: 'BETTING',
    crashPoint: null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    crashedAt: null,
    playerCount: 5,
    totalWagered: 50000,
  };

  const mockBet: Bet = {
    id: 'bet-123',
    roundId: 'round-123',
    playerId: 'player-123',
    amount: 10000,
    state: 'ACTIVE',
    cashedOutAt: null,
    payout: null,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    useGameStore.setState({
      currentRound: null,
      currentMultiplier: 1.0,
      roundState: 'BETTING',
      playerBet: null,
      recentRounds: [],
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial game state', () => {
      const { result } = renderHook(() => useGame());

      expect(result.current.currentRound).toBeNull();
      expect(result.current.currentMultiplier).toBe(1.0);
      expect(result.current.roundState).toBe('BETTING');
      expect(result.current.playerBet).toBeNull();
      expect(result.current.recentRounds).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should have all required actions', () => {
      const { result } = renderHook(() => useGame());

      expect(typeof result.current.placeBet).toBe('function');
      expect(typeof result.current.cashOut).toBe('function');
      expect(typeof result.current.fetchRoundHistory).toBe('function');
      expect(typeof result.current.fetchPlayerBetHistory).toBe('function');
      expect(typeof result.current.verifyRound).toBe('function');
      expect(typeof result.current.updateMultiplier).toBe('function');
      expect(typeof result.current.updateRoundState).toBe('function');
      expect(typeof result.current.handleRoundCrash).toBe('function');
      expect(typeof result.current.resetGame).toBe('function');
    });
  });

  describe('Place Bet', () => {
    it('should place a bet successfully', async () => {
      const placeBetSpy = vi.spyOn(gameService.gameService, 'placeBet').mockResolvedValue(mockBet);

      const { result } = renderHook(() => useGame());

      let placedBet: Bet | undefined;
      await act(async () => {
        placedBet = await result.current.placeBet(10000);
      });

      expect(placeBetSpy).toHaveBeenCalledWith(10000);
      expect(placedBet).toEqual(mockBet);
      expect(result.current.playerBet).toEqual(mockBet);
    });

    it('should handle bet placement errors', async () => {
      vi.spyOn(gameService.gameService, 'placeBet').mockRejectedValue(
        new Error('Insufficient balance')
      );

      const { result } = renderHook(() => useGame());

      await act(async () => {
        try {
          await result.current.placeBet(10000);
        } catch (err) {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Insufficient balance');
    });

    it('should set isLoading during bet placement', async () => {
      vi.spyOn(gameService.gameService, 'placeBet').mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockBet), 100))
      );

      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.placeBet(10000);
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Cash Out', () => {
    it('should cash out successfully', async () => {
      useGameStore.setState({ playerBet: mockBet });

      const cashOutSpy = vi.spyOn(gameService.gameService, 'cashOut').mockResolvedValue({
        success: true,
        multiplier: 2.5,
        payout: 25000,
        message: 'Cashed out successfully',
        betId: 'bet-123',
      });

      const { result } = renderHook(() => useGame());

      let result_data: any;
      await act(async () => {
        result_data = await result.current.cashOut();
      });

      expect(cashOutSpy).toHaveBeenCalled();
      expect(result_data?.multiplier).toBe(2.5);
      expect(result_data?.payout).toBe(25000);
      expect(result.current.playerBet).toBeNull();
    });

    it('should handle cash out errors', async () => {
      useGameStore.setState({ playerBet: mockBet });

      vi.spyOn(gameService.gameService, 'cashOut').mockRejectedValue(
        new Error('Round already crashed')
      );

      const { result } = renderHook(() => useGame());

      await act(async () => {
        try {
          await result.current.cashOut();
        } catch (err) {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Round already crashed');
    });
  });

  describe('Multiplier Updates', () => {
    it('should update multiplier', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.updateMultiplier(2.5);
      });

      expect(result.current.currentMultiplier).toBe(2.5);
    });

    it('should handle multiple multiplier updates', () => {
      const { result } = renderHook(() => useGame());

      const multipliers = [1.1, 1.5, 2.0, 3.5, 5.0];

      multipliers.forEach((multiplier) => {
        act(() => {
          result.current.updateMultiplier(multiplier);
        });
        expect(result.current.currentMultiplier).toBe(multiplier);
      });
    });
  });

  describe('Round State Updates', () => {
    it('should update round state', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.updateRoundState('RUNNING');
      });

      expect(result.current.roundState).toBe('RUNNING');
    });

    it('should handle all round states', () => {
      const { result } = renderHook(() => useGame());

      const states = ['BETTING', 'RUNNING', 'CRASHED'] as const;

      states.forEach((state) => {
        act(() => {
          result.current.updateRoundState(state);
        });
        expect(result.current.roundState).toBe(state);
      });
    });
  });

  describe('Round Crash', () => {
    it('should handle round crash', () => {
      useGameStore.setState({ playerBet: mockBet });

      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.handleRoundCrash(2.5);
      });

      expect(result.current.roundState).toBe('CRASHED');
      expect(result.current.playerBet).toBeNull();
    });

    it('should not clear bet if already cashed out', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.handleRoundCrash(2.5);
      });

      expect(result.current.playerBet).toBeNull();
    });
  });

  describe('Fetch Round History', () => {
    it('should fetch round history', async () => {
      const mockHistory = {
        data: [mockRound],
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      };

      const fetchSpy = vi.spyOn(gameService.gameService, 'getRoundHistory').mockResolvedValue(mockHistory);

      const { result } = renderHook(() => useGame());

      let history;
      await act(async () => {
        history = await result.current.fetchRoundHistory(1, 10);
      });

      expect(fetchSpy).toHaveBeenCalledWith(1, 10);
      expect(history).toEqual(mockHistory);
    });

    it('should handle fetch errors', async () => {
      vi.spyOn(gameService.gameService, 'getRoundHistory').mockRejectedValue(
        new Error('Failed to fetch history')
      );

      const { result } = renderHook(() => useGame());

      await act(async () => {
        try {
          await result.current.fetchRoundHistory();
        } catch (err) {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Failed to fetch history');
    });
  });

  describe('Fetch Player Bet History', () => {
    it('should fetch player bet history', async () => {
      const mockBetHistory = {
        data: [mockBet],
        page: 1,
        pageSize: 50,
        total: 1,
        totalPages: 1,
      };

      const fetchSpy = vi.spyOn(gameService.gameService, 'getPlayerBetHistory').mockResolvedValue(mockBetHistory);

      const { result } = renderHook(() => useGame());

      let history;
      await act(async () => {
        history = await result.current.fetchPlayerBetHistory(1, 50);
      });

      expect(fetchSpy).toHaveBeenCalledWith(1, 50);
      expect(history).toEqual(mockBetHistory);
    });
  });

  describe('Verify Round', () => {
    it('should verify round fairness', async () => {
      const mockVerification = {
        verified: true,
        crashPoint: 2.5,
        serverSeedHash: 'hash123',
        clientSeed: 'seed123',
        message: 'Round verified',
      };

      const verifySpy = vi.spyOn(gameService.gameService, 'verifyRound').mockResolvedValue(mockVerification);

      const { result } = renderHook(() => useGame());

      let verification;
      await act(async () => {
        verification = await result.current.verifyRound('round-123', 'hash123', 'seed123');
      });

      expect(verifySpy).toHaveBeenCalledWith('round-123', 'hash123', 'seed123');
      expect(verification).toEqual(mockVerification);
    });
  });

  describe('Reset Game', () => {
    it('should reset game state', () => {
      useGameStore.setState({
        currentRound: mockRound,
        currentMultiplier: 5.0,
        roundState: 'CRASHED',
        playerBet: mockBet,
      });

      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.resetGame();
      });

      expect(result.current.currentRound).toBeNull();
      expect(result.current.currentMultiplier).toBe(1.0);
      expect(result.current.roundState).toBe('BETTING');
      expect(result.current.playerBet).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should clear error on successful operation', async () => {
      vi.spyOn(gameService.gameService, 'placeBet').mockRejectedValueOnce(
        new Error('First attempt failed')
      );

      const { result } = renderHook(() => useGame());

      await act(async () => {
        try {
          await result.current.placeBet(10000);
        } catch (err) {
          // Expected error
        }
      });

      expect(result.current.error).toBe('First attempt failed');

      // Now succeed
      vi.spyOn(gameService.gameService, 'placeBet').mockResolvedValueOnce(mockBet);

      await act(async () => {
        await result.current.placeBet(10000);
      });

      expect(result.current.error).toBeNull();
    });
  });
});
