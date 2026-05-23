'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useDeposit } from '@/hooks/useDeposit'
import { useToastStore } from '@/store/toastStore'
import { useUserStore } from '@/store/userStore'
import { formatNGN, satsToNGN } from '@/lib/utils'
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
      // Refresh user balance
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
    <>
      <Navbar />
      <PageWrapper className="max-w-sm">
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">
            ← Back
          </Link>
          <h1 className="text-2xl font-black text-gray-900 mt-3">Add Money</h1>
        </div>

        {step === 'amount' && (
          <div className="space-y-5">
            {user && (
              <div className="bg-gray-50 rounded-xl p-4 text-sm">
                <p className="text-gray-500">Current balance</p>
                <p className="text-xl font-bold text-gray-900">{formatNGN(satsToNGN(user.balanceSats))}</p>
              </div>
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
                  className="py-2 text-sm font-medium rounded-xl border border-gray-200 hover:border-primary hover:text-primary transition-colors"
                >
                  {formatNGN(preset)}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-400">
              Minimum: ₦1,000. Funds will appear in your MoniPool balance once your bank transfer is confirmed.
            </p>

            <Button size="lg" onClick={handleGenerate} loading={loading} disabled={!amount}>
              Get Bank Account
            </Button>
          </div>
        )}

        {step === 'waiting' && virtualAccount && (
          <div className="space-y-5">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 text-center">
              <p className="text-sm text-gray-500 mb-1">Transfer exactly</p>
              <p className="text-3xl font-black text-primary">
                {formatNGN(deposit?.amountNGN ?? 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">to this account</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              <BankDetail label="Bank Name" value={virtualAccount.bankName} />
              <BankDetail label="Account Number" value={virtualAccount.accountNumber} copyable />
              <BankDetail label="Amount" value={formatNGN(deposit?.amountNGN ?? 0)} />
            </div>

            <div className="text-center">
              <div className={`text-2xl font-mono font-bold ${countdown < 120 ? 'text-red-500' : 'text-gray-700'}`}>
                {formatCountdown(countdown)}
              </div>
              <p className="text-xs text-gray-400 mt-1">Time remaining</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 bg-amber-50 rounded-xl p-3">
              <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Transfer from your bank app. We will update your balance once confirmed.</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Waiting for your transfer…
            </div>

            <button
              onClick={() => { setStep('amount'); setAmount('') }}
              className="text-sm text-gray-400 hover:text-gray-600 w-full text-center"
            >
              Cancel
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Transfer confirmed!</h2>
            <p className="text-gray-500">
              {formatNGN(deposit?.amountNGN ?? 0)} has been added to your balance.
            </p>
            {user && (
              <p className="text-2xl font-black text-primary">
                {formatNGN(satsToNGN(user.balanceSats))}
              </p>
            )}
            <Link href="/dashboard">
              <Button size="lg">View Dashboard</Button>
            </Link>
          </div>
        )}
      </PageWrapper>
    </>
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
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">{value}</span>
        {copyable && (
          <button onClick={handleCopy} className="text-xs text-primary hover:underline">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  )
}
