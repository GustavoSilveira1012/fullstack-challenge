import { createHash } from 'crypto';
import { ServerSeed } from './server-seed';

/**
 * ServerSeedHash Value Object
 * Represents the SHA-256 hash of a ServerSeed
 * Revealed to players before the round starts to prove fairness
 */

export class InvalidServerSeedHashError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidServerSeedHashError';
  }
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

const HEX_REGEX = /^[0-9a-f]+$/i;
const SHA256_HEX_LENGTH = 64; // SHA-256 produces 32 bytes = 64 hex characters

export class ServerSeedHash {
  private readonly value: string; // SHA-256 hash as hex string

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Create ServerSeedHash from a ServerSeed by computing SHA-256
   * @param seed - ServerSeed instance
   * @returns ServerSeedHash instance
   */
  static fromServerSeed(seed: ServerSeed): ServerSeedHash {
    const hash = createHash('sha256')
      .update(seed.toBuffer())
      .digest('hex');
    return new ServerSeedHash(hash);
  }

  /**
   * Create ServerSeedHash from a hex string
   * @param value - SHA-256 hash as hex string (64 hex characters)
   * @returns Result with ServerSeedHash instance or InvalidServerSeedHashError
   */
  static fromString(value: string): Result<ServerSeedHash, InvalidServerSeedHashError> {
    if (!value || typeof value !== 'string') {
      return {
        ok: false,
        error: new InvalidServerSeedHashError('ServerSeedHash must be a non-empty string'),
      };
    }

    if (!HEX_REGEX.test(value)) {
      return {
        ok: false,
        error: new InvalidServerSeedHashError(
          `ServerSeedHash must be a valid hex string, got: ${value}`
        ),
      };
    }

    if (value.length !== SHA256_HEX_LENGTH) {
      return {
        ok: false,
        error: new InvalidServerSeedHashError(
          `ServerSeedHash must be exactly ${SHA256_HEX_LENGTH} hex characters (SHA-256), got ${value.length} characters`
        ),
      };
    }

    return { ok: true, value: new ServerSeedHash(value.toLowerCase()) };
  }

  /**
   * Get the hex string representation of the ServerSeedHash
   * @returns SHA-256 hash as hex string (64 characters)
   */
  toString(): string {
    return this.value;
  }

  /**
   * Check equality with another ServerSeedHash
   * @param other - ServerSeedHash instance to compare
   * @returns true if hashes are equal
   */
  equals(other: ServerSeedHash): boolean {
    return this.value === other.value;
  }
}
