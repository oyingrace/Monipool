# MoniPool — Build Plan
## For Cursor AI + Development Team

---

# PART 1: HIGH-LEVEL PLAN

## Phase 0 — Foundation (Day 1 Morning)
Scaffold a single Next.js 16 project with App Router, Tailwind, Prisma, and all environment config. One repo, one `npm run dev`, everything in one place.

## Phase 1 — Auth + Identity (Day 1 Morning)
The entire app gates behind login. Build Nostr keypair generation (client), the auth Route Handlers (server), httpOnly cookie session, and middleware-based route protection.

## Phase 2 — Wallet + Deposit (Day 1 Afternoon)
The core value proposition requires money to move. Build the Bitnob NGN deposit Route Handler, virtual account UI, webhook receiver, and wallet balance display.

## Phase 3 — Pool System (Day 1 Afternoon / Evening)
The product's heart. Build pool creation, browsing (Server Component), joining, and the yield simulation cron job.

## Phase 4 — Nostr Community Layer (Day 2 Morning)
The differentiator. Attach a Nostr group to each pool, post activity events from Route Handlers, and display the live feed in a Client Component.

## Phase 5 — Dashboard + Withdrawal (Day 2 Morning)
Close the loop. Users see their earnings and withdraw back to naira. Build the dashboard (Server Component) and withdrawal Route Handler.

## Phase 6 — Polish + Demo Prep (Day 2 Afternoon)
Fix mobile layouts, add loading.tsx files, seed demo data, and rehearse the demo flow.

---

# PART 2: STEP-BY-STEP PLAN

---

## PHASE 0 — FOUNDATION

### Step 0.1 — Scaffold Next.js 15 project

```bash
npx create-next-app@latest monipool \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=no \
  --import-alias="@/*"

cd monipool
```

### Step 0.2 — Install dependencies

```bash
# Database
npm install prisma @prisma/client

# Auth + crypto
npm install jose

# Nostr
npm install nostr-tools

# Validation
npm install zod

# Zustand (client state)
npm install zustand

# Cron (yield accrual)
npm install node-cron
npm install -D @types/node-cron

# Utility
npm install clsx tailwind-merge
```

### Step 0.3 — Configure Tailwind with MoniPool theme
Edit `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0D7A5F',
        'primary-dark': '#0A6350',
        accent: '#F59E0B',
        'accent-dark': '#D97706',
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
      },
    },
  },
}
export default config
```

### Step 0.4 — Add Inter font in root layout
Edit `app/layout.tsx`:
```typescript
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-gray-50`}>
        {children}
      </body>
    </html>
  )
}
```

### Step 0.5 — Set up Prisma
```bash
npx prisma init --datasource-provider postgresql
```
Copy schema from `docs/DATA_MODELS.md` into `prisma/schema.prisma`.
```bash
npx prisma migrate dev --name init
npx prisma generate
```

Create `lib/prisma.ts` (Prisma singleton — prevents hot-reload connection leaks):
```typescript
import { PrismaClient } from '@prisma/client'
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Step 0.6 — Set up environment variables
```bash
cp .env.example .env.local
```
Fill in: `DATABASE_URL`, `BITNOB_API_KEY`, `BITNOB_WEBHOOK_SECRET`, `BREEZ_API_KEY`, `NOSTR_SERVICE_PRIVKEY`, `JWT_SECRET`.

### Step 0.7 — Set up Next.js middleware for route protection
Create `middleware.ts` at the root:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/dashboard', '/deposit', '/create-pool', '/pool']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('monipool_token')
  const isProtected = PROTECTED.some(path => request.nextUrl.pathname.startsWith(path))
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### Step 0.8 — Create shared utility helpers
Create `lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNGN(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}
```

**✅ Phase 0 done when:** `npm run dev` runs with no errors, Tailwind green shows on screen, Prisma connects to DB.

---

## PHASE 1 — AUTH + IDENTITY

### Step 1.1 — JWT helpers (`lib/auth.ts`)

