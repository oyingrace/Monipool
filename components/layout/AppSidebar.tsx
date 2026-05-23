'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  LayoutDashboard,
  PlusCircle,
  ArrowDownToLine,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Logo } from '@/components/layout/Logo'
import { useUserStore } from '@/store/userStore'
import { formatNGN, satsToNGN, truncatePubkey, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

const NAV_ITEMS = [
  { title: 'Pools', href: '/', icon: LayoutGrid },
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Add Money', href: '/deposit', icon: ArrowDownToLine },
  { title: 'Create Pool', href: '/create-pool', icon: PlusCircle },
]

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 h-12 text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-sidebar-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="size-5 shrink-0" />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarBalance() {
  const { user, isAuthenticated } = useUserStore()
  if (!isAuthenticated || !user) return null

  return (
    <div className="mx-3 mb-4 rounded-2xl border border-border/60 bg-muted/50 p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
        Balance
      </p>
      <p className="font-mono text-xl font-bold tabular-nums text-foreground">
        {formatNGN(satsToNGN(user.balanceSats))}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5 font-mono tabular-nums">
        {user.balanceSats.toLocaleString()} sats
      </p>
    </div>
  )
}

function SidebarFooter() {
  const { user, isAuthenticated, logout } = useUserStore()

  if (!isAuthenticated) {
    return (
      <div className="px-3 pb-4">
        <Link href="/login" className="block">
          <Button className="w-full" size="lg">
            Sign In
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="px-3 pb-4 space-y-2">
      <div className="flex items-center gap-3 rounded-xl px-3 py-2">
        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
          {truncatePubkey(user!.nostrPubKey).slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">
            {user!.displayName ?? truncatePubkey(user!.nostrPubKey)}
          </p>
          <p className="text-xs text-muted-foreground font-mono truncate">
            {truncatePubkey(user!.nostrPubKey)}
          </p>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start gap-2">
        <LogOut className="size-4" />
        Sign out
      </Button>
    </div>
  )
}

export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3.5 left-4 z-40 size-9 flex items-center justify-center rounded-full border border-border bg-card shadow-sm"
        aria-label="Open menu"
      >
        <Menu className="size-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-sidebar-border flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-5 h-14 border-b border-sidebar-border">
              <Link href="/" onClick={() => setMobileOpen(false)}>
                <Logo size="sm" />
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="size-8 flex items-center justify-center rounded-full hover:bg-muted"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 py-4 overflow-y-auto">
              <SidebarBalance />
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>
            <SidebarFooter />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
        <div className="flex items-center px-5 h-14 border-b border-sidebar-border">
          <Link href="/">
            <Logo size="sm" />
          </Link>
        </div>
        <div className="flex-1 py-4 overflow-y-auto">
          <SidebarBalance />
          <SidebarNav />
        </div>
        <SidebarFooter />
      </aside>
    </>
  )
}
