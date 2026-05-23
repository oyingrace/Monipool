import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(): Promise<NextResponse> {
  try {
    const auth = await getAuthUser()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const deposits = await prisma.deposit.findMany({
      where: { userId: auth.userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: deposits })
  } catch (error) {
    console.error('[MoniPool Error] Pending deposits:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
