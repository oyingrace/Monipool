import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardContent } from './DashboardContent'
import { satsToNGN } from '@/lib/utils'
import type { Deposit } from '@/types'

export default async function DashboardPage() {
  const auth = await getAuthUser()
  if (!auth) redirect('/login')

  const [user, myPools, deposits] = await Promise.all([
    prisma.user.findUnique({ where: { id: auth.userId } }),
    prisma.poolMember.findMany({
      where: { userId: auth.userId },
      include: { pool: true },
      orderBy: { joinedAt: 'desc' },
    }),
    prisma.deposit.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  if (!user) redirect('/login')

  const userForClient = {
    ...user,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
    balanceNGN: satsToNGN(user.balanceSats),
  }

  const totalEarnings = myPools.reduce((sum, m) => sum + m.earnedYieldNGN, 0)
  const activePools = myPools.filter((m) => m.pool.status === 'ACTIVE').length
  const totalDeposited = myPools.reduce((sum, m) => sum + m.depositNGN, 0)

  const poolsForClient = myPools.map((m) => ({
    id: m.id,
    depositNGN: m.depositNGN,
    sharePercent: m.sharePercent,
    earnedYieldNGN: m.earnedYieldNGN,
    joinedAt: m.joinedAt.toISOString(),
    pool: {
      id: m.poolId,
      name: m.pool.name,
      tier: m.pool.tier,
      status: m.pool.status,
    },
  }))

  const depositsForClient: Deposit[] = deposits.map((d) => ({
    ...d,
    amountSats: d.amountSats,
    virtualAccount: d.virtualAccount as Deposit['virtualAccount'],
    confirmedAt: d.confirmedAt?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
  }))

  return (
    <AppShell>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Your savings, pools, and earnings at a glance</p>
      </div>

      <DashboardContent
        user={userForClient}
        myPools={poolsForClient}
        deposits={depositsForClient}
        totalEarnings={totalEarnings}
        activePools={activePools}
        totalDeposited={totalDeposited}
      />
    </AppShell>
  )
}
