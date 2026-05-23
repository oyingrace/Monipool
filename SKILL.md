---
name: monipool-builder
description: >
  Full build instructions for MoniPool — a community Bitcoin yield pool platform
  for Nigerian users. Use this skill for every code generation, component creation,
  API integration, and architecture decision in this project. Always read this file
  before writing any code, creating any file, or making any architectural decision.
  This skill covers: React frontend, Node.js backend, Bitnob API (NGN fiat onramp),
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
7. **Pool state must be real-time.** Use polling or WebSockets for pool membership and yield updates.

---

## 3. Tech Stack — Use Exactly This

| Layer | Technology | Notes |
|---|---|---|
| Frontend framework | React 18 + TypeScript | Vite for bundling |
| Styling | Tailwind CSS | No component libraries unless specified |
| State management | Zustand | Lightweight, no Redux |
| Backend | Node.js + Express | TypeScript |
| Database | PostgreSQL + Prisma ORM | |
| Fiat onramp | Bitnob API | Sandbox keys for MVP |
| Lightning wallets | Breez SDK (JS) | Non-custodial |
| Identity + community | Nostr (nostr-tools library) | |
| Yield engine | Simulated (MVP) | Real Amboss Magma post-hackathon |
| Auth | Nostr keypair + JWT session | No email/password |

Do not introduce other libraries without a clear reason. Keep dependencies minimal.

---

## 4. File Structure — Follow Exactly

```
monipool/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            ← Primitives: Button, Input, Card, Badge, Modal
│   │   │   ├── pool/          ← PoolCard, PoolList, PoolDetail, JoinPoolModal
│   │   │   ├── wallet/        ← WalletBalance, DepositFlow, WithdrawFlow
│   │   │   ├── feed/          ← NostrFeed, FeedItem, ActivityBadge
│   │   │   └── layout/        ← Navbar, Sidebar, PageWrapper
│   │   ├── pages/
│   │   │   ├── Home.tsx       ← Landing / pool browser
│   │   │   ├── Pool.tsx       ← Single pool detail
│   │   │   ├── Dashboard.tsx  ← User dashboard (wallet + earnings)
│   │   │   ├── Deposit.tsx    ← NGN deposit flow
│   │   │   ├── Login.tsx      ← Nostr login
│   │   │   └── CreatePool.tsx ← Pool creation form
│   │   ├── hooks/
│   │   │   ├── usePool.ts
│   │   │   ├── useWallet.ts
│   │   │   ├── useNostr.ts
│   │   │   └── useDeposit.ts
│   │   ├── lib/
│   │   │   ├── bitnob.ts      ← Bitnob API client
│   │   │   ├── breez.ts       ← Breez SDK wrapper
│   │   │   ├── nostr.ts       ← Nostr client (nostr-tools)
│   │   │   └── api.ts         ← Internal backend API client
│   │   ├── store/
│   │   │   ├── userStore.ts   ← Auth + wallet state
│   │   │   └── poolStore.ts   ← Pool list + active pool state
│   │   └── types/
│   │       └── index.ts       ← All shared TypeScript types
│   └── index.html
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── pools.ts
│   │   │   ├── users.ts
│   │   │   ├── deposits.ts
│   │   │   └── webhooks.ts    ← Bitnob webhook handler
│   │   ├── services/
│   │   │   ├── poolService.ts
│   │   │   ├── yieldService.ts ← Yield simulation logic
│   │   │   ├── bitnobService.ts
│   │   │   └── nostrService.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts        ← JWT verification
│   │   │   └── validate.ts    ← Zod request validation
│   │   └── prisma/
│   │       └── schema.prisma
│   └── server.ts
├── docs/
│   ├── API_REFERENCE.md
│   ├── DATA_MODELS.md
│   └── ARCHITECTURE.md
├── .env.example
├── .cursorrules
├── PLAN.md
├── SKILL.md
└── README.md
```

---

## 5. Data Models — Use These Exactly

Reference `docs/DATA_MODELS.md` for full Prisma schema.

Key entities:
- **User** — nostrPubKey, displayName, walletId (Breez), createdAt
- **Pool** — id, name, tier, minDeposit, lockDays, targetSize, currentSize, status, creatorId, nostrGroupId
- **PoolMember** — userId, poolId, depositAmount, sharePercent, joinedAt
- **Deposit** — userId, amountNGN, amountSats, bitnobReference, status, createdAt
- **YieldRecord** — poolId, periodStart, periodEnd, totalFeesEarned, distributedAt

---

## 6. API Integrations

