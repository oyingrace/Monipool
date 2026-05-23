'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import {
  TrendingUp,
  Layers,
  PiggyBank,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
} from 'lucide-react'
import { WalletBalance } from '@/components/wallet/WalletBalance'
import { TierBadge, StatusBadge, Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { WithdrawSection } from '@/app/dashboard/WithdrawSection'
import { useMotionSafe } from '@/lib/motion'
import { formatNGN, formatDate } from '@/lib/utils'
import type { User, Deposit } from '@/types'

interface PoolMembership {
  id: string
  depositNGN: number
  sharePercent: number
  earnedYieldNGN: number
  joinedAt: string
  pool: {
    id: string
    name: string
    tier: 'STARTER' | 'GROWTH' | 'POWER'
    status: 'OPEN' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  }
}

interface DashboardContentProps {
  user: User
  myPools: PoolMembership[]
  deposits: Deposit[]
  totalEarnings: number
  activePools: number
  totalDeposited: number
}

export function DashboardContent({
  user,
  myPools,
  deposits,
  totalEarnings,
  activePools,
  totalDeposited,
}: DashboardContentProps) {
  const m = useMotionSafe()

  return (
    <motion.div
      className="flex flex-col gap-7"
      initial={m.fadeUp.initial}
      animate={m.fadeUp.animate}
      transition={m.spring}
    >
      <WalletBalance user={user} />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Total Earnings"
          value={formatNGN(totalEarnings)}
          sub="Estimated. Not guaranteed."
          accent
        />
        <StatCard
          icon={Layers}
          label="Active Pools"
          value={activePools.toString()}
        />
        <StatCard
          icon={PiggyBank}
          label="In Pools"
          value={formatNGN(totalDeposited)}
        />
        <StatCard
          icon={Layers}
          label="Pools Joined"
          value={myPools.length.toString()}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-3">
        <Link href="/deposit" className="flex-1">
          <Button variant="outline" className="w-full gap-2">
            <ArrowDownToLine className="size-4" />
            Add Money
          </Button>
        </Link>
        <Link href="/" className="flex-1">
          <Button variant="outline" className="w-full gap-2">
            <Layers className="size-4" />
            Browse Pools
          </Button>
        </Link>
      </div>

      {/* My Pools */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">My Pools</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Pools you&apos;ve joined</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline"
          >
            View all
            <ChevronRight className="size-3.5" />
          </Link>
        </div>

        {myPools.length === 0 ? (
          <Card className="p-10 text-center">
            <CardContent className="p-0">
              <PiggyBank className="size-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">You haven&apos;t joined any pools yet</p>
              <Link href="/">
                <Button variant="outline">Browse open pools</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {myPools.map((m) => (
              <Link key={m.id} href={`/pool/${m.pool.id}`} className="block group">
                <Card className="p-5 h-full hover:border-primary/30 hover:shadow-md transition-all">
                  <CardContent className="p-0">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {m.pool.name}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <TierBadge tier={m.pool.tier} />
                          <StatusBadge status={m.pool.status} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-base font-bold tabular-nums text-primary">
                          +{formatNGN(m.earnedYieldNGN)}
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">earned</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50 text-xs">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Deposited</p>
                        <p className="font-mono font-medium tabular-nums text-foreground">{formatNGN(m.depositNGN)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Share</p>
                        <p className="font-mono font-medium tabular-nums text-foreground">{m.sharePercent.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Joined</p>
                        <p className="font-medium text-foreground truncate">{formatDate(m.joinedAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Bottom grid: withdraw + deposits */}
      <div className="grid gap-7 lg:grid-cols-2">
        <Card id="withdraw">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowUpFromLine className="size-4 text-muted-foreground" />
              <CardTitle>Withdraw to Bank</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <WithdrawSection balanceSats={user.balanceSats} />
          </CardContent>
        </Card>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Recent Deposits</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Your latest top-ups</p>
            </div>
            <Link href="/deposit" className="text-sm text-primary font-medium hover:underline">
              Add money
            </Link>
          </div>

          {deposits.length === 0 ? (
            <Card className="p-8 text-center h-full flex items-center justify-center">
              <CardContent className="p-0">
                <ArrowDownToLine className="size-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-3">No deposits yet</p>
                <Link href="/deposit">
                  <Button variant="outline" size="sm">Add money</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="divide-y divide-border/50">
                {deposits.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-mono text-sm font-medium tabular-nums text-foreground">
                        {formatNGN(d.amountNGN)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(d.createdAt)}</p>
                    </div>
                    <Badge
                      variant={
                        d.status === 'CONFIRMED'
                          ? 'success'
                          : d.status === 'FAILED'
                          ? 'destructive'
                          : 'warning'
                      }
                    >
                      {d.status === 'CONFIRMED' ? 'Confirmed' : d.status === 'FAILED' ? 'Failed' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <Card className="p-4">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="size-3.5 text-primary" />
          </div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
        <p className={`font-mono text-xl lg:text-2xl font-bold tabular-nums ${accent ? 'text-primary' : 'text-foreground'}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}
