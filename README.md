# MoniPool 🌊⚡
### Let your Naira work for you.

---

## What Is MoniPool?

MoniPool is a community savings platform that lets groups of Nigerians pool their naira together to collectively earn Bitcoin yield through the Lightning Network — without needing to understand any of the underlying technology.

Inspired by the traditional **ajo/esusu** savings culture: everyone contributes, everyone earns at the same time. MoniPool puts pooled funds to work as Lightning Network liquidity, earning real routing fees distributed proportionally back to every member.

---

## The Problem It Solves

- Naira in savings accounts loses value to inflation (20%+ per year)
- Lightning Network liquidity pools earn real yield (9–24% APY) but require technical expertise and large minimums
- No existing product combines fiat onramp + Lightning yield + community savings for African users

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router, TypeScript) |
| Styling | Tailwind CSS v3 |
| Client state | Zustand |
| Database | PostgreSQL + Prisma ORM |
| Fiat ↔ Bitcoin | Bitnob API (NGN deposits, BTC conversion, payouts) |
| Lightning Wallet | Breez SDK (non-custodial, server-managed) |
| Yield Engine | Lightning Network routing fees (simulated for MVP) |
| Identity + Community | Nostr (keypair login, group feeds, NWC) |
| Auth | Nostr keypair + JWT (httpOnly cookie) |

---


## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Bitnob sandbox API key → https://bitnob.com/developers
- Breez SDK API key → https://sdk.breez.technology
- Nostr service keypair (auto-generate, see below)

### Installation

```bash
git clone https://github.com/yourteam/monipool
cd monipool
npm install
cp .env.example .env.local
# Fill in your API keys in .env.local
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Open http://localhost:3000

### Generate a Nostr service keypair (run once)

```bash
node -e "
const { generateSecretKey, getPublicKey } = require('nostr-tools');
const priv = generateSecretKey();
const pub = getPublicKey(priv);
console.log('NOSTR_SERVICE_PRIVKEY=' + Buffer.from(priv).toString('hex'));
console.log('NOSTR_SERVICE_PUBKEY=' + pub);
"
```

Paste both values into `.env.local`.

---

## Environment Variables

```env
# Bitnob (sandbox)
BITNOB_API_KEY=
BITNOB_WEBHOOK_SECRET=
BITNOB_BASE_URL=https://sandboxapi.bitnob.co/api/v1

# Breez SDK (testnet)
BREEZ_API_KEY=
BREEZ_NETWORK=testnet

# Nostr (generate with command above)
NOSTR_SERVICE_PRIVKEY=
NOSTR_SERVICE_PUBKEY=

# Database
DATABASE_URL=postgresql://localhost:5432/monipool

# Auth
JWT_SECRET=
CRON_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## MVP Scope (Hackathon)

1. **NGN Deposit Flow** — bank transfer → Bitnob → balance credited
2. **Breez Wallet** — non-custodial Lightning wallet per user (server-managed)
3. **Pool Creation + Joining** — browse pools, join with minimum deposit
4. **Yield Dashboard** — simulated routing fee earnings per pool and per user
5. **Nostr Login** — passkey + PIN login, no email/password
6. **Nostr Pool Feed** — live activity feed per pool

---

## Key Links

- Bitnob API Docs: https://developers.bitnob.com
- Breez SDK Docs: https://sdk.breez.technology/guide
- Nostr Protocol: https://nostr.com
- Amboss Magma: https://amboss.space/magma
- Next.js 16 Docs: https://nextjs.org/docs

---

## Cursor AI Instructions

Before writing any code, Cursor should read these files in order:
1. `SKILL.md` — master build guide
2. `PLAN.md` — phase-by-phase build plan
3. `docs/ARCHITECTURE.md` — system design
4. `docs/DATA_MODELS.md` — database schema
5. `docs/API_REFERENCE.md` — third-party integrations

---

*Built with love for hack4Freedom*