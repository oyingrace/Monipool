import { cn } from '@/lib/utils'

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <main className={cn('max-w-5xl mx-auto px-4 py-6', className)}>
      {children}
    </main>
  )
}