```typescript
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function signJWT(payload: { userId: string; pubkey: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyJWT(token: string) {
  const { payload } = await jwtVerify(token, SECRET)
  return payload as { userId: string; pubkey: string }
}

export async function getAuthUser() {
  const token = (await cookies()).get('monipool_token')?.value
  if (!token) return null
  try { return await verifyJWT(token) }
  catch { return null }
}
```

### Step 1.2 — Auth Route Handlers

**`app/api/auth/challenge/route.ts`**
```typescript
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// In-memory challenge store (fine for MVP)
const challenges = new Map<string, { challenge: string; expires: number }>()

export async function POST() {
  const challenge = crypto.randomBytes(32).toString('hex')
  const id = crypto.randomUUID()
  challenges.set(id, { challenge, expires: Date.now() + 5 * 60 * 1000 })
  return NextResponse.json({ id, challenge })
}

export { challenges } // exported so verify route can read it
```

**`app/api/auth/verify/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyEvent } from 'nostr-tools'
import { prisma } from '@/lib/prisma'
import { signJWT } from '@/lib/auth'
import { challenges } from '../challenge/route'

export async function POST(request: NextRequest) {
  const { pubkey, signedEvent, challengeId } = await request.json()

  const stored = challenges.get(challengeId)
  if (!stored || Date.now() > stored.expires) {
    return NextResponse.json({ error: 'Challenge expired' }, { status: 401 })
  }

  if (!verifyEvent(signedEvent)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  challenges.delete(challengeId)

  const user = await prisma.user.upsert({
    where: { nostrPubKey: pubkey },
    update: {},
    create: { nostrPubKey: pubkey },
  })

  const jwt = await signJWT({ userId: user.id, pubkey })

  const response = NextResponse.json({ user })
  response.cookies.set('monipool_token', jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  return response
}
```

**`app/api/auth/me/route.ts`**
```typescript
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { id: auth.userId } })
  return NextResponse.json({ data: user })
}

export async function DELETE() {
  // Logout — clear cookie
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('monipool_token')
  return response
}
```

### Step 1.3 — Nostr client lib (`lib/nostr.ts`)

```typescript
// Client-side only functions (called from 'use client' components)
import { generateSecretKey, getPublicKey, finalizeEvent, verifyEvent } from 'nostr-tools'

export function generateKeypair() {
  const privkey = generateSecretKey()
  const pubkey = getPublicKey(privkey)
  return { privkey, pubkey }
}

export async function encryptPrivkey(privkey: Uint8Array, pin: string): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('monipool-v1'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, privkey)
  return JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) })
}

export async function decryptPrivkey(stored: string, pin: string): Promise<Uint8Array> {
  const { iv, data } = JSON.parse(stored)
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('monipool-v1'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
  )
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, new Uint8Array(data))
  return new Uint8Array(decrypted)
}

export function signChallenge(challenge: string, privkey: Uint8Array) {
  return finalizeEvent({
    kind: 27235,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['challenge', challenge]],
    content: challenge,
  }, privkey)
}
```

### Step 1.4 — Login page (`app/login/page.tsx`)
This is a Client Component. UI flow:
1. "Welcome to MoniPool" hero + tagline
2. "Sign In" button
3. Check localStorage for existing keypair
4. If none: PIN creation modal (4-digit) → generate keypair → encrypt → save
5. If existing: PIN entry modal → decrypt keypair
6. Call `/api/auth/challenge` → sign → call `/api/auth/verify`
7. On success: `router.push('/dashboard')`

### Step 1.5 — Auth Zustand store (`store/userStore.ts`)
```typescript
'use client' // if imported in Client Components
import { create } from 'zustand'
import type { User } from '@/types'

interface UserStore {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User) => void
  logout: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  logout: () => {
    fetch('/api/auth/me', { method: 'DELETE' }) // clears cookie
    set({ user: null, isAuthenticated: false })
  },
}))
```

**✅ Phase 1 done when:** A user can generate a keypair, set a PIN, sign in, and the httpOnly cookie persists across page refreshes.

