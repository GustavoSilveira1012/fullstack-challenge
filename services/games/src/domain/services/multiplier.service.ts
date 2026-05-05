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
  private readonly exponentialConstant: number = 0.00003; // Reduced from 0.00006 to make rounds last longer

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
  /**
   * Calculate time until crash based on crash point
   *
   * @param _startTime - When the round started (not used in calculation)
   * @param crashPoint - The crash point for this round
   * @returns Time in milliseconds until crash
   */
  getTimeUntilCrash(_startTime: Date, crashPoint: CrashPoint): number {
    const crashPointValue = crashPoint.toNumber();

    // CRITICAL: Handle edge case where crash point is at minimum
    // Since we now guarantee minimum 1.50x, ensure adequate time for gameplay
    if (crashPointValue <= 1.50) {
      return 5000; // 5 seconds minimum for 1.50x crashes
    }

    // For crash points between 1.50x and 2.00x, provide proportional time
    if (crashPointValue <= 2.00) {
      // Scale from 5 seconds (1.50x) to 7 seconds (2.00x)
      const scaleFactor = (crashPointValue - 1.50) / (2.00 - 1.50);
      return 5000 + (scaleFactor * 2000); // 5-7 seconds range
    }

    // Calculate time: elapsedMs = ln(crashPoint) / 0.00003
    const timeUntilCrash = Math.log(crashPointValue) / this.exponentialConstant;

    // Ensure minimum time of 7 seconds for any crash point above 2.00x
    return Math.max(7000, timeUntilCrash);
  }
}
