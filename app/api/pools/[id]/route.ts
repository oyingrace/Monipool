import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const auth = await getAuthUser()

    const pool = await prisma.pool.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, displayName: true, nostrPubKey: true } },
        _count: { select: { members: true } },
        members: auth
          ? {
              where: { userId: auth.userId },
              select: {
                id: true,
                depositNGN: true,
                sharePercent: true,
                earnedYieldNGN: true,
                joinedAt: true,
              },
            }
          : false,
      },
    })

    if (!pool) return NextResponse.json({ error: 'Pool not found' }, { status: 404 })

    return NextResponse.json({
      data: {
        ...pool,
        progressPercent: Math.min(
          Math.round((pool.currentSize / pool.targetSize) * 100),
          100
        ),
        memberCount: pool._count.members,
        myMembership: pool.members?.[0] ?? null,
      },
    })
  } catch (error) {
    console.error('[MoniPool Error] Get pool:', error)
    return NextResponse.json({ error: 'Could not load pool' }, { status: 500 })
  }
}
