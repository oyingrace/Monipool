import { cn } from '@/lib/utils'
import type { PoolTier, PoolStatus } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'muted'
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        {
          'bg-primary/10 text-primary': variant === 'default',
          'bg-success/10 text-success': variant === 'success',
          'bg-warning/15 text-warning-foreground': variant === 'warning',
          'bg-destructive/10 text-destructive': variant === 'destructive',
          'bg-muted text-muted-foreground': variant === 'muted',
        },
        className
      )}
    >
      {children}
    </span>
  )
}

interface TierBadgeProps {
  tier: PoolTier
}

const TIER_STYLES: Record<PoolTier, string> = {
  STARTER: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
  GROWTH: 'bg-amber-50 text-amber-700 border border-amber-200/60',
  POWER: 'bg-violet-50 text-violet-700 border border-violet-200/60',
}

const TIER_LABELS: Record<PoolTier, string> = {
  STARTER: 'Starter',
  GROWTH: 'Growth',
  POWER: 'Power',
}

export function TierBadge({ tier }: TierBadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', TIER_STYLES[tier])}>
      {TIER_LABELS[tier]}
    </span>
  )
}

interface StatusBadgeProps {
  status: PoolStatus
}

const STATUS_VARIANT: Record<PoolStatus, BadgeProps['variant']> = {
  OPEN: 'default',
  ACTIVE: 'success',
  COMPLETED: 'muted',
  CANCELLED: 'destructive',
}

const STATUS_LABELS: Record<PoolStatus, string> = {
  OPEN: 'Open',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>
}
