import { cn } from '@/lib/utils'
import type { PoolTier, PoolStatus } from '@/types'

interface TierBadgeProps {
  tier: PoolTier
}

const TIER_STYLES: Record<PoolTier, string> = {
  STARTER: 'bg-emerald-100 text-emerald-800',
  GROWTH: 'bg-amber-100 text-amber-800',
  POWER: 'bg-purple-100 text-purple-800',
}

const TIER_LABELS: Record<PoolTier, string> = {
  STARTER: 'Starter',
  GROWTH: 'Growth',
  POWER: 'Power',
}

export function TierBadge({ tier }: TierBadgeProps) {
  return (
    <span className={cn('inline-block px-2.5 py-1 rounded-full text-xs font-semibold', TIER_STYLES[tier])}>
      {TIER_LABELS[tier]}
    </span>
  )
}

interface StatusBadgeProps {
  status: PoolStatus
}

const STATUS_STYLES: Record<PoolStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<PoolStatus, string> = {
  OPEN: 'Open',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={cn('inline-block px-2.5 py-1 rounded-full text-xs font-semibold', STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  )
}
