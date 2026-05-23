# MoniPool — Build Plan
## For Cursor AI + Development Team

---

# PART 1: HIGH-LEVEL PLAN

## Phase 0 — Foundation (Day 1 Morning)
Set up the project skeleton, environment, and tooling so every subsequent step has a clean base to build on.

## Phase 1 — Auth + Identity (Day 1 Morning)
The entire app gates behind login. Build Nostr keypair generation, login flow, and JWT session management first — nothing else can be built without a logged-in user context.

## Phase 2 — Wallet + Deposit (Day 1 Afternoon)
The core value proposition requires money to move. Build the Bitnob NGN deposit flow and Breez SDK wallet so users can fund their account before pools exist.

## Phase 3 — Pool System (Day 1 Afternoon / Evening)
The product's heart. Build pool creation, browsing, joining, and the yield simulation engine that makes money appear to grow.

## Phase 4 — Nostr Community Layer (Day 2 Morning)
The differentiator. Attach a Nostr group to each pool, post activity events, and display the live feed inside each pool.

## Phase 5 — Dashboard + Withdrawal (Day 2 Morning)
Close the loop. Users need to see their earnings and withdraw back to naira. Build the dashboard and withdrawal flow.

## Phase 6 — UI Polish + Demo Prep (Day 2 Afternoon)
Sand the edges. Fix mobile layout, add loading/empty states, seed demo data, and prepare for the hackathon presentation.

---

# PART 2: STEP-BY-STEP PLAN

---

## PHASE 0 — FOUNDATION

### Step 0.1 — Scaffold the project

```bash
# Frontend
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install tailwindcss zustand nostr-tools axios

# Backend
mkdir backend && cd backend
npm init -y
npm install express prisma @prisma/client zod jsonwebtoken cors dotenv
npm install -D typescript ts-node @types/express @types/node nodemon
```

### Step 0.2 — Set up Tailwind CSS
Configure `tailwind.config.js` with the MoniPool colour palette:
- Primary: `#0D7A5F` (deep green)
- Accent: `#F59E0B` (amber)
- Add Inter font via Google Fonts in `index.html`

### Step 0.3 — Set up Prisma + Database
- Create PostgreSQL database named `monipool`
- Copy schema from `docs/DATA_MODELS.md` into `backend/prisma/schema.prisma`
- Run `npx prisma migrate dev --name init`
- Run `npx prisma generate`

### Step 0.4 — Set up environment variables
- Copy `.env.example` to `.env`
- Fill in Bitnob sandbox key, Breez testnet key, DB URL, JWT secret

### Step 0.5 — Set up Express server
Create `backend/server.ts` with:
- CORS configured for frontend URL
- JSON body parsing
- Routes mounted: `/api/users`, `/api/pools`, `/api/deposits`, `/api/webhooks`
- Global error handler middleware

### Step 0.6 — Set up React Router
Install `react-router-dom` and configure routes:
- `/` → Home (pool browser)
- `/login` → Login
- `/pool/:id` → Pool detail
- `/dashboard` → User dashboard
- `/deposit` → Deposit flow
- `/create-pool` → Pool creation

**✅ Phase 0 done when:** `npm run dev` starts both frontend and backend with no errors.

---

## PHASE 1 — AUTH + IDENTITY

### Step 1.1 — Nostr keypair generation (`frontend/src/lib/nostr.ts`)

```typescript
// Functions to implement:
generateKeypair()         // → { pubkey, privkey }
encryptPrivkey(privkey, pin)  // AES-GCM via WebCrypto
decryptPrivkey(encrypted, pin) // reverse
saveKeypairToStorage(pubkey, encryptedPrivkey)
loadKeypairFromStorage()  // → { pubkey, encryptedPrivkey } | null
signChallenge(challenge, privkey) // → signature (Nostr event)
```

### Step 1.2 — Backend auth endpoints (`backend/src/routes/users.ts`)

