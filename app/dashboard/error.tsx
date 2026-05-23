'use client'

import { Button } from '@/components/ui/Button'

export default function DashboardError({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="text-center">
        <p className="text-muted-foreground mb-4">Something went wrong loading your dashboard.</p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  )
}