### 6.1 Bitnob (NGN → BTC)
- Read `docs/API_REFERENCE.md#bitnob` before writing any Bitnob code
- Use sandbox URL: `https://sandboxapi.bitnob.co/api/v1`
- Key endpoints: `POST /wallets` (create wallet), `POST /transactions/initiatepayment` (deposit), webhooks for confirmation
- Always verify webhook signatures
- Display Bitnob transaction reference to user for support purposes

### 6.2 Breez SDK
- Read `docs/API_REFERENCE.md#breez` before writing any Breez code
- Initialize SDK once at app startup
- Use passkey backup — never prompt for seed phrase
- Wrap all Breez calls in try/catch with user-friendly error messages
- For MVP: use testnet

### 6.3 Nostr
- Read `docs/API_REFERENCE.md#nostr` before writing any Nostr code
- Use `nostr-tools` library
- On first login: generate keypair, store privkey encrypted in localStorage
- Pool groups are Nostr Kind 34550 (community) events
- Pool activity posts are Kind 1 (text note) events signed by the pool's service key
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
- STARTER pool: 0.014% per day (≈5% APY)
- GROWTH pool:  0.023% per day (≈8.5% APY)  
- POWER pool:   0.036% per day (≈13% APY)
- Yield accrues daily at midnight UTC
- Each member's earned yield = (memberDeposit / totalPoolSize) × dailyYield

Pool tiers:
- STARTER: min ₦10,000 / target ₦500,000 / 30 days
- GROWTH:  min ₦50,000 / target ₦2,000,000 / 60 days
- POWER:   min ₦200,000 / target ₦5,000,000 / 90 days
```

---

## 8. UI/UX Rules

- **Colour palette**: Deep green (#0D7A5F) primary, amber (#F59E0B) accent, white/grey backgrounds
- **Font**: Inter (Google Fonts)
- **Mobile-first**: All layouts must work on 375px width
- **Loading states**: Every async action needs a spinner or skeleton
- **Empty states**: Every list needs an empty state with a CTA
- **Naira formatting**: Always use `₦` symbol and comma separators: `₦10,000`
- **Dates**: Display in Nigerian format — `23 May 2026`
- **Pool cards** must show: name, tier badge, progress bar (current/target), APY range, lock period, member count

---

## 9. Auth Flow

```
User visits site
  → Click "Sign In with Nostr"
  → Check localStorage for existing keypair
  → If none: generate new keypair, save encrypted privkey to localStorage
  → Sign a challenge from the backend with the privkey
  → Backend verifies signature, issues JWT
  → JWT stored in memory (not localStorage) for session
  → On refresh: re-sign challenge with stored keypair
```

Never store the raw private key unencrypted. Use a simple passphrase-based encryption (AES-GCM with WebCrypto API) derived from a user-chosen PIN.

---

## 10. Deposit Flow

```
User clicks "Add Money"
  → Enter NGN amount
  → Backend calls Bitnob to generate a bank account number (virtual account)
  → Display: bank name, account number, amount to transfer
  → User transfers from their bank app
  → Bitnob webhook fires on confirmation → backend credits user's sats balance
  → UI updates in real time (poll /api/deposits/pending every 5s)
  → Show success screen with sats credited and NGN equivalent
```

---

## 11. Error Handling Standards

Every API call must follow this pattern:

```typescript
try {
  const result = await someApiCall()
  // handle success
} catch (error) {
  if (error instanceof BitnobError) {
    showToast('Payment service unavailable. Please try again.', 'error')
  } else if (error instanceof BreezError) {
    showToast('Wallet error. Your funds are safe.', 'error')
  } else {
    showToast('Something went wrong. Please try again.', 'error')
    console.error('[MoniPool Error]', error)
  }
}
```

Never expose raw API error messages to the user.

---

## 12. What NOT to Build (MVP Scope)

- ❌ Real Amboss Magma integration (simulate yield instead)
- ❌ In-app chat (Nostr feed is read-only for MVP)
- ❌ Reputation/vouching system
- ❌ Mobile app (web only)
- ❌ Multiple currencies (NGN only)
- ❌ Admin dashboard
- ❌ Email notifications

These are post-hackathon features. Do not build them now.

---

## 13. Reference Files

Before working on specific areas, read the relevant doc:

| Working on | Read this first |
|---|---|
| Database models / types | `docs/DATA_MODELS.md` |
| Any API integration | `docs/API_REFERENCE.md` |
| System design questions | `docs/ARCHITECTURE.md` |
| Build order / what to do next | `PLAN.md` |