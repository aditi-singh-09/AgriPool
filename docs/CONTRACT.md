# Contract: `agripool-contract`

Location: `contracts/agripool-contract`. Written in Rust against
`soroban-sdk 21.7.6`.

## Concepts

- **Pool** — a named set of participants (`Symbol` id, e.g. `pool_valley_coop`)
  with wallet addresses and basis-point shares that sum to exactly `10_000`
  (100.00%). One cooperative typically registers one pool per season.
- **Participant** — `{ role, wallet, share_bps }`. Roles are free-form
  `Symbol`s in this version (`farmer`, `cooperative`, `transport`,
  `warehouse` by convention) rather than a hardcoded enum, so a cooperative
  with a different structure (e.g. two transport providers) isn't forced
  into four fixed slots.
- **Payment** — an immutable record of one settled transaction: payer,
  token, amount, and ledger timestamp, keyed by a caller-chosen
  `payment_id`.

## Public interface

| Function | Auth required | Purpose |
|---|---|---|
| `initialize(admin)` | — (one-time) | Sets the platform admin. Reverts if called twice. |
| `create_pool(pool_id, participants)` | admin | Registers a new pool. Rejects if shares don't sum to 10,000 bps, if the pool already exists, or if the participant count is 0 or > 12. |
| `update_pool(pool_id, participants)` | admin | Replaces a pool's participant table. Past settlements are untouched. |
| `retire_pool(pool_id)` | admin | Deactivates a pool; `settle` will reject future calls against it. |
| `settle(payment_id, pool_id, payer, token, amount)` | payer | The core flow — see below. |
| `get_pool(pool_id)` | — (read) | Returns the current participant table. |
| `get_payment(payment_id)` | — (read) | Returns a settled payment's record. |
| `get_history(pool_id)` | — (read) | Returns the ordered list of `payment_id`s settled against a pool. |
| `get_admin()` | — (read) | Returns the platform admin address. |

## Why `create_pool` requires the admin, not the cooperative

The buyer-facing `settle` call is fully non-custodial and permissionless —
any buyer can pay any active pool without anyone's permission. Pool
*creation*, however, is admin-gated by design: onboarding a cooperative
means verifying that the wallets being registered actually belong to the
farmer group, transporter, and warehouse the cooperative claims — an
off-chain KYC step that happens before the on-chain call. This mirrors how
the reference off-chain `DistributionPool` mirror is created by a
`cooperative` or `admin` account in the backend (see
`docs/API.md`), with the final on-chain registration performed by the
platform admin as documented in `docs/DEPLOYMENT.md`. A future version could
replace this with a multisig or a cooperative-owned admin key per pool.

## Settlement mechanics

```
settle(payment_id, pool_id, payer, token, amount):
    require payer.require_auth()
    require amount > 0
    require payment_id not already used         # double-payment prevention
    require pool exists and pool.active

    for each participant in pool (in order):
        share = amount * participant.share_bps / 10_000
        # the LAST participant instead receives (amount - sum of all
        # previous shares), so integer-division remainders never go
        # missing and the transfers always sum to exactly `amount`
        token.transfer(payer -> participant.wallet, share)

    record Payment{payment_id, pool_id, payer, token, amount, timestamp}
    append payment_id to pool's history
    emit payment.settled event
```

Because every transfer happens inside one contract invocation, there is no
intermediate state visible to the outside world where some participants
are paid and others aren't — a transaction either commits with everyone
paid, or it doesn't commit at all.

## Events

- `("pool", "created")` → `(pool_id, participant_count)`
- `("pool", "updated")` → `(pool_id, participant_count)`
- `("payment", "settled")` → `(payment_id, pool_id, amount)`

## Testing

`contracts/agripool-contract/src/test.rs` covers:

- Valid pool creation and share-sum rejection
- Atomic distribution across four participants, verified by checking each
  participant's token balance after `settle`
- Duplicate `payment_id` rejection
- Settlement rejection against a retired pool
- Rounding-remainder correctness (an odd, non-evenly-divisible amount still
  sums to exactly the original amount across all participants)
- `update_pool` affecting only future settlements
- Ledger timestamp recording

Run locally with:

```bash
cd contracts/agripool-contract
cargo test
```

> **Note on this submission:** the contract source was written and
> reviewed carefully against the Soroban SDK's documented APIs, but this
> sandbox environment doesn't have network access to install the Rust
> toolchain, so `cargo test` and `cargo build --target wasm32-unknown-unknown`
> could not be executed here. Run them locally (or let CI run them — see
> `.github/workflows/ci.yml`) before deploying, and treat that as the
> first step of `docs/DEPLOYMENT.md`.

## Deploying

See `docs/DEPLOYMENT.md` for the exact `stellar contract build` / `deploy`
/ `invoke` commands, including the one-time `initialize` and per-cooperative
`create_pool` calls.
