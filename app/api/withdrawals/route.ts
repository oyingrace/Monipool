import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import {
  initiateNGNPayout,
  createBitnobLightningInvoice,
  isBitnobConfigured,
} from '@/lib/bitnob'
import { isBreezReady, payLightningInvoice } from '@/lib/breez'
import { ngnToSats } from '@/lib/utils'
import { z } from 'zod'
import crypto from 'crypto'

const WithdrawSchema = z.object({
  amountNGN: z.number().int().min(1000, 'Minimum withdrawal is ₦1,000'),
  bankAccount: z.string().length(10, 'Account number must be 10 digits'),
  bankCode: z.string().min(1),
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
    let finalStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' = 'PENDING'

    // ── Route A: User-provided Lightning invoice ─────────────────────────────
    if (lightningInvoice) {
      const breezReady = await isBreezReady()
      if (!breezReady) {
        return NextResponse.json(
          { error: 'Lightning payments are temporarily unavailable. Use bank withdrawal instead.' },
          { status: 503 }
        )
      }
      const result = await payLightningInvoice(lightningInvoice)
      breezTxId = result.txId
      finalStatus = 'COMPLETED'

    // ── Route B: Bank withdrawal via Breez → Bitnob Lightning → NGN bank ─────
    } else if (isBitnobConfigured() && await isBreezReady()) {
      try {
        // Step 1: Create a Bitnob Lightning invoice for this NGN amount.
        // When paid, Bitnob converts the incoming BTC to NGN and sends to bank.
        const bitnobInvoice = await createBitnobLightningInvoice(
          amountNGN,
          user.nostrPubKey, // used as customerEmail fallback — replace with real email post-demo
          reference
        )

        // Step 2: Pay the Bitnob invoice from the Breez pool wallet.
        // BTC leaves the pool wallet; Bitnob sends NGN to the user's bank.
        const result = await payLightningInvoice(bitnobInvoice.invoice)
        breezTxId = result.txId
        finalStatus = 'PROCESSING'
        console.log(`[MoniPool] Breez paid Bitnob invoice ${reference} — NGN payout in progress`)
      } catch (bridgeErr) {
        // Bridge failed — fall back to direct Bitnob NGN payout
        console.error('[MoniPool Error] Breez → Bitnob bridge failed, falling back to direct payout:', bridgeErr)
        await initiateNGNPayout(bankAccount, bankCode, amountNGN, reference)
        finalStatus = 'PENDING'
      }

    // ── Route C: Direct Bitnob NGN payout (fallback) ──────────────────────────
    } else {
      try {
        await initiateNGNPayout(bankAccount, bankCode, amountNGN, reference)
        finalStatus = 'PENDING'
      } catch (payoutErr) {
        console.error('[MoniPool Error] Bitnob payout failed:', payoutErr)
        // Still record the withdrawal — support team can process manually
        finalStatus = 'PENDING'
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
          status: finalStatus,
        },
      })
    })

    return NextResponse.json({ data: withdrawal })
  } catch (error) {
    console.error('[MoniPool Error] Withdrawal:', error)
    return NextResponse.json({ error: 'Withdrawal failed. Please try again.' }, { status: 500 })
  }
}
