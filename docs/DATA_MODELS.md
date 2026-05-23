# MoniPool — Data Models

---

## Prisma Schema
Save this to `backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String        @id @default(cuid())
  nostrPubKey   String        @unique
  displayName   String?
  walletId      String?       // Breez SDK wallet reference
  balanceSats   Int           @default(0)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  poolsCreated  Pool[]        @relation("PoolCreator")
  poolMembers   PoolMember[]
  deposits      Deposit[]
  withdrawals   Withdrawal[]

  @@map("users")
}

model Pool {
  id            String        @id @default(cuid())
  name          String
  description   String?
  tier          PoolTier
  status        PoolStatus    @default(OPEN)
  minDeposit    Int           // in NGN
  targetSize    Int           // in NGN (total pool target)
  currentSize   Int           @default(0) // in NGN
  lockDays      Int
  apyMin        Float         // percentage e.g. 4.0
  apyMax        Float         // percentage e.g. 6.0
  dailyRate     Float         // decimal e.g. 0.000137
  nostrGroupId  String?       // Nostr event ID for this pool's community
  activatedAt   DateTime?
  completedAt   DateTime?
  creatorId     String
  creator       User          @relation("PoolCreator", fields: [creatorId], references: [id])
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  members       PoolMember[]
  yieldRecords  YieldRecord[]

  @@map("pools")
}

model PoolMember {
  id              String    @id @default(cuid())
  userId          String
  poolId          String
  depositNGN      Int       // their NGN contribution
  depositSats     Int       // equivalent in sats at time of deposit
  sharePercent    Float     // their % of the pool
  earnedYieldNGN  Int       @default(0) // accumulated yield in NGN
  joinedAt        DateTime  @default(now())

  user  User  @relation(fields: [userId], references: [id])
  pool  Pool  @relation(fields: [poolId], references: [id])

  @@unique([userId, poolId])
  @@map("pool_members")
}

model Deposit {
  id               String        @id @default(cuid())
  userId           String
  amountNGN        Int
  amountSats       Int?          // set when confirmed
  bitnobReference  String        @unique
  virtualAccount   Json?         // { bankName, accountNumber }
  status           DepositStatus @default(PENDING)
  confirmedAt      DateTime?
  createdAt        DateTime      @default(now())

  user  User  @relation(fields: [userId], references: [id])

  @@map("deposits")
}

model Withdrawal {
  id              String            @id @default(cuid())
  userId          String
  amountNGN       Int
  bankAccount     String
  bankCode        String
  bitnobReference String            @unique
  status          WithdrawalStatus  @default(PENDING)
  createdAt       DateTime          @default(now())

  user  User  @relation(fields: [userId], references: [id])

  @@map("withdrawals")
}

model YieldRecord {
  id             String    @id @default(cuid())
  poolId         String
  periodDate     DateTime  // the day this yield was for
  totalYieldNGN  Int       // total yield earned by pool this period
  distributedAt  DateTime  @default(now())

  pool  Pool  @relation(fields: [poolId], references: [id])

  @@map("yield_records")
}

enum PoolTier {
  STARTER
  GROWTH
  POWER
}

enum PoolStatus {
  OPEN
  ACTIVE
  COMPLETED
  CANCELLED
}

enum DepositStatus {
  PENDING
  CONFIRMED
  FAILED
}

enum WithdrawalStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

---

## TypeScript Types
Save this to `frontend/src/types/index.ts`

```typescript
export type PoolTier = 'STARTER' | 'GROWTH' | 'POWER'
export type PoolStatus = 'OPEN' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type DepositStatus = 'PENDING' | 'CONFIRMED' | 'FAILED'
export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface User {
  id: string
  nostrPubKey: string
  displayName: string | null
  balanceSats: number
  balanceNGN: number // derived: balanceSats × current rate
  createdAt: string
}

export interface Pool {
  id: string
  name: string
  description: string | null
  tier: PoolTier
  status: PoolStatus
  minDeposit: number       // NGN
  targetSize: number       // NGN
  currentSize: number      // NGN
  progressPercent: number  // derived: currentSize / targetSize × 100
  lockDays: number
  apyMin: number
  apyMax: number
  nostrGroupId: string | null
  memberCount: number
  activatedAt: string | null
  completedAt: string | null
  creator: {
    id: string
    displayName: string | null
    nostrPubKey: string
  }
  createdAt: string
}

export interface PoolMember {
  id: string
  userId: string
  poolId: string
  depositNGN: number
  depositSats: number
  sharePercent: number
  earnedYieldNGN: number
  joinedAt: string
}

