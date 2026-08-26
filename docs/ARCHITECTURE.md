# Architecture

## Overview

AgriPool is split into three independently deployable pieces:

```
contracts/agripool-contract   Rust/Soroban contract — the source of truth for
                               participant shares, settlement records, and
                               double-payment prevention.

backend/                      Express/TypeScript API — off-chain mirror of
                               pool metadata, marketplace listings, user
                               accounts, feedback, and an index of settled
                               payments for fast dashboards.

frontend/                     React/Vite SPA — marketplace, checkout,
                               dashboard, admin panel. Builds and signs the
                               `settle()` transaction directly via Freighter;
                               the backend never holds a signing key.
```

## Why an off-chain backend exists at all

The contract is intentionally minimal: participant registry, share
validation, atomic settlement, and history. It has no concept of user
accounts, produce listings, images, search, or free-text feedback — none of
that belongs on-chain, either for cost reasons or because it isn't data
that needs a trust guarantee.

The backend exists to:

- Let buyers search/filter listings without an RPC round-trip per keystroke
- Cache a cooperative's display name and participant labels next to their
  wallet addresses (the contract only knows addresses and basis points)
- Index settled transaction hashes so the dashboard and explorer don't
  re-scan the ledger on every page load
- Handle authentication, image uploads, and feedback — all off-chain
  concerns by nature

**The backend is never in the custody path.** `settle()` moves funds
directly from the buyer's wallet to every participant's wallet inside a
single contract invocation the buyer signs with Freighter. The backend only
learns about a settlement after the fact, when the frontend reports the
resulting transaction hash for indexing.

## Data flow: a single sale

1. Farmer or cooperative creates a listing (backend, off-chain) tied to a
   `poolId`.
2. Buyer browses the marketplace (backend, off-chain reads).
3. Buyer connects Freighter and chooses a quantity (frontend).
4. Frontend builds a `settle(payment_id, pool_id, buyer, token, amount)`
   invocation, Freighter signs it, the frontend submits it to Soroban RPC.
5. The contract atomically transfers each participant's basis-point share
   directly out of the buyer's authorized amount, writes a `Payment`
   record, and appends to that pool's on-chain history — all inside one
   transaction. Either every participant is paid or none are.
6. Frontend reports the resulting transaction hash to the backend, which
   indexes it (`PaymentRecord`) and marks the listing sold.
7. Anyone — buyer, participant, or an outside auditor — can independently
   verify the split by reading the contract directly, without trusting the
   backend at all.

## Security model

- **Custody**: the contract, not the backend or a cooperative manager,
  moves funds. No party is ever in a position to hold or misdirect a
  buyer's payment.
- **Authorization boundaries**: `create_pool` / `update_pool` /
  `retire_pool` require the platform admin's signature (see
  `docs/CONTRACT.md` for why). `settle` requires the buyer's own signature
  — nobody can settle a payment on a buyer's behalf.
- **Idempotency**: every settlement is keyed by a caller-supplied
  `payment_id`. The contract rejects any `payment_id` it has already seen,
  so retried submissions or double-clicks can't double-pay.
- **Off-chain auth**: JWT access/refresh tokens, bcrypt password hashing,
  role-based route guards, per-route rate limiting (tighter on
  login/register), Helmet security headers, and Zod validation on every
  request body.
- **Least privilege by role**: a `farmer` or `cooperative` account can
  create listings; only `cooperative`/`admin` can register a pool's
  off-chain mirror; only `admin` can view aggregate feedback or platform
  stats.

## Folder structure rationale

Both the backend and frontend use a feature-oriented layout
(`controllers/routes/models/validators` on the backend;
`features/<domain>` on the frontend) so that a change to, say, payments
touches one directory instead of being scattered across a type-based tree.
Shared primitives (`components/ui`, backend `middleware`/`utils`) stay
separate from feature code so they're easy to find and easy to keep
generic.
