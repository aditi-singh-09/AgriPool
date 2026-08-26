# Deployment Guide

This walks through taking AgriPool from source to a live testnet
deployment: contract → backend → frontend. Every command below is exact
and runnable; nothing here is a placeholder — fill in the bracketed values
as you go and keep a copy of every address/hash you generate, since the
Level 4 submission needs them.

## 0. Prerequisites

- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli) (`stellar --version` ≥ 22)
- Rust + `wasm32-unknown-unknown` target: `rustup target add wasm32-unknown-unknown`
- Node.js ≥ 20
- A MongoDB Atlas free cluster
- A funded Stellar testnet account for the platform admin (Freighter can
  fund one via its built-in friendbot button, or `stellar keys generate`
  + `stellar keys fund` below)

## 1. Smart contract

```bash
cd contracts/agripool-contract

# Run the test suite first — see docs/CONTRACT.md for what it covers
cargo test

# Build the optimized WASM
stellar contract build

# Generate (or reuse) the admin identity
stellar keys generate agripool-admin --network testnet
stellar keys fund agripool-admin --network testnet

# Deploy — prints the contract ID, save it as CONTRACT_ID
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/agripool_contract.wasm \
  --source agripool-admin \
  --network testnet

# One-time initialization
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source agripool-admin \
  --network testnet \
  -- initialize --admin <ADMIN_PUBLIC_KEY>
```

### Registering a cooperative's pool on-chain

After a cooperative registers their pool through the app (which stores the
off-chain mirror — see `docs/API.md`), the platform admin runs the matching
on-chain call with the same `poolId` and participant data:

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source agripool-admin \
  --network testnet \
  -- create_pool \
  --pool_id <pool_id_from_the_app> \
  --participants '[
    {"role":"farmer","wallet":"<FARMER_G_ADDRESS>","share_bps":6000},
    {"role":"cooperative","wallet":"<COOP_G_ADDRESS>","share_bps":2000},
    {"role":"transport","wallet":"<TRANSPORT_G_ADDRESS>","share_bps":1000},
    {"role":"warehouse","wallet":"<WAREHOUSE_G_ADDRESS>","share_bps":1000}
  ]'
```

Record the resulting transaction hash — it's part of the submission
evidence.

## 2. Backend (Render)

1. Push this repo to GitHub.
2. In Render, "New +" → "Blueprint" → point at the repo; it will read
   `backend/render.yaml`.
3. Fill in the `sync: false` env vars in the Render dashboard:
   - `MONGODB_URI` — from Atlas ("Connect" → "Drivers")
   - `CORS_ORIGIN` — your Vercel frontend URL once you have it
   - `CONTRACT_ID` — from step 1
   - `SOROBAN_READ_SOURCE_ACCOUNT` — any funded testnet public key used
     purely for fee-free simulated reads
   - Cloudinary / Sentry / PostHog keys if you're using those features
4. Deploy. Confirm `GET https://<your-service>.onrender.com/health`
   returns `{"status":"ok"}`.

## 3. Frontend (Vercel)

1. Import the repo in Vercel, set the project root to `frontend/`.
2. Environment variables (Project Settings → Environment Variables):
   - `VITE_API_BASE_URL` = `https://<your-render-service>.onrender.com/api`
   - `VITE_CONTRACT_ID` = the contract ID from step 1
   - `VITE_SOROBAN_RPC_URL` = `https://soroban-testnet.stellar.org`
   - `VITE_STELLAR_NETWORK` = `TESTNET`
   - `VITE_SOROBAN_READ_SOURCE_ACCOUNT` = same funded read-only account
   - Sentry/PostHog keys if used
3. Deploy. Go back to Render and set `CORS_ORIGIN` to this Vercel URL,
   then redeploy the backend.

## 4. Post-deploy checklist

- [ ] `stellar contract invoke ... -- get_admin` returns the expected admin address
- [ ] Register at least one real pool on-chain and confirm `get_pool` returns it
- [ ] Create a listing through the deployed frontend, then complete a real
      Freighter-signed `settle()` checkout end-to-end on testnet
- [ ] Confirm the resulting transaction hash appears in `/explorer`
- [ ] Onboard the 10 real users required for submission and collect at
      least a few feedback submissions from the dashboard
- [ ] Record the demo video walking through: register → list produce →
      connect wallet → pay → see the on-chain split → view it in the
      explorer

## Local development

```bash
# Backend
cd backend
cp .env.example .env   # fill in MONGODB_URI + JWT secrets at minimum
npm install
npm run dev             # http://localhost:4000

# Frontend
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```
