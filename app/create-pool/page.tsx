'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToastStore } from '@/store/toastStore'
import { formatNGN } from '@/lib/utils'
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
    <>
      <Navbar />
      <PageWrapper className="max-w-lg">
        <div className="mb-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Back</Link>
          <h1 className="text-2xl font-black text-gray-900 mt-3">Create a Pool</h1>
          <p className="text-gray-500 mt-1 text-sm">Start a savings pool for your group. Others can join and earn with you.</p>
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

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell people about this pool…"
              maxLength={300}
              rows={3}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
            {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Tier selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Pool Type</label>
            <div className="space-y-3">
              {TIERS.map((t) => {
                const cfg = POOL_TIER_CONFIG[t]
                const isSelected = tier === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(t)}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${cfg.badgeColor}`}>
                        {cfg.label}
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        {cfg.apyMin}–{cfg.apyMax}% APY
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500 mt-1">
                      <span>Min: {formatNGN(cfg.minDeposit)}</span>
                      <span>Target: {formatNGN(cfg.targetSize)}</span>
                      <span>{cfg.lockDays} days</span>
                    </div>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">(Estimated. Not guaranteed.)</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
            <p>Your pool will open immediately for members to join.</p>
            <p>It activates once it reaches <strong>{formatNGN(selected.targetSize)}</strong>.</p>
          </div>

          <Button size="lg" onClick={handleCreate} loading={loading} disabled={!name.trim()}>
            Create Pool
          </Button>
        </div>
      </PageWrapper>
    </>
  )
}
