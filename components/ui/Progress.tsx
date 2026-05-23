import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  className?: string
  barClassName?: string
}

export function Progress({ value, className, barClassName }: ProgressProps) {
  const clamped = Math.min(Math.max(value, 0), 100)
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div
        className={cn('h-full rounded-full bg-primary transition-all duration-500', barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