```
POST /api/auth/challenge
  → generate random challenge string
  → store in memory with 5min TTL
  → return { challenge }

POST /api/auth/verify
  body: { pubkey, signature, challenge }
  → verify Nostr event signature
  → upsert User record in DB (create if first login)
  → return { jwt, user }

GET /api/auth/me
  header: Authorization: Bearer <jwt>
  → return current user profile
```

### Step 1.3 — Login page (`frontend/src/pages/Login.tsx`)

UI flow:
1. "Welcome to MoniPool" hero with tagline
2. "Sign In" button
3. If new user: show PIN creation modal (4-digit PIN to encrypt keypair)
4. If returning user: show PIN entry modal
5. On success: redirect to `/dashboard`

### Step 1.4 — Auth store (`frontend/src/store/userStore.ts`)

```typescript
interface UserStore {
  user: User | null
  jwt: string | null
  pubkey: string | null
  isAuthenticated: boolean
  login: (pin: string) => Promise<void>
  logout: () => void
}
```

### Step 1.5 — Route protection
Create `ProtectedRoute` component that redirects unauthenticated users to `/login`.
Wrap all routes except `/login` and `/` with it.

**✅ Phase 1 done when:** A user can log in with a PIN, JWT is issued, and they stay logged in on refresh.

---

## PHASE 2 — WALLET + DEPOSIT

### Step 2.1 — Bitnob service (`backend/src/services/bitnobService.ts`)

```typescript
// Functions to implement:
createVirtualAccount(userId, amountNGN)
  // Calls Bitnob API to generate a one-time bank account
  // Returns: { bankName, accountNumber, amount, reference }

handleWebhook(payload, signature)
  // Verifies webhook signature
  // On successful payment: credits user sats balance
  // Updates Deposit record status to CONFIRMED
  // Calls nostrService.postPoolActivity() if user is in a pool
```

### Step 2.2 — Deposit routes (`backend/src/routes/deposits.ts`)

```
POST /api/deposits/initiate
  body: { amountNGN }
  → calls bitnobService.createVirtualAccount()
  → creates Deposit record (status: PENDING)
  → returns virtual account details

GET /api/deposits/pending
  → returns user's pending deposits
  → frontend polls this every 5s

POST /api/webhooks/bitnob
  → no auth (verified by signature)
  → calls bitnobService.handleWebhook()
```

### Step 2.3 — Deposit UI (`frontend/src/pages/Deposit.tsx`)

Step-by-step UI:
1. Enter amount in naira (min ₦1,000)
2. Show BTC equivalent (fetch rate from backend)
3. "Generate Account" button → calls initiate endpoint
4. Show bank transfer details (bank name, account number, amount)
5. Countdown timer (15 minutes)
6. Poll for confirmation every 5s → show success screen when confirmed

### Step 2.4 — Breez SDK wallet (`frontend/src/lib/breez.ts`)

```typescript
// Wrapper functions:
initBreezSDK(apiKey)
getWalletBalance()       // → { sats, ngnEquivalent }
getTransactionHistory()  // → Transaction[]
```

Note: For hackathon MVP, if Breez SDK has complex browser initialization,
use the backend to manage Breez state and expose wallet data via the internal API.

### Step 2.5 — Wallet balance component (`frontend/src/components/wallet/WalletBalance.tsx`)

Display:
- Large naira amount (primary)
- Small sats equivalent (secondary, grey)
- "Add Money" button → `/deposit`
- "Withdraw" button → withdrawal flow

**✅ Phase 2 done when:** A user can trigger a deposit, receive virtual account details, and see their balance update.

---

## PHASE 3 — POOL SYSTEM

### Step 3.1 — Pool service (`backend/src/services/poolService.ts`)

