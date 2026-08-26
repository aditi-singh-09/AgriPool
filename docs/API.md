# API Reference

Base URL: `http://localhost:4000/api` (local) — set `CORS_ORIGIN` and your
deployed frontend's origin in production.

All error responses share this shape:

```json
{ "error": { "code": "BAD_REQUEST", "message": "...", "details": { } } }
```

Authenticated routes expect `Authorization: Bearer <accessToken>`.

## Auth — `/auth`

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/auth/register` | — | `{ email, password, displayName, role, walletAddress? }` | `role` ∈ buyer/farmer/cooperative/transport/warehouse. Rate-limited (10/15min). |
| POST | `/auth/login` | — | `{ email, password }` | Returns `{ user, accessToken, refreshToken }`. Rate-limited. |
| POST | `/auth/refresh` | — | `{ refreshToken }` | Returns a new `accessToken`. |
| GET | `/auth/me` | required | — | Returns the current user. |

## Pools — `/pools`

The off-chain mirror of a Soroban pool's metadata. See `docs/CONTRACT.md`
for why creation is gated to `cooperative`/`admin` roles.

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/pools` | — | Lists active pools. |
| GET | `/pools/:poolId` | — | Off-chain pool record. |
| GET | `/pools/:poolId/on-chain` | — | Live read-through to the contract via Soroban RPC simulation (requires `CONTRACT_ID` + `SOROBAN_READ_SOURCE_ACCOUNT` configured). |
| POST | `/pools` | cooperative/admin | `{ poolId, cooperativeName, participants[] }`; shares must sum to 10,000 bps. |

## Listings — `/listings`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/listings` | — | `?search=&produceType=&region=&minPrice=&maxPrice=&page=&limit=` |
| GET | `/listings/:id` | — | Single listing with seller populated. |
| POST | `/listings` | farmer/cooperative | Creates a listing tied to a `poolId`. |
| PATCH | `/listings/:id` | owner/admin | Partial update. |
| DELETE | `/listings/:id` | owner/admin | Soft-deletes (sets status `archived`). |

## Payments — `/payments`

Indexes on-chain settlements after the frontend confirms them — see
`docs/ARCHITECTURE.md` for why the backend is never in the custody path.

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/payments` | required | `{ paymentId, poolId, listingId?, buyerWallet, tokenAddress, amount, transactionHash, ledgerTimestamp }` |
| GET | `/payments/mine` | required | Current user's settlements. |
| GET | `/payments/pool/:poolId` | — | Public settlement history for a pool (transaction explorer). |
| GET | `/payments/tx/:hash` | — | Single settlement by transaction hash. |
| PATCH | `/payments/:paymentId/confirm` | admin | Marks a record `confirmed` once independently verified. |

## Feedback — `/feedback`

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/feedback` | required | `{ rating (1-5), comment?, category, paymentId? }` |
| GET | `/feedback` | admin | All feedback + average rating. |

## Uploads — `/uploads`

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/uploads/listing-image` | required | `multipart/form-data`, field `image`, ≤5MB, image mimetypes only. Requires Cloudinary env vars. |

## Admin — `/admin`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/admin/stats` | admin | Platform-wide counts: users by role, active listings, pools, confirmed settlements, average feedback rating. |

## Health

`GET /health` — liveness check, no auth, used by Render's health check.
