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
  Options,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ConflictException,
  NotFoundException,
  Res,
  Req,
} from '@nestjs/common';
import { Response, Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { CreateWalletUseCase } from '../../application/create-wallet.use-case';
import { GetWalletUseCase } from '../../application/get-wallet.use-case';
import { WalletResponseDto } from '../../application/dtos';
import { WalletAlreadyExistsError, WalletNotFoundError } from '../../application/errors';

@Controller()
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
   * OPTIONS /wallets/me
   * 
   * Handles CORS preflight requests for the /wallets/me endpoint
   */
  @Options('me')
  @HttpCode(HttpStatus.OK)
  handleOptionsMe(@Req() req: ExpressRequest, @Res() res: Response): void {
    const origin = req.headers.origin;
    
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin,X-Requested-With,X-CSRF-Token');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Authorization');
    
    console.log(`[CORS] Handled OPTIONS request for /wallets/me from origin ${origin}`);
    res.status(200).end();
  }

  /**
   * OPTIONS /wallets
   * 
   * Handles CORS preflight requests for the /wallets endpoint
   */
  @Options()
  @HttpCode(HttpStatus.OK)
  handleOptions(@Req() req: ExpressRequest, @Res() res: Response): void {
    const origin = req.headers.origin;
    
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin,X-Requested-With,X-CSRF-Token');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Authorization');
    
    console.log(`[CORS] Handled OPTIONS request for /wallets from origin ${origin}`);
    res.status(200).end();
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
