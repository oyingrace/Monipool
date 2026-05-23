export type PoolTier = 'STARTER' | 'GROWTH' | 'POWER'
export type PoolStatus = 'OPEN' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type DepositStatus = 'PENDING' | 'CONFIRMED' | 'FAILED'
export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface User {
  id: string
  nostrPubKey: string
  displayName: string | null
  balanceSats: number
  balanceNGN: number
  createdAt: string
}

export interface Pool {
  id: string
  name: string
  description: string | null
  tier: PoolTier
  status: PoolStatus
  minDeposit: number
  targetSize: number
  currentSize: number
  progressPercent: number
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

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  code?: string
}

export const POOL_TIER_CONFIG: Record<PoolTier, {
  label: string
  badgeColor: string
  minDeposit: number
  targetSize: number
  lockDays: number
  apyMin: number
  apyMax: number
  dailyRate: number
}> = {
  STARTER: {
    label: 'Starter',
    badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    minDeposit: 10_000,
    targetSize: 500_000,
    lockDays: 30,
    apyMin: 4,
    apyMax: 6,
    dailyRate: 0.000137,
  },
  GROWTH: {
    label: 'Growth',
    badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    minDeposit: 50_000,
    targetSize: 2_000_000,
    lockDays: 60,
    apyMin: 7,
    apyMax: 10,
    dailyRate: 0.000233,
  },
  POWER: {
    label: 'Power',
    badgeColor: 'bg-violet-50 text-violet-700 border border-violet-200/60',
    minDeposit: 200_000,
    targetSize: 5_000_000,
    lockDays: 90,
    apyMin: 12,
    apyMax: 15,
    dailyRate: 0.000356,
  },
}

export const SATS_TO_NGN_RATE = 330 // HACKATHON: hardcoded rate - fetch from market API post-demo
