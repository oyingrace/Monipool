'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToastStore } from '@/store/toastStore'
import { formatNGN } from '@/lib/utils'

const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '023', name: 'Citibank' },
  { code: '063', name: 'Diamond Bank' },
  { code: '050', name: 'EcoBank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank' },
  { code: '214', name: 'First City Monument Bank (FCMB)' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '526', name: 'Moniepoint MFB' },
  { code: '076', name: 'Polaris Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '221', name: 'Stanbic IBTC' },
  { code: '068', name: 'Standard Chartered' },
  { code: '232', name: 'Sterling Bank' },
  { code: '100', name: 'SunTrust Bank' },
  { code: '032', name: 'Union Bank' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '000014', name: 'Kuda MFB' },
  { code: '000013', name: 'GTB (Guaranty Trust Bank)' },
  { code: '000026', name: 'OPay' },
  { code: '000025', name: 'PalmPay' },
]

type Step = 'form' | 'success'

interface WithdrawFlowProps {
  balanceSats: number
}

export function WithdrawFlow({ balanceSats }: WithdrawFlowProps) {
  const { showToast } = useToastStore()
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const SATS_TO_NGN = 330
  const maxNGN = Math.floor(balanceSats * SATS_TO_NGN)

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    const amountNum = parseInt(amount, 10)
    if (!amount || isNaN(amountNum)) errs.amount = 'Enter an amount'
    else if (amountNum < 1000) errs.amount = 'Minimum withdrawal is ₦1,000'
    else if (amountNum > maxNGN) errs.amount = `Max is ${formatNGN(maxNGN)}`
    if (!bankAccount || bankAccount.length !== 10) errs.bankAccount = 'Enter a valid 10-digit account number'
    if (!bankCode) errs.bankCode = 'Select a bank'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (): Promise<void> => {
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountNGN: parseInt(amount, 10),
          bankAccount,
          bankCode,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Withdrawal failed')
      setStep('success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Something went wrong.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Withdrawal submitted</h3>
        <p className="text-gray-500 mb-6">
          {formatNGN(parseInt(amount, 10))} will arrive in your bank account within 24 hours.
        </p>
        <Button onClick={() => setStep('form')} variant="secondary">
          Withdraw again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-xl p-4 text-sm">
        <p className="text-gray-500">Available balance</p>
        <p className="text-2xl font-black text-gray-900">{formatNGN(maxNGN)}</p>
      </div>

      <Input
        label="Amount (₦)"
        prefix="₦"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="10,000"
        min={1000}
        max={maxNGN}
        error={errors.amount}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Bank</label>
        <select
          value={bankCode}
          onChange={(e) => setBankCode(e.target.value)}
          className={`w-full rounded-xl border px-4 py-3 text-base text-gray-900 bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.bankCode ? 'border-red-400' : 'border-gray-300'}`}
        >
          <option value="">Select your bank</option>
          {NIGERIAN_BANKS.map((b) => (
            <option key={b.code} value={b.code}>{b.name}</option>
          ))}
        </select>
        {errors.bankCode && <p className="text-sm text-red-600">{errors.bankCode}</p>}
      </div>

      <Input
        label="Account Number"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={10}
        value={bankAccount}
        onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ''))}
        placeholder="0123456789"
        error={errors.bankAccount}
      />

      <Button onClick={handleSubmit} loading={loading} size="lg">
        Withdraw to Bank
      </Button>
    </div>
  )
}
