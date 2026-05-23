import Link from 'next/link'
import { Wallet } from 'lucide-react'
import { formatNGN, satsToNGN } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { User } from '@/types'

interface WalletBalanceProps {
  user: User
}

export function WalletBalance({ user }: WalletBalanceProps) {
  const balanceNGN = satsToNGN(user.balanceSats)

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary to-[#0A7A5C] p-6 text-white shadow-[0_4px_24px_-4px_rgba(13,155,117,0.4)]">
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.06] blur-[60px] rounded-full pointer-events-none" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Wallet className="size-4" />
            <span>Available Balance</span>
          </div>
          <h2 className="font-mono text-4xl font-bold tracking-tight tabular-nums">
            {formatNGN(balanceNGN)}
          </h2>
          <p className="text-sm text-white/50 font-mono tabular-nums">
            {user.balanceSats.toLocaleString()} sats
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/deposit" className="flex-1 lg:flex-none">
            <Button
              variant="outline"
              size="lg"
              className="w-full lg:w-auto border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              + Add Money
            </Button>
          </Link>
          <Link href="/dashboard#withdraw" className="flex-1 lg:flex-none">
            <Button
              variant="outline"
              size="lg"
              className="w-full lg:w-auto border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              Withdraw
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
