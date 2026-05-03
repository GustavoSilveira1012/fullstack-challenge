import { Multiplier } from '../value-objects/multiplier';
import { CrashPoint } from '../value-objects/crash-point';

/**
 * MultiplierService
 * Calculates multiplier progression during the running phase
 * Uses exponential formula: multiplier = e^(0.00006 * elapsedMs)
 */
export interface IMultiplierService {
  calculateMultiplier(
    startTime: Date,
    currentTime: Date,
    crashPoint: CrashPoint
  ): Multiplier;
  getTimeUntilCrash(startTime: Date, crashPoint: CrashPoint): number;
}

export class MultiplierService implements IMultiplierService {
  private readonly exponentialConstant: number = 0.00006;

  /**
   * Calculate the current multiplier based on elapsed time
   * Formula: multiplier = e^(0.00006 * elapsedMs)
   * The multiplier is capped at the crash point
   *
   * @param startTime - When the round started
   * @param currentTime - Current time
   * @param crashPoint - The crash point for this round
   * @returns Multiplier value, capped at crash point
   */
  calculateMultiplier(
    startTime: Date,
    currentTime: Date,
    crashPoint: CrashPoint
  ): Multiplier {
    const elapsedMs = currentTime.getTime() - startTime.getTime();

    // Ensure elapsed time is non-negative
    if (elapsedMs < 0) {
      return Multiplier.initial();
    }

    // Calculate multiplier using exponential formula
    const multiplierValue = Math.exp(
      this.exponentialConstant * elapsedMs
    );

    // Cap at crash point
    const cappedValue = Math.min(multiplierValue, crashPoint.toNumber());

    // Create Multiplier (will always succeed since value >= 1.0)
    const result = Multiplier.fromNumber(cappedValue);
    if (!result.ok) {
      // Fallback to initial multiplier if something goes wrong
      return Multiplier.initial();
    }

    return result.value;
  }

  /**
   * Calculate the time (in milliseconds) until the round crashes
   * Inverse of the multiplier formula:
   * elapsedMs = ln(crashPoint) / 0.00006
   *
   * @param startTime - When the round started
   * @param crashPoint - The crash point for this round
   * @returns Time in milliseconds until crash
   */
  getTimeUntilCrash(startTime: Date, crashPoint: CrashPoint): number {
    const crashPointValue = crashPoint.toNumber();

    // Handle edge case where crash point is 1.00x
    if (crashPointValue <= 1.0) {
      return 0;
    }

    // Calculate time: elapsedMs = ln(crashPoint) / 0.00006
    const timeUntilCrash = Math.log(crashPointValue) / this.exponentialConstant;

    return timeUntilCrash;
  }
}
