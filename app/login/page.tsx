'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useUserStore } from '@/store/userStore'
import {
  generateKeypair,
  encryptPrivkey,
  decryptPrivkey,
  signChallenge,
} from '@/lib/nostr'
import { satsToNGN } from '@/lib/utils'
import type { User } from '@/types'

const STORAGE_KEY = 'mp_keypair'

type Step = 'intro' | 'pin-create' | 'pin-enter' | 'loading'

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useUserStore()
  const [step, setStep] = useState<Step>('intro')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const hasKeypair = (): boolean => {
    return !!localStorage.getItem(STORAGE_KEY)
  }

  const handleSignIn = (): void => {
    if (hasKeypair()) {
      setStep('pin-enter')
    } else {
      setStep('pin-create')
    }
  }

  const authenticate = async (privkey: Uint8Array, pubkey: string): Promise<void> => {
    setStep('loading')
    setLoading(true)
    try {
      const challengeRes = await fetch('/api/auth/challenge', { method: 'POST' })
      const { id: challengeId, challenge } = (await challengeRes.json()) as {
        id: string
        challenge: string
      }

      const signedEvent = signChallenge(challenge, privkey)

      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pubkey, signedEvent, challengeId }),
      })
      const verifyData = (await verifyRes.json()) as { data?: { balanceSats: number; id: string; nostrPubKey: string; displayName: string | null; createdAt: string }; error?: string }
      if (!verifyRes.ok) throw new Error(verifyData.error ?? 'Sign in failed')

      if (verifyData.data) {
        const userData: User = {
          ...verifyData.data,
          balanceNGN: satsToNGN(verifyData.data.balanceSats),
        }
        setUser(userData)
      }
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.')
      setStep(hasKeypair() ? 'pin-enter' : 'pin-create')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePin = async (): Promise<void> => {
    if (pin.length !== 4) { setError('PIN must be 4 digits'); return }
    if (pin !== confirmPin) { setError('PINs do not match'); return }
    setError('')

    const { privkey, pubkey } = generateKeypair()
    const encrypted = await encryptPrivkey(privkey, pin)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ encrypted, pubkey }))

    await authenticate(privkey, pubkey)
  }

  const handleEnterPin = async (): Promise<void> => {
    if (pin.length !== 4) { setError('PIN must be 4 digits'); return }
    setError('')

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) { setStep('pin-create'); return }
      const { encrypted, pubkey } = JSON.parse(stored) as { encrypted: string; pubkey: string }
      const privkey = await decryptPrivkey(encrypted, pin)
      await authenticate(privkey, pubkey)
    } catch {
      setError('Wrong PIN. Please try again.')
    }
  }

  const PinInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => {
            const digits = value.split('')
            digits[i] = e.target.value.replace(/\D/g, '')
            onChange(digits.join(''))
            if (e.target.value && i < 3) {
              const next = document.getElementById(`pin-${i + 1}`)
              next?.focus()
            }
          }}
          id={`pin-${i}`}
          className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black">
            <span className="text-primary">Moni</span>
            <span className="text-accent">Pool</span>
          </h1>
          <p className="text-gray-500 mt-2 text-base">
            Bitcoin yield. Naira simplicity. Community power.
          </p>
        </div>

        {step === 'intro' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
              <Feature icon="🏦" text="Save in naira with your group" />
              <Feature icon="📈" text="Earn Bitcoin yield automatically" />
              <Feature icon="💸" text="Withdraw back to your bank anytime" />
              <Feature icon="🔐" text="No password — secured by your 4-digit PIN" />
            </div>
            <Button size="lg" onClick={handleSignIn}>
              Get Started
            </Button>
            <p className="text-xs text-center text-gray-400">
              No email. No password. Your identity is yours.
            </p>
          </div>
        )}

        {step === 'pin-create' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Create your PIN</h2>
              <p className="text-sm text-gray-500 text-center">
                This PIN protects your account. Do not forget it.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 text-center">Enter 4-digit PIN</p>
              <PinInput value={pin} onChange={setPin} />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 text-center">Confirm PIN</p>
              <PinInput value={confirmPin} onChange={setConfirmPin} />
            </div>
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <Button size="lg" onClick={handleCreatePin} loading={loading} disabled={pin.length < 4 || confirmPin.length < 4}>
              Create Account
            </Button>
          </div>
        )}

        {step === 'pin-enter' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Welcome back</h2>
              <p className="text-sm text-gray-500 text-center">Enter your 4-digit PIN to sign in</p>
            </div>
            <PinInput value={pin} onChange={setPin} />
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <Button size="lg" onClick={handleEnterPin} loading={loading} disabled={pin.length < 4}>
              Sign In
            </Button>
            <button
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY)
                setPin('')
                setStep('pin-create')
                setError('')
              }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 text-center"
            >
              Use a different account
            </button>
          </div>
        )}

        {step === 'loading' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Signing you in…</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xl">{icon}</span>
      <span className="text-sm text-gray-700">{text}</span>
    </div>
  )
}
