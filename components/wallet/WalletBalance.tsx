import Link from 'next/link'
import { formatNGN, satsToNGN } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { User } from '@/types'

interface WalletBalanceProps {
  user: User
}

export function WalletBalance({ user }: WalletBalanceProps) {
  const balanceNGN = satsToNGN(user.balanceSats)

  return (
    <div className="bg-primary rounded-2xl p-6 text-white">
      <p className="text-sm text-white/70 mb-1">Available Balance</p>
      <p className="text-4xl font-black mb-0.5">{formatNGN(balanceNGN)}</p>
      <p className="text-sm text-white/50 mb-6">{user.balanceSats.toLocaleString()} sats</p>

      <div className="flex gap-3">
        <Link href="/deposit" className="flex-1">
          <Button
            variant="secondary"
            size="md"
            className="w-full !text-primary !border-white/40 !bg-white/10 hover:!bg-white/20 !text-white"
          >
            + Add Money
          </Button>
        </Link>
        <Link href="/dashboard#withdraw" className="flex-1">
          <Button
            variant="secondary"
            size="md"
            className="w-full !border-white/40 !bg-white/10 hover:!bg-white/20 !text-white"
          >
            Withdraw
          </Button>
        </Link>
      </div>
    </div>
  )
}
