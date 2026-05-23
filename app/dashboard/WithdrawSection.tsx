'use client'
import { WithdrawFlow } from '@/components/wallet/WithdrawFlow'

interface WithdrawSectionProps {
  balanceSats: number
}

export function WithdrawSection({ balanceSats }: WithdrawSectionProps) {
  return <WithdrawFlow balanceSats={balanceSats} />
}
