use candid::Principal;
use ic_cdk::api::{self, time};
use k256::ecdsa::SigningKey;

use crate::error::GenericError;
use crate::global_state::{ORGANIZATIONS, RESELLERS};
use crate::models::{Metadata, ResellerInput, ResellerVerificationResult, ResellerVerificationResultRecord, Reseller, UniqueCodeResult, VerificationStatus};
use crate::utils::generate_unique_principal;

/// Create a new reseller
pub fn create_reseller(input: ResellerInput, user_id: Principal) -> Reseller {
    ic_cdk::print(format!("📝 INFO: Creating reseller for organization: {}", input.org_id.to_text()));
    
    let id = generate_unique_principal(Principal::anonymous());
    let reseller_id = format!("RS-{}", hex::encode(&id.as_slice()[0..4]));
    
    let reseller = Reseller {
        id,
        org_id: input.org_id,
        reseller_id,
        name: input.name,
        date_joined: time(),
        metadata: input.metadata,
        ecommerce_urls: input.ecommerce_urls,
        created_at: time(),
        created_by: user_id,
        updated_at: time(),
        updated_by: user_id,
    };
    
    let mut resellers = RESELLERS.lock().unwrap();
    resellers.insert(id, reseller.clone());
    
    ic_cdk::print(format!("📝 INFO: Reseller created with id: {}", id.to_text()));
    reseller
}

/// Find resellers by name or ID
pub fn find_by_name_or_id(query: String) -> Vec<Reseller> {
    ic_cdk::print(format!("📝 INFO: Searching for resellers with query: {}", query));
    
    let filter = query.trim().to_lowercase();
    let result = RESELLERS.lock().unwrap().values()
        .filter(|r| 
            r.name.to_lowercase().contains(&filter) || 
            r.reseller_id.to_lowercase().contains(&filter)
        )
        .cloned()
        .collect();
    
    ic_cdk::print(format!("📝 INFO: Found {} matching resellers", result.len()));
    result
}

/// Verify reseller using unique code
pub fn verify(reseller_id: Principal, unique_code: String) -> ResellerVerificationResult {
    ic_cdk::print(format!("📝 INFO: Verifying reseller: {} with code: {}", 
        reseller_id.to_text(), unique_code));
    
    let resellers = RESELLERS.lock().unwrap();
    let reseller = match resellers.get(&reseller_id) {
        Some(r) => r,
        None => {
            ic_cdk::print("❌ ERROR: Reseller not found");
            return ResellerVerificationResult::Error(GenericError {
                message: "Reseller not found!".to_string(),
                ..Default::default()
            });
        }
    };
    
    // TODO: Implement actual verification logic for the unique code
    // Current implementation does not verify the code at all
    // Should include:
    // 1. Compare with stored/expected unique code
    // 2. Check for code expiration if applicable
    // 3. Validate against replay attacks
    
    let organizations = ORGANIZATIONS.lock().unwrap();
    let organization = match organizations.get(&reseller.org_id) {
        Some(org) => org,
        None => {
            ic_cdk::print("❌ ERROR: Organization not found for reseller");
            return ResellerVerificationResult::Error(GenericError {
                message: "Organization not found!".to_string(),
                ..Default::default()
            });
        }
    };
    
    ic_cdk::print("📝 INFO: Reseller verified successfully");
    
    // Return verification result
    ResellerVerificationResult::Result(ResellerVerificationResultRecord {
        status: VerificationStatus::Success,
        organization: organization.clone().into(),
        registered_at: Some(reseller.date_joined),
    })
}

/// Generate a unique code for reseller verification
pub fn generate_unique_code(reseller_id: Principal) -> UniqueCodeResult {
    ic_cdk::print(format!("📝 INFO: Generating unique code for reseller: {}", reseller_id.to_text()));
    
    let resellers = RESELLERS.lock().unwrap();
    let reseller = match resellers.get(&reseller_id) {
        Some(r) => r,
        None => {
            ic_cdk::print("❌ ERROR: Reseller not found");
            return UniqueCodeResult::Error(GenericError {
                message: "Reseller not found!".to_string(),
                ..Default::default()
            });
        }
    };
    
    // Generate a unique code based on reseller ID and timestamp
    let timestamp = time().to_string();
    let mut hasher = sha2::Sha256::new();
    sha2::Digest::update(&mut hasher, format!("{}:{}", reseller.reseller_id, timestamp).as_bytes());
    let result = hasher.finalize();
    let unique_code = hex::encode(&result[0..8]); // Use first 8 bytes
    
    ic_cdk::print(format!("📝 INFO: Generated unique code: {}", unique_code));
    UniqueCodeResult::Code(unique_code)
} 