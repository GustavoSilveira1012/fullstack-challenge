import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../gameStore';
import type { Round, Bet } from '../../types';

/**
 * GameStore Unit Tests
 * Requirement 2.2.1: Display real-time multiplier
 * Validates: Requirements 2.2.1, 2.3.5, 2.4.4
 */
describe('GameStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useGameStore.setState({
      currentRound: null,
      currentMultiplier: 1.0,
      roundState: 'BETTING',
      playerBet: null,
      recentRounds: [],
    });
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useGameStore.getState();
      expect(state.currentRound).toBe(null);
      expect(state.currentMultiplier).toBe(1.0);
      expect(state.roundState).toBe('BETTING');
      expect(state.playerBet).toBe(null);
      expect(state.recentRounds).toEqual([]);
    });

    it('should have setCurrentRound action', () => {
      const state = useGameStore.getState();
      expect(typeof state.setCurrentRound).toBe('function');
    });

    it('should have setMultiplier action', () => {
      const state = useGameStore.getState();
      expect(typeof state.setMultiplier).toBe('function');
    });

    it('should have setRoundState action', () => {
      const state = useGameStore.getState();
      expect(typeof state.setRoundState).toBe('function');
    });

    it('should have setPlayerBet action', () => {
      const state = useGameStore.getState();
      expect(typeof state.setPlayerBet).toBe('function');
    });

    it('should have addRecentRound action', () => {
      const state = useGameStore.getState();
      expect(typeof state.addRecentRound).toBe('function');
    });

    it('should have reset action', () => {
      const state = useGameStore.getState();
      expect(typeof state.reset).toBe('function');
    });
  });

  describe('SetCurrentRound Action', () => {
    it('should set current round', () => {
      const round: Round = {
        id: 'round-123',
        state: 'BETTING',
        crashPoint: null,
        createdAt: '2024-01-01T00:00:00Z',
        startedAt: null,
        crashedAt: null,
        playerCount: 5,
        totalWagered: 50000,
      };

      useGameStore.getState().setCurrentRound(round);

      expect(useGameStore.getState().currentRound).toEqual(round);
    });

    it('should update current round when called multiple times', () => {
      const round1: Round = {
        id: 'round-1',
        state: 'BETTING',
        crashPoint: null,
        createdAt: '2024-01-01T00:00:00Z',
        startedAt: null,
        crashedAt: null,
        playerCount: 5,
        totalWagered: 50000,
      };

      const round2: Round = {
        id: 'round-2',
        state: 'RUNNING',
        crashPoint: null,
        createdAt: '2024-01-01T00:01:00Z',
        startedAt: '2024-01-01T00:01:05Z',
        crashedAt: null,
        playerCount: 10,
        totalWagered: 100000,
      };

      useGameStore.getState().setCurrentRound(round1);
      expect(useGameStore.getState().currentRound?.id).toBe('round-1');

      useGameStore.getState().setCurrentRound(round2);
      expect(useGameStore.getState().currentRound?.id).toBe('round-2');
    });

    it('should handle round with crash point', () => {
      const round: Round = {
        id: 'round-123',
        state: 'CRASHED',
        crashPoint: 2.45,
        createdAt: '2024-01-01T00:00:00Z',
        startedAt: '2024-01-01T00:00:05Z',
        crashedAt: '2024-01-01T00:00:10Z',
        playerCount: 5,
        totalWagered: 50000,
      };

      useGameStore.getState().setCurrentRound(round);

      expect(useGameStore.getState().currentRound?.crashPoint).toBe(2.45);
      expect(useGameStore.getState().currentRound?.state).toBe('CRASHED');
    });
  });

  describe('SetMultiplier Action', () => {
    it('should set multiplier value', () => {
      useGameStore.getState().setMultiplier(1.5);
      expect(useGameStore.getState().currentMultiplier).toBe(1.5);
    });

    it('should update multiplier with increasing values', () => {
      const multipliers = [1.0, 1.1, 1.25, 1.5, 2.0, 5.0, 10.0];

      multipliers.forEach((multiplier) => {
        useGameStore.getState().setMultiplier(multiplier);
        expect(useGameStore.getState().currentMultiplier).toBe(multiplier);
      });
    });

    it('should handle very small multiplier values', () => {
      useGameStore.getState().setMultiplier(1.001);
      expect(useGameStore.getState().currentMultiplier).toBe(1.001);
    });

    it('should handle very large multiplier values', () => {
      useGameStore.getState().setMultiplier(999.99);
      expect(useGameStore.getState().currentMultiplier).toBe(999.99);
    });

    it('should handle multiplier with many decimal places', () => {
      useGameStore.getState().setMultiplier(1.23456789);
      expect(useGameStore.getState().currentMultiplier).toBe(1.23456789);
    });
  });

  describe('SetRoundState Action', () => {
    it('should set round state to BETTING', () => {
      useGameStore.getState().setRoundState('BETTING');
      expect(useGameStore.getState().roundState).toBe('BETTING');
    });

    it('should set round state to RUNNING', () => {
      useGameStore.getState().setRoundState('RUNNING');
      expect(useGameStore.getState().roundState).toBe('RUNNING');
    });

    it('should set round state to CRASHED', () => {
      useGameStore.getState().setRoundState('CRASHED');
      expect(useGameStore.getState().roundState).toBe('CRASHED');
    });

    it('should transition through all states', () => {
      useGameStore.getState().setRoundState('BETTING');
      expect(useGameStore.getState().roundState).toBe('BETTING');

      useGameStore.getState().setRoundState('RUNNING');
      expect(useGameStore.getState().roundState).toBe('RUNNING');

      useGameStore.getState().setRoundState('CRASHED');
      expect(useGameStore.getState().roundState).toBe('CRASHED');
    });
  });

  describe('SetPlayerBet Action', () => {
    it('should set player bet', () => {
      const bet: Bet = {
        id: 'bet-123',
        roundId: 'round-123',
        playerId: 'player-456',
        amount: 10000,
        state: 'ACTIVE',
        cashedOutAt: null,
        payout: null,
        createdAt: '2024-01-01T00:00:00Z',
      };

      useGameStore.getState().setPlayerBet(bet);

      expect(useGameStore.getState().playerBet).toEqual(bet);
    });

    it('should clear player bet when set to null', () => {
      const bet: Bet = {
        id: 'bet-123',
        roundId: 'round-123',
        playerId: 'player-456',
        amount: 10000,
        state: 'ACTIVE',
        cashedOutAt: null,
        payout: null,
        createdAt: '2024-01-01T00:00:00Z',
      };

      useGameStore.getState().setPlayerBet(bet);
      expect(useGameStore.getState().playerBet).not.toBeNull();

      useGameStore.getState().setPlayerBet(null);
      expect(useGameStore.getState().playerBet).toBeNull();
    });

    it('should handle bet with different states', () => {
      const states: Array<'ACTIVE' | 'WON' | 'LOST'> = ['ACTIVE', 'WON', 'LOST'];

      states.forEach((state) => {
        const bet: Bet = {
          id: 'bet-123',
          roundId: 'round-123',
          playerId: 'player-456',
          amount: 10000,
          state,
          cashedOutAt: state !== 'ACTIVE' ? 1.5 : null,
          payout: state !== 'ACTIVE' ? 15000 : null,
          createdAt: '2024-01-01T00:00:00Z',
        };

        useGameStore.getState().setPlayerBet(bet);
        expect(useGameStore.getState().playerBet?.state).toBe(state);
      });
    });

    it('should handle bet with payout information', () => {
      const bet: Bet = {
        id: 'bet-123',
        roundId: 'round-123',
        playerId: 'player-456',
        amount: 10000,
        state: 'WON',
        cashedOutAt: 2.5,
        payout: 25000,
        createdAt: '2024-01-01T00:00:00Z',
      };

      useGameStore.getState().setPlayerBet(bet);

      const playerBet = useGameStore.getState().playerBet;
      expect(playerBet?.cashedOutAt).toBe(2.5);
      expect(playerBet?.payout).toBe(25000);
    });
  });

  describe('AddRecentRound Action', () => {
    it('should add a round to recent rounds', () => {
      const round: Round = {
        id: 'round-1',
        state: 'CRASHED',
        crashPoint: 2.5,
        createdAt: '2024-01-01T00:00:00Z',
        startedAt: '2024-01-01T00:00:05Z',
        crashedAt: '2024-01-01T00:00:10Z',
        playerCount: 5,
        totalWagered: 50000,
      };

      useGameStore.getState().addRecentRound(round);

      expect(useGameStore.getState().recentRounds).toHaveLength(1);
      expect(useGameStore.getState().recentRounds[0]).toEqual(round);
    });

    it('should add new rounds to the beginning of the list', () => {
      const round1: Round = {
        id: 'round-1',
        state: 'CRASHED',
        crashPoint: 2.5,
        createdAt: '2024-01-01T00:00:00Z',
        startedAt: '2024-01-01T00:00:05Z',
        crashedAt: '2024-01-01T00:00:10Z',
        playerCount: 5,
        totalWagered: 50000,
      };

      const round2: Round = {
        id: 'round-2',
        state: 'CRASHED',
        crashPoint: 3.0,
        createdAt: '2024-01-01T00:01:00Z',
        startedAt: '2024-01-01T00:01:05Z',
        crashedAt: '2024-01-01T00:01:10Z',
        playerCount: 8,
        totalWagered: 80000,
      };

      useGameStore.getState().addRecentRound(round1);
      useGameStore.getState().addRecentRound(round2);

      const recentRounds = useGameStore.getState().recentRounds;
      expect(recentRounds[0].id).toBe('round-2');
      expect(recentRounds[1].id).toBe('round-1');
    });

    it('should maintain maximum of 10 recent rounds', () => {
      for (let i = 1; i <= 15; i++) {
        const round: Round = {
          id: `round-${i}`,
          state: 'CRASHED',
          crashPoint: 2.5,
          createdAt: `2024-01-01T00:${String(i).padStart(2, '0')}:00Z`,
          startedAt: `2024-01-01T00:${String(i).padStart(2, '0')}:05Z`,
          crashedAt: `2024-01-01T00:${String(i).padStart(2, '0')}:10Z`,
          playerCount: 5,
          totalWagered: 50000,
        };

        useGameStore.getState().addRecentRound(round);
      }

      const recentRounds = useGameStore.getState().recentRounds;
      expect(recentRounds).toHaveLength(10);
      expect(recentRounds[0].id).toBe('round-15');
      expect(recentRounds[9].id).toBe('round-6');
    });
  });

  describe('Reset Action', () => {
    it('should reset all state to initial values', () => {
      // Set up some state
      const round: Round = {
        id: 'round-123',
        state: 'RUNNING',
        crashPoint: null,
        createdAt: '2024-01-01T00:00:00Z',
        startedAt: '2024-01-01T00:00:05Z',
        crashedAt: null,
        playerCount: 5,
        totalWagered: 50000,
      };

      const bet: Bet = {
        id: 'bet-123',
        roundId: 'round-123',
        playerId: 'player-456',
        amount: 10000,
        state: 'ACTIVE',
        cashedOutAt: null,
        payout: null,
        createdAt: '2024-01-01T00:00:00Z',
      };

      useGameStore.getState().setCurrentRound(round);
      useGameStore.getState().setMultiplier(2.5);
      useGameStore.getState().setRoundState('RUNNING');
      useGameStore.getState().setPlayerBet(bet);
      useGameStore.getState().addRecentRound(round);

      // Verify state is set
      expect(useGameStore.getState().currentRound).not.toBeNull();
      expect(useGameStore.getState().currentMultiplier).toBe(2.5);
      expect(useGameStore.getState().roundState).toBe('RUNNING');
      expect(useGameStore.getState().playerBet).not.toBeNull();
      expect(useGameStore.getState().recentRounds).toHaveLength(1);

      // Reset
      useGameStore.getState().reset();

      // Verify state is reset
      const state = useGameStore.getState();
      expect(state.currentRound).toBeNull();
      expect(state.currentMultiplier).toBe(1.0);
      expect(state.roundState).toBe('BETTING');
      expect(state.playerBet).toBeNull();
    });

    it('should not reset recentRounds on reset', () => {
      const round: Round = {
        id: 'round-123',
        state: 'CRASHED',
        crashPoint: 2.5,
        createdAt: '2024-01-01T00:00:00Z',
        startedAt: '2024-01-01T00:00:05Z',
        crashedAt: '2024-01-01T00:00:10Z',
        playerCount: 5,
        totalWagered: 50000,
      };

      useGameStore.getState().addRecentRound(round);
      expect(useGameStore.getState().recentRounds).toHaveLength(1);

      useGameStore.getState().reset();

      // recentRounds should still be there
      expect(useGameStore.getState().recentRounds).toHaveLength(1);
    });
  });

  describe('State Immutability', () => {
    it('should not mutate state directly', () => {
      const state1 = useGameStore.getState();
      useGameStore.getState().setMultiplier(2.5);
      const state2 = useGameStore.getState();

      expect(state1).not.toBe(state2);
    });

    it('should create new recentRounds array on addRecentRound', () => {
      const round: Round = {
        id: 'round-1',
        state: 'CRASHED',
        crashPoint: 2.5,
        createdAt: '2024-01-01T00:00:00Z',
        startedAt: '2024-01-01T00:00:05Z',
        crashedAt: '2024-01-01T00:00:10Z',
        playerCount: 5,
        totalWagered: 50000,
      };

      const rounds1 = useGameStore.getState().recentRounds;
      useGameStore.getState().addRecentRound(round);
      const rounds2 = useGameStore.getState().recentRounds;

      expect(rounds1).not.toBe(rounds2);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle a complete game round lifecycle', () => {
      // BETTING phase
      const bettingRound: Round = {
        id: 'round-1',
        state: 'BETTING',
        crashPoint: null,
        createdAt: '2024-01-01T00:00:00Z',
        startedAt: null,
        crashedAt: null,
        playerCount: 0,
        totalWagered: 0,
      };

      useGameStore.getState().setCurrentRound(bettingRound);
      useGameStore.getState().setRoundState('BETTING');
      expect(useGameStore.getState().roundState).toBe('BETTING');

      // Place bet
      const bet: Bet = {
        id: 'bet-1',
        roundId: 'round-1',
        playerId: 'player-1',
        amount: 10000,
        state: 'ACTIVE',
        cashedOutAt: null,
        payout: null,
        createdAt: '2024-01-01T00:00:05Z',
      };

      useGameStore.getState().setPlayerBet(bet);
      expect(useGameStore.getState().playerBet?.state).toBe('ACTIVE');

      // RUNNING phase
      useGameStore.getState().setRoundState('RUNNING');
      useGameStore.getState().setMultiplier(1.5);
      expect(useGameStore.getState().currentMultiplier).toBe(1.5);

      // Multiplier increases
      useGameStore.getState().setMultiplier(2.0);
      expect(useGameStore.getState().currentMultiplier).toBe(2.0);

      // Cash out
      const wonBet: Bet = {
        ...bet,
        state: 'WON',
        cashedOutAt: 2.0,
        payout: 20000,
      };

      useGameStore.getState().setPlayerBet(wonBet);
      expect(useGameStore.getState().playerBet?.payout).toBe(20000);

      // CRASHED phase
      const crashedRound: Round = {
        ...bettingRound,
        state: 'CRASHED',
        crashPoint: 2.5,
        crashedAt: '2024-01-01T00:00:15Z',
      };

      useGameStore.getState().setCurrentRound(crashedRound);
      useGameStore.getState().setRoundState('CRASHED');
      useGameStore.getState().addRecentRound(crashedRound);

      // Reset for next round
      useGameStore.getState().reset();
      expect(useGameStore.getState().roundState).toBe('BETTING');
      expect(useGameStore.getState().currentMultiplier).toBe(1.0);
      expect(useGameStore.getState().playerBet).toBeNull();
    });
  });
});
