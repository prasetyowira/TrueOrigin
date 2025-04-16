use candid::Principal;
use ic_cdk::api::{self, time};
use rand::{rngs::StdRng, SeedableRng};
use k256::ecdsa::SigningKey;

use crate::auth::authorize_user_organization;
use crate::error::GenericError;
use crate::models::{Organization, OrganizationInput, OrganizationPublic, OrganizationResult, PrivateKeyResult};
use crate::global_state::ORGANIZATIONS;
use crate::utils::generate_unique_principal;

/// Get organization by ID
pub fn get_by_id(id: Principal) -> OrganizationResult {
    ic_cdk::print(format!("📝 INFO: Fetching organization with id: {}", id.to_text()));
    
    let organizations = ORGANIZATIONS.lock().unwrap();
    match organizations.get(&id) {
        Some(org) => {
            ic_cdk::print("📝 INFO: Organization found");
            OrganizationResult::Organization(OrganizationPublic::from(org.clone()))
        },
        None => {
            ic_cdk::print("❌ ERROR: Organization not found");
            OrganizationResult::Error(GenericError {
                message: "Cannot find organization!".to_string(),
                ..Default::default()
            })
        }
    }
}

/// Create a new organization
pub fn create(input: OrganizationInput) -> OrganizationPublic {
    ic_cdk::print(format!("📝 INFO: Creating organization: {}", input.name));
    
    let id = generate_unique_principal(Principal::anonymous());
    
    // Generate ECDSA keys for the organization
    let mut rng = StdRng::from_entropy();
    let signing_key = SigningKey::random(&mut rng);
    
    let organization = Organization {
        id,
        name: input.name,
        private_key: hex::encode(&signing_key.to_bytes()),
        description: input.description,
        metadata: input.metadata,
        created_at: time(),
        created_by: api::caller(),
        updated_at: time(),
        updated_by: api::caller(),
    };
    
    let mut organizations = ORGANIZATIONS.lock().unwrap();
    organizations.insert(id, organization.clone());
    
    ic_cdk::print(format!("📝 INFO: Organization created with id: {}", id.to_text()));
    OrganizationPublic::from(organization)
}

/// Update an existing organization
pub fn update(id: Principal, input: OrganizationInput) -> OrganizationResult {
    ic_cdk::print(format!("📝 INFO: Updating organization with id: {}", id.to_text()));
    
    let mut organizations = ORGANIZATIONS.lock().unwrap();
    match organizations.get_mut(&id) {
        Some(org) => {
            org.name = input.name;
            org.description = input.description;
            org.metadata = input.metadata;
            org.updated_at = time();
            org.updated_by = api::caller();
            
            ic_cdk::print("📝 INFO: Organization updated successfully");
            OrganizationResult::Organization(OrganizationPublic::from(org.clone()))
        },
        None => {
            ic_cdk::print("❌ ERROR: Organization not found for update");
            OrganizationResult::Error(GenericError {
                message: "Organization not found!".to_string(),
                ..Default::default()
            })
        }
    }
}

/// Get organization's private key (requires authorization)
pub fn get_private_key(org_id: Principal) -> PrivateKeyResult {
    ic_cdk::print(format!("📝 INFO: Fetching private key for organization: {}", org_id.to_text()));
    
    match authorize_user_organization(api::caller(), org_id) {
        Ok(org) => {
            ic_cdk::print("📝 INFO: Access authorized, returning private key");
            PrivateKeyResult::Key(org.private_key)
        },
        Err(err) => {
            ic_cdk::print(format!("❌ ERROR: Authorization failed: {}", err.message));
            PrivateKeyResult::Error(err)
        }
    }
}

/// Find organizations by name (case-insensitive, partial match)
pub fn find_by_name(name: String) -> Vec<OrganizationPublic> {
    ic_cdk::print(format!("📝 INFO: Searching for organizations with name: {}", name));
    
    let filter = name.trim().to_lowercase();
    let result = ORGANIZATIONS.lock().unwrap().values()
        .filter(|org| org.name.to_lowercase().contains(&filter))
        .map(|org| OrganizationPublic::from(org.clone()))
        .collect();
    
    ic_cdk::print(format!("📝 INFO: Found {} matching organizations", result.len()));
    result
} 