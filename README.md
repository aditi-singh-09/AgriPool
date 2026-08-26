# AgriPool

**Transparent cooperative revenue distribution, settled atomically on
Stellar.**

A buyer pays once. The Soroban contract splits that single payment between
the farmer, the cooperative, the transport provider, and the warehouse —
in the same transaction, according to shares the cooperative defined
up front. Nobody manually wires anyone their cut, and nobody has to trust
that they will.

## Why this exists

Cooperative produce sales usually work like this: a buyer pays one person
— a cooperative manager — who is then trusted to manually distribute the
right amounts to everyone else who contributed. That's slow, opaque, and
depends entirely on the manager's honesty and bookkeeping.

AgriPool replaces that manual step with a smart contract. Shares are
registered once; every sale after that settles instantly and identically,
and anyone can verify the split by reading the contract directly.

## Repository layout

```
contracts/agripool-contract/   Rust/Soroban settlement contract + tests
backend/                       Express/TypeScript API (auth, listings, feedback, payment indexing)
frontend/                      React/Vite SPA (marketplace, checkout, dashboard, admin)
docs/                          Architecture, contract, API, and deployment documentation
.github/workflows/ci.yml       CI: contract tests, backend lint+test+build, frontend lint+build
```

Read `docs/ARCHITECTURE.md` first — it explains what lives on-chain vs.
off-chain and why, which makes the rest of the code easier to follow.

## Quick start

```bash
# 1. Contract
cd contracts/agripool-contract && cargo test

# 2. Backend
cd backend && cp .env.example .env   # set MONGODB_URI + JWT secrets
npm install && npm run dev            # http://localhost:4000

# 3. Frontend
cd frontend && cp .env.example .env
npm install && npm run dev            # http://localhost:5173
```

Full deployment instructions (Stellar testnet, Render, Vercel, MongoDB
Atlas) are in `docs/DEPLOYMENT.md`.

## Documentation

| Doc | Covers |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design, data flow, security model |
| [`docs/CONTRACT.md`](docs/CONTRACT.md) | Contract interface, settlement mechanics, test coverage |
| [`docs/API.md`](docs/API.md) | Every backend route, auth requirements, request/response shapes |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Exact commands: contract deploy, Render, Vercel |

## Tech stack

- **Contract**: Rust, Soroban SDK, Stellar Testnet
- **Backend**: Node.js, Express, TypeScript, MongoDB/Mongoose, JWT auth,
  Zod validation, Helmet, rate limiting, Pino logging, Sentry, PostHog,
  Cloudinary
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, TanStack Query,
  React Hook Form + Zod, Framer Motion, Freighter + Stellar SDK, Sentry,
  PostHog

## Design

The product's signature visual is the **settlement ticket** — a
weighbridge-manifest-style receipt (perforated edges, ink-stamp seal) that
shows exactly how one payment split across every participant. It appears
on the landing page, the checkout confirmation, and the transaction
explorer, using real data in the latter two.

## Status against Level 4 requirements

This repository ships: a tested Soroban contract with atomic multi-party
settlement and double-payment prevention; a production-shaped backend and
frontend with real auth, validation, and error handling; CI across all
three components; and complete architecture/contract/API/deployment docs.

What can only be produced by actually operating the deployed app —
testnet contract ID and transaction hashes, 10 onboarded real users,
collected feedback, analytics data, and a demo video — is **not**
fabricated here (per the brief) and is tracked as the checklist in
`docs/DEPLOYMENT.md § Post-deploy checklist`. Run through that checklist
after deploying to produce the remaining submission assets.

## License

MIT — see `LICENSE`.
