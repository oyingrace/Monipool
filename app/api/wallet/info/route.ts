import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPoolWalletBalance, isBreezReady } from '@/lib/breez'

export async function GET(): Promise<NextResponse> {
  try {
    const auth = await getAuthUser()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ready = await isBreezReady()

    if (!ready) {
      return NextResponse.json({
        data: { connected: false, balanceSat: null, pendingSendSat: null, pendingReceiveSat: null },
      })
    }

    const balance = await getPoolWalletBalance()
    return NextResponse.json({ data: { connected: true, ...balance } })
  } catch (error) {
    console.error('[MoniPool Error] Wallet info:', error)
    return NextResponse.json({ error: 'Could not fetch wallet info' }, { status: 500 })
  }
}