---

## PHASE 2 — WALLET + DEPOSIT

### Step 2.1 — Bitnob service (`lib/bitnob.ts`)

```typescript
const BASE = process.env.BITNOB_BASE_URL!
const KEY = process.env.BITNOB_API_KEY!

async function bitnobFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!res.ok) throw new Error(`Bitnob error: ${res.status}`)
  return res.json()
}

export async function createVirtualAccount(amountNGN: number, reference: string) {
  return bitnobFetch('/wallets/ngn/virtual-account', {
    method: 'POST',
    body: JSON.stringify({ amount: amountNGN, reference }),
  })
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const crypto = require('crypto')
  const expected = crypto.createHmac('sha256', process.env.BITNOB_WEBHOOK_SECRET!).update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

export async function initiateNGNPayout(accountNumber: string, bankCode: string, amountNGN: number, reference: string) {
  return bitnobFetch('/payouts/initiate', {
    method: 'POST',
    body: JSON.stringify({ accountNumber, bankCode, amount: amountNGN, reference }),
  })
}
```

### Step 2.2 — Deposit Route Handlers

**`app/api/deposits/route.ts`** — POST: initiate deposit
**`app/api/deposits/pending/route.ts`** — GET: poll pending deposits
**`app/api/webhooks/bitnob/route.ts`** — POST: receive Bitnob webhook

Webhook handler must:
1. Read raw body as text (for signature verification)
2. Call `verifyWebhookSignature(rawBody, req.headers.get('x-bitnob-signature'))`
3. Parse JSON, match reference to Deposit record
4. Update Deposit status → CONFIRMED
5. Credit `user.balanceSats` (convert NGN using current rate)
6. Return `200 OK` immediately (Bitnob retries on non-200)

### Step 2.3 — Deposit page (`app/deposit/page.tsx`)
Client Component. Multi-step UI:
1. Amount input (₦ formatted, min ₦1,000)
2. Show BTC equivalent in real time (fetch rate from `/api/rates`)
3. "Generate Account" → POST `/api/deposits` → show bank details
4. Display: bank name, account number, amount, 15-min countdown
5. Poll `GET /api/deposits/pending` every 5s via `useDeposit` hook
6. On CONFIRMED: success screen with updated balance

### Step 2.4 — Wallet balance component (`components/wallet/WalletBalance.tsx`)
Server Component — receives balance as props from parent page.
Shows: large ₦ amount, small sats amount in grey, "Add Money" + "Withdraw" buttons.

**✅ Phase 2 done when:** Deposit flow generates a virtual account, webhook updates balance, UI reflects confirmed deposit.

---

## PHASE 3 — POOL SYSTEM

### Step 3.1 — Pool Route Handlers

**`app/api/pools/route.ts`**
```typescript
// GET: list OPEN pools (public, no auth)
// POST: create pool (auth required)
```

**`app/api/pools/[id]/route.ts`**
```typescript
// GET: single pool detail with member count + user's membership
```

**`app/api/pools/[id]/join/route.ts`**
```typescript
// POST: join pool
// Validate: auth, pool OPEN, amount >= minDeposit, user has balance, not already member
// Transaction: deduct balance + create PoolMember + update pool currentSize
// If pool full: set ACTIVE, set activatedAt
// Post Nostr event
```

### Step 3.2 — Yield cron job (`lib/yield.ts` + `app/api/cron/yield/route.ts`)

`lib/yield.ts` — pure calculation functions:
```typescript
export const DAILY_RATES = { STARTER: 0.000137, GROWTH: 0.000233, POWER: 0.000356 }

export async function accrueAllPools() {
  const activePools = await prisma.pool.findMany({
    where: { status: 'ACTIVE' },
    include: { members: true }
  })
  for (const pool of activePools) {
    const dailyYield = pool.currentSize * DAILY_RATES[pool.tier]
    await prisma.yieldRecord.create({ data: { poolId: pool.id, periodDate: new Date(), totalYieldNGN: Math.floor(dailyYield) } })
    for (const member of pool.members) {
      const memberYield = Math.floor(dailyYield * member.sharePercent / 100)
      await prisma.poolMember.update({ where: { id: member.id }, data: { earnedYieldNGN: { increment: memberYield } } })
    }
    // Check if lock period ended
    const daysSinceActivation = (Date.now() - new Date(pool.activatedAt!).getTime()) / 86400000
    if (daysSinceActivation >= pool.lockDays) await completePool(pool.id)
  }
}
```

