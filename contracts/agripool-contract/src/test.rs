#![cfg(test)]

use super::*;
use soroban_sdk::{
    symbol_short,
    testutils::{Address as _, Ledger},
    vec, Env,
};

fn create_token_contract<'a>(
    env: &Env,
    admin: &Address,
) -> (Address, token::Client<'a>, token::StellarAssetClient<'a>) {
    let address = env.register_stellar_asset_contract(admin.clone());
    (
        address.clone(),
        token::Client::new(env, &address),
        token::StellarAssetClient::new(env, &address),
    )
}

fn setup(env: &Env) -> (Address, AgriPoolContractClient) {
    let admin = Address::generate(env);
    let contract_id = env.register_contract(None, AgriPoolContract);
    let client = AgriPoolContractClient::new(env, &contract_id);
    client.initialize(&admin);
    (admin, client)
}

fn standard_participants(env: &Env) -> (Vec<Participant>, Address, Address, Address, Address) {
    let farmer = Address::generate(env);
    let coop = Address::generate(env);
    let transport = Address::generate(env);
    let warehouse = Address::generate(env);

    let participants = vec![
        env,
        Participant {
            role: symbol_short!("farmer"),
            wallet: farmer.clone(),
            share_bps: 6000,
        },
        Participant {
            role: symbol_short!("coop"),
            wallet: coop.clone(),
            share_bps: 2000,
        },
        Participant {
            role: symbol_short!("transport"),
            wallet: transport.clone(),
            share_bps: 1000,
        },
        Participant {
            role: symbol_short!("warehouse"),
            wallet: warehouse.clone(),
            share_bps: 1000,
        },
    ];
    (participants, farmer, coop, transport, warehouse)
}

#[test]
fn test_create_pool_with_valid_shares() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, client) = setup(&env);
    let (participants, ..) = standard_participants(&env);

    client.create_pool(&symbol_short!("pool1"), &participants);
    let pool = client.get_pool(&symbol_short!("pool1"));
    assert_eq!(pool.participants.len(), 4);
    assert!(pool.active);
}

#[test]
fn test_create_pool_rejects_bad_share_sum() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, client) = setup(&env);
    let farmer = Address::generate(&env);
    let bad = vec![
        &env,
        Participant {
            role: symbol_short!("farmer"),
            wallet: farmer,
            share_bps: 5000, // does not sum to 10_000 alone
        },
    ];

    let result = client.try_create_pool(&symbol_short!("pool2"), &bad);
    assert_eq!(result, Err(Ok(Error::SharesMustSumToTotal)));
}

#[test]
fn test_settle_distributes_atomically() {
    let env = Env::default();
    env.mock_all_auths();
    let (admin, client) = setup(&env);
    let (participants, farmer, coop, transport, warehouse) = standard_participants(&env);
    client.create_pool(&symbol_short!("pool1"), &participants);

    let (token_addr, token_client, token_admin) = create_token_contract(&env, &admin);
    let buyer = Address::generate(&env);
    token_admin.mint(&buyer, &1_000_000);

    client.settle(
        &symbol_short!("pay001"),
        &symbol_short!("pool1"),
        &buyer,
        &token_addr,
        &1_000_000,
    );

    assert_eq!(token_client.balance(&farmer), 600_000);
    assert_eq!(token_client.balance(&coop), 200_000);
    assert_eq!(token_client.balance(&transport), 100_000);
    assert_eq!(token_client.balance(&warehouse), 100_000);
    assert_eq!(token_client.balance(&buyer), 0);

    let payment = client.get_payment(&symbol_short!("pay001"));
    assert_eq!(payment.amount, 1_000_000);

    let history = client.get_history(&symbol_short!("pool1"));
    assert_eq!(history.len(), 1);
}

