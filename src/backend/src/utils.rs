use candid::Principal;
use ic_cdk::api::time;
use sha2::{Sha256, Digest};
use std::time::Duration;
use futures::channel::oneshot;
use ic_cdk_timers::set_timer;


pub fn generate_unique_principal(principal: Principal) -> Principal {
    // Combine the principal text and the current time
    let input = format!("{}-{}", principal.to_text(), time());

    // Hash the combined input using SHA-256
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    let result = hasher.finalize();

    // Take the first 29 bytes of the hash and convert it into a Principal
    let principal_bytes: [u8; 29] = result[0..29].try_into().expect("slice with incorrect length");

    Principal::from_slice(&principal_bytes)
}

/// Creates a future that completes after the specified duration.
/// Uses a oneshot channel and `ic_cdk_timers::set_timer`.
pub async fn async_delay(duration: Duration) {
    let (tx, rx) = oneshot::channel::<()>();
    ic_cdk::print(format!("⏱️ Setting timer for {:?}", duration)); // Optional: Log timer setting
    set_timer(duration, move || {
        let _ = tx.send(()); // Signal completion, ignore result
    });
    match rx.await {
        Ok(_) => { /* Timer completed successfully */ }
        Err(e) => {
            // This should ideally not happen in canister environment unless timer logic fails
            ic_cdk::print(format!("❌ ERROR: Timer future cancelled: {:?}", e));
        }
    }
}