`app/api/cron/yield/route.ts` — secured cron endpoint:
```typescript
export async function GET(request: NextRequest) {
  // Verify Vercel cron secret or internal token
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  await accrueAllPools()
  return NextResponse.json({ ok: true })
}
```

### Step 3.3 — Home page — pool browser (`app/page.tsx`)
Server Component — fetches pools directly from Prisma.
Layout: hero section + filter tabs (client) + pool grid (server-rendered cards).

### Step 3.4 — PoolCard (`components/pool/PoolCard.tsx`)
Server Component. Shows: name, tier badge, progress bar, APY, lock period, member count, "View Pool" link.

### Step 3.5 — Pool detail page (`app/pool/[id]/page.tsx`)
Server Component — fetches pool by ID.
Sections: pool header, stats row, JoinPoolModal (Client), members list, NostrFeed (Client).

### Step 3.6 — JoinPoolModal (`components/pool/JoinPoolModal.tsx`)
Client Component. Amount input → confirm button → POST `/api/pools/:id/join` → success toast → router.refresh().

### Step 3.7 — Create pool page (`app/create-pool/page.tsx`)
Client Component. Form: name, tier radio, description → POST `/api/pools` → redirect to new pool page.

**✅ Phase 3 done when:** Pools can be created, joined, and yield accrues (trigger manually via `/api/cron/yield`).

---

## PHASE 4 — NOSTR COMMUNITY LAYER

### Step 4.1 — Server-side Nostr posting (`lib/nostr-server.ts`)

```typescript
import { finalizeEvent, getPublicKey } from 'nostr-tools'
import { Relay } from 'nostr-tools/relay'

const SERVICE_PRIVKEY = Buffer.from(process.env.NOSTR_SERVICE_PRIVKEY!, 'hex')

export async function postPoolActivity(nostrGroupId: string, message: string) {
  const event = finalizeEvent({
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['a', `34550:${getPublicKey(SERVICE_PRIVKEY)}:${nostrGroupId}`], ['t', 'monipool']],
    content: message,
  }, SERVICE_PRIVKEY)
  const relay = await Relay.connect('wss://relay.damus.io')
  await relay.publish(event)
  relay.close()
}

export async function createPoolCommunity(poolId: string, poolName: string) {
  const event = finalizeEvent({
    kind: 34550,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['d', poolId], ['name', poolName], ['relay', 'wss://relay.damus.io']],
    content: '',
  }, SERVICE_PRIVKEY)
  const relay = await Relay.connect('wss://relay.damus.io')
  await relay.publish(event)
  relay.close()
  return event.id
}
```

### Step 4.2 — NostrFeed component (`components/feed/NostrFeed.tsx`)
Client Component (`'use client'`). Connects to relay via WebSocket, subscribes to pool's nostrGroupId, renders scrollable activity list. Handles disconnection with auto-reconnect.

### Step 4.3 — Wire up Nostr to pool actions
In `app/api/pools/[id]/join/route.ts`, after creating PoolMember:
```typescript
await postPoolActivity(pool.nostrGroupId, `🎉 Someone joined ${pool.name}`)
```

In `app/api/pools/route.ts` POST, after creating pool:
```typescript
const nostrGroupId = await createPoolCommunity(pool.id, pool.name)
await prisma.pool.update({ where: { id: pool.id }, data: { nostrGroupId } })
```

**✅ Phase 4 done when:** Joining a pool posts a Nostr event visible in the pool's live feed.

---

## PHASE 5 — DASHBOARD + WITHDRAWAL

