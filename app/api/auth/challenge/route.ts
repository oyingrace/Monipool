import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createChallenge, purgeExpiredChallenges } from '@/lib/challengeStore'

export async function POST(): Promise<NextResponse> {
  // Occasionally purge stale rows — cheap, fire-and-forget
  purgeExpiredChallenges().catch(() => null)

  const challenge = crypto.randomBytes(32).toString('hex')
  const id = await createChallenge(challenge)
  return NextResponse.json({ id, challenge })
}
