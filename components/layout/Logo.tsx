import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ size = 'md', className }: LogoProps) {
  return (
    <span
      className={cn(
        'font-bold tracking-tight',
        {
          'text-lg': size === 'sm',
          'text-2xl': size === 'md',
          'text-4xl': size === 'lg',
        },
        className
      )}
    >
      <span className="text-primary">Moni</span>
      <span className="text-[#F59E0B]">Pool</span>
    </span>
  )
}
