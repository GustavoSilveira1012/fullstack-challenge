-- CreateTable "Round"
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "serverSeed" CHAR(64) NOT NULL,
    "serverSeedHash" CHAR(64) NOT NULL,
    "crashPoint" NUMERIC(10,2) NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'BETTING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "crashedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Round_crashPoint_check" CHECK ("crashPoint" >= 1.00)
);

-- CreateTable "Bet"
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "cashOutMultiplier" NUMERIC(10,2),
    "payout" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Bet_roundId_playerId_key" UNIQUE("roundId", "playerId"),
    CONSTRAINT "Bet_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Bet_amount_check" CHECK ("amount" >= 100 AND "amount" <= 100000)
);

-- CreateIndex
CREATE INDEX "Round_state_idx" ON "Round"("state");

-- CreateIndex
CREATE INDEX "Round_createdAt_idx" ON "Round"("createdAt");

-- CreateIndex
CREATE INDEX "Bet_roundId_idx" ON "Bet"("roundId");

-- CreateIndex
CREATE INDEX "Bet_playerId_idx" ON "Bet"("playerId");

-- CreateIndex
CREATE INDEX "Bet_state_idx" ON "Bet"("state");
