/**
 * Breez SDK Liquid — pool wallet singleton.
 *
 * MoniPool uses a SINGLE custodial pool wallet (not per-user).
 * All deposits accumulate here; per-user balances are tracked as
 * shares in PostgreSQL. This mirrors a real ajo/esusu group pot.
 *
 * Post-hackathon: migrate to per-user non-custodial wallets using
 * Breez's connectWithSigner() + user-held keys.
 */

import {
  connect,
  defaultConfig,
  type BindingLiquidSdk,
  type LiquidNetwork,
  type LightningPaymentLimitsResponse,
} from '@breeztech/breez-sdk-liquid'
import path from 'path'

let sdk: BindingLiquidSdk | null = null
let initPromise: Promise<BindingLiquidSdk> | null = null

async function initSdk(): Promise<BindingLiquidSdk> {
  if (sdk) return sdk

  const mnemonic = process.env.BREEZ_MNEMONIC
  const apiKey = process.env.BREEZ_API_KEY ?? undefined

  if (!mnemonic) {
    throw new Error('BREEZ_MNEMONIC must be set in environment')
  }

  const network: LiquidNetwork =
    process.env.BREEZ_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'

  const config = defaultConfig(network, apiKey)

  // Store wallet data outside the Next.js build output
  config.workingDir = path.join(process.cwd(), '.breez-data')

  sdk = await connect({ mnemonic, config })
  return sdk
}

/**
 * Get the SDK instance, initialising on first call.
 * All callers should use this — never call initSdk() directly.
 */
export async function getBreezSdk(): Promise<BindingLiquidSdk> {
  if (sdk) return sdk
  if (!initPromise) initPromise = initSdk()
  return initPromise
}

export interface WalletInfo {
  balanceSat: number
  pendingSendSat: number
  pendingReceiveSat: number
}

/**
 * Returns the current pool wallet balance from the Breez node.
 */
export async function getPoolWalletBalance(): Promise<WalletInfo> {
  const breez = await getBreezSdk()
  const info = await breez.getInfo()
  return {
    balanceSat: info.walletInfo.balanceSat,
    pendingSendSat: info.walletInfo.pendingSendSat,
    pendingReceiveSat: info.walletInfo.pendingReceiveSat,
  }
}

export interface ReceiveDetails {
  destination: string  // BOLT11 invoice
  feeSat: number
}

/**
 * Generates a Lightning invoice for the given amount.
 * The caller (Bitnob webhook handler) uses this to fund the pool wallet.
 */
export async function createDepositInvoice(
  amountSat: number,
  description: string
): Promise<ReceiveDetails> {
  const breez = await getBreezSdk()

  const prepareRes = await breez.prepareReceivePayment({
    paymentMethod: 'bolt11Invoice',
    amount: { type: 'bitcoin', payerAmountSat: amountSat },
  })

  const receiveRes = await breez.receivePayment({
    prepareResponse: prepareRes,
    description,
  })

  return {
    destination: receiveRes.destination,
    feeSat: prepareRes.feesSat,
  }
}

export interface SendResult {
  txId: string | null
  feeSat: number
}

/**
 * Pays a Lightning invoice from the pool wallet.
 * Used for yield distribution and withdrawals routed via Lightning.
 */
export async function payLightningInvoice(bolt11: string): Promise<SendResult> {
  const breez = await getBreezSdk()

  const prepareRes = await breez.prepareSendPayment({ destination: bolt11 })
  const sendRes = await breez.sendPayment({ prepareResponse: prepareRes })

  return {
    txId: sendRes.payment.txId ?? null,
    feeSat: sendRes.payment.feesSat,
  }
}

/**
 * Returns Lightning payment limits (min/max receivable sats).
 * Used to validate deposit amounts before generating invoices.
 */
export async function getLightningLimits(): Promise<LightningPaymentLimitsResponse> {
  const breez = await getBreezSdk()
  return breez.fetchLightningLimits()
}

/**
 * Graceful connectivity check — safe to call at startup.
 * Returns true if the wallet is reachable, false otherwise.
 */
export async function isBreezReady(): Promise<boolean> {
  try {
    await getPoolWalletBalance()
    return true
  } catch {
    return false
  }
}
