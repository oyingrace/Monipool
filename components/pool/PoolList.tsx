'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PoolCard } from './PoolCard'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { Pool, PoolStatus } from '@/types'

interface PoolListProps {
  initialPools: Pool[]
}

const FILTERS: { label: string; value: PoolStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
]

export function PoolList({ initialPools }: PoolListProps) {
  const [filter, setFilter] = useState<PoolStatus | 'ALL'>('ALL')

  const filtered =
    filter === 'ALL' ? initialPools : initialPools.filter((p) => p.status === filter)

  return (
    <div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
              filter === f.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-base mb-4">No pools found</p>
          <Link href="/create-pool">
            <Button variant="outline">Start a Pool</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pool) => (
            <PoolCard key={pool.id} pool={pool} />
          ))}
        </div>
      )}
    </div>
  )
}
