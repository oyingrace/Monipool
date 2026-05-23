import { prisma } from '@/lib/prisma'
import { PoolTier } from '@prisma/client'

export const DAILY_RATES: Record<PoolTier, number> = {
  STARTER: 0.000137,
  GROWTH: 0.000233,
  POWER: 0.000356,
}

async function completePool(poolId: string): Promise<void> {
  await prisma.pool.update({
    where: { id: poolId },
    data: { status: 'COMPLETED', completedAt: new Date() },
  })
}

export async function accrueAllPools(): Promise<{ poolsProcessed: number }> {
  const activePools = await prisma.pool.findMany({
    where: { status: 'ACTIVE' },
    include: { members: true },
  })

  for (const pool of activePools) {
    const dailyYield = Math.floor(pool.currentSize * DAILY_RATES[pool.tier])

    await prisma.yieldRecord.create({
      data: {
        poolId: pool.id,
        periodDate: new Date(),
        totalYieldNGN: dailyYield,
      },
    })

    for (const member of pool.members) {
      const memberYield = Math.floor(dailyYield * (member.sharePercent / 100))
      await prisma.poolMember.update({
        where: { id: member.id },
        data: { earnedYieldNGN: { increment: memberYield } },
      })
    }

    if (pool.activatedAt) {
      const daysSinceActivation =
        (Date.now() - new Date(pool.activatedAt).getTime()) / 86_400_000
      if (daysSinceActivation >= pool.lockDays) {
        await completePool(pool.id)
      }
    }
  }

  return { poolsProcessed: activePools.length }
}
