/**
 * Structured Logger Service
 * 
 * Implements JSON-formatted logging with context support and sensitive data redaction.
 * Logs are written to stdout in JSON format for consumption by log aggregation systems.
 */

import { Injectable } from '@nestjs/common';
import { ILogger } from './logger.interface';
import { environmentConfig } from '../config/environment.config';

export type LogContext = Record<string, unknown>;

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  context?: LogContext;
  trace?: string;
}

@Injectable()
export class StructuredLogger implements ILogger {
  private readonly serviceName = 'wallet-service';
  private readonly logLevel: LogLevel;
  private readonly baseContext: LogContext;

  // Sensitive fields that should be redacted from logs
  private readonly sensitiveFields = new Set([
    'password',
    'token',
    'jwt',
    'authorization',
    'secret',
    'apikey',
    'api_key',
  ]);

  constructor(baseContext: LogContext = {}) {
    this.baseContext = baseContext;
    this.logLevel = this.parseLogLevel(environmentConfig.logLevel);
  }

  private parseLogLevel(level: string): LogLevel {
    const normalized = level.toLowerCase();
    if (['error', 'warn', 'info', 'debug'].includes(normalized)) {
      return normalized as LogLevel;
    }
    return 'info'; // Default to info if invalid
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private redactSensitiveData(context: LogContext): LogContext {
    const redacted: LogContext = {};

    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase();
      
      // Check if the key is sensitive
      if (this.sensitiveFields.has(lowerKey)) {
        redacted[key] = '[REDACTED]';
        continue;
      }

      // Recursively redact nested objects
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        redacted[key] = this.redactSensitiveData(value as LogContext);
      } else if (Array.isArray(value)) {
        redacted[key] = value.map(item =>
          item && typeof item === 'object'
            ? this.redactSensitiveData(item as LogContext)
            : item
        );
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  private log(level: LogLevel, message: string, context?: LogContext, trace?: string): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const mergedContext = { ...this.baseContext, ...context };
    const redactedContext = this.redactSensitiveData(mergedContext);

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
    };

    // Only add context if it has properties
    if (Object.keys(redactedContext).length > 0) {
      logEntry.context = redactedContext;
    }

    // Only add trace for error logs
    if (trace && level === 'error') {
      logEntry.trace = trace;
    }

    // Write to stdout as JSON
    console.log(JSON.stringify(logEntry));
  }

  error(message: string, context?: LogContext, trace?: string): void {
    this.log('error', message, context, trace);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  child(context: LogContext): ILogger {
    const mergedContext = { ...this.baseContext, ...context };
    return new StructuredLogger(mergedContext);
  }
}