### Step 5.1 — Dashboard page (`app/dashboard/page.tsx`)
Server Component — reads auth from cookie, fetches user + pools + transactions.

```typescript
import { getAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const auth = await getAuthUser()
  if (!auth) redirect('/login')

  const [user, myPools, deposits] = await Promise.all([
    prisma.user.findUnique({ where: { id: auth.userId } }),
    prisma.poolMember.findMany({
      where: { userId: auth.userId },
      include: { pool: true },
      orderBy: { joinedAt: 'desc' }
    }),
    prisma.deposit.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  ])

  return <DashboardContent user={user} myPools={myPools} deposits={deposits} />
}
```

Sections to render: wallet card, my pools list, transaction history.

### Step 5.2 — Withdrawal Route Handler (`app/api/withdrawals/route.ts`)
POST: validate balance → call `initiateNGNPayout()` from `lib/bitnob.ts` → deduct balance → create Withdrawal record → return confirmation.

### Step 5.3 — Withdraw flow UI (`components/wallet/WithdrawFlow.tsx`)
Client Component. Fields: amount (₦), account number, bank selection (dropdown of Nigerian banks). Submit → POST `/api/withdrawals` → confirmation screen.

**✅ Phase 5 done when:** Dashboard shows user's balance, pool memberships, earnings, and withdrawal initiates successfully.

---

## PHASE 6 — POLISH + DEMO PREP

### Step 6.1 — Add Next.js loading states
Create `loading.tsx` in each route folder:
```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return <DashboardSkeleton />
}
```

### Step 6.2 — Add error boundaries
Create `error.tsx` in each route folder:
```typescript
'use client'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="text-center p-8">
      <p className="text-red-600">Something went wrong.</p>
      <button onClick={reset} className="mt-4 btn-primary">Try again</button>
    </div>
  )
}
```

### Step 6.3 — Seed demo data
```bash
npx prisma db seed
```
Seed script at `prisma/seed.ts` (see `docs/DATA_MODELS.md`).
Creates: 3 OPEN pools (one per tier), 1 ACTIVE pool with yield, 1 COMPLETED pool, 1 demo user.

### Step 6.4 — Toast notification system
Create `components/ui/Toast.tsx` + `store/toastStore.ts`.
Add `<ToastContainer />` to `app/layout.tsx`.
Expose `showToast(message, type)` globally.

### Step 6.5 — Mobile layout audit
Test every page at 375px in Chrome DevTools. Fix: nav overflow, card truncation, button tap targets (min 44px), modal scroll.

### Step 6.6 — Final checklist before demo
- [ ] All 6 MVP features working end-to-end
- [ ] Demo data seeded and visible on home page
- [ ] No console errors or TypeScript errors (`npm run build` passes)
- [ ] Mobile layout verified at 375px
- [ ] Yield disclaimer on all APY displays
- [ ] Bitnob webhook tested with sandbox (use ngrok for local)
- [ ] Nostr events appearing in pool feed
- [ ] `npm run build` completes without errors

**✅ Phase 6 done when:** Full demo can be walked through without any broken states or errors.

---

# DEMO FLOW (For Hackathon Presentation)

Follow this exact sequence:

1. Open home page → show pool browser, 3 pool tiers visible
2. Click "Sign In" → Nostr keypair login, set 4-digit PIN (no password, no email!)
3. Show wallet: ₦0 balance
4. Click "Add Money" → ₦50,000 → generate virtual bank account
5. "Transfer received" (pre-triggered via seeded deposit) → balance updates to ₦50,000
6. Browse pools → click Lagos Growth Fund
7. Click "Join Pool" → enter ₦50,000 → pool progress bar fills
8. Pool feed shows: "Someone joined Lagos Growth Fund"
9. Switch to pre-seeded ACTIVE pool → show live yield counter ticking up
10. Switch to COMPLETED pool → show earnings distributed to members
11. Go to Dashboard → see all pools, total earnings in ₦
12. Click "Withdraw" → enter bank details → confirmation screen

**Total demo time: ~4 minutes.**