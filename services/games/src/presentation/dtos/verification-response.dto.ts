/**
 * Verification Response DTO
 * Response body for round verification
 */
export class VerificationResponseDto {
  readonly roundId: string;
  readonly serverSeed: string;
  readonly serverSeedHash: string;
  readonly crashPoint: string;
  readonly algorithm: string;
  readonly verified: boolean;

  constructor(
    roundId: string,
    serverSeed: string,
    serverSeedHash: string,
    crashPoint: string,
    algorithm: string,
    verified: boolean,
  ) {
    this.roundId = roundId;
    this.serverSeed = serverSeed;
    this.serverSeedHash = serverSeedHash;
    this.crashPoint = crashPoint;
    this.algorithm = algorithm;
    this.verified = verified;
  }
}
