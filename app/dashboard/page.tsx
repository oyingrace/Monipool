import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { Navbar } from '@/components/layout/Navbar'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { WalletBalance } from '@/components/wallet/WalletBalance'
import { TierBadge, StatusBadge } from '@/components/ui/Badge'
import { WithdrawSection } from './WithdrawSection'
import { formatNGN, formatDate, satsToNGN } from '@/lib/utils'

export default async function DashboardPage() {
  const auth = await getAuthUser()
  if (!auth) redirect('/login')

  const [user, myPools, deposits] = await Promise.all([
    prisma.user.findUnique({ where: { id: auth.userId } }),
    prisma.poolMember.findMany({
      where: { userId: auth.userId },
      include: { pool: true },
      orderBy: { joinedAt: 'desc' },
    }),
    prisma.deposit.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  if (!user) redirect('/login')

  const userForClient = {
    ...user,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
    balanceNGN: satsToNGN(user.balanceSats),
  }

  const totalEarnings = myPools.reduce((sum, m) => sum + m.earnedYieldNGN, 0)

  return (
    <>
      <Navbar />
      <PageWrapper>
        <h1 className="text-2xl font-black text-gray-900 mb-5">My Dashboard</h1>

        {/* Wallet card */}
        <div className="mb-6">
          <WalletBalance user={userForClient} />
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Total Earnings</p>
            <p className="text-xl font-black text-primary">{formatNGN(totalEarnings)}</p>
            <p className="text-xs text-gray-400">(Estimated. Not guaranteed.)</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Active Pools</p>
            <p className="text-xl font-black text-gray-900">
              {myPools.filter((m) => m.pool.status === 'ACTIVE').length}
            </p>
          </div>
        </div>

        {/* My Pools */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">My Pools</h2>
            <Link href="/" className="text-sm text-primary font-semibold hover:underline">
              Browse pools
            </Link>
          </div>

          {myPools.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
              <p className="text-gray-400 mb-4">You haven't joined any pools yet</p>
              <Link href="/">
                <span className="text-primary font-semibold hover:underline">Browse open pools →</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myPools.map((m) => (
                <Link key={m.id} href={`/pool/${m.poolId}`} className="block group">
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-primary/20 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                          {m.pool.name}
                        </p>
                        <div className="flex gap-1.5 mt-1">
                          <TierBadge tier={m.pool.tier} />
                          <StatusBadge status={m.pool.status} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-primary">
                          +{formatNGN(m.earnedYieldNGN)}
                        </p>
                        <p className="text-xs text-gray-400">earned</p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500 pt-2 border-t border-gray-50">
                      <span>Deposited: {formatNGN(m.depositNGN)}</span>
                      <span>Share: {m.sharePercent.toFixed(2)}%</span>
                      <span>Joined: {formatDate(m.joinedAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Withdraw section */}
        <section className="mb-6" id="withdraw">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Withdraw to Bank</h2>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <WithdrawSection balanceSats={user.balanceSats} />
          </div>
        </section>

        {/* Transaction history */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Recent Deposits</h2>
          {deposits.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
              <p className="text-gray-400 text-sm">No deposits yet</p>
              <Link href="/deposit" className="text-primary font-semibold text-sm hover:underline mt-2 inline-block">
                Add money →
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {deposits.map((d) => (
                <div key={d.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatNGN(d.amountNGN)}</p>
                    <p className="text-xs text-gray-400">{formatDate(d.createdAt)}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      d.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-700'
                        : d.status === 'FAILED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {d.status === 'CONFIRMED' ? 'Confirmed' : d.status === 'FAILED' ? 'Failed' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </PageWrapper>
    </>
  )
}
