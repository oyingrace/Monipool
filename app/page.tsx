import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PoolList } from '@/components/pool/PoolList'
import { LandingShell } from '@/components/layout/LandingShell'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
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
    return []
  }
}

export default async function HomePage() {
  const pools = await getPools()
  const activeCount = pools.filter((p) => p.status === 'ACTIVE').length
  const openCount = pools.filter((p) => p.status === 'OPEN').length
  const totalSaved = pools.reduce((a, p) => a + p.currentSize, 0)

  return (
    <LandingShell>
      {/* Hero */}
      <section className="relative mb-10 pt-4 lg:pt-8 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/[0.06] blur-[120px] rounded-full pointer-events-none" />
        <div className="relative">
          <p className="text-[11px] font-medium uppercase tracking-widest text-primary mb-4">
            Community savings · Bitcoin yield
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] tracking-tight text-foreground mb-4">
            Save together.
            <br />
            <span className="text-primary font-medium">Earn together.</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-base leading-relaxed mb-8">
            Join a savings pool with your community. Your money earns Bitcoin yield and pays out in naira.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/login">
              <Button size="lg" className="w-auto px-8">Start Saving</Button>
            </Link>
            <Link href="/create-pool">
              <Button variant="outline" size="lg" className="w-auto px-8">Create a Pool</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        <StatCard label="Active Pools" value={activeCount.toString()} />
        <StatCard label="Open Pools" value={openCount.toString()} />
        <StatCard
          label="Total Saved"
          value={`₦${Math.round(totalSaved / 1000)}k`}
        />
      </div>

      {/* Pool browser */}
      <section id="pools">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Savings Pools</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Browse and join community pools</p>
          </div>
          <Link href="/create-pool">
            <Button variant="outline" size="sm">+ New Pool</Button>
          </Link>
        </div>
        <PoolList initialPools={pools} />
      </section>
    </LandingShell>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5 text-center">
      <CardContent className="p-0">
        <p className="font-mono text-2xl sm:text-3xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mt-1.5">{label}</p>
      </CardContent>
    </Card>
  )
}
