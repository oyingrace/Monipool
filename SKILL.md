---
name: monipool-builder
description: >
  Full build instructions for MoniPool — a community Bitcoin yield pool platform
  for Nigerian users. Use this skill for every code generation, component creation,
  API integration, and architecture decision in this project. Always read this file
  before writing any code, creating any file, or making any architectural decision.
  This skill covers: Next.js 16 App Router, Bitnob API (NGN fiat onramp),
  Breez SDK (Lightning wallets), Nostr (identity + community), pool logic, and
  yield simulation. Trigger this whenever working on any part of MoniPool.
---

# MoniPool — Cursor AI Skill

You are building **MoniPool**: a community Bitcoin yield pool web app for Nigerian users.
Read this entire file before writing a single line of code.

---

## 1. Project Identity

- **Name**: MoniPool
- **Tagline**: Bitcoin yield. Naira simplicity. Community power.
- **Users**: Non-technical Nigerians who already save in ajo/esusu groups
- **Tone**: Warm, grassroots, trustworthy — not crypto-bro, not corporate fintech
- **Language**: Plain English. Avoid "sats", "nodes", "channels" in UI copy. Say "your balance", "your earnings", "your group"

---

## 2. Core Principles — Never Break These

1. **Never show crypto jargon to the user.** The UI must read like a savings app, not a crypto app.
2. **Never ask for a seed phrase or recovery phrase.** Breez SDK handles this via passkey.
3. **Always handle errors gracefully.** Every API call must have a fallback UI state.
4. **All money amounts displayed in ₦ naira first**, with BTC equivalent in small grey text underneath.
5. **Yield figures must always include a disclaimer**: "Estimated. Not guaranteed."
6. **Never store private keys on the backend.** Wallets are non-custodial via Breez SDK.
7. **Pool state must be real-time.** Use polling for pool membership and yield updates.

---

## 3. Tech Stack — Use Exactly This

| Layer | Technology | Notes |
|---|---|---|
| Framework | **Next.js 6** (App Router) | Single project — no separate backend |
| Language | TypeScript (strict mode) | Everywhere, no exceptions |
| Styling | Tailwind CSS v3 | No component libraries unless specified |
| State management | Zustand | Client-side only, lightweight |
| Database ORM | Prisma + PostgreSQL | |
| API layer | Next.js Route Handlers | `/app/api/...` replaces Express |
| Fiat onramp | Bitnob API | Sandbox keys for MVP |
| Lightning wallets | Breez SDK | Managed server-side |
| Identity + community | Nostr (nostr-tools) | |
| Yield engine | Simulated (MVP) | Real Amboss Magma post-hackathon |
| Auth | Nostr keypair + JWT (via cookies) | No email/password |
| Cron jobs | Vercel Cron / node-cron | Daily yield accrual |

Do not introduce other libraries without a clear reason. Keep dependencies minimal.

**Critical Next.js 16 rules:**
- Use the **App Router** (`/app` directory) — NOT the Pages Router
- Server Components by default — only add `'use client'` when genuinely needed (event handlers, browser APIs, Zustand)
- Route Handlers live at `app/api/[route]/route.ts` and export named functions: `GET`, `POST`, `PUT`, `DELETE`
- Use `next/navigation` for routing (`useRouter`, `redirect`, `notFound`) — NOT `next/router`
- Use `cookies()` from `next/headers` for server-side cookie access
- Fetch is native — no need for axios on the server side

---

## 4. File Structure — Follow Exactly

