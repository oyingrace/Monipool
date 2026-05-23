'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { useToastStore } from '@/store/toastStore'
import { formatNGN, cn } from '@/lib/utils'
import { POOL_TIER_CONFIG } from '@/types'
import type { PoolTier } from '@/types'

const TIERS: PoolTier[] = ['STARTER', 'GROWTH', 'POWER']

export default function CreatePoolPage() {
  const router = useRouter()
  const { showToast } = useToastStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tier, setTier] = useState<PoolTier>('STARTER')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const selected = POOL_TIER_CONFIG[tier]

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!name.trim() || name.trim().length < 3) errs.name = 'Pool name must be at least 3 characters'
    if (name.trim().length > 60) errs.name = 'Pool name must be under 60 characters'
    if (description.length > 300) errs.description = 'Description must be under 300 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleCreate = async (): Promise<void> => {
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, tier }),
      })
      const data = (await res.json()) as { data?: { id: string }; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to create pool')
      showToast('Pool created!', 'success')
      router.push(`/pool/${data.data!.id}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Something went wrong.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell narrow>
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="size-3.5" />
          Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create a Pool</h1>
        <p className="text-sm text-muted-foreground mt-1">Start a savings pool for your group</p>
      </div>

      <div className="space-y-5">
        <Input
          label="Pool Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Lagos Market Women Fund"
          maxLength={60}
          error={errors.name}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell people about this pool…"
            maxLength={300}
            rows={3}
            className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-ring/30 resize-none shadow-xs"
          />
          {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-3">Pool Type</label>
          <div className="space-y-3">
            {TIERS.map((t) => {
              const cfg = POOL_TIER_CONFIG[t]
              const isSelected = tier === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={cn(
                    'w-full text-left rounded-2xl border-2 p-4 transition-all',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card hover:border-primary/30'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn('text-[11px] font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full', cfg.badgeColor)}>
                      {cfg.label}
                    </span>
                    <span className="font-mono text-sm font-semibold tabular-nums text-primary">
                      {cfg.apyMin}–{cfg.apyMax}% APY
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2 font-mono tabular-nums">
                    <span>Min: {formatNGN(cfg.minDeposit)}</span>
                    <span>Target: {formatNGN(cfg.targetSize)}</span>
                    <span>{cfg.lockDays} days</span>
                  </div>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Estimated. Not guaranteed.</p>
        </div>

        <Card className="p-4 bg-muted/50">
          <CardContent className="p-0 text-sm text-muted-foreground space-y-1">
            <p>Your pool will open immediately for members to join.</p>
            <p>It activates once it reaches <strong className="text-foreground font-mono tabular-nums">{formatNGN(selected.targetSize)}</strong>.</p>
          </CardContent>
        </Card>

        <Button size="lg" onClick={handleCreate} loading={loading} disabled={!name.trim()}>
          Create Pool
        </Button>
      </div>
    </AppShell>
  )
}
