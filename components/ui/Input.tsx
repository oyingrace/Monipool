import { cn } from '@/lib/utils'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  prefix?: string
}

export function Input({ label, error, prefix, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3.5 text-muted-foreground font-medium text-sm select-none font-mono">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full rounded-xl border border-input bg-card h-11 px-4 text-sm text-foreground placeholder:text-muted-foreground shadow-xs transition-colors focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-ring/30 disabled:bg-muted disabled:text-muted-foreground',
            prefix && 'pl-8',
            error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
