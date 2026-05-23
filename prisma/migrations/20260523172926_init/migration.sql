-- CreateEnum
CREATE TYPE "PoolTier" AS ENUM ('STARTER', 'GROWTH', 'POWER');

-- CreateEnum
CREATE TYPE "PoolStatus" AS ENUM ('OPEN', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nostrPubKey" TEXT NOT NULL,
    "displayName" TEXT,
    "walletId" TEXT,
    "balanceSats" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tier" "PoolTier" NOT NULL,
    "status" "PoolStatus" NOT NULL DEFAULT 'OPEN',
    "minDeposit" INTEGER NOT NULL,
    "targetSize" INTEGER NOT NULL,
    "currentSize" INTEGER NOT NULL DEFAULT 0,
    "lockDays" INTEGER NOT NULL,
    "apyMin" DOUBLE PRECISION NOT NULL,
    "apyMax" DOUBLE PRECISION NOT NULL,
    "dailyRate" DOUBLE PRECISION NOT NULL,
    "nostrGroupId" TEXT,
    "activatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pool_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "depositNGN" INTEGER NOT NULL,
    "depositSats" INTEGER NOT NULL,
    "sharePercent" DOUBLE PRECISION NOT NULL,
    "earnedYieldNGN" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pool_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountNGN" INTEGER NOT NULL,
    "amountSats" INTEGER,
    "bitnobReference" TEXT NOT NULL,
    "virtualAccount" JSONB,
    "status" "DepositStatus" NOT NULL DEFAULT 'PENDING',
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountNGN" INTEGER NOT NULL,
    "bankAccount" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "bitnobReference" TEXT NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yield_records" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "periodDate" TIMESTAMP(3) NOT NULL,
    "totalYieldNGN" INTEGER NOT NULL,
    "distributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "yield_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_nostrPubKey_key" ON "users"("nostrPubKey");

-- CreateIndex
CREATE UNIQUE INDEX "pool_members_userId_poolId_key" ON "pool_members"("userId", "poolId");

-- CreateIndex
CREATE UNIQUE INDEX "deposits_bitnobReference_key" ON "deposits"("bitnobReference");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawals_bitnobReference_key" ON "withdrawals"("bitnobReference");

-- AddForeignKey
ALTER TABLE "pools" ADD CONSTRAINT "pools_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_members" ADD CONSTRAINT "pool_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_members" ADD CONSTRAINT "pool_members_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yield_records" ADD CONSTRAINT "yield_records_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
