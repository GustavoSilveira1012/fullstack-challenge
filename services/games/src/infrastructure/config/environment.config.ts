import { Injectable } from '@nestjs/common';

@Injectable()
export class EnvironmentConfig {
  readonly port: number;
  readonly databaseUrl: string;
  readonly rabbitmqUrl: string;
  readonly jwtSecret: string;
  readonly jwtIssuer: string;
  readonly nodeEnv: string;

  constructor() {
    this.port = this.getNumberEnv('PORT', 4001);
    this.databaseUrl = this.getStringEnv('DATABASE_URL');
    this.rabbitmqUrl = this.getStringEnv('RABBITMQ_URL');
    this.jwtSecret = this.getStringEnv('JWT_SECRET', 'your-secret-key');
    this.jwtIssuer = this.getStringEnv('JWT_ISSUER', 'keycloak');
    this.nodeEnv = this.getStringEnv('NODE_ENV', 'development');

    this.validate();
  }

  private getStringEnv(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (!value && defaultValue === undefined) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || defaultValue || '';
  }

  private getNumberEnv(key: string, defaultValue?: number): number {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue === undefined) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
      return defaultValue;
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(`Invalid number for environment variable: ${key}`);
    }
    return parsed;
  }

  private validate(): void {
    if (!this.databaseUrl) {
      throw new Error('DATABASE_URL is required');
    }
    if (!this.rabbitmqUrl) {
      throw new Error('RABBITMQ_URL is required');
    }
    if (this.port < 1 || this.port > 65535) {
      throw new Error('PORT must be between 1 and 65535');
    }
  }

  isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
}
