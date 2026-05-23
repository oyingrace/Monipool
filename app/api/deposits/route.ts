import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { createVirtualAccount, isBitnobConfigured } from '@/lib/bitnob'
import { z } from 'zod'
import crypto from 'crypto'
import type { Prisma } from '@prisma/client'

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
    let vaData: Prisma.InputJsonValue | null = null

    if (isBitnobConfigured()) {
      // Real Bitnob API — generate a virtual NGN bank account for this deposit
      const result = await createVirtualAccount(amountNGN, reference)
      const inner = (result as { data?: unknown }).data ?? result
      vaData = inner as Prisma.InputJsonValue
    } else {
      // Demo mode — Bitnob API key not configured yet.
      // Shows the deposit UI flow without a real bank account.
      console.warn('[MoniPool] Bitnob not configured — using demo virtual account')
      vaData = {
        bankName: 'Wema Bank (Demo)',
        accountNumber: '0123456789',
        accountName: 'MoniPool Demo Account',
        demo: true,
      }
    }

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