```
monipool/
├── app/
│   ├── layout.tsx              ← Root layout (fonts, providers)
│   ├── page.tsx                ← Home / pool browser (Server Component)
│   ├── login/
│   │   └── page.tsx            ← Nostr login page
│   ├── dashboard/
│   │   └── page.tsx            ← User dashboard
│   ├── deposit/
│   │   └── page.tsx            ← NGN deposit flow
│   ├── create-pool/
│   │   └── page.tsx            ← Pool creation form
│   ├── pool/
│   │   └── [id]/
│   │       └── page.tsx        ← Pool detail page
│   └── api/
│       ├── auth/
│       │   ├── challenge/route.ts
│       │   ├── verify/route.ts
│       │   └── me/route.ts
│       ├── pools/
│       │   ├── route.ts           ← GET (list), POST (create)
│       │   └── [id]/
│       │       ├── route.ts       ← GET (detail)
│       │       └── join/route.ts  ← POST (join)
│       ├── deposits/
│       │   ├── route.ts           ← POST (initiate)
│       │   └── pending/route.ts   ← GET (poll)
│       ├── withdrawals/
│       │   └── route.ts           ← POST (initiate)
│       └── webhooks/
│           └── bitnob/route.ts    ← POST (Bitnob webhook)
├── components/
│   ├── ui/                     ← Button, Input, Card, Badge, Modal, Toast
│   ├── pool/                   ← PoolCard, PoolList, PoolDetail, JoinPoolModal
│   ├── wallet/                 ← WalletBalance, DepositFlow, WithdrawFlow
│   ├── feed/                   ← NostrFeed, FeedItem
│   └── layout/                 ← Navbar, PageWrapper
├── lib/
│   ├── bitnob.ts               ← Bitnob API client (server-side)
│   ├── breez.ts                ← Breez SDK wrapper (server-side)
│   ├── nostr.ts                ← Nostr client (browser + server)
│   ├── prisma.ts               ← Prisma client singleton
│   ├── auth.ts                 ← JWT helpers
│   └── yield.ts                ← Yield calculation logic
├── hooks/
│   ├── usePool.ts              ← Client-side pool data fetching
│   ├── useWallet.ts            ← Client-side wallet state
│   ├── useNostr.ts             ← Nostr relay subscription
│   └── useDeposit.ts           ← Deposit polling logic
├── store/
│   ├── userStore.ts            ← Auth + wallet Zustand store
│   └── poolStore.ts            ← Pool list Zustand store
├── types/
│   └── index.ts                ← All shared TypeScript interfaces
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── docs/
│   ├── API_REFERENCE.md
│   ├── DATA_MODELS.md
│   └── ARCHITECTURE.md
├── .env.local                  ← Local env vars (never commit)
├── .env.example
├── .cursorrules
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── PLAN.md
├── SKILL.md
└── README.md
```

---

## 5. Data Models — Use These Exactly

Reference `docs/DATA_MODELS.md` for full Prisma schema.

Key entities:
- **User** — nostrPubKey, displayName, walletId (Breez), balanceSats, createdAt
- **Pool** — id, name, tier, minDeposit, lockDays, targetSize, currentSize, status, creatorId, nostrGroupId
- **PoolMember** — userId, poolId, depositNGN, depositSats, sharePercent, earnedYieldNGN, joinedAt
- **Deposit** — userId, amountNGN, amountSats, bitnobReference, status, createdAt
- **YieldRecord** — poolId, periodDate, totalYieldNGN, distributedAt

---

## 6. API Integrations

### 6.1 Bitnob (NGN → BTC)
- Read `docs/API_REFERENCE.md#bitnob` before writing any Bitnob code
- All Bitnob calls happen in Route Handlers only — never in Client Components
- Use sandbox URL: `https://sandboxapi.bitnob.co/api/v1`
- Always verify webhook signatures in `app/api/webhooks/bitnob/route.ts`
- Display Bitnob transaction reference to user for support purposes

### 6.2 Breez SDK
- Read `docs/API_REFERENCE.md#breez` before writing any Breez code
- Breez SDK runs server-side only (in Route Handlers and lib/breez.ts)
- Initialize once as a singleton in `lib/breez.ts`
- Use testnet for MVP
- Wrap all calls in try/catch with user-friendly error messages

### 6.3 Nostr
- Read `docs/API_REFERENCE.md#nostr` before writing any Nostr code
- Use `nostr-tools` library
- Keypair generation and encryption happen client-side (browser)
- Relay subscriptions (NostrFeed) are Client Components with `'use client'`
- Server-side Nostr posting (pool activity) happens in Route Handlers via `lib/nostr.ts`
- Use relay: `wss://relay.damus.io` as primary, `wss://nos.lol` as fallback

---

## 7. Pool Logic (Business Rules)

```
Pool statuses: OPEN → ACTIVE → COMPLETED | CANCELLED

OPEN:      Accepting deposits. Not yet at target size.
ACTIVE:    Target reached. Yield simulation running. No new members.
COMPLETED: Lock period ended. Yield distributed. Members can withdraw.
CANCELLED: Pool didn't fill within 7 days. Deposits refunded.

Yield simulation (MVP):
- STARTER pool: 0.000137 per day (≈5% APY)
- GROWTH pool:  0.000233 per day (≈8.5% APY)
- POWER pool:   0.000356 per day (≈13% APY)
- Yield accrues daily at midnight UTC via cron job
- Each member's earned yield = (memberDeposit / totalPoolSize) × dailyPoolYield

Pool tiers:
- STARTER: min ₦10,000 / target ₦500,000 / 30 days
- GROWTH:  min ₦50,000 / target ₦2,000,000 / 60 days
- POWER:   min ₦200,000 / target ₦5,000,000 / 90 days
```

