use candid::Principal;
use ic_cdk::{init, post_upgrade, pre_upgrade};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, Storable, storable::Bound};
use rand::rngs::StdRng;
use rand::{RngCore, SeedableRng};
use getrandom::register_custom_getrandom;
use std::time::Duration;
use std::cell::RefCell;
use crate::models::{Organization, Product, User, Reseller, ProductSerialNumber, ProductVerification};

// Implement Storable trait for all model types
mod stable_impls {
    use super::*;
    use std::borrow::Cow;
    use std::collections::HashMap;
    use candid::{CandidType, Decode, Encode};

    impl Storable for Organization {
        fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
            Cow::Owned(Encode!(self).unwrap())
        }

        fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
            Decode!(bytes.as_ref(), Self).unwrap()
        }

        const BOUND: Bound = Bound::Unbounded;
    }

    impl Storable for Product {
        fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
            Cow::Owned(Encode!(self).unwrap())
        }

        fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
            Decode!(bytes.as_ref(), Self).unwrap()
        }

        const BOUND: Bound = Bound::Unbounded;
    }

    impl Storable for User {
        fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
            Cow::Owned(Encode!(self).unwrap())
        }

        fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
            Decode!(bytes.as_ref(), Self).unwrap()
        }

        const BOUND: Bound = Bound::Unbounded;
    }

    impl Storable for Reseller {
        fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
            Cow::Owned(Encode!(self).unwrap())
        }

        fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
            Decode!(bytes.as_ref(), Self).unwrap()
        }

        const BOUND: Bound = Bound::Unbounded;
    }

    impl Storable for ProductSerialNumber {
        fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
            Cow::Owned(Encode!(self).unwrap())
        }

        fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
            Decode!(bytes.as_ref(), Self).unwrap()
        }

        const BOUND: Bound = Bound::Unbounded;
    }

    impl Storable for ProductVerification {
        fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
            Cow::Owned(Encode!(self).unwrap())
        }

        fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
            Decode!(bytes.as_ref(), Self).unwrap()
        }

        const BOUND: Bound = Bound::Unbounded;
    }

    impl Storable for Principal {
        fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
            Cow::Owned(self.as_slice().to_vec())
        }

        fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
            Principal::from_slice(bytes.as_ref())
        }

        const BOUND: Bound = Bound::Unbounded;
    }

    impl Storable for Vec<ProductSerialNumber> {
        fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
            Cow::Owned(Encode!(self).unwrap())
        }

        fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
            Decode!(bytes.as_ref(), Self).unwrap()
        }

        // Use a reasonably large bound for a collection
        const BOUND: Bound = Bound::Unbounded;
    }

    impl Storable for Vec<ProductVerification> {
        fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
            Cow::Owned(Encode!(self).unwrap())
        }

        fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
            Decode!(bytes.as_ref(), Self).unwrap()
        }

        // Use a reasonably large bound for a collection
        const BOUND: Bound = Bound::Unbounded;
    }
}

// Define memory manager and memory regions
type Memory = VirtualMemory<DefaultMemoryImpl>;

const MEMORY_MANAGER_ID: MemoryId = MemoryId::new(0);
const ORGANIZATIONS_ID: MemoryId = MemoryId::new(1);
const PRODUCTS_ID: MemoryId = MemoryId::new(2);
const USERS_ID: MemoryId = MemoryId::new(3);
const RESELLERS_ID: MemoryId = MemoryId::new(4);
const PRODUCT_SERIAL_NUMBERS_ID: MemoryId = MemoryId::new(5);
const PRODUCT_VERIFICATIONS_ID: MemoryId = MemoryId::new(6);
const RNG_SEED_ID: MemoryId = MemoryId::new(7);

thread_local! {
    // Memory manager for stable memory allocations
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

    // Stable collections
    static ORGANIZATIONS: RefCell<StableBTreeMap<Principal, Organization, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(ORGANIZATIONS_ID))
        )
    );

    static PRODUCTS: RefCell<StableBTreeMap<Principal, Product, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(PRODUCTS_ID))
        )
    );

    static USERS: RefCell<StableBTreeMap<Principal, User, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(USERS_ID))
        )
    );

    static RESELLERS: RefCell<StableBTreeMap<Principal, Reseller, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(RESELLERS_ID))
        )
    );

    static PRODUCT_SERIAL_NUMBERS: RefCell<StableBTreeMap<Principal, Vec<ProductSerialNumber>, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(PRODUCT_SERIAL_NUMBERS_ID))
        )
    );

    static PRODUCT_VERIFICATIONS: RefCell<StableBTreeMap<Principal, Vec<ProductVerification>, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(PRODUCT_VERIFICATIONS_ID))
        )
    );

    // RNG for random operations
    static RNG: RefCell<Option<StdRng>> = RefCell::new(None);
}

