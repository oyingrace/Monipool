'use client'

import { useToastStore } from '@/store/toastStore'
import { cn } from '@/lib/utils'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[90vw] max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium border animate-in slide-in-from-bottom-2',
            {
              'bg-card text-foreground border-primary/30': toast.type === 'success',
              'bg-card text-foreground border-destructive/30': toast.type === 'error',
              'bg-card text-foreground border-border': toast.type === 'info',
            }
          )}
        >
          {toast.type === 'success' && <CheckCircle2 className="size-4 text-primary shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="size-4 text-destructive shrink-0" />}
          {toast.type === 'info' && <Info className="size-4 text-muted-foreground shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => dismiss(toast.id)}
            className="text-muted-foreground hover:text-foreground text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
