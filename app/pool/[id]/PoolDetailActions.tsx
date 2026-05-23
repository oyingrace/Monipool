'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
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
      <Card className="p-5 mb-4 text-center">
        <CardContent className="p-0">
          <p className="text-muted-foreground text-sm mb-4">
            Sign in to join this pool. Minimum deposit: {formatNGN(pool.minDeposit)}
          </p>
          <Link href="/login">
            <Button>Sign In to Join</Button>
          </Link>
        </CardContent>
      </Card>
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
