import { NextResponse } from 'next/server'
import crypto from 'crypto'

// HACKATHON: in-memory store is fine for MVP. Use Redis post-demo.
export const challenges = new Map<string, { challenge: string; expires: number }>()

export async function POST(): Promise<NextResponse> {
  const challenge = crypto.randomBytes(32).toString('hex')
  const id = crypto.randomUUID()
  challenges.set(id, { challenge, expires: Date.now() + 5 * 60 * 1000 })
  return NextResponse.json({ id, challenge })
}
