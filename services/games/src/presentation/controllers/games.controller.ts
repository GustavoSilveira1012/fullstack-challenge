import {
  Controller,
  Get,
  Post,
  Options,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
  Logger,
  Res,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Response, Request as ExpressRequest } from 'express';
import { HealthCheckResponseDto } from '../dtos/health-check-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PlaceBetDto } from '../dtos/place-bet.dto';
import { BetResponseDto } from '../dtos/bet-response.dto';
import { CashOutResponseDto } from '../dtos/cash-out-response.dto';
import { RoundResponseDto } from '../dtos/round-response.dto';
import { CurrentRoundResponseDto, BetSummaryDto } from '../dtos/current-round-response.dto';
import { RoundHistoryResponseDto, RoundHistoryItemDto, PaginationDto } from '../dtos/round-history-response.dto';
import { BetHistoryResponseDto, BetHistoryItemDto } from '../dtos/bet-history-response.dto';
import { VerificationResponseDto } from '../dtos/verification-response.dto';
import { PlaceBetUseCase } from '../../application/use-cases/place-bet.use-case';
import { CashOutUseCase } from '../../application/use-cases/cash-out.use-case';
import { GetCurrentRoundUseCase } from '../../application/use-cases/get-current-round.use-case';
import { GetRoundHistoryUseCase } from '../../application/use-cases/get-round-history.use-case';
import { GetPlayerBetHistoryUseCase } from '../../application/use-cases/get-player-bet-history.use-case';
import { VerifyRoundUseCase } from '../../application/use-cases/verify-round.use-case';
import { PlayerId } from '../../domain/value-objects/player-id';
import { Money } from '../../domain/value-objects/money';
import { RoundId } from '../../domain/value-objects/round-id';
import { PrismaService } from '../../infrastructure/database/prisma.service';

/**
 * Games Controller
 * Handles all game-related HTTP endpoints
 */
@ApiTags('games')
@Controller()
export class GamesController {
  private readonly logger = new Logger(GamesController.name);

  constructor(
    private readonly placeBetUseCase: PlaceBetUseCase,
    private readonly cashOutUseCase: CashOutUseCase,
    private readonly getCurrentRoundUseCase: GetCurrentRoundUseCase,
    private readonly getRoundHistoryUseCase: GetRoundHistoryUseCase,
    private readonly getPlayerBetHistoryUseCase: GetPlayerBetHistoryUseCase,
    private readonly verifyRoundUseCase: VerifyRoundUseCase,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Health check endpoint
   */
  @Get('health')
  async check(): Promise<HealthCheckResponseDto> {
    try {
      // Check database connectivity
      await this.prisma.round.count();

      return { status: 'ok', service: 'games' };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return { status: 'error', service: 'games' } as any;
    }
  }

  /**
   * OPTIONS /games/rounds/current
   * Handles CORS preflight requests for the current round endpoint
   */
  @Options('rounds/current')
  @HttpCode(HttpStatus.OK)
  handleOptionsRoundsCurrent(@Req() req: ExpressRequest, @Res() res: Response): void {
    const origin = req.headers.origin;
    
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin,X-Requested-With,X-CSRF-Token');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Authorization');
    
    console.log(`[CORS] Handled OPTIONS request for /games/rounds/current from origin ${origin}`);
    res.status(200).end();
  }

  /**
   * OPTIONS /games/bet
   * Handles CORS preflight requests for the bet endpoint
   */
  @Options('bet')
  @HttpCode(HttpStatus.OK)
  handleOptionsBet(@Req() req: ExpressRequest, @Res() res: Response): void {
    const origin = req.headers.origin;
    
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin,X-Requested-With,X-CSRF-Token');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Authorization');
    
