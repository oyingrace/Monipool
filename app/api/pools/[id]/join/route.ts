import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { postPoolActivity } from '@/lib/nostr-server'
import { ngnToSats } from '@/lib/utils'
import { z } from 'zod'

const JoinSchema = z.object({
  amountNGN: z.number().int().positive(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await getAuthUser()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: poolId } = await params
    const body = await request.json()
    const parsed = JoinSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const { amountNGN } = parsed.data

    const [pool, user] = await Promise.all([
      prisma.pool.findUnique({ where: { id: poolId } }),
      prisma.user.findUnique({ where: { id: auth.userId } }),
    ])

    if (!pool) return NextResponse.json({ error: 'Pool not found' }, { status: 404 })
    if (pool.status !== 'OPEN') {
      return NextResponse.json({ error: 'This pool is no longer accepting new members' }, { status: 400 })
    }
    if (amountNGN < pool.minDeposit) {
      return NextResponse.json(
        { error: `Minimum deposit is ₦${pool.minDeposit.toLocaleString('en-NG')}` },
        { status: 400 }
      )
    }

    const requiredSats = ngnToSats(amountNGN)
    if (!user || user.balanceSats < requiredSats) {
      return NextResponse.json({ error: 'Insufficient balance. Please add money first.' }, { status: 400 })
    }

    const existing = await prisma.poolMember.findUnique({
      where: { userId_poolId: { userId: auth.userId, poolId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'You are already a member of this pool' }, { status: 400 })
    }

    const newSize = pool.currentSize + amountNGN
    const sharePercent = (amountNGN / Math.max(newSize, pool.targetSize)) * 100
    const willActivate = newSize >= pool.targetSize

    const member = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: auth.userId },
        data: { balanceSats: { decrement: requiredSats } },
      })

      const newMember = await tx.poolMember.create({
        data: {
          userId: auth.userId,
          poolId,
          depositNGN: amountNGN,
          depositSats: requiredSats,
          sharePercent,
        },
      })

      await tx.pool.update({
        where: { id: poolId },
        data: {
          currentSize: newSize,
          ...(willActivate && { status: 'ACTIVE', activatedAt: new Date() }),
        },
      })

      return newMember
    })

    // Post Nostr activity — non-blocking
    if (pool.nostrGroupId) {
      const msg = willActivate
        ? `🚀 ${pool.name} is now ACTIVE! All members are earning.`
        : `Someone joined ${pool.name}`
      postPoolActivity(pool.nostrGroupId, msg).catch(console.error)
    }

    return NextResponse.json({ data: member }, { status: 201 })
  } catch (error) {
    console.error('[MoniPool Error] Join pool:', error)
    return NextResponse.json({ error: 'Could not join pool. Please try again.' }, { status: 500 })
  }
}
