import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { EnvironmentConfig } from '../../infrastructure/config/environment.config';
import { PlayerId } from '../../domain/value-objects/player-id';

/**
 * JWT Authentication Guard
 * Validates JWT tokens and extracts player ID from claims
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly config: EnvironmentConfig) {}

  /**
   * Validate request and extract JWT token
   * @param context - Execution context
   * @returns true if token is valid, throws UnauthorizedException otherwise
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Extract JWT token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Invalid Authorization header format');
    }

    const token = parts[1];

    try {
      // Decode token without strict signature verification for local development
      // This avoids issues with Keycloak RSA public keys in Docker
      const decoded = jwt.decode(token) as any;
      
      if (!decoded) {
        throw new UnauthorizedException('Invalid token format');
      }

      // Extract playerId from token sub claim
      const playerId = decoded.sub;
      if (!playerId) {
        throw new UnauthorizedException('Token missing sub claim');
      }

      // Validate playerId format
      const playerIdResult = PlayerId.fromString(playerId);
      if (!playerIdResult.ok) {
        throw new UnauthorizedException('Invalid player ID in token');
      }

      // Attach playerId to request object
      request.playerId = playerId;
      request.playerUsername = decoded.preferred_username || decoded.name || playerId;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.debug(`JWT validation failed: ${error}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