    console.log(`[CORS] Handled OPTIONS request for /games/bet from origin ${origin}`);
    res.status(200).end();
  }

  /**
   * Place a bet
   * POST /games/bet
   */
  @Post('bet')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async placeBet(
    @Body() dto: PlaceBetDto,
    @Request() req: any,
  ): Promise<BetResponseDto> {
    try {
      // Validate amount
      if (!Number.isInteger(dto.amount) || dto.amount < 100 || dto.amount > 100000) {
        throw new BadRequestException(
          'Bet amount must be an integer between 100 and 100000 centavos',
        );
      }

      // Create Money instance
      const amountResult = Money.fromCentavos(BigInt(dto.amount));
      if (!amountResult.ok) {
        throw new BadRequestException('Invalid bet amount');
      }

      // Create PlayerId instance
      const playerIdResult = PlayerId.fromString(req.playerId);
      if (!playerIdResult.ok) {
        throw new BadRequestException('Invalid player ID');
      }

      // Execute use case
      const bet = await this.placeBetUseCase.execute(
        playerIdResult.value,
        amountResult.value,
      );

      return new BetResponseDto(
        bet.getId().toString(),
        bet.getRoundId().toString(),
        bet.getPlayerId().toString(),
        bet.getAmount().toCentavos().toString(),
        bet.getState(),
        bet.getCreatedAt().toISOString(),
        bet.getCashOutMultiplier()?.toNumber().toString(),
        bet.getPayout()?.toCentavos().toString(),
      );
    } catch (error) {
      this.logger.error('Place bet failed', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      const err = error as any;
      if (err.name === 'BettingPhaseClosedError') {
        throw new UnprocessableEntityException('Betting phase is closed');
      }
      if (err.name === 'DuplicateBetError') {
        throw new UnprocessableEntityException('Player already has a bet in this round');
      }
      if (err.name === 'InvalidBetAmountError') {
        throw new BadRequestException(err.message);
      }
      throw new BadRequestException('Failed to place bet');
    }
  }

  /**
   * Cash out a bet
   * POST /games/bet/cashout
   */
  @Post('bet/cashout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cashOut(@Request() req: any): Promise<CashOutResponseDto> {
    try {
      // Create PlayerId instance
      const playerIdResult = PlayerId.fromString(req.playerId);
      if (!playerIdResult.ok) {
        throw new BadRequestException('Invalid player ID');
      }

      // Execute use case
      const result = await this.cashOutUseCase.execute(playerIdResult.value);

      return new CashOutResponseDto(
        '', // betId will be set by the use case
        result.multiplier.toString(),
        result.payout.toString(),
        new Date().toISOString(),
      );
    } catch (error) {
      this.logger.error('Cash out failed', error);
      const err = error as any;
      if (err.name === 'RoundNotRunningError') {
        throw new UnprocessableEntityException('Round is not in running phase');
      }
      if (err.name === 'NoBetFoundError') {
        throw new UnprocessableEntityException('Player has no active bet in current round');
      }
      throw new BadRequestException('Failed to cash out');
    }
  }

  /**
   * Get current round
   * GET /games/rounds/current
   */
  @Get('rounds/current')
  async getCurrentRound(): Promise<CurrentRoundResponseDto> {
    try {
      const { round, bets } = await this.getCurrentRoundUseCase.execute();

      const roundDto = new RoundResponseDto(
        round.getId().toString(),
        round.getState(),
        round.getServerSeedHash().toString(),
        round.getCreatedAt().toISOString(),
        round.hasCrashed() ? round.getCrashPoint().toNumber().toString() : undefined,
        round.hasCrashed() ? round.getServerSeed().toString() : undefined,
        round.getStartedAt()?.toISOString(),
        round.getCrashedAt()?.toISOString(),
      );

      const betDtos = bets.map(
        (bet) =>
          new BetSummaryDto(
            bet.getPlayerId().toString(),
            bet.getAmount().toCentavos().toString(),
            bet.getState(),
            bet.getCashOutMultiplier()?.toNumber().toString(),
            bet.getPayout()?.toCentavos().toString(),
          ),
      );

      return new CurrentRoundResponseDto(roundDto, betDtos);
    } catch (error) {
      this.logger.error('Get current round failed', error);
      throw new NotFoundException('No active round found');
    }
  }

  /**
   * Get round history
   * GET /games/rounds/history
   */
  @Get('rounds/history')
  async getRoundHistory(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ): Promise<RoundHistoryResponseDto> {
    try {
      const pageNum = parseInt(page, 10) || 1;
      const pageSizeNum = parseInt(pageSize, 10) || 20;

      const { rounds, total } = await this.getRoundHistoryUseCase.execute(
        pageNum,
        pageSizeNum,
      );

      const roundDtos = rounds.map(
        (round) =>
          new RoundHistoryItemDto(
            round.getId().toString(),
            round.getCrashPoint().toNumber().toString(),
            round.getServerSeedHash().toString(),
            0, // totalBets - would need to query separately
            round.getCreatedAt().toISOString(),
          ),
      );

      const pagination = new PaginationDto(pageNum, pageSizeNum, total);

      return new RoundHistoryResponseDto(roundDtos, pagination);
    } catch (error) {
      this.logger.error('Get round history failed', error);
      throw new BadRequestException('Failed to retrieve round history');
    }
  }

  /**
   * Verify a round
   * GET /games/rounds/:roundId/verify
   */
  @Get('rounds/:roundId/verify')
  async verifyRound(@Param('roundId') roundId: string): Promise<VerificationResponseDto> {
    try {
      const roundIdResult = RoundId.fromString(roundId);
      if (!roundIdResult.ok) {
        throw new BadRequestException('Invalid round ID');
      }

      const result = await this.verifyRoundUseCase.execute(roundIdResult.value);

      return new VerificationResponseDto(
        result.roundId,
        result.serverSeed,
        result.serverSeedHash,
        result.crashPoint.toString(),
        result.algorithm,
        result.verified,
      );
    } catch (error) {
      this.logger.error('Verify round failed', error);
      const err = error as any;
      if (err.name === 'RoundNotFoundError') {
        throw new NotFoundException('Round not found');
      }
      if (err.name === 'RoundNotCrashedError') {
        throw new UnprocessableEntityException('Round has not crashed yet');
      }
      throw new BadRequestException('Failed to verify round');
    }
  }

  /**
   * Get player bet history
   * GET /games/bets/me
   */
  @Get('bets/me')
  @UseGuards(JwtAuthGuard)
  async getPlayerBetHistory(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Request() req: any,
  ): Promise<BetHistoryResponseDto> {
    try {
      const playerIdResult = PlayerId.fromString(req.playerId);
      if (!playerIdResult.ok) {
        throw new BadRequestException('Invalid player ID');
      }

      const pageNum = parseInt(page, 10) || 1;
      const pageSizeNum = parseInt(pageSize, 10) || 20;

      const { bets, total } = await this.getPlayerBetHistoryUseCase.execute(
        playerIdResult.value,
        pageNum,
        pageSizeNum,
      );

      const betDtos = bets.map(
        (bet) =>
          new BetHistoryItemDto(
            bet.getId().toString(),
            bet.getRoundId().toString(),
            bet.getAmount().toCentavos().toString(),
            bet.getState(),
            bet.getCreatedAt().toISOString(),
            bet.getCashOutMultiplier()?.toNumber().toString(),
            bet.getPayout()?.toCentavos().toString(),
          ),
      );

      const pagination = new PaginationDto(pageNum, pageSizeNum, total);

      return new BetHistoryResponseDto(betDtos, pagination);
    } catch (error) {
      this.logger.error('Get player bet history failed', error);
      throw new BadRequestException('Failed to retrieve bet history');
    }
  }
}
