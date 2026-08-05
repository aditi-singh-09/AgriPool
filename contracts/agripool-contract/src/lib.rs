#![no_std]

//! AgriPool settlement contract.
//!
//! A buyer pays once; this contract atomically splits that single payment
//! across a fixed set of registered participants (farmer, cooperative,
//! transporter, warehouse) according to basis-point shares that sum to
//! exactly 10_000 (100.00%). Every settlement is idempotent per
//! `payment_id`, so a payment can never be distributed twice.

mod events;
mod types;

use soroban_sdk::{
    contract, contractimpl, contractmeta, panic_with_error, token, Address, Env, String, Symbol,
    Vec,
};

pub use types::{DataKey, Error, Participant, Payment, Pool};

contractmeta!(
    key = "Description",
    val = "AgriPool cooperative revenue split-settlement contract"
);

const TOTAL_BPS: u32 = 10_000;
const MAX_PARTICIPANTS: u32 = 12;

#[contract]
pub struct AgriPoolContract;

#[contractimpl]
impl AgriPoolContract {
    /// One-time setup. Stores the platform admin, who is the only address
    /// allowed to create/retire pools. Admin has no custody over funds —
    /// funds move directly from buyer to participants inside `settle`.
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Registers a new distribution pool: an ordered set of participants
    /// with wallet addresses and basis-point shares. Shares must sum to
    /// exactly 10_000. Requires admin authorization.
    pub fn create_pool(
        env: Env,
        pool_id: Symbol,
        participants: Vec<Participant>,
    ) -> Result<(), Error> {
        let admin = Self::require_admin(&env)?;
        admin.require_auth();

        if env
            .storage()
            .persistent()
            .has(&DataKey::Pool(pool_id.clone()))
        {
            return Err(Error::PoolAlreadyExists);
        }
        if participants.is_empty() || participants.len() > MAX_PARTICIPANTS {
            return Err(Error::InvalidParticipantCount);
        }

        Self::assert_valid_shares(&participants)?;

        let pool = Pool {
            pool_id: pool_id.clone(),
            participants: participants.clone(),
            active: true,
            payment_count: 0,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Pool(pool_id.clone()), &pool);

        events::pool_created(&env, &pool_id, participants.len());
        Ok(())
    }

    /// Replaces a pool's participant/share table (e.g. a farmer's wallet
    /// changes, or shares are renegotiated for a new season). Admin only.
    /// Existing settled payments are untouched — this only affects future
    /// settlements against this pool.
    pub fn update_pool(
        env: Env,
        pool_id: Symbol,
        participants: Vec<Participant>,
    ) -> Result<(), Error> {
        let admin = Self::require_admin(&env)?;
        admin.require_auth();

        let mut pool: Pool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id.clone()))
            .ok_or(Error::PoolNotFound)?;

        if participants.is_empty() || participants.len() > MAX_PARTICIPANTS {
            return Err(Error::InvalidParticipantCount);
        }
        Self::assert_valid_shares(&participants)?;

        pool.participants = participants.clone();
        env.storage()
            .persistent()
            .set(&DataKey::Pool(pool_id.clone()), &pool);

        events::pool_updated(&env, &pool_id, participants.len());
        Ok(())
    }

    /// Deactivates a pool so it can no longer accept settlements. Admin only.
    pub fn retire_pool(env: Env, pool_id: Symbol) -> Result<(), Error> {
        let admin = Self::require_admin(&env)?;
        admin.require_auth();

        let mut pool: Pool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id.clone()))
            .ok_or(Error::PoolNotFound)?;
        pool.active = false;
        env.storage()
            .persistent()
            .set(&DataKey::Pool(pool_id.clone()), &pool);
        Ok(())
    }

    /// The core flow: buyer authorizes a single token transfer of `amount`
    /// into this call, the contract atomically forwards a proportional cut
    /// to every participant in `pool_id` per their basis-point share, and a
    /// permanent `Payment` record is written keyed by `payment_id`.
    ///
    /// Re-using a `payment_id` is rejected outright — this is the
    /// double-payment guard. Because every transfer happens inside one
    /// contract invocation, either every participant is paid or none are;
    /// there is no intermediate state where funds are held by a manager.
    pub fn settle(
        env: Env,
        payment_id: Symbol,
        pool_id: Symbol,
        payer: Address,
        token_address: Address,
        amount: i128,
    ) -> Result<(), Error> {
        payer.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if env
            .storage()
            .persistent()
            .has(&DataKey::Payment(payment_id.clone()))
        {
            return Err(Error::PaymentAlreadySettled);
        }

        let mut pool: Pool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id.clone()))
            .ok_or(Error::PoolNotFound)?;
        if !pool.active {
            return Err(Error::PoolInactive);
        }

        let token_client = token::Client::new(&env, &token_address);

        let mut distributed: i128 = 0;
        let count = pool.participants.len();
        for (i, participant) in pool.participants.iter().enumerate() {
            let share = if i as u32 == count - 1 {
                // Last participant absorbs any rounding remainder so the
                // sum of transfers always equals `amount` exactly.
                amount - distributed
            } else {
                (amount * participant.share_bps as i128) / TOTAL_BPS as i128
            };
            if share > 0 {
                token_client.transfer(&payer, &participant.wallet, &share);
                distributed += share;
            }
        }

        pool.payment_count += 1;
        env.storage()
            .persistent()
            .set(&DataKey::Pool(pool_id.clone()), &pool);

        let record = Payment {
            payment_id: payment_id.clone(),
            pool_id: pool_id.clone(),
            payer: payer.clone(),
            token: token_address.clone(),
            amount,
            timestamp: env.ledger().timestamp(),
        };
        env.storage()
            .persistent()
            .set(&DataKey::Payment(payment_id.clone()), &record);

        Self::push_history(&env, &pool_id, &payment_id);
        events::payment_settled(&env, &payment_id, &pool_id, amount);
        Ok(())
    }

    pub fn get_pool(env: Env, pool_id: Symbol) -> Result<Pool, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .ok_or(Error::PoolNotFound)
    }

    pub fn get_payment(env: Env, payment_id: Symbol) -> Result<Payment, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Payment(payment_id))
            .ok_or(Error::PaymentNotFound)
    }

    /// Returns the ordered list of settled `payment_id`s for a pool, most
    /// recent last — the on-chain transaction history for that cooperative.
    pub fn get_history(env: Env, pool_id: Symbol) -> Vec<Symbol> {
        env.storage()
            .persistent()
            .get(&DataKey::History(pool_id))
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn get_admin(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    // ---- internal helpers ----

    fn require_admin(env: &Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    fn assert_valid_shares(participants: &Vec<Participant>) -> Result<(), Error> {
        let mut total: u32 = 0;
        for p in participants.iter() {
            if p.share_bps == 0 {
                return Err(Error::InvalidShare);
            }
            total = total.checked_add(p.share_bps).ok_or(Error::InvalidShare)?;
        }
        if total != TOTAL_BPS {
            return Err(Error::SharesMustSumToTotal);
        }
        Ok(())
    }

    fn push_history(env: &Env, pool_id: &Symbol, payment_id: &Symbol) {
        let key = DataKey::History(pool_id.clone());
        let mut history: Vec<Symbol> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(env));
        history.push_back(payment_id.clone());
        env.storage().persistent().set(&key, &history);
    }
}

/// Convenience label type re-exported for the SDK/backend to construct
/// human-readable role tags (e.g. "farmer", "cooperative") without pulling
/// in the whole crate.
pub type Role = String;

#[cfg(test)]
mod test;
