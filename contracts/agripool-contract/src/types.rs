use soroban_sdk::{contracterror, contracttype, Address, Symbol, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Participant {
    /// Short role tag, e.g. "farmer", "cooperative", "transport", "warehouse".
    pub role: Symbol,
    pub wallet: Address,
    /// Basis points (1/100 of a percent). All shares in a pool must sum to 10_000.
    pub share_bps: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Pool {
    pub pool_id: Symbol,
    pub participants: Vec<Participant>,
    pub active: bool,
    pub payment_count: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Payment {
    pub payment_id: Symbol,
    pub pool_id: Symbol,
    pub payer: Address,
    pub token: Address,
    pub amount: i128,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Pool(Symbol),
    Payment(Symbol),
    History(Symbol),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    PoolAlreadyExists = 3,
    PoolNotFound = 4,
    PoolInactive = 5,
    InvalidParticipantCount = 6,
    InvalidShare = 7,
    SharesMustSumToTotal = 8,
    InvalidAmount = 9,
    PaymentAlreadySettled = 10,
    PaymentNotFound = 11,
}
