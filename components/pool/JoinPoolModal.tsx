'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToastStore } from '@/store/toastStore'
import { formatNGN } from '@/lib/utils'
import type { Pool } from '@/types'

interface JoinPoolModalProps {
  pool: Pool
  isOpen: boolean
  onClose: () => void
}

export function JoinPoolModal({ pool, isOpen, onClose }: JoinPoolModalProps) {
  const router = useRouter()
  const { showToast } = useToastStore()
  const [amount, setAmount] = useState(pool.minDeposit.toString())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleJoin = async (): Promise<void> => {
    const amountNGN = parseInt(amount, 10)
    if (isNaN(amountNGN) || amountNGN < pool.minDeposit) {
      setError(`Minimum is ${formatNGN(pool.minDeposit)}`)
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`/api/pools/${pool.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountNGN }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to join')

      showToast(`You joined ${pool.name}!`, 'success')
      onClose()
      router.refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Something went wrong.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Join ${pool.name}`}>
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Minimum deposit</span>
            <span className="font-semibold">{formatNGN(pool.minDeposit)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Lock period</span>
            <span className="font-semibold">{pool.lockDays} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Estimated APY</span>
            <span className="font-semibold text-primary">
              {pool.apyMin}–{pool.apyMax}%
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          (Estimated. Not guaranteed.) Your funds will be locked for {pool.lockDays} days.
        </p>

        <Input
          label="Amount to deposit"
          prefix="₦"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={pool.minDeposit}
          step={1000}
          error={error}
        />

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleJoin} loading={loading} className="flex-1">
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  )
}
