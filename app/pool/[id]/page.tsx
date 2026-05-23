import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { AppShell } from '@/components/layout/AppShell'
import { TierBadge, StatusBadge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { NostrFeed } from '@/components/feed/NostrFeed'
import { PoolDetailActions } from './PoolDetailActions'
import { formatNGN, formatDate } from '@/lib/utils'
import type { Pool, PoolMember } from '@/types'

async function getPool(id: string, userId: string | null) {
  const pool = await prisma.pool.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, displayName: true, nostrPubKey: true } },
      _count: { select: { members: true } },
      members: userId ? { where: { userId }, take: 1 } : false,
    },
  })
  return pool
}

export default async function PoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const auth = await getAuthUser()
  const pool = await getPool(id, auth?.userId ?? null)

  if (!pool) notFound()

  const progressPercent = Math.min(Math.round((pool.currentSize / pool.targetSize) * 100), 100)
  const myMembership: PoolMember | null = pool.members?.[0]
    ? {
        ...pool.members[0],
        userId: pool.members[0].userId,
        poolId: pool.members[0].poolId,
        joinedAt: pool.members[0].joinedAt.toISOString(),
      }
    : null

  const poolForClient: Pool = {
    ...pool,
    description: pool.description ?? null,
    nostrGroupId: pool.nostrGroupId ?? null,
    activatedAt: pool.activatedAt?.toISOString() ?? null,
    completedAt: pool.completedAt?.toISOString() ?? null,
    createdAt: pool.createdAt.toISOString(),
    progressPercent,
    memberCount: pool._count.members,
  }

  return (
    <AppShell>
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-3.5" />
          Back to pools
        </Link>
      </div>

      <Card className="p-6 mb-4">
        <CardContent className="p-0">
          <div className="flex flex-wrap gap-2 mb-4">
            <TierBadge tier={pool.tier} />
            <StatusBadge status={pool.status} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">{pool.name}</h1>
          {pool.description && <p className="text-muted-foreground mb-5 leading-relaxed">{pool.description}</p>}

          <div className="mb-5">
            <div className="flex justify-between text-sm text-muted-foreground mb-2 font-mono tabular-nums">
              <span>{formatNGN(pool.currentSize)} raised</span>
              <span className="font-semibold text-foreground">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <p className="text-xs text-muted-foreground mt-1.5">Target: {formatNGN(pool.targetSize)}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-5 border-t border-border/50">
            <div>
              <p className="font-mono text-lg font-bold tabular-nums text-foreground">
                {pool.apyMin}–{pool.apyMax}%
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Est. APY</p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold tabular-nums text-foreground">{pool.lockDays}d</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Lock period</p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold tabular-nums text-foreground">{pool._count.members}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Members</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">*Estimated. Not guaranteed.</p>
        </CardContent>
      </Card>

      {myMembership && (
        <Card className="p-5 mb-4 border-primary/20 bg-primary/5">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-primary text-base">Your Membership</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Your deposit</p>
                <p className="font-mono font-semibold tabular-nums text-foreground">{formatNGN(myMembership.depositNGN)}</p>
                <p className="text-xs text-muted-foreground font-mono tabular-nums">{myMembership.depositSats.toLocaleString()} sats</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Earnings so far</p>
                <p className="font-mono font-semibold tabular-nums text-primary">{formatNGN(myMembership.earnedYieldNGN)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Your share</p>
                <p className="font-mono font-semibold tabular-nums text-foreground">{myMembership.sharePercent.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Joined</p>
                <p className="font-semibold text-foreground">{formatDate(myMembership.joinedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {pool.status === 'OPEN' && !myMembership && (
        <PoolDetailActions pool={poolForClient} isAuthenticated={!!auth} />
      )}

      {pool.status === 'COMPLETED' && (
        <Card className="p-5 mb-4 text-center">
          <CardContent className="p-0">
            <p className="text-muted-foreground text-sm">
              This pool completed on {pool.completedAt ? formatDate(pool.completedAt) : '—'}.
              Members can withdraw their earnings from the{' '}
              <Link href="/dashboard" className="text-primary font-medium hover:underline">
                dashboard
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      )}

      {pool.activatedAt && (
        <Card className="p-4 mb-4 border-warning/30 bg-warning/10">
          <CardContent className="p-0">
            <p className="text-sm text-foreground">
              This pool activated on {formatDate(pool.activatedAt)} and is currently earning.
              Lock ends on{' '}
              <strong className="font-mono tabular-nums">
                {formatDate(
                  new Date(
                    new Date(pool.activatedAt).getTime() + pool.lockDays * 86_400_000
                  ).toISOString()
                )}
              </strong>
              .
            </p>
          </CardContent>
        </Card>
      )}

      {pool.nostrGroupId && (
        <div className="mt-4">
          <NostrFeed nostrGroupId={pool.nostrGroupId} poolName={pool.name} />
        </div>
      )}
    </AppShell>
  )
}
