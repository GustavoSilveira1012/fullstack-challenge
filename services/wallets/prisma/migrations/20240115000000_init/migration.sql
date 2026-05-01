-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "balance" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_player_id_key" ON "wallets"("player_id");

-- CreateIndex
CREATE INDEX "wallets_player_id_idx" ON "wallets"("player_id");

-- AddCheckConstraint
ALTER TABLE "wallets" ADD CONSTRAINT "balance_non_negative" CHECK ("balance" >= 0);
