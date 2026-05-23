import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { challenges } from '@/lib/challengeStore'

export async function POST(): Promise<NextResponse> {
  const challenge = crypto.randomBytes(32).toString('hex')
  const id = crypto.randomUUID()
  challenges.set(id, { challenge, expires: Date.now() + 5 * 60 * 1000 })
  return NextResponse.json({ id, challenge })
}
