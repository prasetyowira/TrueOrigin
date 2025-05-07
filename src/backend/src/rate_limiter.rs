use std::borrow::Cow;
use std::collections::HashMap;
use std::cell::RefCell;

use candid::{CandidType, Deserialize, Principal, encode_one, decode_one};
use ic_cdk::api;
use ic_stable_structures::{DefaultMemoryImpl, Storable, StableBTreeMap, memory_manager::{MemoryId, MemoryManager, VirtualMemory}};

use crate::api::RateLimitInfo;
use crate::error::ApiError;
// Import the shared memory manager
use crate::global_state::MEMORY_MANAGER;

// Default values for rate limiting
const MAX_ATTEMPTS_PER_WINDOW: u32 = 5;
const WINDOW_DURATION_SECONDS: u64 = 60 * 5; // 5 minutes

// Define a unique MemoryId for this structure
const RATE_LIMIT_MEM_ID: MemoryId = MemoryId::new(6);

// Type definitions for rate limiting
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct RateLimitEntry {
    pub principal_id: Principal,
    pub product_id: Principal, 
    pub attempts: u32,
    pub window_start: u64,
    pub last_attempt: u64,
}

impl Storable for RateLimitEntry {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(encode_one(self).expect("Failed to encode"))
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        decode_one(&bytes).expect("Failed to decode")
    }

    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;
}

// Key for rate limit entries: combination of user ID and product ID
#[derive(CandidType, Deserialize, Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct RateLimitKey {
    pub user_id: Principal,
    pub product_id: Principal,
}

impl Storable for RateLimitKey {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(encode_one(self).expect("Failed to encode"))
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        decode_one(&bytes).expect("Failed to decode")
    }

    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;
}

// Use the standard Memory type alias if it's defined globally, or define it here
type Memory = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    // Initialize RATE_LIMITS using the shared MEMORY_MANAGER and the specific MemoryId
    static RATE_LIMITS: RefCell<StableBTreeMap<RateLimitKey, RateLimitEntry, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(RATE_LIMIT_MEM_ID))
        )
    );
}

// Helper function to create a rate limit key
fn create_rate_limit_key(user_id: Principal, product_id: Principal) -> RateLimitKey {
    RateLimitKey {
        user_id,
        product_id,
    }
}

// Check if a user is rate limited for verifying a specific product
pub fn check_rate_limit(user_id: Principal, product_id: Principal) -> Result<RateLimitInfo, ApiError> {
    let key = create_rate_limit_key(user_id, product_id);
    let current_time = api::time();

    RATE_LIMITS.with(|rate_limits| {
        let rate_limits_ref = rate_limits.borrow();
        
        let entry = match rate_limits_ref.get(&key) {
            Some(mut entry) => {
                if current_time > entry.window_start + WINDOW_DURATION_SECONDS {
                    RateLimitEntry {
                        attempts: 0,
                        window_start: current_time,
                        ..entry.clone()
                    }
                } else {
                    entry.clone()
                }
            },
            None => {
                RateLimitEntry {
                    principal_id: user_id,
                    product_id,
                    attempts: 0,
                    window_start: current_time,
                    last_attempt: 0,
                }
            }
        };

        let remaining_attempts = if entry.attempts >= MAX_ATTEMPTS_PER_WINDOW {
            0
        } else {
            MAX_ATTEMPTS_PER_WINDOW - entry.attempts
        };

        let reset_time = entry.window_start + WINDOW_DURATION_SECONDS;

        Ok(RateLimitInfo {
            remaining_attempts,
            reset_time,
            current_window_start: entry.window_start,
        })
    })
}

// Record an attempt and check if rate limited
pub fn record_verification_attempt(user_id: Principal, product_id: Principal) -> Result<RateLimitInfo, ApiError> {
    let key = create_rate_limit_key(user_id, product_id);
    let current_time = api::time();

    RATE_LIMITS.with(|rate_limits| {
        let mut rate_limits_mut = rate_limits.borrow_mut();
        
        // Get or create rate limit entry
        let mut entry = match rate_limits_mut.get(&key) {
            Some(mut entry) => {
                // Check if window has expired and reset if needed
                if current_time > entry.window_start + WINDOW_DURATION_SECONDS {
                    // Reset the window
                    entry.window_start = current_time;
                    entry.attempts = 0;
                }
                entry
            },
            None => {
                // Create new entry
                RateLimitEntry {
                    principal_id: user_id,
                    product_id,
                    attempts: 0,
                    window_start: current_time,
                    last_attempt: 0,
                }
            }
        };

        // Check if rate limited
        if entry.attempts >= MAX_ATTEMPTS_PER_WINDOW {
            return Err(ApiError::invalid_input(
                &format!("Rate limit exceeded. Try again after {}", entry.window_start + WINDOW_DURATION_SECONDS)
            ));
        }

        // Increment attempts and update last attempt time
        entry.attempts += 1;
        entry.last_attempt = current_time;

        // Update entry
        rate_limits_mut.insert(key, entry.clone());

        let remaining_attempts = if entry.attempts >= MAX_ATTEMPTS_PER_WINDOW {
            0
        } else {
            MAX_ATTEMPTS_PER_WINDOW - entry.attempts
        };

        let reset_time = entry.window_start + WINDOW_DURATION_SECONDS;

        Ok(RateLimitInfo {
            remaining_attempts,
            reset_time,
            current_window_start: entry.window_start,
        })
    })
}

// Record a successful verification attempt
pub fn record_successful_verification(user_id: Principal, product_id: Principal) {
    let key = create_rate_limit_key(user_id, product_id);
    let current_time = api::time();

    RATE_LIMITS.with(|rate_limits| {
        let mut rate_limits_mut = rate_limits.borrow_mut();
        
        // Get or create rate limit entry
        if let Some(mut entry) = rate_limits_mut.get(&key) {
            // Update last attempt time for successful verification
            entry.last_attempt = current_time;
            
            // Update entry
            rate_limits_mut.insert(key, entry);
        }
    });
}

// Reset rate limit for a user and product
pub fn reset_rate_limit(user_id: Principal, product_id: Principal) {
    let key = create_rate_limit_key(user_id, product_id);
    RATE_LIMITS.with(|rate_limits| {
        let mut rate_limits_mut = rate_limits.borrow_mut();
        rate_limits_mut.remove(&key);
    });
}

// Reset ALL rate limits (use with caution)
pub fn reset_rate_limits() {
    RATE_LIMITS.with(|rate_limits| {
        let mut rate_limits_mut = rate_limits.borrow_mut();
        let keys: Vec<_> = rate_limits_mut.iter().map(|(k, _)| k).collect();
        for key in keys {
            rate_limits_mut.remove(&key);
        }
    });
    ic_cdk::print("ℹ️ All rate limits have been reset.");
} 