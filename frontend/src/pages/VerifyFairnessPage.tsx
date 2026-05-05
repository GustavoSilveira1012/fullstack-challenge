import React, { useState } from 'react';
import { Header } from '@components/layout/Header';
import { Card, Button, Input } from '@components/common';
import { gameService } from '@services/gameService';

/**
 * VerifyFairnessPage Component
 * Allows players to verify the fairness of past rounds
 */
export const VerifyFairnessPage: React.FC = () => {
  const [roundId, setRoundId] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!roundId.trim()) {
      setError('Please enter a round ID');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await gameService.verifyRound(roundId, '', '');
      setVerificationResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to verify round');
      setVerificationResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Verify Fairness
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Verify that past rounds were provably fair and not manipulated
          </p>
        </div>

        {/* How it Works */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            How Provably Fair Works
          </h2>
          <div className="space-y-3 text-gray-600 dark:text-gray-400">
            <p>
              <strong className="text-gray-900 dark:text-white">1. Before the round:</strong> The server generates a random seed and shows you its SHA-256 hash.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">2. During the round:</strong> The crash point is calculated from the seed (which you don't know yet).
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">3. After the crash:</strong> The server reveals the seed. You can verify it matches the hash and produces the correct crash point.
            </p>
            <p className="text-sm italic">
              This proves the crash point was determined before the round started and couldn't be manipulated.
            </p>
          </div>
        </Card>

        {/* Verification Form */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Verify a Round
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Round ID
              </label>
              <Input
                type="text"
                value={roundId}
                onChange={(e) => setRoundId(e.target.value)}
                placeholder="Enter round ID (e.g., 550e8400-e29b-41d4-a716-446655440000)"
                className="w-full"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleVerify}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Verifying...' : 'Verify Round'}
            </Button>
          </div>
        </Card>

        {/* Verification Result */}
        {verificationResult && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                verificationResult.verified 
                  ? 'bg-green-100 dark:bg-green-900/20' 
                  : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                {verificationResult.verified ? (
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {verificationResult.verified ? 'Round Verified ✓' : 'Verification Failed ✗'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {verificationResult.verified 
                    ? 'This round was provably fair' 
                    : 'This round could not be verified'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Round ID
                </label>
                <code className="block p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono break-all">
                  {verificationResult.roundId}
                </code>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Server Seed (Revealed)
                </label>
                <code className="block p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono break-all">
                  {verificationResult.serverSeed}
                </code>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Server Seed Hash (Shown Before Round)
                </label>
                <code className="block p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono break-all">
                  {verificationResult.serverSeedHash}
                </code>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Crash Point
                </label>
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {parseFloat(verificationResult.crashPoint).toFixed(2)}x
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Algorithm
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {verificationResult.algorithm || 'SHA-256 hash-based provably fair'}
                </p>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default VerifyFairnessPage;
