import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { createPoolCommunity } from '@/lib/nostr-server'
import { POOL_TIER_CONFIG } from '@/types'
import { z } from 'zod'

const CreatePoolSchema = z.object({
  name: z.string().min(3).max(60),
  description: z.string().max(300).optional(),
  tier: z.enum(['STARTER', 'GROWTH', 'POWER']),
})

export async function GET(): Promise<NextResponse> {
  try {
    const pools = await prisma.pool.findMany({
      where: { status: { in: ['OPEN', 'ACTIVE', 'COMPLETED'] } },
      include: {
        creator: { select: { id: true, displayName: true, nostrPubKey: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = pools.map((pool) => ({
      ...pool,
      progressPercent: Math.min(
        Math.round((pool.currentSize / pool.targetSize) * 100),
        100
      ),
      memberCount: pool._count.members,
    }))

    return NextResponse.json({ data: formatted })
  } catch (error) {
    console.error('[MoniPool Error] List pools:', error)
    return NextResponse.json({ error: 'Could not load pools' }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await getAuthUser()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = CreatePoolSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    const { name, description, tier } = parsed.data
    const config = POOL_TIER_CONFIG[tier]

    const pool = await prisma.pool.create({
      data: {
        name,
        description,
        tier,
        minDeposit: config.minDeposit,
        targetSize: config.targetSize,
        lockDays: config.lockDays,
        apyMin: config.apyMin,
        apyMax: config.apyMax,
        dailyRate: config.dailyRate,
        creatorId: auth.userId,
      },
    })

    // Wire up Nostr community — non-blocking
    createPoolCommunity(pool.id, pool.name)
      .then((nostrGroupId) =>
        prisma.pool.update({ where: { id: pool.id }, data: { nostrGroupId } })
      )
      .catch((err) => console.error('[MoniPool Error] Nostr community creation:', err))

    return NextResponse.json({ data: pool }, { status: 201 })
  } catch (error) {
    console.error('[MoniPool Error] Create pool:', error)
    return NextResponse.json({ error: 'Could not create pool. Please try again.' }, { status: 500 })
  }
}
