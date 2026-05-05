import React from 'react';
import { BetForm } from './BetForm';
import { CashOutButton } from './CashOutButton';
import { useGameStore } from '@store/gameStore';
import { useGameLogic } from '@hooks/useGameLogic';
import { useWallet } from '@hooks/useWallet';

/**
 * GameInterface Component
 * Main game interface that combines betting and cash out functionality
 */
interface GameInterfaceProps {
  className?: string;
}

export const GameInterface: React.FC<GameInterfaceProps> = ({ className = '' }) => {
  const { roundState, playerBet, currentMultiplier } = useGameStore();
  
  // Initialize wallet to load balance from API
  useWallet();
  
  // Initialize game logic hook for automatic wallet updates
  useGameLogic();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Game Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Round Status
          </div>
          <div className={`text-lg font-semibold ${
            roundState === 'BETTING' ? 'text-blue-600 dark:text-blue-400' :
            roundState === 'RUNNING' ? 'text-green-600 dark:text-green-400' :
            'text-red-600 dark:text-red-400'
          }`}>
            {roundState === 'BETTING' ? 'Betting Phase' :
             roundState === 'RUNNING' ? 'Round Running' :
             'Round Crashed'}
          </div>
          {roundState === 'RUNNING' && (
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {(typeof currentMultiplier === 'number' && !isNaN(currentMultiplier) ? currentMultiplier : 1.0).toFixed(2)}x
            </div>
          )}
        </div>
      </div>

      {/* Betting Interface */}
      {roundState === 'BETTING' && !playerBet && (
        <BetForm />
      )}

      {/* Cash Out Interface */}
      {roundState === 'RUNNING' && playerBet && playerBet.state === 'ACTIVE' && (
        <CashOutButton currentMultiplier={currentMultiplier} />
      )}

      {/* Bet Result Display */}
      {playerBet && playerBet.state !== 'ACTIVE' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Last Bet Result
            </h3>
            
            {playerBet.state === 'WON' && (
              <div className="space-y-2">
                <div className="text-green-600 dark:text-green-400 font-semibold">
                  🎉 You Won!
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Cashed out at {playerBet.cashedOutAt?.toFixed(2)}x
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  Payout: R$ {((playerBet.payout || 0) / 100).toFixed(2)}
                </div>
              </div>
            )}
            
            {playerBet.state === 'LOST' && (
              <div className="space-y-2">
                <div className="text-red-600 dark:text-red-400 font-semibold">
                  💥 You Lost
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Didn't cash out in time
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  Lost: R$ {(playerBet.amount / 100).toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Waiting for next round */}
      {roundState === 'CRASHED' && !playerBet && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="text-center text-gray-600 dark:text-gray-400">
            Waiting for next round...
          </div>
        </div>
      )}
    </div>
  );
};

export default GameInterface;