import crypto from 'crypto'

const BASE = process.env.BITNOB_BASE_URL!
const KEY = process.env.BITNOB_API_KEY!

async function bitnobFetch(path: string, options?: RequestInit): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`Bitnob error: ${res.status}`)
  return res.json()
}

export async function createVirtualAccount(
  amountNGN: number,
  reference: string
): Promise<unknown> {
  return bitnobFetch('/wallets/ngn/virtual-account', {
    method: 'POST',
    body: JSON.stringify({ amount: amountNGN, reference }),
  })
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.BITNOB_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function initiateNGNPayout(
  accountNumber: string,
  bankCode: string,
  amountNGN: number,
  reference: string
): Promise<unknown> {
  return bitnobFetch('/payouts/initiate', {
    method: 'POST',
    body: JSON.stringify({ accountNumber, bankCode, amount: amountNGN, reference }),
  })
}
