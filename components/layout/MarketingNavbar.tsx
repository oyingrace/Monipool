'use client'

import Link from 'next/link'
import { useUserStore } from '@/store/userStore'
import { formatNGN, satsToNGN, truncatePubkey } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/layout/Logo'

const NAV_LINKS = [
  { label: 'Pools', href: '/#pools' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Add Money', href: '/deposit' },
]

export function MarketingNavbar() {
  const { user, isAuthenticated, logout } = useUserStore()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/">
          <Logo size="sm" />
        </Link>

        <ul className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated && user ? (
            <>
              <Link
                href="/deposit"
                className="hidden sm:block font-mono text-sm font-medium tabular-nums text-foreground hover:text-primary transition-colors"
              >
                {formatNGN(satsToNGN(user.balanceSats))}
              </Link>
              <Link href="/dashboard">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  {truncatePubkey(user.nostrPubKey).slice(0, 2).toUpperCase()}
                </div>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout} className="hidden sm:inline-flex">
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/login">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
