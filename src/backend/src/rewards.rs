use std::borrow::Cow;
use std::cell::RefCell;

use candid::{decode_one, encode_one, CandidType, Deserialize, Principal};
use ic_cdk::api;
use ic_stable_structures::{memory_manager::{MemoryId, VirtualMemory}, DefaultMemoryImpl, StableBTreeMap, Storable};

use crate::api::VerificationRewards;
// Import the shared memory manager
use crate::global_state::MEMORY_MANAGER;
use crate::models::{Metadata, ProductVerificationStatus};

// Points awarded for different verification types
const FIRST_VERIFICATION_POINTS: u32 = 100;
const MULTIPLE_VERIFICATION_POINTS: u32 = 10;
const SPECIAL_PROMOTION_POINTS: u32 = 50;

// Expiration time for rewards (in seconds)
const REWARDS_EXPIRATION_TIME: u64 = 86400 * 30; // 30 days

// Define unique Memory IDs for the structures in this module
const USER_REWARDS_MEM_ID: MemoryId = MemoryId::new(7);
const USER_VERIFIED_PRODUCTS_MEM_ID: MemoryId = MemoryId::new(8);
const PROMOTIONS_MEM_ID: MemoryId = MemoryId::new(9);

// Type definitions for rewards
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UserRewards {
    pub user_id: Principal,
    pub total_points: u32,
    pub verification_count: u32,
    pub first_verifications: u32,
    pub last_reward_time: u64,
    pub metadata: Vec<Metadata>,
}

impl Storable for UserRewards {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(encode_one(self).expect("Failed to encode"))
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        decode_one(&bytes).expect("Failed to decode")
    }

    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;
}

// Record of products verified by a user to prevent duplicate first verification rewards
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UserVerifiedProducts {
    pub user_id: Principal,
    pub verified_products: Vec<Principal>,
}

impl Storable for UserVerifiedProducts {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(encode_one(self).expect("Failed to encode"))
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        decode_one(&bytes).expect("Failed to decode")
    }

    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;
}

// Use the standard Memory type alias
type Memory = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    // Initialize structures using the shared MEMORY_MANAGER and unique MemoryIds
    static USER_REWARDS: RefCell<StableBTreeMap<Principal, UserRewards, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(USER_REWARDS_MEM_ID))
        )
    );
    
    static USER_VERIFIED_PRODUCTS: RefCell<StableBTreeMap<Principal, UserVerifiedProducts, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(USER_VERIFIED_PRODUCTS_MEM_ID))
        )
    );

    static PROMOTIONS: RefCell<StableBTreeMap<Principal, Metadata, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(PROMOTIONS_MEM_ID))
        )
    );
}

// Check if this is the first time a user has verified this product
pub fn is_first_verification_for_user(user_id: Principal, product_id: Principal) -> bool {
    USER_VERIFIED_PRODUCTS.with(|verified_products| {
        let verified_products_ref = verified_products.borrow();
        
        match verified_products_ref.get(&user_id) {
            Some(user_verified) => !user_verified.verified_products.contains(&product_id),
            None => true,
        }
    })
}

// Record that a user has verified a product
pub fn record_product_verification(user_id: Principal, product_id: Principal) {
    USER_VERIFIED_PRODUCTS.with(|verified_products| {
        let mut verified_products_mut = verified_products.borrow_mut();
        
        match verified_products_mut.get(&user_id) {
            Some(user_verified) => {
                // Only add if not already verified
                if !user_verified.verified_products.contains(&product_id) {
                    let mut updated = user_verified.clone();
                    updated.verified_products.push(product_id);
                    verified_products_mut.insert(user_id, updated);
                }
            },
            None => {
                // Create new record
                let new_verified = UserVerifiedProducts {
                    user_id,
                    verified_products: vec![product_id],
                };
                verified_products_mut.insert(user_id, new_verified);
            }
        }
    });
}

