import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature } from '@/lib/bitnob'
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

    if (event.event === 'payment.confirmed') {
      const { reference, amount } = event.data

      const deposit = await prisma.deposit.findUnique({
        where: { bitnobReference: reference },
      })

      if (!deposit || deposit.status === 'CONFIRMED') {
        return NextResponse.json({ ok: true })
      }

      const amountSats = ngnToSats(amount)

      await prisma.$transaction([
        prisma.deposit.update({
          where: { id: deposit.id },
          data: { status: 'CONFIRMED', amountSats, confirmedAt: new Date() },
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