```typescript
createPool(creatorId, poolData)
  // Creates pool record
  // Creates Nostr community event for the pool
  // Returns pool with nostrGroupId

getPools(filters?)
  // Returns all OPEN pools
  // Sorted by: newest first

getPool(poolId)
  // Returns pool + members + user's position

joinPool(userId, poolId, depositAmount)
  // Validates: user has enough balance
  // Validates: pool is OPEN
  // Validates: amount >= pool.minDeposit
  // Deducts from user balance
  // Creates PoolMember record
  // Checks if pool is now full → if so, set status ACTIVE
  // Posts Nostr event: "{displayName} joined the pool"

activatePool(poolId)
  // Sets status to ACTIVE
  // Records activation timestamp
  // Starts yield accrual (via yieldService)
```

### Step 3.2 — Yield service (`backend/src/services/yieldService.ts`)

```typescript
// Daily cron job (run at midnight UTC):
accrueYield()
  // For each ACTIVE pool:
  //   Calculate daily yield rate by tier
  //   Create YieldRecord
  //   Update each PoolMember's earnedYield
  //   Check if lock period has ended → if so, call completePool()

completePool(poolId)
  // Set pool status to COMPLETED
  // Credit each member's wallet with principal + earned yield
  // Post Nostr event: "Pool completed! Earnings distributed."

// Yield rates:
const DAILY_RATES = {
  STARTER: 0.000137,  // ≈ 5% APY
  GROWTH:  0.000233,  // ≈ 8.5% APY
  POWER:   0.000356,  // ≈ 13% APY
}
```

### Step 3.3 — Pool routes (`backend/src/routes/pools.ts`)

```
GET  /api/pools           → list all OPEN pools
GET  /api/pools/:id       → single pool detail
POST /api/pools           → create new pool
POST /api/pools/:id/join  → join a pool
GET  /api/pools/:id/members → pool members list
GET  /api/users/me/pools  → current user's pools
```

### Step 3.4 — Pool list page (`frontend/src/pages/Home.tsx`)

Layout:
- Header: MoniPool logo + "Sign In" or user avatar
- Hero: "Your community. Your earnings." with brief explanation
- Filter tabs: All / Starter / Growth / Power
- Grid of PoolCards
- "Create a Pool" button (if authenticated)

### Step 3.5 — PoolCard component (`frontend/src/components/pool/PoolCard.tsx`)

Must show:
- Pool name
- Tier badge (colour-coded: green/yellow/red)
- Progress bar: current size / target size
- APY range ("4–6% APY")
- Lock period ("30 days")
- Member count
- "Join Pool" button

### Step 3.6 — Pool detail page (`frontend/src/pages/Pool.tsx`)

Sections:
- Pool header (name, tier, status)
- Stats row (APY, lock period, members, progress)
- "Join This Pool" section (enter amount, confirm)
- Members list (anonymised: "Member 1", "Member 2" etc.)
- Nostr activity feed (Phase 4)

### Step 3.7 — Create pool page (`frontend/src/pages/CreatePool.tsx`)

Form fields:
- Pool name (text)
- Tier selection (radio: Starter / Growth / Power)
- Description (optional textarea)
- Preview of auto-filled values (min deposit, target, lock period, APY)
- "Create Pool" submit button

**✅ Phase 3 done when:** Users can create pools, browse pools, join pools, and see simulated yield accruing.

---

## PHASE 4 — NOSTR COMMUNITY LAYER

### Step 4.1 — Nostr service (`backend/src/services/nostrService.ts`)

```typescript
createPoolGroup(pool)
  // Publishes Kind 34550 (community) event
  // Returns nostrGroupId (event ID)

postPoolActivity(poolId, message)
  // Publishes Kind 1 (text note) event
  // Signed by MoniPool service key
  // Tagged with pool's nostrGroupId
  // Examples:
  //   "🎉 Chidi joined Lagos Starter Pool"
  //   "⚡ Pool activated — ₦500,000 now earning yield"
  //   "✅ Pool complete — earnings distributed to 12 members"

getPoolFeed(nostrGroupId, limit = 20)
  // Subscribes to relay for events tagged with nostrGroupId
  // Returns latest events
```

### Step 4.2 — Nostr feed component (`frontend/src/components/feed/NostrFeed.tsx`)

