/**
 * Pagination DTO
 * Pagination metadata
 */
export class PaginationDto {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;

  constructor(page: number, pageSize: number, total: number) {
    this.page = page;
    this.pageSize = pageSize;
    this.total = total;
    this.totalPages = Math.ceil(total / pageSize);
  }
}

/**
 * Round History Item DTO
 * Summary of a finished round
 */
export class RoundHistoryItemDto {
  readonly id: string;
  readonly crashPoint: string;
  readonly serverSeedHash: string;
  readonly totalBets: number;
  readonly createdAt: string;

  constructor(
    id: string,
    crashPoint: string,
    serverSeedHash: string,
    totalBets: number,
    createdAt: string,
  ) {
    this.id = id;
    this.crashPoint = crashPoint;
    this.serverSeedHash = serverSeedHash;
    this.totalBets = totalBets;
    this.createdAt = createdAt;
  }
}

/**
 * Round History Response DTO
 * Response body for round history retrieval
 */
export class RoundHistoryResponseDto {
  readonly rounds: RoundHistoryItemDto[];
  readonly pagination: PaginationDto;

  constructor(rounds: RoundHistoryItemDto[], pagination: PaginationDto) {
    this.rounds = rounds;
    this.pagination = pagination;
  }
}
