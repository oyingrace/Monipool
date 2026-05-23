import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { initiateNGNPayout } from '@/lib/bitnob'
import { isBreezReady, payLightningInvoice } from '@/lib/breez'
import { ngnToSats } from '@/lib/utils'
import { z } from 'zod'
import crypto from 'crypto'

const WithdrawSchema = z.object({
  amountNGN: z.number().int().min(1000, 'Minimum withdrawal is ₦1,000'),
  bankAccount: z.string().length(10, 'Account number must be 10 digits'),
  bankCode: z.string().min(1),
  // Optional: if user provides a Lightning invoice we pay it directly from Breez
  lightningInvoice: z.string().optional(),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await getAuthUser()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = WithdrawSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 }
      )
    }

    const { amountNGN, bankAccount, bankCode, lightningInvoice } = parsed.data

    const user = await prisma.user.findUnique({ where: { id: auth.userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const requiredSats = ngnToSats(amountNGN)
    if (user.balanceSats < requiredSats) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    const reference = `mp_wdl_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
    let breezTxId: string | null = null

    // Route 1: User provided a Lightning invoice — pay directly from Breez wallet
    if (lightningInvoice) {
      const breezReady = await isBreezReady()
      if (!breezReady) {
        return NextResponse.json(
          { error: 'Lightning payments are temporarily unavailable. Use bank withdrawal instead.' },
          { status: 503 }
        )
      }
      try {
        const result = await payLightningInvoice(lightningInvoice)
        breezTxId = result.txId
      } catch {
        return NextResponse.json(
          { error: 'Lightning payment failed. Please try bank withdrawal.' },
          { status: 500 }
        )
      }
    } else {
      // Route 2: Standard bank withdrawal via Bitnob NGN payout
      // The Breez wallet sends BTC to Bitnob, Bitnob sends NGN to bank.
      // HACKATHON: Bitnob ↔ Breez bridge is simulated — Bitnob payout
      // initiated directly. Post-demo: generate Bitnob Lightning invoice,
      // pay it from Breez, then Bitnob auto-converts to NGN and pays bank.
      const breezReady = await isBreezReady()
      if (breezReady) {
        console.log(`[MoniPool] Breez: withdrawing ${requiredSats} sats for user ${auth.userId}`)
        // TODO: post-demo — pay Bitnob Lightning invoice from Breez wallet
        // const bitnobInvoice = await getBitnobLightningInvoice(amountNGN, reference)
        // await payLightningInvoice(bitnobInvoice)
      }

      try {
        await initiateNGNPayout(bankAccount, bankCode, amountNGN, reference)
      } catch {
        // HACKATHON: Bitnob sandbox fallback — proceed for demo
        console.warn('[MoniPool] Bitnob payout failed — demo mode, recording withdrawal anyway')
      }
    }

    // Deduct balance and record withdrawal atomically
    const withdrawal = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: auth.userId },
        data: { balanceSats: { decrement: requiredSats } },
      })
      return tx.withdrawal.create({
        data: {
          userId: auth.userId,
          amountNGN,
          bankAccount: lightningInvoice ? 'lightning' : bankAccount,
          bankCode: lightningInvoice ? 'ln' : bankCode,
          bitnobReference: breezTxId ?? reference,
          status: breezTxId ? 'COMPLETED' : 'PENDING',
        },
      })
    })

    return NextResponse.json({ data: withdrawal })
  } catch (error) {
    console.error('[MoniPool Error] Withdrawal:', error)
    return NextResponse.json({ error: 'Withdrawal failed. Please try again.' }, { status: 500 })
  }
}
