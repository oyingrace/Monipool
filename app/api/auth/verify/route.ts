import { NextRequest, NextResponse } from 'next/server'
import { verifyEvent } from 'nostr-tools'
import { prisma } from '@/lib/prisma'
import { signJWT } from '@/lib/auth'
import { challenges } from '@/lib/challengeStore'
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
    const stored = challenges.get(challengeId)

    if (!stored || Date.now() > stored.expires) {
      return NextResponse.json({ error: 'Challenge expired. Please try again.' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!verifyEvent(signedEvent as any)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    challenges.delete(challengeId)

    const user = await prisma.user.upsert({
      where: { nostrPubKey: pubkey },
      update: {},
      create: { nostrPubKey: pubkey },
    })

    const jwt = await signJWT({ userId: user.id, pubkey })

    const response = NextResponse.json({ data: user })
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
