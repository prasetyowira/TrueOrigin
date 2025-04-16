use candid::Principal;
use ic_cdk::{init, post_upgrade};
use rand::rngs::StdRng;
use rand::{RngCore, SeedableRng};
use getrandom::register_custom_getrandom;
use std::time::Duration;
use std::{cell::RefCell, collections::HashMap};
use std::sync::Mutex;
use lazy_static::lazy_static;
use crate::models::{Organization, Product, User, Reseller, ProductSerialNumber, ProductVerification};

// TODO: Replace in-memory global state with stable storage
// Current implementation uses Mutex-protected HashMaps that are lost on upgrades
// Should be replaced with:
// 1. StableBTreeMap from ic-stable-structures for all collections
// 2. Proper versioning and migration strategy for canister upgrades
// 3. Consider memory efficiency and pagination for large datasets
// 4. Implement proper indices for efficient querying

thread_local! {
    static RNG: RefCell<Option<StdRng>> = RefCell::new(None);
}

fn _restart_rng() {
    // need to reset the RNG each time the canister is restarted
    let _timer_id = ic_cdk_timers::set_timer(Duration::ZERO, || ic_cdk::spawn(async {
        let (seed,): ([u8; 32],) = ic_cdk::call(Principal::management_canister(), "raw_rand", ()).await.unwrap();
        ic_cdk::println!("Got seed");
        RNG.with(|rng| *rng.borrow_mut() = Some(StdRng::from_seed(seed)));
    }));
    ic_cdk::println!("registered timer {:?}", _timer_id);
}

#[post_upgrade]
fn post_upgrade() {
    _restart_rng();
}

#[init]
fn init() {
    _restart_rng();
}

fn custom_getrandom(buf: &mut [u8]) -> Result<(), getrandom::Error> {
    ic_cdk::println!("custom_getrandom");
    RNG.with(|rng| rng.borrow_mut().as_mut().unwrap().fill_bytes(buf));
    Ok(())
}
register_custom_getrandom!(custom_getrandom);

lazy_static! {
    pub static ref ORGANIZATIONS: Mutex<HashMap<Principal, Organization>> = Mutex::new(HashMap::new());
    pub static ref PRODUCTS: Mutex<HashMap<Principal, Product>> = Mutex::new(HashMap::new());
    pub static ref USERS: Mutex<HashMap<Principal, User>> = Mutex::new(HashMap::new());
    pub static ref RESELLERS: Mutex<HashMap<Principal, Reseller>> = Mutex::new(HashMap::new());
    pub static ref PRODUCT_SERIAL_NUMBERS: Mutex<HashMap<Principal, Vec<ProductSerialNumber>>> = Mutex::new(HashMap::new());
    pub static ref PRODUCT_VERIFICATIONS: Mutex<HashMap<Principal, Vec<ProductVerification>>> = Mutex::new(HashMap::new());
}
