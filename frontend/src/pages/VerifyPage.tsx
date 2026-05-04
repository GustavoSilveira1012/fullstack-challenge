import React, { useState } from 'react';
import { Button, Input, Card, Loading } from '../components/common';
import { gameService } from '../services/gameService';
import { VerifyRoundResponse } from '../types';
import { formatMultiplier } from '../utils/formatters';

interface VerificationForm {
  roundId: string;
  serverSeedHash: string;
  clientSeed: string;
}

/**
 * VerifyPage component - provides provably fair verification functionality
 * Requirement 2.6.3: Provide "Provably Fair" verification page where players can verify round fairness
 */
export const VerifyPage: React.FC = () => {
  const [form, setForm] = useState<VerificationForm>({
    roundId: '',
    serverSeedHash: '',
    clientSeed: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyRoundResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<VerificationForm>>({});

  // Handle form input changes
  const handleInputChange = (field: keyof VerificationForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Partial<VerificationForm> = {};

    if (!form.roundId.trim()) {
      errors.roundId = 'Round ID is required';
    } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(form.roundId.trim())) {
      errors.roundId = 'Round ID must be a valid UUID format';
    }

    if (!form.serverSeedHash.trim()) {
      errors.serverSeedHash = 'Server seed hash is required';
    } else if (!/^[a-f0-9]{64}$/i.test(form.serverSeedHash.trim())) {
      errors.serverSeedHash = 'Server seed hash must be a 64-character hexadecimal string';
    }

    if (!form.clientSeed.trim()) {
      errors.clientSeed = 'Client seed is required';
    } else if (form.clientSeed.trim().length < 1 || form.clientSeed.trim().length > 256) {
      errors.clientSeed = 'Client seed must be between 1 and 256 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const verificationResult = await gameService.verifyRound(
        form.roundId.trim(),
        form.serverSeedHash.trim(),
        form.clientSeed.trim()
      );

      setResult(verificationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify round');
    } finally {
      setLoading(false);
    }
  };

  // Clear form and results
  const clearForm = () => {
    setForm({
      roundId: '',
      serverSeedHash: '',
      clientSeed: '',
    });
    setResult(null);
    setError(null);
    setFormErrors({});
  };

  // Generate random client seed
  const generateClientSeed = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleInputChange('clientSeed', result);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Provably Fair Verification
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Verify the fairness of any game round using cryptographic proof. Enter the round details below to confirm the crash point was determined fairly.
          </p>
        </div>

        {/* How It Works */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            How Provably Fair Works
          </h2>
          <div className="space-y-3 text-gray-600 dark:text-gray-400">
            <p>
              Our provably fair system ensures that every game round is completely transparent and verifiable:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>
                <strong>Server Seed:</strong> Before each round, the server generates a random seed and publishes its hash.
              </li>
              <li>
                <strong>Client Seed:</strong> Players can provide their own random seed to influence the outcome.
              </li>
              <li>
                <strong>Crash Point Calculation:</strong> The crash point is calculated using both seeds through a cryptographic hash function.
              </li>
              <li>
                <strong>Verification:</strong> After the round, players can verify the crash point using the original server seed.
              </li>
            </ol>
            <p className="text-sm">
              This system ensures that neither the house nor the player can manipulate the outcome of any round.
            </p>
          </div>
        </Card>

        {/* Verification Form */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Verify Round
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Round ID"
              type="text"
              value={form.roundId}
              onChange={(e) => handleInputChange('roundId', e.target.value)}
              error={formErrors.roundId}
              placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
              helperText="The unique identifier of the round you want to verify"
              required
            />

            <Input
              label="Server Seed Hash"
              type="text"
              value={form.serverSeedHash}
              onChange={(e) => handleInputChange('serverSeedHash', e.target.value)}
              error={formErrors.serverSeedHash}
              placeholder="e.g., a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
              helperText="The SHA-256 hash of the server seed (64 hexadecimal characters)"
              required
            />

            <div>
              <Input
                label="Client Seed"
                type="text"
                value={form.clientSeed}
                onChange={(e) => handleInputChange('clientSeed', e.target.value)}
                error={formErrors.clientSeed}
                placeholder="e.g., MyRandomSeed123"
                helperText="Your random seed that was used in the round (1-256 characters)"
                required
              />
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={generateClientSeed}
                className="mt-2"
              >
                Generate Random Seed
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
              >
                Verify Round
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={clearForm}
                disabled={loading}
              >
                Clear Form
              </Button>
            </div>
          </form>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Verification Failed
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Verification Result */}
        {result && (
          <Card className={`mb-6 ${
            result.verified 
              ? 'border-green-200 bg-green-50 dark:bg-green-900/20' 
              : 'border-red-200 bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {result.verified ? (
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <h3 className={`text-lg font-medium ${
                  result.verified 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {result.verified ? 'Round Verified Successfully' : 'Verification Failed'}
                </h3>
                <p className={`text-sm mt-1 ${
                  result.verified 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {result.message}
                </p>

                {/* Verification Details */}
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className={`text-sm font-medium ${
                        result.verified 
                          ? 'text-green-800 dark:text-green-200' 
                          : 'text-red-800 dark:text-red-200'
                      }`}>
                        Calculated Crash Point
                      </p>
                      <p className={`text-2xl font-bold ${
                        result.verified 
                          ? 'text-green-900 dark:text-green-100' 
                          : 'text-red-900 dark:text-red-100'
                      }`}>
                        {formatMultiplier(result.crashPoint)}
                      </p>
                    </div>

                    <div>
                      <p className={`text-sm font-medium ${
                        result.verified 
                          ? 'text-green-800 dark:text-green-200' 
                          : 'text-red-800 dark:text-red-200'
                      }`}>
                        Verification Status
                      </p>
                      <p className={`text-lg font-semibold ${
                        result.verified 
                          ? 'text-green-900 dark:text-green-100' 
                          : 'text-red-900 dark:text-red-100'
                      }`}>
                        {result.verified ? 'VERIFIED ✓' : 'FAILED ✗'}
                      </p>
                    </div>
                  </div>

                  {/* Technical Details */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <h4 className={`text-sm font-medium mb-2 ${
                      result.verified 
                        ? 'text-green-800 dark:text-green-200' 
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      Technical Details
                    </h4>
                    <div className="space-y-2 text-xs font-mono">
                      <div>
                        <span className={`${
                          result.verified 
                            ? 'text-green-700 dark:text-green-300' 
                            : 'text-red-700 dark:text-red-300'
                        }`}>
                          Server Seed Hash:
                        </span>
                        <br />
                        <span className={`break-all ${
                          result.verified 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {result.serverSeedHash}
                        </span>
                      </div>
                      <div>
                        <span className={`${
                          result.verified 
                            ? 'text-green-700 dark:text-green-300' 
                            : 'text-red-700 dark:text-red-300'
                        }`}>
                          Client Seed:
                        </span>
                        <br />
                        <span className={`break-all ${
                          result.verified 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {result.clientSeed}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* FAQ */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                Where can I find the round information?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Round IDs and server seed hashes are displayed after each round ends. You can also find them in your bet history.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                What is a client seed?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                A client seed is a random string that you can provide to influence the outcome. If you don't provide one, a default seed is used. You can generate a random seed using the button above.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                Why might verification fail?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verification can fail if the round ID doesn't exist, the server seed hash is incorrect, or if there was an error in the calculation. Make sure all information is entered correctly.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                Is this system really fair?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Yes! The provably fair system uses cryptographic hashing to ensure that neither the house nor the player can manipulate the outcome. The crash point is mathematically determined from the seeds before the round begins.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VerifyPage;