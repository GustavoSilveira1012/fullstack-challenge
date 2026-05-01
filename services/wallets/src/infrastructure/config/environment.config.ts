/**
 * Environment Configuration Module
 * 
 * Centralizes all environment variable access with type safety and validation.
 * Validates required environment variables on application startup.
 */

export interface EnvironmentConfig {
  // Server Configuration
  port: number;

  // Database Configuration
  databaseUrl: string;

  // RabbitMQ Configuration
  rabbitmqUrl: string;
  rabbitmqBetPlacedQueue: string;
  rabbitmqCashoutQueue: string;
  rabbitmqBetLostQueue: string;
  rabbitmqGameExchange: string;
  rabbitmqWalletExchange: string;

  // JWT Configuration
  jwtSecret: string;
  jwtIssuer: string;

  // Logging Configuration
  logLevel: string;

  // Environment
  nodeEnv: string;
}

class EnvironmentConfigService {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadAndValidate();
  }

  private loadAndValidate(): EnvironmentConfig {
    const config: EnvironmentConfig = {
      // Server
      port: this.getNumber('PORT', 3001),

      // Database
      databaseUrl: this.getRequired('DATABASE_URL'),

      // RabbitMQ
      rabbitmqUrl: this.getRequired('RABBITMQ_URL'),
      rabbitmqBetPlacedQueue: this.get('RABBITMQ_BET_PLACED_QUEUE', 'bet.placed'),
      rabbitmqCashoutQueue: this.get('RABBITMQ_CASHOUT_QUEUE', 'bet.cashout'),
      rabbitmqBetLostQueue: this.get('RABBITMQ_BET_LOST_QUEUE', 'bet.lost'),
      rabbitmqGameExchange: this.get('RABBITMQ_GAME_EXCHANGE', 'game.events'),
      rabbitmqWalletExchange: this.get('RABBITMQ_WALLET_EXCHANGE', 'wallet.events'),

      // JWT
      jwtSecret: this.getRequired('JWT_SECRET'),
      jwtIssuer: this.getRequired('JWT_ISSUER'),

      // Logging
      logLevel: this.get('LOG_LEVEL', 'info'),

      // Environment
      nodeEnv: this.get('NODE_ENV', 'development'),
    };

    return config;
  }

  private getRequired(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(
        `Missing required environment variable: ${key}. ` +
        `Please ensure it is set in your .env file or environment.`
      );
    }
    return value;
  }

  private get(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }

  private getNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) {
      return defaultValue;
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(
        `Environment variable ${key} must be a valid number, got: ${value}`
      );
    }
    return parsed;
  }

  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  public get port(): number {
    return this.config.port;
  }

  public get databaseUrl(): string {
    return this.config.databaseUrl;
  }

  public get rabbitmqUrl(): string {
    return this.config.rabbitmqUrl;
  }

  public get rabbitmqBetPlacedQueue(): string {
    return this.config.rabbitmqBetPlacedQueue;
  }

  public get rabbitmqCashoutQueue(): string {
    return this.config.rabbitmqCashoutQueue;
  }

  public get rabbitmqBetLostQueue(): string {
    return this.config.rabbitmqBetLostQueue;
  }

  public get rabbitmqGameExchange(): string {
    return this.config.rabbitmqGameExchange;
  }

  public get rabbitmqWalletExchange(): string {
    return this.config.rabbitmqWalletExchange;
  }

  public get jwtSecret(): string {
    return this.config.jwtSecret;
  }

  public get jwtIssuer(): string {
    return this.config.jwtIssuer;
  }

  public get logLevel(): string {
    return this.config.logLevel;
  }

  public get nodeEnv(): string {
    return this.config.nodeEnv;
  }

  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  public isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  public isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }
}

// Export singleton instance
export const environmentConfig = new EnvironmentConfigService();
