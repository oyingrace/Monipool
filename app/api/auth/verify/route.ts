import { NextRequest, NextResponse } from 'next/server'
import { verifyEvent } from 'nostr-tools'
import { prisma } from '@/lib/prisma'
import { signJWT } from '@/lib/auth'
import { consumeChallenge } from '@/lib/challengeStore'
import { satsToNGN } from '@/lib/utils'
import { z } from 'zod'

const VerifySchema = z.object({
  pubkey: z.string().min(1),
  signedEvent: z.record(z.string(), z.unknown()),
  challengeId: z.string().min(1),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const parsed = VerifySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { pubkey, signedEvent, challengeId } = parsed.data

    // Consume the challenge — single-use, deleted from DB immediately
    const challenge = await consumeChallenge(challengeId)
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge expired. Please try again.' }, { status: 401 })
    }

    // Verify the Nostr event signature
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!verifyEvent(signedEvent as any)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Ensure the signed challenge matches what we issued
    const signedChallenge = (signedEvent.tags as string[][])
      ?.find((t) => t[0] === 'challenge')?.[1]
    if (signedChallenge !== challenge) {
      return NextResponse.json({ error: 'Challenge mismatch' }, { status: 401 })
    }

    const user = await prisma.user.upsert({
      where: { nostrPubKey: pubkey },
      update: {},
      create: { nostrPubKey: pubkey },
    })

    const jwt = await signJWT({ userId: user.id, pubkey })

    const response = NextResponse.json({
      data: { ...user, balanceNGN: satsToNGN(user.balanceSats) },
    })
    response.cookies.set('monipool_token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('[MoniPool Error] Auth verify:', error)
    return NextResponse.json({ error: 'Sign in failed. Please try again.' }, { status: 500 })
  }
}
