# MoniPool 🌊⚡
### Community Bitcoin Yield Pools — Bitcoin yield. Naira simplicity. Community power.

---

## What Is MoniPool?

MoniPool is a community savings platform that lets groups of Nigerians pool their naira together to collectively earn Bitcoin yield through the Lightning Network — without needing to understand any of the underlying technology.

It is inspired by the traditional **ajo/esusu** savings culture: everyone contributes, everyone earns at the same time. The difference is that MoniPool puts the pooled funds to work as Lightning Network liquidity, earning real routing fees distributed proportionally back to every member.

---

## The Problem It Solves

- Naira in savings accounts loses value to inflation (20%+ per year)
- Lightning Network liquidity pools earn real yield (9–24% APY) but require technical expertise and large minimums
- No existing product combines fiat onramp + Lightning yield + community savings for African users

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS |
| Fiat ↔ Bitcoin | Bitnob API (NGN deposits, BTC conversion, payouts) |
| Lightning Wallet | Breez SDK (non-custodial wallets, invoices, stable balance) |
| Yield Engine | Lightning Network + Amboss Magma (simulated for MVP) |
| Identity + Community | Nostr (keypair login, group feeds, Nostr Wallet Connect) |
| Backend | Node.js + Express + PostgreSQL |
| Auth | Nostr keypair (passkey-based, no passwords) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Bitnob sandbox API key → https://bitnob.com/developers
- Breez SDK API key → https://sdk.breez.technology
- Nostr keypair (generated automatically on first run)

### Installation

```bash
git clone https://github.com/oyingrace/monipool
cd monipool
npm install
cp .env.example .env
# Fill in your API keys in .env
npm run dev
```

### Environment Variables

```env
# Bitnob
BITNOB_API_KEY=your_sandbox_key
BITNOB_WEBHOOK_SECRET=your_webhook_secret
BITNOB_BASE_URL=https://sandboxapi.bitnob.co/api/v1

# Breez SDK
BREEZ_API_KEY=your_breez_key
BREEZ_NETWORK=testnet

# Nostr
NOSTR_RELAY_URL=wss://relay.nostr.com

# Database
DATABASE_URL=postgresql://localhost:5432/monipool

# App
PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret
```

---

## MVP Scope (Hackathon)

The following 6 features constitute the full MVP:

1. **NGN Deposit Flow** — bank transfer → Bitnob → BTC/sats credited to wallet
2. **Breez SDK Wallet** — each user gets a non-custodial Lightning wallet, no seed phrase
3. **Pool Creation + Joining** — browse pools, join with minimum deposit, see members
4. **Yield Dashboard** — simulated routing fee earnings shown per pool and per user
5. **Nostr Login** — passkey-based login using Nostr keypair, no email/password
6. **Nostr Pool Feed** — live activity feed per pool using Nostr events

---

## Key Links

- Bitnob API Docs: https://developers.bitnob.com
- Breez SDK Docs: https://sdk.breez.technology/guide
- Nostr Protocol: https://nostr.com
- Amboss Magma: https://amboss.space/magma
- Lightning Pool (reference): https://github.com/lightninglabs/pool

---

## Team

Built with love for Hack4Freedom