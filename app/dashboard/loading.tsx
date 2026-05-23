import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'

export default function DashboardLoading() {
  return (
    <AppShell>
      <div className="h-8 w-48 bg-muted rounded-xl animate-pulse mb-7" />

      {/* Balance hero skeleton */}
      <div className="h-44 bg-muted rounded-2xl animate-pulse mb-7" />

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 h-24 animate-pulse bg-muted/50" />
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 gap-3 mb-7">
        <div className="h-10 bg-muted rounded-full animate-pulse" />
        <div className="h-10 bg-muted rounded-full animate-pulse" />
      </div>

      {/* Pools skeleton */}
      <div className="grid gap-3 lg:grid-cols-2 mb-7">
        {[1, 2].map((i) => (
          <div key={i} className="h-36 bg-muted rounded-2xl animate-pulse" />
        ))}
      </div>

      {/* Bottom grid skeleton */}
      <div className="grid gap-7 lg:grid-cols-2">
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      </div>
    </AppShell>
  )
}
