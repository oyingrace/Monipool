'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Check, AlertCircle, Loader2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { useDeposit } from '@/hooks/useDeposit'
import { useToastStore } from '@/store/toastStore'
import { useUserStore } from '@/store/userStore'
import { formatNGN, satsToNGN, cn } from '@/lib/utils'
import type { Deposit } from '@/types'

type Step = 'amount' | 'waiting' | 'success'

export default function DepositPage() {
  const { showToast } = useToastStore()
  const { user, setUser } = useUserStore()
  const [step, setStep] = useState<Step>('amount')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deposit, setDeposit] = useState<Deposit | null>(null)
  const [countdown, setCountdown] = useState(900)

  const { deposit: polledDeposit, isConfirmed } = useDeposit(
    step === 'waiting' ? deposit?.id ?? null : null
  )

  useEffect(() => {
    if (polledDeposit) setDeposit(polledDeposit)
  }, [polledDeposit])

  useEffect(() => {
    if (isConfirmed) {
      setStep('success')
      fetch('/api/auth/me')
        .then((r) => r.json())
        .then((d: { data?: { id: string; nostrPubKey: string; displayName: string | null; balanceSats: number; createdAt: string } }) => {
          if (d.data) setUser({ ...d.data, balanceNGN: satsToNGN(d.data.balanceSats) })
        })
        .catch(console.error)
    }
  }, [isConfirmed, setUser])

  useEffect(() => {
    if (step !== 'waiting') return
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [step])

  const handleGenerate = async (): Promise<void> => {
    const amountNum = parseInt(amount, 10)
    if (isNaN(amountNum) || amountNum < 1000) {
      setError('Minimum deposit is ₦1,000')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountNGN: amountNum }),
      })
      const data = (await res.json()) as { data?: Deposit; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to create deposit')
      setDeposit(data.data!)
      setStep('waiting')
      setCountdown(900)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Something went wrong.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const formatCountdown = (s: number): string => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const virtualAccount = deposit?.virtualAccount

  return (
    <AppShell narrow>
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="size-3.5" />
          Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Add Money</h1>
        <p className="text-sm text-muted-foreground mt-1">Deposit naira via bank transfer</p>
      </div>

      {step === 'amount' && (
        <div className="space-y-5">
          {user && (
            <Card className="p-4">
              <CardContent className="p-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Current balance</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-foreground">{formatNGN(satsToNGN(user.balanceSats))}</p>
              </CardContent>
            </Card>
          )}

          <Input
            label="Amount (₦)"
            prefix="₦"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10,000"
            min={1000}
            error={error}
          />

          <div className="grid grid-cols-3 gap-2">
            {[10000, 50000, 100000].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset.toString())}
                className={cn(
                  'py-2.5 text-sm font-medium rounded-full border transition-all font-mono tabular-nums',
                  amount === preset.toString()
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card hover:border-primary/40 hover:text-primary'
                )}
              >
                {formatNGN(preset)}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Minimum: ₦1,000. Funds will appear in your MoniPool balance once your bank transfer is confirmed.
          </p>

          <Button size="lg" onClick={handleGenerate} loading={loading} disabled={!amount}>
            Get Bank Account
          </Button>
        </div>
      )}

      {step === 'waiting' && virtualAccount && (
        <div className="space-y-5">
          <Card className="p-6 text-center border-primary/20 bg-primary/5">
            <CardContent className="p-0">
              <p className="text-sm text-muted-foreground mb-1">Transfer exactly</p>
              <p className="font-mono text-3xl font-bold tabular-nums text-primary">
                {formatNGN(deposit?.amountNGN ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">to this account</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <BankDetail label="Bank Name" value={virtualAccount.bankName} />
            <BankDetail label="Account Number" value={virtualAccount.accountNumber} copyable />
            <BankDetail label="Amount" value={formatNGN(deposit?.amountNGN ?? 0)} />
          </Card>

          <div className="text-center">
            <div className={cn(
              'font-mono text-2xl font-bold tabular-nums',
              countdown < 120 ? 'text-destructive' : 'text-foreground'
            )}>
              {formatCountdown(countdown)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Time remaining</p>
          </div>

          <div className="flex items-start gap-2.5 text-sm text-muted-foreground bg-warning/10 rounded-2xl p-4 border border-warning/20">
            <AlertCircle className="size-4 text-warning shrink-0 mt-0.5" />
            <span>Transfer from your bank app. We will update your balance once confirmed.</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            Waiting for your transfer…
          </div>

          <button
            onClick={() => { setStep('amount'); setAmount('') }}
            className="text-sm text-muted-foreground hover:text-foreground w-full text-center transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-8 space-y-4">
          <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Check className="size-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Transfer confirmed!</h2>
          <p className="text-muted-foreground">
            {formatNGN(deposit?.amountNGN ?? 0)} has been added to your balance.
          </p>
          {user && (
            <p className="font-mono text-2xl font-bold tabular-nums text-primary">
              {formatNGN(satsToNGN(user.balanceSats))}
            </p>
          )}
          <Link href="/dashboard">
            <Button size="lg">View Dashboard</Button>
          </Link>
        </div>
      )}
    </AppShell>
  )
}

function BankDetail({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (): void => {
    navigator.clipboard.writeText(value).catch(console.error)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold font-mono tabular-nums text-foreground">{value}</span>
        {copyable && (
          <button onClick={handleCopy} className="text-primary hover:text-primary/80 transition-colors">
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
        )}
      </div>
    </div>
  )
}
