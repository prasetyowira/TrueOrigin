use candid::{encode_one, decode_one, Principal, CandidType, Deserialize};
use ic_cdk::{init, post_upgrade};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{storable::Bound, DefaultMemoryImpl, StableBTreeMap, Storable};
use rand::rngs::StdRng;
use rand::{RngCore, SeedableRng};
use getrandom::register_custom_getrandom;
use std::borrow::Cow;
use std::time::Duration;
use std::{cell::RefCell};
use serde::Serialize;
use crate::models::{Organization, Product, User, Reseller, ProductSerialNumber, ProductVerification};

// Define Memory IDs for stable structures
const ORGANIZATION_MEM_ID: MemoryId = MemoryId::new(0);
const PRODUCT_MEM_ID: MemoryId = MemoryId::new(1);
const USER_MEM_ID: MemoryId = MemoryId::new(2);
const RESELLER_MEM_ID: MemoryId = MemoryId::new(3);
const PRODUCT_SERIAL_NUMBER_MEM_ID: MemoryId = MemoryId::new(4);
const PRODUCT_VERIFICATION_MEM_ID: MemoryId = MemoryId::new(5);

// Type aliases for memory and stable structures
type Memory = VirtualMemory<DefaultMemoryImpl>;

// Wrapper struct for Vec<u8> to implement Storable (solves orphan rule)
#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Default, PartialEq, Eq, PartialOrd, Ord)]
pub struct StorableBytes(pub Vec<u8>);

impl Storable for StorableBytes {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Borrowed(&self.0)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        StorableBytes(bytes.into_owned())
    }

    const BOUND: Bound = Bound::Unbounded;
}

thread_local! {
    static RNG: RefCell<Option<StdRng>> = RefCell::new(None);

    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    pub static ORGANIZATIONS: RefCell<StableBTreeMap<Principal, Organization, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(ORGANIZATION_MEM_ID)))
    );

    pub static PRODUCTS: RefCell<StableBTreeMap<Principal, Product, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(PRODUCT_MEM_ID)))
    );

    pub static USERS: RefCell<StableBTreeMap<Principal, User, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(USER_MEM_ID)))
    );

    pub static RESELLERS: RefCell<StableBTreeMap<Principal, Reseller, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(RESELLER_MEM_ID)))
    );

    pub static PRODUCT_SERIAL_NUMBERS: RefCell<StableBTreeMap<Principal, StorableBytes, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(PRODUCT_SERIAL_NUMBER_MEM_ID)))
    );

    pub static PRODUCT_VERIFICATIONS: RefCell<StableBTreeMap<Principal, StorableBytes, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(PRODUCT_VERIFICATION_MEM_ID)))
    );
}

pub fn decode_product_serial_numbers(storable_bytes: &StorableBytes) -> Vec<ProductSerialNumber> {
    decode_one(&storable_bytes.0).expect("Failed to decode Vec<ProductSerialNumber>")
}

pub fn encode_product_serial_numbers(data: &Vec<ProductSerialNumber>) -> StorableBytes {
    StorableBytes(encode_one(data).expect("Failed to encode Vec<ProductSerialNumber>"))
}

pub fn decode_product_verifications(storable_bytes: &StorableBytes) -> Vec<ProductVerification> {
    decode_one(&storable_bytes.0).expect("Failed to decode Vec<ProductVerification>")
}

pub fn encode_product_verifications(data: &Vec<ProductVerification>) -> StorableBytes {
    StorableBytes(encode_one(data).expect("Failed to encode Vec<ProductVerification>"))
}

fn _restart_rng() {
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