export interface MyPool extends Pool {
  myMembership: PoolMember
}

export interface Deposit {
  id: string
  amountNGN: number
  amountSats: number | null
  bitnobReference: string
  virtualAccount: {
    bankName: string
    accountNumber: string
  } | null
  status: DepositStatus
  confirmedAt: string | null
  createdAt: string
}

export interface Withdrawal {
  id: string
  amountNGN: number
  bankAccount: string
  status: WithdrawalStatus
  createdAt: string
}

export interface NostrEvent {
  id: string
  pubkey: string
  created_at: number
  kind: number
  tags: string[][]
  content: string
  sig: string
}

export interface FeedItem {
  id: string
  message: string
  timestamp: number
  type: 'join' | 'activate' | 'complete' | 'yield' | 'general'
}

// API response wrappers
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  code?: string
}

// Pool tier config (constants)
export const POOL_TIER_CONFIG: Record<PoolTier, {
  label: string
  color: string
  minDeposit: number
  targetSize: number
  lockDays: number
  apyMin: number
  apyMax: number
  dailyRate: number
}> = {
  STARTER: {
    label: 'Starter',
    color: 'green',
    minDeposit: 10_000,
    targetSize: 500_000,
    lockDays: 30,
    apyMin: 4,
    apyMax: 6,
    dailyRate: 0.000137,
  },
  GROWTH: {
    label: 'Growth',
    color: 'yellow',
    minDeposit: 50_000,
    targetSize: 2_000_000,
    lockDays: 60,
    apyMin: 7,
    apyMax: 10,
    dailyRate: 0.000233,
  },
  POWER: {
    label: 'Power',
    color: 'red',
    minDeposit: 200_000,
    targetSize: 5_000_000,
    lockDays: 90,
    apyMin: 12,
    apyMax: 15,
    dailyRate: 0.000356,
  },
}
```

---

## Database Seed Data
Save to `backend/prisma/seed.ts`

```typescript
import { PrismaClient, PoolTier, PoolStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Demo user
  const demoUser = await prisma.user.upsert({
    where: { nostrPubKey: 'demo_pubkey_000' },
    update: {},
    create: {
      nostrPubKey: 'demo_pubkey_000',
      displayName: 'Demo User',
      balanceSats: 150000, // roughly ₦50,000 worth
    },
  })

  // Seed creator user
  const creator = await prisma.user.upsert({
    where: { nostrPubKey: 'creator_pubkey_001' },
    update: {},
    create: {
      nostrPubKey: 'creator_pubkey_001',
      displayName: 'Kemi A.',
      balanceSats: 0,
    },
  })

  // Open Starter pool
  await prisma.pool.create({
    data: {
      name: 'Lagos Starter Circle',
      description: 'A beginner-friendly pool for first-time savers.',
      tier: PoolTier.STARTER,
      status: PoolStatus.OPEN,
      minDeposit: 10000,
      targetSize: 500000,
      currentSize: 310000,
      lockDays: 30,
      apyMin: 4,
      apyMax: 6,
      dailyRate: 0.000137,
      creatorId: creator.id,
    },
  })

  // Active Growth pool (with demo user as member + yield)
  const activePool = await prisma.pool.create({
    data: {
      name: 'Abuja Growth Fund',
      tier: PoolTier.GROWTH,
      status: PoolStatus.ACTIVE,
      minDeposit: 50000,
      targetSize: 2000000,
      currentSize: 2000000,
      lockDays: 60,
      apyMin: 7,
      apyMax: 10,
      dailyRate: 0.000233,
      activatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      creatorId: creator.id,
    },
  })

  await prisma.poolMember.create({
    data: {
      userId: demoUser.id,
      poolId: activePool.id,
      depositNGN: 50000,
      depositSats: 15000,
      sharePercent: 2.5,
      earnedYieldNGN: 875, // 15 days × 0.000233 × 50000 × 5 (adjust)
    },
  })

  // Completed Power pool
  await prisma.pool.create({
    data: {
      name: 'Port Harcourt Power Pool',
      tier: PoolTier.POWER,
      status: PoolStatus.COMPLETED,
      minDeposit: 200000,
      targetSize: 5000000,
      currentSize: 5000000,
      lockDays: 90,
      apyMin: 12,
      apyMax: 15,
      dailyRate: 0.000356,
      activatedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      creatorId: creator.id,
    },
  })

  console.log('✅ Seed data created successfully')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```