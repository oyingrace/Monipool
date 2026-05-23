'use client'
import { useEffect, useRef, useState } from 'react'
import type { Deposit } from '@/types'

export function useDeposit(depositId: string | null): {
  deposit: Deposit | null
  isConfirmed: boolean
} {
  const [deposit, setDeposit] = useState<Deposit | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!depositId) return

    const poll = async (): Promise<void> => {
      try {
        const res = await fetch('/api/deposits/pending')
        if (!res.ok) return
        const { data } = (await res.json()) as { data: Deposit[] }
        const found = data.find((d) => d.id === depositId)
        if (found) {
          setDeposit(found)
          if (found.status === 'CONFIRMED' && intervalRef.current) {
            clearInterval(intervalRef.current)
          }
        }
      } catch {
        // silently ignore poll errors
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 5000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [depositId])

  return { deposit, isConfirmed: deposit?.status === 'CONFIRMED' }
}
