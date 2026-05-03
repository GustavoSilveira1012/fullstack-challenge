import { randomBytes } from 'crypto';

/**
 * ServerSeed Value Object
 * Represents a cryptographically secure random seed used for provably fair crash point generation
 * Stored as a hex string representing 32 bytes (256 bits)
 */

export class InvalidServerSeedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidServerSeedError';
  }
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

const HEX_REGEX = /^[0-9a-f]+$/i;
const SEED_BYTE_LENGTH = 32; // 256 bits
const SEED_HEX_LENGTH = SEED_BYTE_LENGTH * 2; // 64 hex characters

export class ServerSeed {
  private readonly value: string; // Hex string

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Generate a new ServerSeed using cryptographically secure random bytes
   * @returns ServerSeed instance with 32 random bytes (256 bits)
   */
  static generate(): ServerSeed {
    const randomBuffer = randomBytes(SEED_BYTE_LENGTH);
    return new ServerSeed(randomBuffer.toString('hex'));
  }

  /**
   * Create ServerSeed from a hex string
   * @param value - Hex string representing 32 bytes (64 hex characters)
   * @returns Result with ServerSeed instance or InvalidServerSeedError
   */
  static fromString(value: string): Result<ServerSeed, InvalidServerSeedError> {
    if (!value || typeof value !== 'string') {
      return {
        ok: false,
        error: new InvalidServerSeedError('ServerSeed must be a non-empty string'),
      };
    }

    if (!HEX_REGEX.test(value)) {
      return {
        ok: false,
        error: new InvalidServerSeedError(
          `ServerSeed must be a valid hex string, got: ${value}`
        ),
      };
    }

    if (value.length !== SEED_HEX_LENGTH) {
      return {
        ok: false,
        error: new InvalidServerSeedError(
          `ServerSeed must be exactly ${SEED_HEX_LENGTH} hex characters (32 bytes), got ${value.length} characters`
        ),
      };
    }

    return { ok: true, value: new ServerSeed(value.toLowerCase()) };
  }

  /**
   * Get the hex string representation of the ServerSeed
   * @returns Hex string (64 characters)
   */
  toString(): string {
    return this.value;
  }

  /**
   * Get the ServerSeed as a Buffer
   * @returns Buffer representing the 32 bytes
   */
  toBuffer(): Buffer {
    return Buffer.from(this.value, 'hex');
  }
}
