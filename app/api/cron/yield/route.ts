import { NextRequest, NextResponse } from 'next/server'
import { accrueAllPools } from '@/lib/yield'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = request.headers.get('authorization')
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const result = await accrueAllPools()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[MoniPool Error] Yield cron:', error)
    return NextResponse.json({ error: 'Yield accrual failed' }, { status: 500 })
  }
}
