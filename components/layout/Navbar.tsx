'use client'
import Link from 'next/link'
import { useUserStore } from '@/store/userStore'
import { formatNGN, satsToNGN, truncatePubkey } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export function Navbar() {
  const { user, isAuthenticated, logout } = useUserStore()

  return (
    <nav className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black text-primary">Moni</span>
          <span className="text-xl font-black text-accent">Pool</span>
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <Link href="/deposit" className="hidden sm:flex items-center text-sm text-gray-600 hover:text-primary">
                <span className="font-semibold text-gray-900">{formatNGN(satsToNGN(user.balanceSats))}</span>
              </Link>
              <Link href="/dashboard">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {truncatePubkey(user.nostrPubKey).slice(0, 2).toUpperCase()}
                </div>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                Sign out
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
