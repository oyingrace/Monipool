import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature, payLightningInvoiceFromBitnob, isBitnobConfigured } from '@/lib/bitnob'
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
      data: { reference: string; amount: number; customerEmail?: string }
    }

    if (event.event === 'wallet.funded' || event.event === 'payment.confirmed') {
      const { reference, amount, customerEmail } = event.data

      const deposit = await prisma.deposit.findUnique({
        where: { bitnobReference: reference },
        include: { user: { select: { nostrPubKey: true } } },
      })

      if (!deposit || deposit.status === 'CONFIRMED') {
        return NextResponse.json({ ok: true })
      }

      const amountSats = ngnToSats(amount)
      let lightningInvoice: string | null = null

      // Step 1: Generate a Breez Lightning invoice for this deposit amount
      const breezReady = await isBreezReady()
      if (breezReady) {
        try {
          const invoiceDetails = await createDepositInvoice(
            amountSats,
            `MoniPool deposit ref:${reference}`
          )
          lightningInvoice = invoiceDetails.destination
          console.log(`[MoniPool] Breez invoice generated for ${amountSats} sats`)

          // Step 2: Have Bitnob pay the Breez invoice — routes BTC into pool wallet
          if (isBitnobConfigured() && customerEmail) {
            try {
              await payLightningInvoiceFromBitnob(lightningInvoice, customerEmail)
              console.log(`[MoniPool] Bitnob paid Breez invoice — BTC now in pool wallet`)
            } catch (payErr) {
              // Invoice payment failed — BTC stays with Bitnob for now.
              // The invoice is stored in the DB and can be retried manually.
              console.error('[MoniPool Error] Bitnob → Breez invoice payment failed:', payErr)
            }
          } else if (!customerEmail) {
            console.warn('[MoniPool] No customerEmail in webhook — cannot trigger Bitnob Lightning payout. BTC stays in Bitnob custody.')
          }
        } catch (breezErr) {
          console.error('[MoniPool Error] Breez invoice generation failed:', breezErr)
        }
      } else {
        console.warn('[MoniPool] Breez not ready — crediting DB only (configure BREEZ_MNEMONIC to activate)')
      }

      // Credit user balance and confirm deposit regardless of Lightning status.
      // The DB balance is the source of truth; Breez is the custody layer.
      await prisma.$transaction([
        prisma.deposit.update({
          where: { id: deposit.id },
          data: {
            status: 'CONFIRMED',
            amountSats,
            confirmedAt: new Date(),
            virtualAccount: {
              ...(deposit.virtualAccount as Record<string, unknown> ?? {}),
              lightningInvoice,
              breezFunded: lightningInvoice !== null,
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
