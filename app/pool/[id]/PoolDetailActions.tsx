'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { JoinPoolModal } from '@/components/pool/JoinPoolModal'
import { formatNGN } from '@/lib/utils'
import type { Pool } from '@/types'

interface PoolDetailActionsProps {
  pool: Pool
  isAuthenticated: boolean
}

export function PoolDetailActions({ pool, isAuthenticated }: PoolDetailActionsProps) {
  const [modalOpen, setModalOpen] = useState(false)

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4 text-center">
        <p className="text-gray-500 text-sm mb-4">
          Sign in to join this pool. Minimum deposit: {formatNGN(pool.minDeposit)}
        </p>
        <Link href="/login">
          <Button>Sign In to Join</Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4">
        <Button size="lg" onClick={() => setModalOpen(true)}>
          Join Pool — from {formatNGN(pool.minDeposit)}
        </Button>
      </div>
      <JoinPoolModal pool={pool} isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
