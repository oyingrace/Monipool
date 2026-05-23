import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { Navbar } from '@/components/layout/Navbar'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { TierBadge, StatusBadge } from '@/components/ui/Badge'
import { NostrFeed } from '@/components/feed/NostrFeed'
import { PoolDetailActions } from './PoolDetailActions'
import { formatNGN, formatDate, satsToNGN } from '@/lib/utils'
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
    <>
      <Navbar />
      <PageWrapper>
        <div className="mb-4">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            ← Back to pools
          </Link>
        </div>

        {/* Pool header */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <TierBadge tier={pool.tier} />
            <StatusBadge status={pool.status} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">{pool.name}</h1>
          {pool.description && <p className="text-gray-500 mb-4">{pool.description}</p>}

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1.5">
              <span>{formatNGN(pool.currentSize)} raised</span>
              <span className="font-semibold">{progressPercent}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Target: {formatNGN(pool.targetSize)}</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-50">
            <div>
              <p className="text-lg font-bold text-gray-900">
                {pool.apyMin}–{pool.apyMax}%
              </p>
              <p className="text-xs text-gray-400">Est. APY*</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{pool.lockDays}d</p>
              <p className="text-xs text-gray-400">Lock period</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{pool._count.members}</p>
              <p className="text-xs text-gray-400">Members</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">*Estimated. Not guaranteed.</p>
        </div>

        {/* My membership */}
        {myMembership && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-4">
            <h3 className="font-bold text-primary mb-3">Your Membership</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Your deposit</p>
                <p className="font-semibold text-gray-900">{formatNGN(myMembership.depositNGN)}</p>
                <p className="text-xs text-gray-400">{myMembership.depositSats.toLocaleString()} sats</p>
              </div>
              <div>
                <p className="text-gray-500">Earnings so far</p>
                <p className="font-semibold text-primary">{formatNGN(myMembership.earnedYieldNGN)}</p>
              </div>
              <div>
                <p className="text-gray-500">Your share</p>
                <p className="font-semibold text-gray-900">{myMembership.sharePercent.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-gray-500">Joined</p>
                <p className="font-semibold text-gray-900">{formatDate(myMembership.joinedAt)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions (Client Component for join button) */}
        {pool.status === 'OPEN' && !myMembership && (
          <PoolDetailActions pool={poolForClient} isAuthenticated={!!auth} />
        )}

        {pool.status === 'COMPLETED' && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4 text-center">
            <p className="text-gray-500 text-sm">
              This pool completed on {pool.completedAt ? formatDate(pool.completedAt) : '—'}.
              Members can withdraw their earnings from the{' '}
              <Link href="/dashboard" className="text-primary font-semibold hover:underline">
                dashboard
              </Link>
              .
            </p>
          </div>
        )}

        {pool.activatedAt && (
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 mb-4">
            <p className="text-sm text-amber-800">
              🚀 This pool activated on {formatDate(pool.activatedAt)} and is currently earning.
              Lock ends on{' '}
              <strong>
                {formatDate(
                  new Date(
                    new Date(pool.activatedAt).getTime() + pool.lockDays * 86_400_000
                  ).toISOString()
                )}
              </strong>
              .
            </p>
          </div>
        )}

        {/* Nostr feed */}
        {pool.nostrGroupId && (
          <div className="mt-4">
            <NostrFeed nostrGroupId={pool.nostrGroupId} poolName={pool.name} />
          </div>
        )}
      </PageWrapper>
    </>
  )
}
