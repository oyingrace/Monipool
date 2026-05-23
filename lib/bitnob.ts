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
  const body = await res.json() as unknown
  if (!res.ok) {
    const msg = (body as { message?: string })?.message ?? `Bitnob error ${res.status}`
    throw new Error(msg)
  }
  return body
}

// ── NGN Deposits ──────────────────────────────────────────────────────────────

export async function createVirtualAccount(
  amountNGN: number,
  reference: string
): Promise<unknown> {
  return bitnobFetch('/wallets/ngn/virtual-account', {
    method: 'POST',
    body: JSON.stringify({ amount: amountNGN, reference }),
  })
}

// ── Lightning: Bitnob → Breez (fund pool wallet on deposit) ──────────────────

/**
 * Pays a Lightning invoice from Bitnob's side.
 * Used after an NGN deposit is confirmed: Bitnob pays the Breez-generated
 * BOLT11 invoice, routing BTC into the MoniPool pool wallet.
 */
export async function payLightningInvoiceFromBitnob(
  bolt11: string,
  customerEmail: string
): Promise<unknown> {
  return bitnobFetch('/transactions/pay-lightning-invoice', {
    method: 'POST',
    body: JSON.stringify({ invoice: bolt11, customerEmail }),
  })
}

// ── Lightning: Breez → Bitnob (fund Bitnob on withdrawal) ────────────────────

/**
 * Creates a Lightning invoice on Bitnob's side for a given NGN amount.
 * The Breez pool wallet pays this invoice; Bitnob receives the BTC,
 * converts it to NGN, and sends the payout to the user's bank account.
 */
export async function createBitnobLightningInvoice(
  amountNGN: number,
  customerEmail: string,
  reference: string
): Promise<{ invoice: string; amountSats: number }> {
  const data = await bitnobFetch('/wallets/lightning/create-invoice', {
    method: 'POST',
    body: JSON.stringify({
      customerEmail,
      amountNGN,
      reference,
      description: `MoniPool withdrawal ${reference}`,
    }),
  }) as { data: { invoice: string; amountSats: number } }

  return data.data
}

// ── NGN Payouts ───────────────────────────────────────────────────────────────

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

// ── Webhook Security ──────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true when a real Bitnob API key has been configured. */
export function isBitnobConfigured(): boolean {
  return Boolean(KEY) && !KEY.startsWith('your_')
}
