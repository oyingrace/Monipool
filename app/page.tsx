import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PoolList } from '@/components/pool/PoolList'
import { Navbar } from '@/components/layout/Navbar'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/Button'
import type { Pool } from '@/types'

async function getPools(): Promise<Pool[]> {
  try {
    const pools = await prisma.pool.findMany({
      where: { status: { in: ['OPEN', 'ACTIVE', 'COMPLETED'] } },
      include: {
        creator: { select: { id: true, displayName: true, nostrPubKey: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return pools.map((pool) => ({
      ...pool,
      description: pool.description ?? null,
      nostrGroupId: pool.nostrGroupId ?? null,
      activatedAt: pool.activatedAt?.toISOString() ?? null,
      completedAt: pool.completedAt?.toISOString() ?? null,
      createdAt: pool.createdAt.toISOString(),
      progressPercent: Math.min(Math.round((pool.currentSize / pool.targetSize) * 100), 100),
      memberCount: pool._count.members,
    }))
  } catch {
    // DB not yet connected — show empty state
    return []
  }
}

export default async function HomePage() {
  const pools = await getPools()

  return (
    <>
      <Navbar />
      <PageWrapper>
        {/* Hero */}
        <section className="py-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
            Save together.<br />
            <span className="text-primary">Earn together.</span>
          </h1>
          <p className="text-gray-500 max-w-sm mx-auto text-base mb-6">
            Join a savings pool with your community. Your money earns Bitcoin yield and pays out in naira.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/login">
              <Button size="md">Start Saving</Button>
            </Link>
            <Link href="/create-pool">
              <Button variant="secondary" size="md">Create a Pool</Button>
            </Link>
          </div>
        </section>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 bg-white rounded-2xl p-4 border border-gray-100 mb-8">
          <StatCard label="Active Pools" value={pools.filter(p => p.status === 'ACTIVE').length.toString()} />
          <StatCard label="Open Pools" value={pools.filter(p => p.status === 'OPEN').length.toString()} />
          <StatCard
            label="Total Saved"
            value={`₦${Math.round(pools.reduce((a, p) => a + p.currentSize, 0) / 1000)}k`}
          />
        </div>

        {/* Pool browser */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Savings Pools</h2>
            <Link href="/create-pool" className="text-sm text-primary font-semibold hover:underline">
              + New Pool
            </Link>
          </div>
          <PoolList initialPools={pools} />
        </section>
      </PageWrapper>
    </>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