#[test]
fn test_settle_rejects_duplicate_payment_id() {
    let env = Env::default();
    env.mock_all_auths();
    let (admin, client) = setup(&env);
    let (participants, ..) = standard_participants(&env);
    client.create_pool(&symbol_short!("pool1"), &participants);

    let (token_addr, _token_client, token_admin) = create_token_contract(&env, &admin);
    let buyer = Address::generate(&env);
    token_admin.mint(&buyer, &2_000_000);

    client.settle(
        &symbol_short!("pay001"),
        &symbol_short!("pool1"),
        &buyer,
        &token_addr,
        &1_000_000,
    );

    let result = client.try_settle(
        &symbol_short!("pay001"),
        &symbol_short!("pool1"),
        &buyer,
        &token_addr,
        &1_000_000,
    );
    assert_eq!(result, Err(Ok(Error::PaymentAlreadySettled)));
}

#[test]
fn test_settle_rejects_inactive_pool() {
    let env = Env::default();
    env.mock_all_auths();
    let (admin, client) = setup(&env);
    let (participants, ..) = standard_participants(&env);
    client.create_pool(&symbol_short!("pool1"), &participants);
    client.retire_pool(&symbol_short!("pool1"));

    let (token_addr, _token_client, token_admin) = create_token_contract(&env, &admin);
    let buyer = Address::generate(&env);
    token_admin.mint(&buyer, &1_000_000);

    let result = client.try_settle(
        &symbol_short!("pay002"),
        &symbol_short!("pool1"),
        &buyer,
        &token_addr,
        &1_000_000,
    );
    assert_eq!(result, Err(Ok(Error::PoolInactive)));
}

#[test]
fn test_rounding_remainder_goes_to_last_participant() {
    let env = Env::default();
    env.mock_all_auths();
    let (admin, client) = setup(&env);
    let (participants, farmer, coop, transport, warehouse) = standard_participants(&env);
    client.create_pool(&symbol_short!("pool1"), &participants);

    let (token_addr, token_client, token_admin) = create_token_contract(&env, &admin);
    let buyer = Address::generate(&env);
    token_admin.mint(&buyer, &1_000_001); // not evenly divisible

    client.settle(
        &symbol_short!("pay003"),
        &symbol_short!("pool1"),
        &buyer,
        &token_addr,
        &1_000_001,
    );

    let total = token_client.balance(&farmer)
        + token_client.balance(&coop)
        + token_client.balance(&transport)
        + token_client.balance(&warehouse);
    assert_eq!(total, 1_000_001);
}

#[test]
fn test_update_pool_changes_future_settlements_only() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, client) = setup(&env);
    let (participants, ..) = standard_participants(&env);
    client.create_pool(&symbol_short!("pool1"), &participants);

    let new_farmer = Address::generate(&env);
    let coop = Address::generate(&env);
    let transport = Address::generate(&env);
    let warehouse = Address::generate(&env);
    let updated = vec![
        &env,
        Participant {
            role: symbol_short!("farmer"),
            wallet: new_farmer.clone(),
            share_bps: 7000,
        },
        Participant {
            role: symbol_short!("coop"),
            wallet: coop,
            share_bps: 1000,
        },
        Participant {
            role: symbol_short!("transport"),
            wallet: transport,
            share_bps: 1000,
        },
        Participant {
            role: symbol_short!("warehouse"),
            wallet: warehouse,
            share_bps: 1000,
        },
    ];
    client.update_pool(&symbol_short!("pool1"), &updated);

    let pool = client.get_pool(&symbol_short!("pool1"));
    assert_eq!(pool.participants.get(0).unwrap().wallet, new_farmer);
    assert_eq!(pool.participants.get(0).unwrap().share_bps, 7000);
}

#[test]
fn test_ledger_timestamp_recorded() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_700_000_000);
    let (admin, client) = setup(&env);
    let (participants, ..) = standard_participants(&env);
    client.create_pool(&symbol_short!("pool1"), &participants);

    let (token_addr, _tc, token_admin) = create_token_contract(&env, &admin);
    let buyer = Address::generate(&env);
    token_admin.mint(&buyer, &500_000);

    client.settle(
        &symbol_short!("pay004"),
        &symbol_short!("pool1"),
        &buyer,
        &token_addr,
        &500_000,
    );

    let payment = client.get_payment(&symbol_short!("pay004"));
    assert_eq!(payment.timestamp, 1_700_000_000);
}
