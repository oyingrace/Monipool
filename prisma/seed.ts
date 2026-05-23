import { PrismaClient, PoolTier, PoolStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  const demoUser = await prisma.user.upsert({
    where: { nostrPubKey: 'demo_pubkey_000' },
    update: {},
    create: {
      nostrPubKey: 'demo_pubkey_000',
      displayName: 'Demo User',
      balanceSats: 150000,
    },
  })

  const creator = await prisma.user.upsert({
    where: { nostrPubKey: 'creator_pubkey_001' },
    update: {},
    create: {
      nostrPubKey: 'creator_pubkey_001',
      displayName: 'Kemi A.',
      balanceSats: 0,
    },
  })

  await prisma.pool.create({
    data: {
      name: 'Lagos Starter Circle',
      description: 'A beginner-friendly pool for first-time savers.',
      tier: PoolTier.STARTER,
      status: PoolStatus.OPEN,
      minDeposit: 10000,
      targetSize: 500000,
      currentSize: 310000,
      lockDays: 30,
      apyMin: 4,
      apyMax: 6,
      dailyRate: 0.000137,
      creatorId: creator.id,
    },
  })

  const activePool = await prisma.pool.create({
    data: {
      name: 'Abuja Growth Fund',
      description: 'For serious savers looking to grow their naira.',
      tier: PoolTier.GROWTH,
      status: PoolStatus.ACTIVE,
      minDeposit: 50000,
      targetSize: 2000000,
      currentSize: 2000000,
      lockDays: 60,
      apyMin: 7,
      apyMax: 10,
      dailyRate: 0.000233,
      activatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      creatorId: creator.id,
    },
  })

  await prisma.poolMember.create({
    data: {
      userId: demoUser.id,
      poolId: activePool.id,
      depositNGN: 50000,
      depositSats: 15000,
      sharePercent: 2.5,
      earnedYieldNGN: 875,
    },
  })

  await prisma.pool.create({
    data: {
      name: 'Port Harcourt Power Pool',
      description: 'High-yield 90-day pool for power savers.',
      tier: PoolTier.POWER,
      status: PoolStatus.COMPLETED,
      minDeposit: 200000,
      targetSize: 5000000,
      currentSize: 5000000,
      lockDays: 90,
      apyMin: 12,
      apyMax: 15,
      dailyRate: 0.000356,
      activatedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      creatorId: creator.id,
    },
  })

  console.log('Seed data created successfully')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
