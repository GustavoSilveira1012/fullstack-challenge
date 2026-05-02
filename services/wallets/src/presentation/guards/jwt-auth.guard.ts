/**
 * JWT Authentication Guard
 * 
 * NestJS guard that validates JWT tokens and extracts player ID from token claims.
 * Implements authentication for REST endpoints by:
 * - Extracting JWT token from Authorization header
 * - Validating token signature, expiration, and issuer
 * - Extracting playerId from token sub claim
 * - Attaching playerId to request object for use in controllers
 * 
 * Returns 401 Unauthorized for missing or invalid tokens.
 * 
 * Validates Requirements: 9.1, 9.2, 9.3, 9.5
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { environmentConfig } from '../../infrastructure/config/environment.config';
import { PlayerId } from '../../domain/player-id';

/**
 * Extended Express Request interface with playerId attached.
 * The playerId is extracted from the JWT token and attached to the request
 * for use in controllers and use cases.
 */
export interface AuthenticatedRequest extends Request {
  playerId: PlayerId;
}

/**
 * JWT payload structure expected from Keycloak tokens.
 * Contains standard JWT claims plus custom claims.
 */
interface JwtPayload {
  sub: string; // Subject - player ID
  iss: string; // Issuer - Keycloak realm URL
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  [key: string]: unknown; // Additional claims
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  /**
   * Determines if the current request is allowed to proceed.
   * Validates JWT token and attaches playerId to request.
   * 
   * @param context - Execution context containing request information
   * @returns true if authentication succeeds, throws UnauthorizedException otherwise
   * @throws UnauthorizedException if token is missing, invalid, or expired
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // Extract token from Authorization header
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    // Validate token and extract payload
    const payload = this.validateToken(token);

    // Extract playerId from token sub claim
    const playerId = this.extractPlayerId(payload);

    // Attach playerId to request for use in controllers
    request.playerId = playerId;

    return true;
  }

  /**
   * Extracts JWT token from Authorization header.
   * Expected format: "Bearer <token>"
   * 
   * @param request - Express request object
   * @returns JWT token string or null if not found
   */
  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Validates JWT token signature, expiration, and issuer.
   * Uses jsonwebtoken library to verify token against configured secret.
   * 
   * @param token - JWT token string to validate
   * @returns Decoded JWT payload
   * @throws UnauthorizedException if token is invalid, expired, or has wrong issuer
   */
  private validateToken(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, environmentConfig.jwtSecret, {
        issuer: environmentConfig.jwtIssuer,
        algorithms: ['HS256'], // Keycloak uses HS256 for shared secret
      }) as JwtPayload;

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token signature or format');
      }
      if (error instanceof jwt.NotBeforeError) {
        throw new UnauthorizedException('Token not yet valid');
      }
      throw new UnauthorizedException('Token validation failed');
    }
  }

  /**
   * Extracts playerId from JWT token sub claim.
   * Validates that the sub claim is a valid player ID.
   * 
   * @param payload - Decoded JWT payload
   * @returns PlayerId value object
   * @throws UnauthorizedException if sub claim is missing or invalid
   */
  private extractPlayerId(payload: JwtPayload): PlayerId {
    const sub = payload.sub;

    if (!sub) {
      throw new UnauthorizedException('Token missing sub claim (player ID)');
    }

    const playerIdResult = PlayerId.fromString(sub);

    if (!playerIdResult.ok) {
      throw new UnauthorizedException(
        `Invalid player ID in token: ${playerIdResult.error.message}`
      );
    }

    return playerIdResult.value;
  }
}