fn _restart_rng() {
    // Need to reset the RNG each time the canister is restarted
    let _timer_id = ic_cdk_timers::set_timer(Duration::ZERO, || ic_cdk::spawn(async {
        let (seed,): ([u8; 32],) = ic_cdk::call(Principal::management_canister(), "raw_rand", ()).await.unwrap();
        ic_cdk::print("📝 INFO: Got random seed for RNG");
        RNG.with(|rng| *rng.borrow_mut() = Some(StdRng::from_seed(seed)));
    }));
    ic_cdk::print(format!("📝 INFO: Registered RNG timer {:?}", _timer_id));
}

#[pre_upgrade]
fn pre_upgrade() {
    ic_cdk::print("📝 INFO: Running pre_upgrade to prepare for canister upgrade");
    // No special handling needed as data is already in stable storage
}

#[post_upgrade]
fn post_upgrade() {
    ic_cdk::print("📝 INFO: Running post_upgrade after canister upgrade");
    _restart_rng();
}

#[init]
fn init() {
    ic_cdk::print("📝 INFO: Initializing canister");
    _restart_rng();
}

fn custom_getrandom(buf: &mut [u8]) -> Result<(), getrandom::Error> {
    ic_cdk::println!("custom_getrandom");
    RNG.with(|rng| rng.borrow_mut().as_mut().unwrap().fill_bytes(buf));
    Ok(())
}
register_custom_getrandom!(custom_getrandom);

// Expose storage access functions to be used by storage.rs
pub mod stable_storage {
    use super::*;
    
    pub fn with_organizations<R, F: FnOnce(&StableBTreeMap<Principal, Organization, Memory>) -> R>(f: F) -> R {
        ORGANIZATIONS.with(|organizations| {
            f(&organizations.borrow())
        })
    }
    
    pub fn with_organizations_mut<R, F: FnOnce(&mut StableBTreeMap<Principal, Organization, Memory>) -> R>(f: F) -> R {
        ORGANIZATIONS.with(|organizations| {
            f(&mut organizations.borrow_mut())
        })
    }
    
    pub fn with_products<R, F: FnOnce(&StableBTreeMap<Principal, Product, Memory>) -> R>(f: F) -> R {
        PRODUCTS.with(|products| {
            f(&products.borrow())
        })
    }
    
    pub fn with_products_mut<R, F: FnOnce(&mut StableBTreeMap<Principal, Product, Memory>) -> R>(f: F) -> R {
        PRODUCTS.with(|products| {
            f(&mut products.borrow_mut())
        })
    }
    
    pub fn with_users<R, F: FnOnce(&StableBTreeMap<Principal, User, Memory>) -> R>(f: F) -> R {
        USERS.with(|users| {
            f(&users.borrow())
        })
    }
    
    pub fn with_users_mut<R, F: FnOnce(&mut StableBTreeMap<Principal, User, Memory>) -> R>(f: F) -> R {
        USERS.with(|users| {
            f(&mut users.borrow_mut())
        })
    }
    
    pub fn with_resellers<R, F: FnOnce(&StableBTreeMap<Principal, Reseller, Memory>) -> R>(f: F) -> R {
        RESELLERS.with(|resellers| {
            f(&resellers.borrow())
        })
    }
    
    pub fn with_resellers_mut<R, F: FnOnce(&mut StableBTreeMap<Principal, Reseller, Memory>) -> R>(f: F) -> R {
        RESELLERS.with(|resellers| {
            f(&mut resellers.borrow_mut())
        })
    }
    
    pub fn with_product_serial_numbers<R, F: FnOnce(&StableBTreeMap<Principal, Vec<ProductSerialNumber>, Memory>) -> R>(f: F) -> R {
        PRODUCT_SERIAL_NUMBERS.with(|serial_numbers| {
            f(&serial_numbers.borrow())
        })
    }
    
    pub fn with_product_serial_numbers_mut<R, F: FnOnce(&mut StableBTreeMap<Principal, Vec<ProductSerialNumber>, Memory>) -> R>(f: F) -> R {
        PRODUCT_SERIAL_NUMBERS.with(|serial_numbers| {
            f(&mut serial_numbers.borrow_mut())
        })
    }
    
    pub fn with_product_verifications<R, F: FnOnce(&StableBTreeMap<Principal, Vec<ProductVerification>, Memory>) -> R>(f: F) -> R {
        PRODUCT_VERIFICATIONS.with(|verifications| {
            f(&verifications.borrow())
        })
    }
    
    pub fn with_product_verifications_mut<R, F: FnOnce(&mut StableBTreeMap<Principal, Vec<ProductVerification>, Memory>) -> R>(f: F) -> R {
        PRODUCT_VERIFICATIONS.with(|verifications| {
            f(&mut verifications.borrow_mut())
        })
    }
}
