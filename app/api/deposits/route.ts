import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { createVirtualAccount } from '@/lib/bitnob'
import { z } from 'zod'
import crypto from 'crypto'

const DepositSchema = z.object({
  amountNGN: z.number().int().min(1000, 'Minimum deposit is ₦1,000'),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await getAuthUser()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = DepositSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid amount' },
        { status: 400 }
      )
    }

    const { amountNGN } = parsed.data
    const reference = `mp_dep_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`

    let virtualAccount: unknown = null
    try {
      virtualAccount = await createVirtualAccount(amountNGN, reference)
    } catch {
      // HACKATHON: Bitnob sandbox fallback — use mock account for demo
      virtualAccount = {
        data: {
          bankName: 'Wema Bank (Demo)',
          accountNumber: '0123456789',
          accountName: 'MoniPool Demo Account',
        },
      }
    }

    const vaData = ((virtualAccount as { data?: unknown }).data ?? virtualAccount) as
      | Record<string, unknown>
      | null

    const deposit = await prisma.deposit.create({
      data: {
        userId: auth.userId,
        amountNGN,
        bitnobReference: reference,
        virtualAccount: vaData ?? undefined,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ data: deposit })
  } catch (error) {
    console.error('[MoniPool Error] Create deposit:', error)
    return NextResponse.json({ error: 'Could not initiate deposit. Please try again.' }, { status: 500 })
  }
}
