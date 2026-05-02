/**
 * Unit Tests for JwtAuthGuard
 * 
 * Tests JWT token validation, player ID extraction, and error handling.
 * Validates Requirements: 9.1, 9.2, 9.3, 9.5
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtAuthGuard, AuthenticatedRequest } from '../../../src/presentation/guards/jwt-auth.guard';
import { PlayerId } from '../../../src/domain/player-id';
import { environmentConfig } from '../../../src/infrastructure/config/environment.config';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: Partial<AuthenticatedRequest>;

  beforeEach(() => {
    guard = new JwtAuthGuard();
    mockRequest = {
      headers: {},
    };

    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => ({}),
        getNext: () => ({}),
      }),
    } as ExecutionContext;
  });

  describe('canActivate', () => {
    it('should return true and attach playerId for valid token', () => {
      // Arrange
      const playerId = 'player-123';
      const token = jwt.sign(
        { sub: playerId },
        environmentConfig.jwtSecret,
        {
          issuer: environmentConfig.jwtIssuer,
          expiresIn: '1h',
        }
      );
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
      expect(mockRequest.playerId).toBeDefined();
      expect(mockRequest.playerId?.toString()).toBe(playerId);
    });

    it('should throw UnauthorizedException when Authorization header is missing', () => {
      // Arrange
      mockRequest.headers = {};

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Missing or invalid Authorization header'
      );
    });

    it('should throw UnauthorizedException when Authorization header format is invalid', () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'InvalidFormat token123',
      };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException when token is missing Bearer prefix', () => {
      // Arrange
      const token = jwt.sign(
        { sub: 'player-123' },
        environmentConfig.jwtSecret,
        {
          issuer: environmentConfig.jwtIssuer,
          expiresIn: '1h',
        }
      );
      mockRequest.headers = {
        authorization: token, // Missing "Bearer " prefix
      };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException when token signature is invalid', () => {
      // Arrange
      const token = jwt.sign(
        { sub: 'player-123' },
        'wrong-secret', // Wrong secret
        {
          issuer: environmentConfig.jwtIssuer,
          expiresIn: '1h',
        }
      );
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Invalid token signature or format'
      );
    });

    it('should throw UnauthorizedException when token has expired', () => {
      // Arrange
      const token = jwt.sign(
        { sub: 'player-123' },
        environmentConfig.jwtSecret,
        {
          issuer: environmentConfig.jwtIssuer,
          expiresIn: '-1h', // Expired 1 hour ago
        }
      );
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Token has expired'
      );
    });

    it('should throw UnauthorizedException when token issuer is invalid', () => {
      // Arrange
      const token = jwt.sign(
        { sub: 'player-123' },
        environmentConfig.jwtSecret,
        {
          issuer: 'http://wrong-issuer.com', // Wrong issuer
          expiresIn: '1h',
        }
      );
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException when token is missing sub claim', () => {
      // Arrange
      const token = jwt.sign(
        { userId: 'player-123' }, // Wrong claim name
        environmentConfig.jwtSecret,
        {
          issuer: environmentConfig.jwtIssuer,
          expiresIn: '1h',
        }
      );
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Token missing sub claim (player ID)'
      );
    });

    it('should throw UnauthorizedException when sub claim is empty string', () => {
      // Arrange
      const token = jwt.sign(
        { sub: '' }, // Empty sub claim
        environmentConfig.jwtSecret,
        {
          issuer: environmentConfig.jwtIssuer,
          expiresIn: '1h',
        }
      );
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException
      );
      // Empty string is falsy, so it's caught by the "missing sub claim" check
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Token missing sub claim (player ID)'
      );
    });

    it('should throw UnauthorizedException when sub claim is whitespace only', () => {
      // Arrange
      const token = jwt.sign(
        { sub: '   ' }, // Whitespace only
        environmentConfig.jwtSecret,
        {
          issuer: environmentConfig.jwtIssuer,
          expiresIn: '1h',
        }
      );
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Invalid player ID in token'
      );
    });

    it('should handle token with additional claims', () => {
      // Arrange
      const playerId = 'player-123';
      const token = jwt.sign(
        {
          sub: playerId,
          email: 'player@example.com',
          roles: ['player', 'vip'],
          custom: 'data',
        },
        environmentConfig.jwtSecret,
        {
          issuer: environmentConfig.jwtIssuer,
          expiresIn: '1h',
        }
      );
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
      expect(mockRequest.playerId).toBeDefined();
      expect(mockRequest.playerId?.toString()).toBe(playerId);
    });

    it('should handle UUID format player IDs', () => {
      // Arrange
      const playerId = '550e8400-e29b-41d4-a716-446655440000';
      const token = jwt.sign(
        { sub: playerId },
        environmentConfig.jwtSecret,
        {
          issuer: environmentConfig.jwtIssuer,
          expiresIn: '1h',
        }
      );
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
      expect(mockRequest.playerId).toBeDefined();
      expect(mockRequest.playerId?.toString()).toBe(playerId);
    });

    it('should handle alphanumeric player IDs', () => {
      // Arrange
      const playerId = 'player-abc-123-xyz';
      const token = jwt.sign(
        { sub: playerId },
        environmentConfig.jwtSecret,
        {
          issuer: environmentConfig.jwtIssuer,
          expiresIn: '1h',
        }
      );
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
      expect(mockRequest.playerId).toBeDefined();
      expect(mockRequest.playerId?.toString()).toBe(playerId);
    });
  });
});