// Calculate rewards for a verification
pub fn calculate_verification_rewards(
    user_id: Principal, 
    product_id: Principal, 
    verification_status: &ProductVerificationStatus
) -> VerificationRewards {
    let is_first_verification = is_first_verification_for_user(user_id, product_id);
    api::time();
    
    // Calculate points based on verification type
    let base_points = match verification_status {
        ProductVerificationStatus::FirstVerification => FIRST_VERIFICATION_POINTS,
        ProductVerificationStatus::MultipleVerification => MULTIPLE_VERIFICATION_POINTS,
        ProductVerificationStatus::Invalid => 0,
    };
    
    // Check for special promotions
    let special_reward = get_special_promotion(product_id);
    let promotion_points = if special_reward.is_some() { SPECIAL_PROMOTION_POINTS } else { 0 };
    
    // Record the verification if valid
    if *verification_status != ProductVerificationStatus::Invalid {
        record_product_verification(user_id, product_id);
    }
    
    // Update user rewards
    let total_points = base_points + promotion_points;
    
    if total_points > 0 {
        update_user_rewards(user_id, total_points, is_first_verification);
    }
    
    VerificationRewards {
        points: total_points,
        is_first_verification,
        special_reward: special_reward.as_ref().map(|m| m.value.clone()),
        reward_description: special_reward.as_ref().map(|m| format!("Special reward: {}", m.value)),
    }
}

// Update user rewards
fn update_user_rewards(user_id: Principal, points: u32, is_first_verification: bool) {
    USER_REWARDS.with(|rewards| {
        let mut rewards_mut = rewards.borrow_mut();
        
        match rewards_mut.get(&user_id) {
            Some(user_rewards) => {
                let mut updated = user_rewards.clone();
                updated.total_points += points;
                updated.verification_count += 1;
                if is_first_verification {
                    updated.first_verifications += 1;
                }
                updated.last_reward_time = api::time();
                
                rewards_mut.insert(user_id, updated);
            },
            None => {
                // Create new rewards record
                let new_rewards = UserRewards {
                    user_id,
                    total_points: points,
                    verification_count: 1,
                    first_verifications: if is_first_verification { 1 } else { 0 },
                    last_reward_time: api::time(),
                    metadata: Vec::new(),
                };
                
                rewards_mut.insert(user_id, new_rewards);
            }
        }
    });
}

// Get special promotion for a product if available
fn get_special_promotion(product_id: Principal) -> Option<Metadata> {
    PROMOTIONS.with(|promotions| {
        promotions.borrow().get(&product_id)
    })
}

// Add a special promotion for a product
pub fn add_special_promotion(product_id: Principal, promotion_name: &str, promotion_value: &str) {
    let metadata = Metadata {
        key: promotion_name.to_string(),
        value: promotion_value.to_string(),
    };
    
    PROMOTIONS.with(|promotions| {
        promotions.borrow_mut().insert(product_id, metadata);
    });
}

// Remove a special promotion
pub fn remove_special_promotion(product_id: Principal) {
    PROMOTIONS.with(|promotions| {
        promotions.borrow_mut().remove(&product_id);
    });
}

// Get user rewards
pub fn get_user_rewards(user_id: Principal) -> Option<UserRewards> {
    USER_REWARDS.with(|rewards| {
        rewards.borrow().get(&user_id)
    })
}

// Reset ALL rewards-related stable storage (use with caution)
pub fn reset_rewards_storage() {
    USER_REWARDS.with(|rewards| {
        let mut rewards_mut = rewards.borrow_mut();
        let keys: Vec<_> = rewards_mut.iter().map(|(k, _)| k).collect();
        for key in keys {
            rewards_mut.remove(&key);
        }
    });
    USER_VERIFIED_PRODUCTS.with(|verified| {
        let mut verified_mut = verified.borrow_mut();
        let keys: Vec<_> = verified_mut.iter().map(|(k, _)| k).collect();
        for key in keys {
            verified_mut.remove(&key);
        }
    });
    PROMOTIONS.with(|promos| {
        let mut promos_mut = promos.borrow_mut();
        let keys: Vec<_> = promos_mut.iter().map(|(k, _)| k).collect();
        for key in keys {
            promos_mut.remove(&key);
        }
    });
    ic_cdk::print("ℹ️ All rewards-related stable storage has been reset.");
}