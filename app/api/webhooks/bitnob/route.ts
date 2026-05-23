import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature } from '@/lib/bitnob'
import { createDepositInvoice, isBreezReady } from '@/lib/breez'
import { ngnToSats } from '@/lib/utils'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-bitnob-signature') ?? ''

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('[MoniPool Error] Invalid Bitnob webhook signature')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const event = JSON.parse(rawBody) as {
      event: string
      data: { reference: string; amount: number }
    }

    if (event.event === 'wallet.funded' || event.event === 'payment.confirmed') {
      const { reference, amount } = event.data

      const deposit = await prisma.deposit.findUnique({
        where: { bitnobReference: reference },
      })

      if (!deposit || deposit.status === 'CONFIRMED') {
        return NextResponse.json({ ok: true })
      }

      const amountSats = ngnToSats(amount)

      // Credit the Breez pool wallet via Lightning invoice.
      // We generate the invoice and store it — in production, Bitnob
      // would pay this invoice to route the BTC into our Lightning wallet.
      // HACKATHON: auto-funding is simulated below; wire up Bitnob's
      // "send to Lightning invoice" endpoint post-demo.
      let lightningInvoice: string | null = null
      const breezReady = await isBreezReady()

      if (breezReady) {
        try {
          const invoiceDetails = await createDepositInvoice(
            amountSats,
            `MoniPool deposit ref:${reference}`
          )
          lightningInvoice = invoiceDetails.destination
          console.log(`[MoniPool] Breez invoice generated for ${amountSats} sats: ${lightningInvoice.slice(0, 40)}…`)
        } catch (breezErr) {
          console.error('[MoniPool Error] Breez invoice generation failed, crediting DB only:', breezErr)
        }
      } else {
        console.warn('[MoniPool] Breez not ready — crediting DB balance only (sandbox mode)')
      }

      // Credit user balance and confirm deposit in a single transaction
      await prisma.$transaction([
        prisma.deposit.update({
          where: { id: deposit.id },
          data: {
            status: 'CONFIRMED',
            amountSats,
            confirmedAt: new Date(),
            // Store the Lightning invoice so it can be paid by Bitnob later
            virtualAccount: {
              ...(deposit.virtualAccount as Record<string, unknown> ?? {}),
              lightningInvoice,
            },
          },
        }),
        prisma.user.update({
          where: { id: deposit.userId },
          data: { balanceSats: { increment: amountSats } },
        }),
      ])
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[MoniPool Error] Bitnob webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
