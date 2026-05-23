# MoniPool — Architecture

---

## System Overview

```
┌─────────────────────────────────────────────────┐
│                  USER (Browser)                  │
│           React + TypeScript + Tailwind          │
└─────────────┬───────────────────────────────────┘
              │ HTTPS REST API
              ▼
┌─────────────────────────────────────────────────┐
│              MONIPOOL BACKEND                    │
│           Node.js + Express + Prisma             │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │
│  │  Pool    │ │  Yield   │ │  Auth (Nostr    │  │
│  │ Service  │ │ Service  │ │   + JWT)        │  │
│  └──────────┘ └──────────┘ └─────────────────┘  │
└──────┬────────────────┬────────────────┬─────────┘
       │                │                │
       ▼                ▼                ▼
┌────────────┐  ┌──────────────┐  ┌───────────────┐
│ PostgreSQL │  │  Bitnob API  │  │  Nostr Relay  │
│ (Prisma)   │  │  (NGN ↔ BTC) │  │  (wss://...)  │
└────────────┘  └──────────────┘  └───────────────┘
                        │
                        ▼
               ┌──────────────┐
               │  Breez SDK   │
               │ (Lightning   │
               │  Wallets)    │
               └──────────────┘
```

---

## Key Architectural Decisions

### Decision 1: Breez SDK on the Backend (not frontend)
**Why:** The Breez SDK requires filesystem access for wallet data storage and has complex initialization that doesn't work cleanly in a browser environment for MVP.
**How:** The backend manages one Breez node. User wallet balances are tracked in PostgreSQL. Breez handles the actual Lightning transactions.
**Post-hackathon:** Migrate to per-user Breez instances or a proper LSP.

### Decision 2: Simulated Yield (not real Amboss Magma)
**Why:** Real Lightning liquidity deployment requires running a Lightning node with significant capital, which is out of scope for a hackathon.
**How:** A daily cron job (node-cron) calculates yield based on the tier's daily rate and credits each PoolMember's `earnedYieldNGN`.
**Post-hackathon:** Replace yieldService simulation with real Amboss Magma API calls.

### Decision 3: Nostr for Identity (not email/password)
**Why:** Nostr keypairs give users a self-sovereign identity with no central database of passwords. Aligns with the app's decentralised ethos. Passkey-based flow removes seed phrase friction.
**How:** Frontend generates a keypair on first visit. Privkey is encrypted with user's PIN and stored in localStorage. Backend issues a JWT after verifying a signed challenge.
**Tradeoff:** If user loses their PIN and clears localStorage, they lose their identity. For MVP this is acceptable. Post-hackathon: add Breez passkey backup.

### Decision 4: NGN as primary display currency
**Why:** Users think in naira. Showing BTC or sats first creates confusion and distrust.
**How:** All UI displays NGN first. Sats/BTC shown as secondary, smaller, grey text. Exchange rate fetched from Bitnob and cached for 1 minute.

### Decision 5: Polling over WebSockets (for MVP)
**Why:** WebSockets add complexity for a hackathon. Polling every 5s is sufficient for deposit confirmation and pool updates.
**How:** Frontend polls `/api/deposits/pending` every 5s during the deposit flow. Pool data refreshes every 30s.
**Post-hackathon:** Replace with WebSocket subscriptions.

---

## Data Flow: NGN Deposit

```
1. User enters ₦50,000 on Deposit page
2. Frontend → POST /api/deposits/initiate { amountNGN: 50000 }
3. Backend → Bitnob API: generate virtual NGN account
4. Bitnob returns: { bankName, accountNumber, reference }
5. Backend creates Deposit record (status: PENDING)
6. Backend returns virtual account to frontend
7. Frontend displays bank details + countdown timer
8. Frontend polls GET /api/deposits/pending every 5s
9. User transfers from their bank app
10. Bitnob sends webhook → POST /api/webhooks/bitnob
11. Backend verifies signature
12. Backend updates Deposit status → CONFIRMED
13. Backend calculates sats equivalent (amountNGN × current rate)
14. Backend updates User.balanceSats
15. Next poll returns confirmed deposit
16. Frontend shows success screen
```

## Data Flow: Join a Pool

```
1. User clicks "Join Pool" on Pool detail page
2. Frontend → POST /api/pools/:id/join { amountNGN: 50000 }
3. Backend validates:
   - User.balanceSats >= required sats
   - Pool.status === OPEN
   - amountNGN >= pool.minDeposit
   - User not already a member
4. Backend deducts from User.balanceSats
5. Backend creates PoolMember record
6. Backend updates Pool.currentSize
7. If Pool.currentSize >= Pool.targetSize:
   → Pool.status = ACTIVE
   → Pool.activatedAt = now()
   → nostrService.postPoolActivity("⚡ Pool activated!")
8. nostrService.postPoolActivity("🎉 {displayName} joined!")
9. Backend returns updated pool data
10. Frontend shows success + updated pool progress bar
```

## Data Flow: Yield Accrual (Daily Cron)

```
Runs at 00:00 UTC every day

1. Query all pools WHERE status = ACTIVE
2. For each pool:
   a. Calculate daily yield:
      totalYield = pool.currentSize × pool.dailyRate
   b. Create YieldRecord for this pool + date
   c. For each PoolMember in pool:
      memberYield = totalYield × member.sharePercent / 100
      Update PoolMember.earnedYieldNGN += memberYield
   d. Check if lock period ended:
      if (now - pool.activatedAt) >= pool.lockDays days:
        Call completePool(pool.id)

completePool(poolId):
1. Set pool.status = COMPLETED
2. Set pool.completedAt = now()
3. For each member:
   Credit User.balanceSats with principal + yield (converted to sats)
4. Post Nostr event: "✅ Pool complete! Earnings distributed."
```

---

## Security Considerations

| Risk | Mitigation |
|---|---|
| Bitnob webhook forgery | Verify HMAC-SHA256 signature on every webhook |
| JWT theft | Store JWT in memory only (Zustand), not localStorage |
| Private key exposure | AES-GCM encrypt privkey before localStorage storage |
| SQL injection | Prisma parameterised queries only — no raw SQL |
| API abuse | Rate limiting via express-rate-limit (100 req/15min) |
| Overdraft | Check User.balanceSats before every deduction |
| Double join | Database unique constraint on (userId, poolId) |

---

## Environment Configuration

```
Development:  Bitnob sandbox + Breez testnet + local Postgres
Production:   Bitnob mainnet + Breez mainnet + managed Postgres (Railway/Supabase)
```

For the hackathon, run in development mode with sandbox/testnet only.