use candid::Principal;
use ic_cdk::api::time;
use sha2::{Sha256, Digest};


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

