use soroban_sdk::{symbol_short, Env, Symbol};

pub fn pool_created(env: &Env, pool_id: &Symbol, participant_count: u32) {
    env.events().publish(
        (symbol_short!("pool"), symbol_short!("created")),
        (pool_id.clone(), participant_count),
    );
}

pub fn pool_updated(env: &Env, pool_id: &Symbol, participant_count: u32) {
    env.events().publish(
        (symbol_short!("pool"), symbol_short!("updated")),
        (pool_id.clone(), participant_count),
    );
}

pub fn payment_settled(env: &Env, payment_id: &Symbol, pool_id: &Symbol, amount: i128) {
    env.events().publish(
        (symbol_short!("payment"), symbol_short!("settled")),
        (payment_id.clone(), pool_id.clone(), amount),
    );
}
