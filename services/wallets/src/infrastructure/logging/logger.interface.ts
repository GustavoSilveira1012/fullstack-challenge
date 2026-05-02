/**
 * Logger Interface
 * 
 * Defines the contract for logging operations with structured context support.
 */

export type LogContext = Record<string, unknown>;

export interface ILogger {
  /**
   * Log an error message with optional context
   */
  error(message: string, context?: LogContext, trace?: string): void;

  /**
   * Log a warning message with optional context
   */
  warn(message: string, context?: LogContext): void;

  /**
   * Log an info message with optional context
   */
  info(message: string, context?: LogContext): void;

  /**
   * Log a debug message with optional context
   */
  debug(message: string, context?: LogContext): void;

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): ILogger;
}
