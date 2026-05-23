import { AppSidebar } from '@/components/layout/AppSidebar'
import { PageTransition } from '@/components/layout/PageTransition'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
  className?: string
  narrow?: boolean
}

export function AppShell({ children, className, narrow }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <div
          className="h-[2px] w-full shrink-0"
          style={{
            background:
              'linear-gradient(90deg, oklch(0.55 0.12 155), oklch(0.72 0.14 85), oklch(0.55 0.12 155))',
          }}
        />
        <main
          className={cn(
            'mx-auto w-full flex-1 px-4 sm:px-6 pt-14 sm:pt-6 pb-6 sm:pb-8 lg:pl-6 lg:pt-8',
            narrow ? 'max-w-lg' : 'max-w-6xl',
            className
          )}
        >
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  )
}
