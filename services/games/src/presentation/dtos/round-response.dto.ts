import { RoundState } from '../../domain/entities/round';

/**
 * Round Response DTO
 * Response body for round operations
 */
export class RoundResponseDto {
  readonly id: string;
  readonly state: RoundState;
  readonly serverSeedHash: string;
  readonly crashPoint?: string;
  readonly serverSeed?: string;
  readonly createdAt: string;
  readonly startedAt?: string;
  readonly crashedAt?: string;

  constructor(
    id: string,
    state: RoundState,
    serverSeedHash: string,
    createdAt: string,
    crashPoint?: string,
    serverSeed?: string,
    startedAt?: string,
    crashedAt?: string,
  ) {
    this.id = id;
    this.state = state;
    this.serverSeedHash = serverSeedHash;
    this.createdAt = createdAt;
    this.crashPoint = crashPoint;
    this.serverSeed = serverSeed;
    this.startedAt = startedAt;
    this.crashedAt = crashedAt;
  }
}