---

## 8. UI/UX Rules

- **Colour palette**: Deep green (`#0D7A5F`) primary, amber (`#F59E0B`) accent, `#F9FAFB` background
- **Font**: Inter — add via `next/font/google` in `app/layout.tsx`
- **Mobile-first**: All layouts must work on 375px width
- **Loading states**: Use Next.js `loading.tsx` files + Suspense boundaries + skeleton components
- **Empty states**: Every list needs an empty state with a CTA
- **Naira formatting**: Always `₦` symbol with comma separators: `₦10,000`
- **Dates**: Nigerian format — `23 May 2026`
- **Pool cards** must show: name, tier badge, progress bar, APY range, lock period, member count
- **Server Components render the shell** — Client Components handle interactivity only

---

## 9. Auth Flow

```
User visits site
  → Click "Sign In with Nostr"
  → Check localStorage for existing encrypted keypair
  → If none: generate new keypair, show 4-digit PIN modal, encrypt + save to localStorage
  → If existing: show PIN entry modal, decrypt keypair
  → POST /api/auth/challenge → get challenge string
  → Sign challenge with Nostr privkey → get signed event
  → POST /api/auth/verify { pubkey, signedEvent }
  → Backend verifies signature, upserts User, returns JWT
  → JWT stored in httpOnly cookie (set by server)
  → Subsequent requests authenticated via cookie
  → On page refresh: cookie persists, no re-login needed
```

Use `httpOnly` cookies for JWT — NOT localStorage. Set via `cookies().set()` in the Route Handler response.

---

## 10. Deposit Flow

```
User clicks "Add Money"
  → Enter NGN amount (min ₦1,000)
  → POST /api/deposits → Bitnob generates virtual NGN bank account
  → Display: bank name, account number, amount, 15-min countdown
  → User transfers from their bank app (outside MoniPool)
  → Bitnob sends webhook → POST /api/webhooks/bitnob
  → Backend verifies, credits user balance, updates Deposit status
  → Frontend polls GET /api/deposits/pending every 5s
  → Poll returns CONFIRMED → show success screen
```

---

## 11. Next.js 16 Specific Patterns

### Route Handler pattern:
```typescript
// app/api/pools/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const pools = await prisma.pool.findMany({ where: { status: 'OPEN' } })
    return NextResponse.json({ data: pools })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch pools' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request) // reads httpOnly cookie
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  // ... create pool
}
```

### Server Component data fetching:
```typescript
// app/page.tsx — Server Component, no 'use client'
import { prisma } from '@/lib/prisma'
import { PoolList } from '@/components/pool/PoolList'

export default async function HomePage() {
  const pools = await prisma.pool.findMany({ where: { status: 'OPEN' } })
  return <PoolList initialPools={pools} />
}
```

### Client Component pattern:
```typescript
// components/pool/JoinPoolModal.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function JoinPoolModal({ poolId }: { poolId: string }) {
  const router = useRouter()
  // ... interactive logic
}
```

### Prisma singleton (prevents connection exhaustion in dev):
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## 12. Error Handling Standards

Route Handlers:
```typescript
try {
  // operation
  return NextResponse.json({ data: result })
} catch (error) {
  console.error('[MoniPool Error]', error)
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
}
```

Client Components:
```typescript
try {
  const res = await fetch('/api/pools', { method: 'POST', body: JSON.stringify(data) })
  if (!res.ok) throw new Error(await res.text())
  // handle success
} catch {
  showToast('Something went wrong. Please try again.', 'error')
}
```

Never expose raw API or database error messages to the user.

---

## 13. What NOT to Build (MVP Scope)

- ❌ Real Amboss Magma integration (simulate yield instead)
- ❌ In-app chat (Nostr feed is read-only)
- ❌ Reputation/vouching system
- ❌ Mobile app (web only)
- ❌ Multiple currencies (NGN only)
- ❌ Admin dashboard
- ❌ Email/SMS notifications
- ❌ Pages Router (App Router only)

These are post-hackathon features. Do not build them now.

---

## 14. Reference Files

Before working on specific areas, read the relevant doc:

| Working on | Read this first |
|---|---|
| Database models / types | `docs/DATA_MODELS.md` |
| Any API integration | `docs/API_REFERENCE.md` |
| System design questions | `docs/ARCHITECTURE.md` |
| Build order / what to do next | `PLAN.md` |