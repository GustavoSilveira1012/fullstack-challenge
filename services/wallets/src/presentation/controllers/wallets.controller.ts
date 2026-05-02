/**
 * WalletsController
 * 
 * REST controller for wallet management endpoints.
 * Handles wallet creation and retrieval with JWT authentication.
 * 
 * Requirements: 1.1, 1.3, 1.5, 2.1, 2.2, 2.3, 9.4, 13.2
 */

import {
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { CreateWalletUseCase } from '../../application/create-wallet.use-case';
import { GetWalletUseCase } from '../../application/get-wallet.use-case';
import { WalletResponseDto } from '../../application/dtos';
import { WalletAlreadyExistsError, WalletNotFoundError } from '../../application/errors';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(
    private readonly createWalletUseCase: CreateWalletUseCase,
    private readonly getWalletUseCase: GetWalletUseCase
  ) {}

  /**
   * POST /wallets
   * 
   * Creates a new wallet for the authenticated player.
   * PlayerId is extracted from JWT token by JwtAuthGuard.
   * 
   * @param req - Authenticated request with playerId attached
   * @returns WalletResponseDto with 201 Created status
   * @throws ConflictException (409) if wallet already exists
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createWallet(@Request() req: AuthenticatedRequest): Promise<WalletResponseDto> {
    const playerId = req.playerId;

    const result = await this.createWalletUseCase.execute(playerId);

    if (!result.ok) {
      if (result.error instanceof WalletAlreadyExistsError) {
        throw new ConflictException({
          error: {
            code: 'WALLET_ALREADY_EXISTS',
            message: result.error.message,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    return result.value;
  }

  /**
   * GET /wallets/me
   * 
   * Retrieves the wallet for the authenticated player.
   * PlayerId is extracted from JWT token by JwtAuthGuard.
   * 
   * @param req - Authenticated request with playerId attached
   * @returns WalletResponseDto with 200 OK status
   * @throws NotFoundException (404) if wallet does not exist
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMyWallet(@Request() req: AuthenticatedRequest): Promise<WalletResponseDto> {
    const playerId = req.playerId;

    const result = await this.getWalletUseCase.execute(playerId);

    if (!result.ok) {
      if (result.error instanceof WalletNotFoundError) {
        throw new NotFoundException({
          error: {
            code: 'WALLET_NOT_FOUND',
            message: result.error.message,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    return result.value;
  }
}
