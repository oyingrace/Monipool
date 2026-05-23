# MoniPool — API Reference

---

## BITNOB API

**Base URL (Sandbox):** `https://sandboxapi.bitnob.co/api/v1`
**Docs:** https://developers.bitnob.com
**Auth:** `Authorization: Bearer YOUR_API_KEY`

### Create a Customer
```http
POST /customers
Content-Type: application/json

{
  "email": "user@example.com",
  "firstName": "Chidi",
  "lastName": "Okeke",
  "phone": "+2348012345678",
  "countryCode": "NG"
}
```
Response: `{ "id": "customer_id", "email": "...", ... }`

### Generate Virtual NGN Account (for deposits)
```http
POST /wallets/generateaddress
Content-Type: application/json

{
  "customerEmail": "user@example.com",
  "label": "MoniPool Deposit",
  "crypto": "bitcoin"
}
```
Response includes: `{ "address": "bc1q...", "lightning_invoice": "lnbc..." }`

For NGN bank deposit specifically, use:
```http
POST /wallets/ngn/virtual-account
{
  "customerEmail": "user@example.com",
  "amount": 50000,
  "reference": "your-unique-ref-123"
}
```
Response: `{ "bankName": "Wema Bank", "accountNumber": "7012345678", "amount": 50000 }`

### Get Exchange Rate (NGN → BTC)
```http
GET /rates?from=NGN&to=BTC
```
Response: `{ "rate": 0.0000000089, "timestamp": "..." }`

### Webhook Events
Bitnob sends POST requests to your webhook URL when payments are confirmed.

Verify signature:
```typescript
import crypto from 'crypto'

function verifyBitnobWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}
```

Event types:
- `wallet.funded` — NGN deposit confirmed
- `transaction.successful` — outbound payout succeeded
- `transaction.failed` — outbound payout failed

Webhook payload:
```json
{
  "event": "wallet.funded",
  "data": {
    "reference": "your-unique-ref-123",
    "amount": 50000,
    "currency": "NGN",
    "customerEmail": "user@example.com",
    "status": "successful"
  }
}
```

### Initiate NGN Withdrawal (Bank Payout)
```http
POST /payouts/initiate
{
  "customerEmail": "user@example.com",
  "amount": 25000,
  "bankCode": "058",
  "accountNumber": "0123456789",
  "narration": "MoniPool withdrawal",
  "reference": "unique-payout-ref-456"
}
```

Common Nigerian bank codes:
- GTBank: `058`
- Zenith: `057`
- Access: `044`
- UBA: `033`
- First Bank: `011`
- Opay: `100004`

---

## BREEZ SDK

**Docs:** https://sdk.breez.technology/guide
**npm:** `@breeztech/react-native-breez-sdk-liquid` or JS wrapper

### Initialization
```typescript
import { connect, EnvironmentType } from '@breeztech/breez-sdk'

async function initBreez(apiKey: string) {
  const config = {
    workingDir: './breez-data',
    network: EnvironmentType.TESTNET, // use MAINNET in production
    apiKey,
  }
  
  const seed = await generateMnemonic() // or load from secure storage
  await connect({ config, seed })
}
```

### Get Wallet Balance
```typescript
import { nodeInfo } from '@breeztech/breez-sdk'

async function getBalance() {
  const info = await nodeInfo()
  return {
    sats: info.channelsBalanceMsat / 1000,
    pendingSats: info.pendingChannelsBalanceMsat / 1000,
  }
}
```

### Receive Payment (Generate Lightning Invoice)
```typescript
import { receivePayment } from '@breeztech/breez-sdk'

async function createInvoice(amountSats: number, description: string) {
  const response = await receivePayment({
    amountMsat: amountSats * 1000,
    description,
  })
  return response.lnInvoice.bolt11 // share this string with payer
}
```

### Send Payment
```typescript
import { sendPayment } from '@breeztech/breez-sdk'

async function payInvoice(bolt11: string) {
  const response = await sendPayment({ bolt11 })
  return response.payment
}
```

