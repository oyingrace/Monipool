import { MarketingNavbar } from '@/components/layout/MarketingNavbar'
import { PageTransition } from '@/components/layout/PageTransition'
import { cn } from '@/lib/utils'

interface LandingShellProps {
  children: React.ReactNode
  className?: string
}

export function LandingShell({ children, className }: LandingShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <div
        className="h-[2px] w-full shrink-0"
        style={{
          background:
            'linear-gradient(90deg, oklch(0.55 0.12 155), oklch(0.72 0.14 85), oklch(0.55 0.12 155))',
        }}
      />
      <MarketingNavbar />
      <main
        className={cn(
          'mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-8 sm:py-10',
          className
        )}
      >
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  )
}
