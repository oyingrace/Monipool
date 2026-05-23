import Link from 'next/link'
import { TierBadge, StatusBadge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { formatNGN } from '@/lib/utils'
import type { Pool } from '@/types'

interface PoolCardProps {
  pool: Pool
}

export function PoolCard({ pool }: PoolCardProps) {
  const progressPercent = Math.min(
    Math.round((pool.currentSize / pool.targetSize) * 100),
    100
  )

  return (
    <Link href={`/pool/${pool.id}`} className="block group">
      <Card className="p-5 h-full hover:border-primary/30 hover:shadow-md transition-all">
        <CardContent className="p-0 flex flex-col h-full">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex flex-wrap gap-1.5">
              <TierBadge tier={pool.tier} />
              <StatusBadge status={pool.status} />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap font-mono tabular-nums">
              {pool.memberCount} {pool.memberCount === 1 ? 'member' : 'members'}
            </span>
          </div>

          <h3 className="font-semibold text-foreground text-base mb-1 group-hover:text-primary transition-colors">
            {pool.name}
          </h3>

          {pool.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{pool.description}</p>
          )}

          <div className="mb-4 mt-auto">
            <div className="flex justify-between text-xs text-muted-foreground mb-2 font-mono tabular-nums">
              <span>{formatNGN(pool.currentSize)} raised</span>
              <span className="font-semibold text-foreground">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} />
            <p className="text-xs text-muted-foreground mt-1.5">Target: {formatNGN(pool.targetSize)}</p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div>
              <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
                {pool.apyMin}–{pool.apyMax}% APY
              </p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Estimated</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-medium tabular-nums text-foreground">{pool.lockDays} days</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">lock period</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
