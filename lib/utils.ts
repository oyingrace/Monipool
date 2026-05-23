import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { SATS_TO_NGN_RATE } from '@/types'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatNGN(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function satsToNGN(sats: number): number {
  return Math.round(sats * SATS_TO_NGN_RATE)
}

export function ngnToSats(ngn: number): number {
  return Math.round(ngn / SATS_TO_NGN_RATE)
}

export function truncatePubkey(pubkey: string): string {
  return `${pubkey.slice(0, 8)}...${pubkey.slice(-4)}`
}