- Connects to Nostr relay via WebSocket
- Subscribes to pool's nostrGroupId
- Shows scrollable list of activity events
- Auto-updates when new events arrive
- Each item: avatar placeholder + message + timestamp

### Step 4.3 — Integrate feed into Pool detail page
Add the `<NostrFeed poolId={pool.nostrGroupId} />` component to the bottom of the pool detail page.

**✅ Phase 4 done when:** Joining a pool posts a Nostr event and it appears in the pool's live feed.

---

## PHASE 5 — DASHBOARD + WITHDRAWAL

### Step 5.1 — Dashboard page (`frontend/src/pages/Dashboard.tsx`)

Sections:
- **Wallet card**: Total balance (NGN + sats), "Add Money" + "Withdraw" buttons
- **My Pools**: List of pools user has joined, with:
  - Pool name + tier
  - Their deposit amount
  - Earnings so far (₦)
  - Status badge (Active / Completed / Open)
  - "View Pool" link
- **Transaction history**: Recent deposits and payouts

### Step 5.2 — Withdrawal flow

```
User clicks "Withdraw"
  → Enter bank account details (account number, bank name)
  → Enter amount to withdraw
  → Backend calls Bitnob to initiate NGN payout
  → Show confirmation screen with estimated arrival time (1–2 business days)
  → Update wallet balance
```

Backend endpoint:
```
POST /api/withdrawals
  body: { amountNGN, bankAccount, bankCode }
  → validate user has sufficient balance
  → call Bitnob payout API
  → deduct balance
  → create Withdrawal record
  → return { reference, estimatedArrival }
```

**✅ Phase 5 done when:** Users can see their earnings on the dashboard and initiate a withdrawal.

---

## PHASE 6 — POLISH + DEMO PREP

### Step 6.1 — Seed demo data
Create `backend/prisma/seed.ts`:
- 3 demo pools (one of each tier, all OPEN)
- 1 ACTIVE pool with 8 members and visible yield
- 1 COMPLETED pool showing final distribution
- Demo user with balance and pool memberships

Run with: `npx prisma db seed`

### Step 6.2 — Mobile layout audit
Check every page at 375px width. Fix any overflow, truncation, or tap target issues.

### Step 6.3 — Loading + empty states
Every list component must handle:
- Loading: skeleton cards
- Empty: illustration + CTA text
- Error: error message + retry button

### Step 6.4 — Toast notifications
Implement a global toast system for:
- Success: green toast ("You've joined the pool!")
- Error: red toast ("Something went wrong. Try again.")
- Info: grey toast ("Waiting for your bank transfer...")

### Step 6.5 — Final checklist before demo
- [ ] All 6 MVP features working end-to-end
- [ ] Demo data seeded
- [ ] No console errors
- [ ] Mobile layout verified
- [ ] Yield disclaimer visible on all yield displays
- [ ] Bitnob webhook tested with sandbox
- [ ] Nostr events appearing in pool feed

**✅ Phase 6 done when:** A judge can be walked through the full demo flow without hitting any errors or broken states.

---

# DEMO FLOW (For Hackathon Presentation)

Follow this exact sequence when demoing:

1. Open home page → show pool browser with 3 tiers
2. Click "Sign In with Nostr" → show passkey login (no password!)
3. Show wallet: ₦0 balance
4. Click "Add Money" → generate virtual account → "transfer received" (pre-seeded)
5. Balance updates to ₦50,000
6. Browse pools → click on Growth Pool
7. Click "Join Pool" → enter ₦50,000
8. Show pool progress bar fill up
9. Click "View Pool Feed" → show Nostr activity: "You joined the pool"
10. Switch to pre-seeded ACTIVE pool → show yield counter ticking
11. Switch to COMPLETED pool → show earnings distributed
12. Dashboard → show all pools + total earnings
13. Click "Withdraw" → enter bank details → confirm

Total demo time: ~4 minutes.