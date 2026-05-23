import Link from 'next/link'
import { TierBadge, StatusBadge } from '@/components/ui/Badge'
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
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap gap-1.5">
            <TierBadge tier={pool.tier} />
            <StatusBadge status={pool.status} />
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {pool.memberCount} {pool.memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>

        <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-primary transition-colors">
          {pool.name}
        </h3>

        {pool.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{pool.description}</p>
        )}

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{formatNGN(pool.currentSize)} raised</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Target: {formatNGN(pool.targetSize)}</p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {pool.apyMin}–{pool.apyMax}% APY
            </p>
            <p className="text-xs text-gray-400">(Estimated. Not guaranteed.)</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">{pool.lockDays} days</p>
            <p className="text-xs text-gray-400">lock period</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
