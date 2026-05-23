import { prisma } from '@/lib/prisma'

export async function createChallenge(challenge: string): Promise<string> {
  const record = await prisma.authChallenge.create({
    data: {
      challenge,
      expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    },
  })
  return record.id
}

export async function consumeChallenge(
  id: string
): Promise<string | null> {
  const record = await prisma.authChallenge.findUnique({ where: { id } })

  if (!record) return null
  if (new Date() > record.expires) {
    await prisma.authChallenge.delete({ where: { id } }).catch(() => null)
    return null
  }

  // Delete immediately — challenges are single-use
  await prisma.authChallenge.delete({ where: { id } }).catch(() => null)
  return record.challenge
}

// Purge expired challenges — called occasionally to keep the table clean
export async function purgeExpiredChallenges(): Promise<void> {
  await prisma.authChallenge.deleteMany({ where: { expires: { lt: new Date() } } })
}