### Stable Balance (USD)
Breez SDK includes a Liquid-based stable balance feature:
```typescript
import { buyBitcoin } from '@breeztech/breez-sdk'
// For stable balance, use Breez's Liquid swap feature
// Refer to: https://sdk.breez.technology/guide/send_payment.html#pay-to-liquid-address
```

### Nostr Wallet Connect (NWC)
```typescript
// NWC allows Nostr clients to control the wallet
// Generate NWC URI:
import { lspInfo } from '@breeztech/breez-sdk'

// In Breez SDK, NWC is enabled via the Breez dashboard
// Set your NWC relay and connection string in the SDK config
```

### Error Handling for Breez
```typescript
import { SdkError } from '@breeztech/breez-sdk'

try {
  await someBreezCall()
} catch (e) {
  if (e instanceof SdkError) {
    // e.code: 'NOT_READY' | 'GENERIC' | 'PAYMENT_FAILED' etc.
    console.error('[Breez Error]', e.code, e.message)
  }
}
```

---

## NOSTR

**Library:** `nostr-tools` (`npm install nostr-tools`)
**Docs:** https://nostr.com/the-protocol
**Relay (primary):** `wss://relay.damus.io`
**Relay (fallback):** `wss://nos.lol`

### Generate Keypair
```typescript
import { generateSecretKey, getPublicKey } from 'nostr-tools'

function generateNostrKeypair() {
  const privkey = generateSecretKey()             // Uint8Array
  const pubkey = getPublicKey(privkey)            // hex string
  return { privkey, pubkey }
}
```

### Encrypt Private Key for Storage
```typescript
async function encryptPrivkey(privkey: Uint8Array, pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(pin), 'PBKDF2', false, ['deriveKey']
  )
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: encoder.encode('monipool'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, privkey)
  return JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  })
}
```

### Sign and Publish an Event
```typescript
import { finalizeEvent, verifyEvent } from 'nostr-tools'
import { Relay } from 'nostr-tools/relay'

async function publishEvent(privkey: Uint8Array, content: string, tags: string[][] = []) {
  const event = finalizeEvent({
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content,
  }, privkey)

  const relay = await Relay.connect('wss://relay.damus.io')
  await relay.publish(event)
  relay.close()
  return event.id
}
```

### Create a Pool Community (Kind 34550)
```typescript
async function createPoolCommunity(privkey: Uint8Array, pool: Pool) {
  const event = finalizeEvent({
    kind: 34550,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['d', pool.id],
      ['name', pool.name],
      ['description', `MoniPool ${pool.tier} pool — ${pool.apyMin}–${pool.apyMax}% APY`],
      ['relay', 'wss://relay.damus.io'],
    ],
    content: '',
  }, privkey)
  
  // publish to relay...
  return event.id // this becomes the pool's nostrGroupId
}
```

### Post Pool Activity (Kind 1 tagged to community)
```typescript
async function postPoolActivity(
  servicePrivkey: Uint8Array,
  nostrGroupId: string,
  message: string
) {
  return publishEvent(servicePrivkey, message, [
    ['a', `34550:${getPublicKey(servicePrivkey)}:${nostrGroupId}`],
    ['t', 'monipool'],
  ])
}
```

### Subscribe to Pool Feed
```typescript
import { SimplePool } from 'nostr-tools'

async function subscribeToPoolFeed(nostrGroupId: string, onEvent: (event: any) => void) {
  const pool = new SimplePool()
  const relays = ['wss://relay.damus.io', 'wss://nos.lol']
  
  const sub = pool.subscribeMany(relays, [
    {
      kinds: [1],
      '#a': [`34550:SERVICE_PUBKEY:${nostrGroupId}`],
      limit: 50,
    }
  ], {
    onevent: onEvent,
  })
  
  return () => sub.close() // return cleanup function
}
```

### Verify a Nostr Signature (for auth)
```typescript
import { verifyEvent } from 'nostr-tools'

function verifyNostrAuth(event: NostrEvent): boolean {
  return verifyEvent(event)
}
```