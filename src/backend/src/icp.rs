use candid::Principal;
use ic_cdk::{api, query, update};
use k256::{
    ecdsa::{
        signature::{Signer, Verifier},
        Signature, SigningKey, VerifyingKey,
    },
    elliptic_curve::sec1::ToEncodedPoint,
    sha2::{Digest, Sha256},
    EncodedPoint, SecretKey,
};
use crate::auth::{authorize_for_organization, ensure_admin, Permission};
use crate::error::ApiError;
use crate::models::{Metadata, Organization, OrganizationInput, OrganizationPublic, OrganizationResult, PrivateKeyResult, Product, ProductInput, ProductResult, ProductSerialNumber, ProductSerialNumberResult, ProductUniqueCodeResult, ProductUniqueCodeResultRecord, ProductVerification, ProductVerificationResult, ProductVerificationStatus, Reseller, ResellerInput, ResellerVerificationResult, UniqueCodeResult, User, UserDetailsInput, UserResult, UserRole, UserPublic, AuthContextResponse, BrandOwnerContextDetails, ResellerContextDetails, LogoutResponse, CreateOrganizationWithOwnerContextRequest, OrganizationContextResponse, CompleteResellerProfileRequest, ResellerCertificationPageContext, ResellerPublic, NavigationContextResponse};
use crate::utils::generate_unique_principal;
use crate::{
    global_state::{
        decode_product_serial_numbers, decode_product_verifications, encode_product_serial_numbers,
        encode_product_verifications, ORGANIZATIONS, PRODUCTS, PRODUCT_SERIAL_NUMBERS,
        PRODUCT_VERIFICATIONS, RESELLERS, USERS,
        CONFIG_OPENAI_API_KEY, CONFIG_SCRAPER_URL, StorableString,
    },
    models::{ResellerVerificationResultRecord, VerificationStatus},
};

use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse, TransformArgs,
    TransformContext, TransformFunc,
};

use serde_json::{self, Value};
use rand::prelude::StdRng;
use k256::elliptic_curve::rand_core::SeedableRng;
use ic_cdk_timers::set_timer;
use std::time::Duration;
use std::convert::TryInto;

use crate::api::{
    ApiResponse, CreateOrganizationRequest, FindOrganizationsRequest, OrganizationResponse,
    UpdateOrganizationRequest, OrganizationsListResponse, PaginationRequest, paginate,
    VerifyProductEnhancedRequest, ProductVerificationEnhancedResponse, RateLimitInfo,
    GenerateResellerUniqueCodeRequest, ResellerUniqueCodeResponse, VerifyResellerRequest,
    ResellerVerificationResponse, ResellerVerificationStatus, UserResponse, ProductResponse,
    ProductVerificationDetail, ResetStorageResponse,
};
use crate::rate_limiter;
use crate::rewards;
use crate::utils;

#[query]
pub fn get_organization_by_id(id: Principal) -> OrganizationResult {
    // Check for permission to read organization
    let user_id = ic_cdk::caller();
    let user_opt = USERS.with(|users| users.borrow().get(&user_id));

    // If user exists and has a role, check permissions
    if let Some(user) = user_opt {
        if let Some(role) = &user.user_role {
            // Check if user belongs to this organization or is an admin
            if !user.org_ids.contains(&id) && !matches!(role, UserRole::Admin) {
                return OrganizationResult::Error(ApiError::unauthorized(
                    "User does not have access to this organization",
                ));
            }
        } else {
            // If user has no role, they can't access organizations
            return OrganizationResult::Error(ApiError::unauthorized("User has no role assigned"));
        }
    }

    ORGANIZATIONS.with(|orgs| match orgs.borrow().get(&id) {
        Some(org) => OrganizationResult::Organization(OrganizationPublic::from(org.clone())),
        None => OrganizationResult::Error(ApiError::not_found(&format!(
            "Organization with ID {} not found",
            id
        ))),
    })
}

#[query]
pub fn get_organization_by_id_v2(id: Principal) -> ApiResponse<OrganizationResponse> {
    // Check for permission to read organization
    let user_id = ic_cdk::caller();
    let user_opt = USERS.with(|users| users.borrow().get(&user_id));

    // If user exists and has a role, check permissions
    if let Some(user) = user_opt {
        if let Some(role) = &user.user_role {
            // For users with BrandOwner role, automatically allow access even if the org isn't in their org_ids yet
            // This fixes the chicken-and-egg problem where users need to see the org but don't have it in their list yet
            if matches!(role, UserRole::BrandOwner) {
                // Log this situation for debugging
                ic_cdk::print(format!("ℹ️ [get_organization_by_id_v2] BrandOwner accessing org {}", id));
                
                // Continue with the function to get the organization
            }
            else if matches!(role, UserRole::Reseller) {
                // Log this situation for debugging
                ic_cdk::print(format!("ℹ️ [get_organization_by_id_v2] Reseller accessing org {}", id));

                // Continue with the function to get the organization
            }
            // If user is Admin, they can see any organization
            else if matches!(role, UserRole::Admin) {
                // Log this situation for debugging
                ic_cdk::print(format!("ℹ️ [get_organization_by_id_v2] Admin accessing org {}", id));
                
                // Continue with the function to get the organization
            }
            // For other roles, check if user belongs to this organization or is an admin
            else if !user.org_ids.contains(&id) {
                return ApiResponse::error(ApiError::unauthorized(
                    "User does not have access to this organization",
                ));
            }
        } else {
            // If user has no role, they can't access organizations
            return ApiResponse::error(ApiError::unauthorized("User has no role assigned"));
        }
    } else {
        return ApiResponse::error(ApiError::unauthorized("User not found"));
    }

    ORGANIZATIONS.with(|orgs| match orgs.borrow().get(&id) {
        Some(org) => ApiResponse::success(OrganizationResponse {
            organization: OrganizationPublic::from(org.clone()),
        }),
        None => ApiResponse::error(ApiError::not_found(&format!(
            "Organization with ID {} not found",
            id
        ))),
    })
}

#[update]
pub fn create_organization(input: OrganizationInput) -> OrganizationPublic {
    // For creation, we don't need to check existing permissions since this creates a brand new org
    // However, we should check if the user has a registered account at minimum
    let caller = api::caller();
    let user_exists = USERS.with(|users| users.borrow().get(&caller).is_some());

    if !user_exists {
        // Register the user automatically
        let _ = register();
    }

    let id = generate_unique_principal(Principal::anonymous()); // Generate a unique ID for the organization
    // Generate ECDSA keys for demonstration
    let mut rng = StdRng::from_entropy();
    let signing_key = SigningKey::random(&mut rng);
    let organization = Organization {
        id,
        name: input.name,
        private_key: hex::encode(&signing_key.to_bytes()),
        description: input.description,
        metadata: input.metadata,
        ..Default::default()
    };

    ORGANIZATIONS.with(|orgs| {
        orgs.borrow_mut().insert(id, organization.clone());
    });

    OrganizationPublic::from(organization)
}

#[update]
pub fn update_organization(id: Principal, input: OrganizationInput) -> OrganizationResult {
    // Check that user has write permission for this organization
    let result = authorize_for_organization(ic_cdk::caller(), id, Permission::WriteOrganization);
    if result.is_err() {
        return OrganizationResult::Error(result.err().unwrap());
    }

    ORGANIZATIONS.with(|orgs| {
        let mut orgs_mut = orgs.borrow_mut();
        match orgs_mut.get(&id) {
            Some(org) => {
                // Create a new organization with updated fields
                let updated_org = Organization {
                    name: input.name,
                    description: input.description,
                    metadata: input.metadata,
                    updated_at: api::time(),
                    updated_by: api::caller(),
                    ..org.clone()
                };

                // Insert the updated organization
                orgs_mut.insert(id, updated_org.clone());

                OrganizationResult::Organization(OrganizationPublic::from(updated_org))
            }
            None => OrganizationResult::Error(ApiError::not_found(&format!(
                "Organization with ID {} not found",
                id
            ))),
        }
    })
}

#[query]
pub fn get_organization_private_key(org_id: Principal) -> PrivateKeyResult {
    // Accessing private key requires higher permission level (write access to the organization)
    let result = authorize_for_organization(api::caller(), org_id, Permission::WriteOrganization);
    match result {
        Ok(org) => PrivateKeyResult::Key(org.private_key),
        Err(err) => PrivateKeyResult::Error(err),
    }
}

#[query]
pub fn find_organizations_by_name(name: String) -> Vec<OrganizationPublic> {
    let filter = name.trim().to_lowercase();

    ORGANIZATIONS.with(|orgs| {
        let orgs_borrow = orgs.borrow();

        // Directly filter all organizations by name
        orgs_borrow
            .iter()
            .filter(|(_, org)| org.name.to_lowercase().contains(&filter))
            .map(|(_, org)| OrganizationPublic::from(org.clone()))
            .collect()
    })
}

#[update]
pub fn create_product(input: ProductInput) -> ProductResult {
    // Use enhanced authorization that checks for write permission
    let authorization_result =
        authorize_for_organization(api::caller(), input.org_id, Permission::WriteProduct);
    if authorization_result.is_err() {
        return ProductResult::Error(authorization_result.err().unwrap());
    }

    let organization = authorization_result.ok().unwrap();
    let id = generate_unique_principal(Principal::anonymous()); // Generate a unique ID for the product

    let private_key_bytes = hex::decode(&organization.private_key);
    if private_key_bytes.is_err() {
        return ProductResult::Error(ApiError::invalid_input(&format!(
            "Invalid private key format: {}",
            private_key_bytes.err().unwrap()
        )));
    }
    let private_key = SigningKey::from_slice(&private_key_bytes.unwrap().as_slice());
    if private_key.is_err() {
        return ProductResult::Error(ApiError::internal_error(&format!(
            "Failed to process private key: {}",
            private_key.err().unwrap()
        )));
    }
    let private_key_unwrapped = private_key.unwrap();
    let public_key = private_key_unwrapped.verifying_key();
    let product = Product {
        id,
        org_id: input.org_id,
        name: input.name,
        category: input.category,
        description: input.description,
        metadata: input.metadata,
        public_key: hex::encode(public_key.to_encoded_point(false).as_bytes()),
        ..Default::default()
    };

    PRODUCTS.with(|products| {
        products.borrow_mut().insert(id, product.clone());
    });

    ProductResult::Product(product)
}

#[query]
pub fn list_products(org_id: Principal) -> Vec<Product> {
    // Check for read product permission within the organization
    let authorization_result =
        authorize_for_organization(api::caller(), org_id, Permission::ReadProduct);
    if authorization_result.is_err() {
        return vec![];
    }

    PRODUCTS.with(|products| {
        products
            .borrow()
            .iter()
            .filter(|(_, product)| product.org_id == org_id)
            .map(|(_, product)| product.clone())
            .collect()
    })
}

#[query]
pub fn list_resellers_by_org_id(org_id: Principal) -> Vec<Reseller> {
    // Check for read permission within the organization. 
    // Using ReadOrganization permission as a baseline, adjust if a specific Reseller permission exists.
    let authorization_result =
        authorize_for_organization(api::caller(), org_id, Permission::ReadOrganization); 
    if authorization_result.is_err() {
        // Return empty vector if user does not have permission or org doesn't exist
        ic_cdk::print(format!("Authorization failed for listing resellers in org {}: {:?}", org_id, authorization_result.err()));
        return vec![]; 
    }

    RESELLERS.with(|resellers| {
        resellers
            .borrow()
            .iter()
            .filter(|(_, reseller)| reseller.org_id == org_id)
            .map(|(_, reseller)| reseller.clone())
            .collect()
    })
}

#[query]
pub fn get_product_by_id(id: Principal) -> ProductResult {
    let product_opt = PRODUCTS.with(|products| products.borrow().get(&id));

    if product_opt.is_none() {
        return ProductResult::None;
    }

    let product = product_opt.unwrap();

    // Check for read product permission
    let authorization_result =
        authorize_for_organization(api::caller(), product.org_id, Permission::ReadProduct);
    if authorization_result.is_err() {
        return ProductResult::Error(authorization_result.err().unwrap());
    }

    ProductResult::Product(product)
}

#[update]
pub fn update_product(id: Principal, input: ProductInput) -> ProductResult {
    // Get the product first to check ownership and permissions
    let product_opt = PRODUCTS.with(|products| products.borrow().get(&id));

    if product_opt.is_none() {
        return ProductResult::Error(ApiError::not_found(&format!(
            "Product with ID {} not found",
            id
        )));
    }

    let product = product_opt.unwrap();

    // Check for write product permission
    let authorization_result =
        authorize_for_organization(api::caller(), product.org_id, Permission::WriteProduct);
    if authorization_result.is_err() {
        return ProductResult::Error(authorization_result.err().unwrap());
    }

    // Check that the user is not trying to move the product to a different organization they don't have access to
    if product.org_id != input.org_id {
        let new_org_auth =
            authorize_for_organization(api::caller(), input.org_id, Permission::WriteProduct);
        if new_org_auth.is_err() {
            return ProductResult::Error(ApiError::unauthorized(
                "Cannot move product to an organization you don't have write access to",
            ));
        }
    }

    PRODUCTS.with(|products| {
        let mut products_mut = products.borrow_mut();

        // Create an updated product
        let updated_product = Product {
            org_id: input.org_id,
            name: input.name,
            description: input.description,
            category: input.category,
            metadata: input.metadata,
            updated_at: api::time(),
            updated_by: api::caller(),
            ..product.clone()
        };

        // Insert the updated product
        products_mut.insert(id, updated_product.clone());

        ProductResult::Product(updated_product)
    })
}

#[update]
pub fn register() -> User {
    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();
        let caller = api::caller();
        ic_cdk::print(format!("ℹ️ [Register] Called by: {}", caller));

        // If user already exists, return their current state
        if let Some(existing_user) = users_mut.get(&caller) {
            ic_cdk::print(format!("ℹ️ [Register] Found existing user: {}", caller));
            return existing_user.clone();
        }

        // If user does not exist, create a new one with default values
        ic_cdk::print(format!("ℹ️ [Register] Creating NEW user: {}", caller));
        let user = User {
            id: caller,
            // is_principal logic is likely unnecessary and removed for simplicity
            // Ensure user_role and org_ids are empty by relying on Default::default()
            ..Default::default()
        };

        users_mut.insert(caller, user.clone());
        
        // --- Diagnostic Read --- 
        let inserted_user = users_mut.get(&caller);
        ic_cdk::print(format!("ℹ️ [Register] Diagnostic read after insert for {}: {:?}", caller, inserted_user.is_some()));
        // --- End Diagnostic --- 
        
        user
    })
}

#[query]
pub fn get_user_by_id(id: Principal) -> Option<User> {
    // TODO access control
    USERS.with(|users| {
        let users_ref = users.borrow();
        match users_ref.get(&id) {
            Some(user) => Some(user.clone()),
            None => None,
        }
    })
}

#[query]
pub fn whoami() -> Option<User> {
    USERS.with(|users| {
        let users_ref = users.borrow();
        let caller = api::caller();
        // Log the caller principal received by whoami
        ic_cdk::print(format!("ℹ️ [whoami] Called by: {}", caller));
        match users_ref.get(&caller) {
            Some(user) => {
                 ic_cdk::print(format!("ℹ️ [whoami] Found user: {}", caller));
                 Some(user.clone())
            },
            None => {
                 ic_cdk::print(format!("ℹ️ [whoami] User not found: {}", caller));
                 None
            }
        }
    })
}

#[update]
pub fn update_self_details(input: UserDetailsInput) -> UserResult {
    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();
        let caller = api::caller();

        if let Some(user) = users_mut.get(&caller) {
            // Create an updated user
            let updated_user = User {
                first_name: Some(input.first_name),
                last_name: Some(input.last_name),
                phone_no: Some(input.phone_no),
                email: Some(input.email),
                detail_meta: input.detail_meta,
                updated_at: api::time(),
                updated_by: caller,
                ..user.clone()
            };

            // Insert updated user
            users_mut.insert(caller, updated_user.clone());

            UserResult::User(updated_user)
        } else {
            UserResult::Error(ApiError::not_found("User not found"))
        }
    })
}

#[update]
pub fn set_self_role(role: UserRole) -> UserResult {
    let caller = api::caller();

    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();

        if let Some(user) = users_mut.get(&caller) {
            // Create an updated user with a new role
            // Only allow role assignment if user doesn't already have a role or is an admin
            if user.user_role.is_some()
                && !matches!(user.user_role.as_ref().unwrap(), UserRole::Admin)
            {
                return UserResult::Error(ApiError::unauthorized(
                    "You already have a role assigned and cannot change it",
                ));
            }

            // Admin role can only be assigned by another admin
            if matches!(role, UserRole::Admin) {
                let caller_is_admin = USERS.with(|users| {
                    if let Some(caller_user) = users.borrow().get(&caller) {
                        if let Some(caller_role) = &caller_user.user_role {
                            return matches!(caller_role, UserRole::Admin);
                        }
                    }
                    false
                });

                if !caller_is_admin {
                    return UserResult::Error(ApiError::unauthorized(
                        "Only administrators can assign admin roles",
                    ));
                }
            }

            // Check if user has requested organization ID in their metadata
            let mut org_ids = user.org_ids.clone();
            let has_requested_org = user.detail_meta.iter()
                .find(|meta| meta.key == "selectedOrgId")
                .map(|meta| meta.value.clone());

            // If role is BrandOwner and user has a selectedOrgId, add it to org_ids
            if matches!(role, UserRole::BrandOwner) && has_requested_org.is_some() {
                let org_id_str = has_requested_org.unwrap();
                match Principal::from_text(&org_id_str) {
                    Ok(org_id) => {
                        ic_cdk::print(format!("ℹ️ [set_self_role] Adding organization {} to user {}", org_id, caller));
                        
                        // Check if org exists
                        let org_exists = ORGANIZATIONS.with(|orgs| orgs.borrow().get(&org_id).is_some());
                        
                        if org_exists && !org_ids.contains(&org_id) {
                            org_ids.push(org_id);
                            ic_cdk::print(format!("ℹ️ [set_self_role] Successfully added org {} to BrandOwner {}", org_id, caller));
                        } else if !org_exists {
                            ic_cdk::print(format!("⚠️ [set_self_role] Organization {} not found for user {}", org_id, caller));
                        }
                    },
                    Err(e) => {
                        ic_cdk::print(format!("❌ ERROR: Invalid organization ID format: {}, error: {}", org_id_str, e));
                    }
                }
            }

            let updated_user = User {
                user_role: Some(role),
                org_ids,  // Use potentially updated org_ids
                updated_at: api::time(),
                updated_by: caller,
                ..user.clone()
            };

            // Insert updated user
            users_mut.insert(caller, updated_user.clone());

            UserResult::User(updated_user)
        } else {
            UserResult::Error(ApiError::not_found("User not found"))
        }
    })
}

#[update]
pub fn register_as_organization(input: OrganizationInput) -> UserResult {
    // First, create the organization
    let org_public = create_organization(input);

    // Then update the user
    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();
        let caller = api::caller();

        if let Some(user) = users_mut.get(&caller) {
            // Create an updated user with organization access
            let mut org_ids = user.org_ids.clone();
            org_ids.push(org_public.id);

            let updated_user = User {
                org_ids,
                user_role: Some(UserRole::BrandOwner),
                updated_at: api::time(),
                updated_by: caller,
                ..user.clone()
            };

            // Insert updated user
            users_mut.insert(caller, updated_user.clone());

            UserResult::User(updated_user)
        } else {
            UserResult::Error(ApiError::not_found("User not found"))
        }
    })
}

#[update]
pub fn register_as_reseller_v2(input: ResellerInput) -> ApiResponse<UserResponse> {
    let caller = api::caller();

    // --- 1. Input Validation ---
    if input.name.trim().is_empty() {
        return ApiResponse::error(ApiError::invalid_input("Reseller name cannot be empty"));
    }
    // TODO: Add validation for metadata/ecommerce_urls length/content if needed

    // --- 2. User Checks ---
    let user_opt = USERS.with(|users| users.borrow().get(&caller));

    if user_opt.is_none() {
        return ApiResponse::error(ApiError::not_found(&format!(
            "User with principal {} not found. Please register first.",
            caller
        )));
    }

    let user = user_opt.unwrap(); // Safe to unwrap due to check above

    if user.user_role.is_some() {
        return ApiResponse::error(ApiError::unauthorized(
            "User already has an assigned role (e.g., BrandOwner or Admin)",
        ));
    }

    // --- 3. Organization Checks ---
    let org_opt = ORGANIZATIONS.with(|orgs| orgs.borrow().get(&input.org_id));

    if org_opt.is_none() {
        return ApiResponse::error(ApiError::not_found(&format!(
            "Organization with ID {} not found",
            input.org_id
        )));
    }

    let organization = org_opt.unwrap(); // Safe to unwrap

    // --- 4. Key Processing ---
    let private_key_bytes = match hex::decode(&organization.private_key) {
        Ok(bytes) => bytes,
        Err(e) => {
            ic_cdk::print(format!("❌ ERROR: Failed to decode private key for org {}: {}", organization.id, e));
            return ApiResponse::error(ApiError::internal_error(
                "Failed to process organization secret key",
            ));
        }
    };

    let private_key = match SecretKey::from_slice(&private_key_bytes) { // Note: Using SecretKey, assuming this is correct for Reseller key generation
        Ok(key) => key,
        Err(e) => {
             ic_cdk::print(format!("❌ ERROR: Failed to create secret key from slice for org {}: {}", organization.id, e));
            return ApiResponse::error(ApiError::internal_error(
                "Malformed secret key for organization",
            ));
        }
    };
    
    // Derive public key - assuming reseller needs its own keypair based on org's key?
    // Or should the reseller use the org's public key directly?
    // Let's stick to the previous logic: generate public key from org private key for now.
    let public_key = private_key.public_key();
    let public_key_hex = hex::encode(public_key.to_encoded_point(false).as_bytes());

    // --- 5. Reseller Creation ---
    let reseller_id = generate_unique_principal(Principal::anonymous());

    let reseller = Reseller {
        id: reseller_id,
        org_id: input.org_id,
        name: input.name,
        ecommerce_urls: input.ecommerce_urls,
        metadata: input.metadata,
        public_key: public_key_hex, // Storing derived public key
        created_at: api::time(),
        created_by: caller,
        updated_at: api::time(),
        updated_by: caller,
        ..Default::default() // Ensure other fields like date_joined are handled
    };

    RESELLERS.with(|resellers| {
        resellers.borrow_mut().insert(reseller_id, reseller);
    });

    // --- 6. Update User Role ---
    let updated_user = User {
        user_role: Some(UserRole::Reseller),
        org_ids: vec![input.org_id], // Associate user with this org
        updated_at: api::time(),
        updated_by: caller,
        ..user.clone()
    };

    USERS.with(|users| {
        users.borrow_mut().insert(caller, updated_user.clone());
    });
    
    // --- 7. Success --- 
    ApiResponse::success(UserResponse { user: updated_user })
}

#[update]
pub fn create_user(id: Principal, input: UserDetailsInput) -> UserResult {
    // Only admins can create other users
    let caller = api::caller();
    let auth_result = ensure_admin(caller);

    if auth_result.is_err() {
        return UserResult::Error(ApiError::unauthorized(
            "Only administrators can create users",
        ));
    }

    let mut user_exists = false;

    USERS.with(|users| {
        user_exists = users.borrow().get(&id).is_some();
    });

    if user_exists {
        return UserResult::Error(ApiError::already_exists("User already exists"));
    }

    let user = User {
        id,
        is_enabled: true,
        is_principal: false,
        first_name: Some(input.first_name),
        last_name: Some(input.last_name),
        email: Some(input.email),
        phone_no: Some(input.phone_no),
        detail_meta: input.detail_meta,
        ..Default::default()
    };

    USERS.with(|users| {
        users.borrow_mut().insert(id, user.clone());
    });

    UserResult::User(user)
}

#[update]
pub fn update_user(id: Principal, input: UserDetailsInput) -> UserResult {
    let caller = api::caller();

    // Users can update their own profile, or admins can update any user
    if caller != id {
        let auth_result = ensure_admin(caller);
        if auth_result.is_err() {
            return UserResult::Error(ApiError::unauthorized(
                "You can only update your own user profile or must be an admin",
            ));
        }
    }

    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();

        if let Some(user) = users_mut.get(&id) {
            // Create an updated user
            let updated_user = User {
                first_name: Some(input.first_name),
                last_name: Some(input.last_name),
                phone_no: Some(input.phone_no),
                email: Some(input.email),
                detail_meta: input.detail_meta,
                updated_at: api::time(),
                updated_by: caller,
                ..user.clone()
            };

            // Insert updated user
            users_mut.insert(id, updated_user.clone());

            UserResult::User(updated_user)
        } else {
            UserResult::Error(ApiError::not_found("User not found"))
        }
    })
}

#[update]
pub fn update_user_orgs(id: Principal, org_ids: Vec<Principal>) -> UserResult {
    let caller = api::caller();

    // Only admins can modify organization associations, or users can manage their own orgs if they're admins
    if caller != id {
        let auth_result = ensure_admin(caller);
        if auth_result.is_err() {
            return UserResult::Error(ApiError::unauthorized(
                "Only administrators can update user organizations",
            ));
        }
    } else {
        // If caller is the same as target id, ensure they have admin role to modify their own orgs
        let auth_result = ensure_admin(caller);
        if auth_result.is_err() {
            return UserResult::Error(ApiError::unauthorized(
                "You need admin rights to modify organization associations",
            ));
        }
    }

    // Validate that all org IDs exist
    for org_id in &org_ids {
        let org_exists = ORGANIZATIONS.with(|orgs| orgs.borrow().get(org_id).is_some());
        if !org_exists {
            return UserResult::Error(ApiError::not_found(&format!(
                "Organization with ID {} not found",
                org_id
            )));
        }
    }

    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();

        if let Some(user) = users_mut.get(&id) {
            // Create an updated user with new organization IDs
            let updated_user = User {
                org_ids: org_ids,
                updated_at: api::time(),
                updated_by: caller,
                ..user.clone()
            };

            // Insert updated user
            users_mut.insert(id, updated_user.clone());

            UserResult::User(updated_user)
        } else {
            UserResult::Error(ApiError::not_found("User not found"))
        }
    })
}

const REVIEW_REFRESH_INTERVAL: u64 = 86400; // 24 hours in seconds
const OPENAI_HOST: &str = "api.openai.com";
const GPT_MODEL: &str = "gpt-4o";
const REQUEST_CYCLES: u64 = 230_949_972_000;
const UNIQUE_CODE_EXPIRATION_SECONDS: u64 = 300; // 5 minutes
const MAX_HTTP_RETRIES: u32 = 3;
const RETRY_DELAY_SECONDS: u64 = 2;

#[update]
async fn generate_product_review_v2(product_id: Principal) -> ApiResponse<ProductResponse> {
    let product = match get_product(&product_id) {
        Ok(p) => p,
        Err(e) => return ApiResponse::error(e),
    };

    if !should_generate_new_review(&product) {
        ic_cdk::print(format!("ℹ️ Product review for {} is up-to-date. Skipping generation.", product_id));
        // Return current product data if review is fresh
        return ApiResponse::success(ProductResponse { product }); 
    }
    
    ic_cdk::print(format!("ℹ️ Generating new product review for {}.", product_id));

    // Scrape Review Summary - Handle the Result
    let review_summary_result = scrape_product_review(&product).await;
    let review_summary = match review_summary_result {
        Ok(summary) => summary,
        Err(e) => {
            ic_cdk::print(format!("⚠️ Failed to scrape review for {}: {:?}", product_id, e));
            // Return the scraping error
            return ApiResponse::error(e);
        }
    };

    // Analyze Sentiment (already returns Result, handled below)
    let sentiment_analysis_result = analyze_sentiment_with_openai(&review_summary).await;
    let sentiment_analysis = match sentiment_analysis_result {
        Ok(sentiment) => sentiment,
        Err(e) => {
            ic_cdk::print(format!("⚠️ Failed to analyze sentiment for {}: {:?}", product_id, e));
            return ApiResponse::error(e); 
        }
    };

    // Update Product with Review
    match update_product_with_review(product, sentiment_analysis) {
        Ok(updated_product) => {
            ic_cdk::print(format!("✅ Successfully generated review for product {}.", product_id));
            ApiResponse::success(ProductResponse { product: updated_product })
        }
        Err(e) => {
            ic_cdk::print(format!("❌ ERROR: Failed to update product {} with review: {:?}", product_id, e));
            ApiResponse::error(e)
        }
    }
}

fn get_product(product_id: &Principal) -> Result<Product, ApiError> {
    PRODUCTS.with(|products| {
        products
            .borrow()
            .get(product_id)
            .map(|p| p.clone())
            .ok_or_else(|| ApiError::not_found("Product not found"))
    })
}

fn should_generate_new_review(product: &Product) -> bool {
    let latest_review_time = product
        .metadata
        .iter()
        .find(|v| v.key == "latest_product_review_generation")
        .and_then(|v| v.value.parse::<u64>().ok());

    latest_review_time
        .map(|time| time < api::time() - REVIEW_REFRESH_INTERVAL)
        .unwrap_or(true)
}

async fn analyze_sentiment_with_openai(review_text: &str) -> Result<String, ApiError> {
    let request = match create_openai_request(review_text) {
        Ok(req) => req,
        Err(e) => return Err(e),
    };

    let mut attempts = 0;
    loop {
        attempts += 1;
        ic_cdk::print(format!("ℹ️ Attempt {} analyzing sentiment with OpenAI.", attempts));

        // Cast REQUEST_CYCLES to u128
        match http_request(request.clone(), REQUEST_CYCLES as u128).await {
            Ok((response,)) => {
                // Clone status for potential logging before moving its inner value
                let original_status = response.status.clone();
                // Convert Nat status to u64 for comparison
                let status_code: u64 = match response.status.0.try_into() {
                    Ok(code) => code,
                    Err(_) => {
                        // Use the cloned status for logging
                        ic_cdk::print(format!("❌ ERROR: Invalid status code received from OpenAI: {}", original_status));
                        return Err(ApiError::external_api_error("Invalid status code received"));
                    }
                };

                if status_code >= 200 && status_code < 300 {
                    let response_body = String::from_utf8(response.body).map_err(|e| {
                        ic_cdk::print(format!("❌ ERROR: Invalid UTF-8 in OpenAI response: {:?}", e));
                        ApiError::external_api_error("Invalid UTF-8 in OpenAI response")
                    })?;

                    let parsed: Value = serde_json::from_str(&response_body).map_err(|e| {
                        ic_cdk::print(format!("❌ ERROR: Invalid JSON in OpenAI response: {:?}, Body: {}", e, response_body));
                        ApiError::external_api_error("Invalid JSON response from OpenAI")
                    })?;

                    // Extract the content
                    return Ok(parsed["choices"][0]["message"]["content"]
                        .as_str()
                        .unwrap_or_default()
                        .to_string());
                } else {
                    let error_message = format!(
                        "OpenAI API returned status {}: {}",
                        status_code, // Use converted status code
                        String::from_utf8_lossy(&response.body)
                    );
                    ic_cdk::print(format!("❌ ERROR: {}", error_message));

                    // Treat server-side errors (5xx) as potentially retryable
                    if status_code >= 500 && attempts < MAX_HTTP_RETRIES {
                        ic_cdk::print(format!("⏱️ Retrying analyze_sentiment after delay..."));
                        utils::async_delay(Duration::from_secs(RETRY_DELAY_SECONDS * attempts as u64)).await;
                        continue; // Retry the loop
                    }
                    // For non-retryable errors or max retries reached
                    return Err(ApiError::external_api_error(&error_message));
                }
            }
            Err((rejection_code, message)) => {
                 let error_message = format!(
                    "HTTP request to OpenAI failed. RejectionCode: {:?}, Error: {}",
                    rejection_code, message
                );
                ic_cdk::print(format!("❌ ERROR: {}", error_message));

                 // Retry on most errors up to the limit
                if attempts < MAX_HTTP_RETRIES {
                    ic_cdk::print(format!("⏱️ Retrying analyze_sentiment after rejection delay..."));
                    utils::async_delay(Duration::from_secs(RETRY_DELAY_SECONDS * attempts as u64)).await;
                    continue; // Retry the loop
                }
                // Max retries reached
                return Err(ApiError::external_api_error(&error_message));
            }
        }
    }
}

fn create_openai_request(review_text: &str) -> Result<CanisterHttpRequestArgument, ApiError> {
    let escaped_review = review_text.replace("\"", "\\\"");
    let request_body = format!(
        r#"{{
        "model": "{GPT_MODEL}",
        "messages": [{{
            "role": "user",
            "content": "With this product review summary: {}\n Please help summarize what is the overall sentiment of the product"
        }}],
        "temperature": 0.7
    }}"#,
        escaped_review
    );

    Ok(CanisterHttpRequestArgument {
        url: format!("https://{OPENAI_HOST}/v1/chat/completions"),
        method: HttpMethod::POST,
        body: Some(request_body.into_bytes()),
        max_response_bytes: None,
        transform: Some(TransformContext {
            function: TransformFunc(candid::Func {
                principal: api::id(),
                method: "transform".to_string(),
            }),
            context: vec![],
        }),
        headers: create_request_headers(),
    })
}

fn create_request_headers() -> Vec<HttpHeader> {
    // Read StorableString from stable storage
    let api_key_storable = CONFIG_OPENAI_API_KEY.with(|cell| cell.borrow().get().clone());
    let api_key = &api_key_storable.0; // Get reference to inner String
    
    if api_key.is_empty() {
        ic_cdk::print("⚠️ WARNING: OpenAI API Key is not configured.");
        // Return headers without Authorization if key is missing
        return vec![
            HttpHeader {
                name: "Host".to_string(),
                value: format!("{OPENAI_HOST}:443"),
            },
            HttpHeader {
                name: "User-Agent".to_string(),
                value: "exchange_rate_canister".to_string(), // Consider making this configurable too
            },
            HttpHeader {
                name: "Content-Type".to_string(),
                value: "application/json".to_string(),
            },
            HttpHeader {
                name: "Idempotency-Key".to_string(),
                value: generate_unique_principal(Principal::anonymous()).to_string(),
            },
        ];
    }

    vec![
        HttpHeader {
            name: "Host".to_string(),
            value: format!("{OPENAI_HOST}:443"),
        },
        HttpHeader {
            name: "User-Agent".to_string(),
            value: "exchange_rate_canister".to_string(),
        },
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        },
        HttpHeader {
            name: "Authorization".to_string(),
            value: format!("Bearer {}", api_key), // Use the inner string
        },
        HttpHeader {
            name: "Idempotency-Key".to_string(),
            value: generate_unique_principal(Principal::anonymous()).to_string(),
        },
    ]
}

fn update_product_with_review(
    mut product: Product,
    review_content: String,
) -> Result<Product, ApiError> {
    let review_metadata = Metadata {
        key: "product_review".to_string(),
        value: review_content,
    };
    let timestamp_metadata = Metadata {
        key: "latest_product_review_generation".to_string(),
        value: api::time().to_string(),
    };

    product.metadata.push(review_metadata);
    product.metadata.push(timestamp_metadata);

    PRODUCTS.with(|products| {
        products.borrow_mut().insert(product.id, product.clone());
    });

    Ok(product)
}

async fn scrape_product_review(product: &Product) -> Result<String, ApiError> {
    // Read StorableString from stable storage
    let base_scraper_url_storable = CONFIG_SCRAPER_URL.with(|cell| cell.borrow().get().clone());
    let base_scraper_url = &base_scraper_url_storable.0; // Get reference to inner String

    if base_scraper_url.is_empty() {
        ic_cdk::print("⚠️ WARNING: Scraper URL is not configured.");
        return Err(ApiError::internal_error("Scraper service URL not configured"));
    }

    // Use the inner string to format the URL
    let url = format!(
        "{}/product-review?id={}",
        base_scraper_url,
        product.id.to_string()
    );

    let request = CanisterHttpRequestArgument {
        url: url.clone(), // Clone url for potential retries
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: None, // Consider setting a limit
        transform: Some(TransformContext {
            function: TransformFunc(candid::Func {
                principal: api::id(),
                method: "transform".to_string(),
            }),
            context: vec![],
        }),
        headers: vec![],
    };

    let mut attempts = 0;
    loop {
        attempts += 1;
        ic_cdk::print(format!("ℹ️ Attempt {} scraping review from: {}", attempts, request.url));

        // Cast REQUEST_CYCLES to u128
        match http_request(request.clone(), REQUEST_CYCLES as u128).await {
            Ok((response,)) => {
                // Clone status for potential logging before moving its inner value
                let original_status = response.status.clone();
                // Convert Nat status to u64 for comparison
                let status_code: u64 = match response.status.0.try_into() {
                    Ok(code) => code,
                    Err(_) => {
                        // Use the cloned status for logging
                        ic_cdk::print(format!("❌ ERROR: Invalid status code received from scraper: {}", original_status));
                        return Err(ApiError::external_api_error("Invalid status code received"));
                    }
                };

                if status_code >= 200 && status_code < 300 {
                    return String::from_utf8(response.body).map_err(|e| {
                        ic_cdk::print(format!("❌ ERROR: Failed to decode scraper response body: {:?}", e));
                        ApiError::external_api_error("Failed to decode scraper response")
                    });
                } else {
                    let error_message = format!(
                        "Scraper service returned status {}: {}",
                        status_code, // Use converted status code
                        String::from_utf8_lossy(&response.body)
                    );
                    ic_cdk::print(format!("❌ ERROR: {}", error_message));

                    // Treat server-side errors (5xx) as potentially retryable
                    if status_code >= 500 && attempts < MAX_HTTP_RETRIES {
                        ic_cdk::print(format!("⏱️ Retrying scrape_product_review after delay..."));
                        utils::async_delay(Duration::from_secs(RETRY_DELAY_SECONDS * attempts as u64)).await;
                        continue; // Retry the loop
                    }
                    // For non-retryable errors or max retries reached
                    return Err(ApiError::external_api_error(&error_message));
                }
            }
            Err((rejection_code, message)) => {
                let error_message = format!(
                    "HTTP request to scraper failed. RejectionCode: {:?}, Error: {}",
                    rejection_code, message
                );
                ic_cdk::print(format!("❌ ERROR: {}", error_message));

                // Retry on specific rejection codes if desired (e.g., network errors)
                // For now, let's retry on most errors up to the limit
                if attempts < MAX_HTTP_RETRIES {
                    ic_cdk::print(format!("⏱️ Retrying scrape_product_review after rejection delay..."));
                    utils::async_delay(Duration::from_secs(RETRY_DELAY_SECONDS * attempts as u64)).await;
                    continue; // Retry the loop
                }
                // Max retries reached
                return Err(ApiError::external_api_error(&error_message));
            }
        }
    }
}

#[query]
pub fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

#[query]
fn transform(raw: TransformArgs) -> HttpResponse {
    let headers = vec![
        HttpHeader {
            name: "Content-Security-Policy".to_string(),
            value: "default-src 'self'".to_string(),
        },
        HttpHeader {
            name: "Referrer-Policy".to_string(),
            value: "strict-origin".to_string(),
        },
        HttpHeader {
            name: "Permissions-Policy".to_string(),
            value: "geolocation=(self)".to_string(),
        },
        HttpHeader {
            name: "Strict-Transport-Security".to_string(),
            value: "max-age=63072000".to_string(),
        },
        HttpHeader {
            name: "X-Frame-Options".to_string(),
            value: "DENY".to_string(),
        },
        HttpHeader {
            name: "X-Content-Type-Options".to_string(),
            value: "nosniff".to_string(),
        },
    ];

    let mut res = HttpResponse {
        status: raw.response.status.clone(),
        body: raw.response.body.clone(),
        headers,
    };

    if res.status == 200u64 {
        res.body = raw.response.body;
    } else {
        api::print(format!("Received an error: err = {:?}", raw));
    }
    res
}

#[query]
pub fn find_resellers_by_name_or_id(name: String) -> Vec<Reseller> {
    let filter = name.trim().to_lowercase();

    RESELLERS.with(|resellers| {
        resellers
            .borrow()
            .iter()
            .filter(|(_, reseller)| reseller.name.to_lowercase().contains(&filter))
            .map(|(_, reseller)| reseller.clone())
            .collect()
    })
}

#[query]
pub fn verify_reseller_v2(request: VerifyResellerRequest) -> ApiResponse<ResellerVerificationResponse> {
    let current_time = api::time();
    let reseller_id = request.reseller_id;
    let code_timestamp = request.timestamp;
    let context_str = request.context.as_deref().unwrap_or("");

    // 1. Check for expiration / replay attack
    if current_time > code_timestamp + UNIQUE_CODE_EXPIRATION_SECONDS {
        return ApiResponse::success(ResellerVerificationResponse {
            status: ResellerVerificationStatus::ExpiredCode,
            organization: None,
            reseller: None,
        });
    }
    // Basic check for future timestamps (allowing a small clock skew, e.g., 60 seconds)
    if code_timestamp > current_time + 60 {
         return ApiResponse::success(ResellerVerificationResponse {
            status: ResellerVerificationStatus::InvalidCode, // Or a more specific error
            organization: None,
            reseller: None,
        });
    }

    // 2. Find Reseller
    let reseller_opt = RESELLERS.with(|r| r.borrow().get(&reseller_id).clone());
    if reseller_opt.is_none() {
        return ApiResponse::success(ResellerVerificationResponse {
            status: ResellerVerificationStatus::ResellerNotFound,
            organization: None,
            reseller: None,
        });
    }
    let reseller = reseller_opt.unwrap();

    // 3. Find Organization
    let org_opt = ORGANIZATIONS.with(|o| o.borrow().get(&reseller.org_id).clone());
    if org_opt.is_none() {
         return ApiResponse::success(ResellerVerificationResponse {
            status: ResellerVerificationStatus::OrganizationNotFound,
            organization: None,
            reseller: Some(reseller), // Can still return reseller info
        });
    }
    let organization = org_opt.unwrap();

    // 4. Get Reseller's Public Key
    // Note: In the previous implementation, reseller had its own public key.
    // Let's assume the verification should use the ORGANIZATION's public key, 
    // derived from the private key used in generation.
    // If reseller should have its own keypair, the model and generation logic need adjustment.
    let public_key_bytes = match hex::decode(&organization.private_key) { // Using org's key for verification
        Ok(bytes) => bytes,
        Err(_) => {
             return ApiResponse::success(ResellerVerificationResponse {
                status: ResellerVerificationStatus::InternalError,
                organization: Some(OrganizationPublic::from(organization.clone())), 
                reseller: Some(reseller),
            });
        }
    };
    let public_key_encoded_point = match EncodedPoint::from_bytes(public_key_bytes) {
        Ok(point) => point,
        Err(_) => {
             return ApiResponse::success(ResellerVerificationResponse {
                status: ResellerVerificationStatus::InternalError,
                organization: Some(OrganizationPublic::from(organization.clone())), 
                reseller: Some(reseller),
            });
        }
    };
    let public_key = match VerifyingKey::from_encoded_point(&public_key_encoded_point) {
        Ok(key) => key,
        Err(_) => {
             return ApiResponse::success(ResellerVerificationResponse {
                status: ResellerVerificationStatus::InternalError,
                organization: Some(OrganizationPublic::from(organization.clone())), 
                reseller: Some(reseller),
            });
        }
    };

    // 5. Prepare message hash
    let msg = format!("{}_{}_{}", reseller_id.to_string(), code_timestamp, context_str);
    let mut hasher = Sha256::new();
    hasher.update(msg);
    let hashed_message = hasher.finalize();

    // 6. Decode signature
    let decoded_code = match hex::decode(&request.unique_code) {
        Ok(bytes) => bytes,
        Err(_) => {
             return ApiResponse::success(ResellerVerificationResponse {
                status: ResellerVerificationStatus::InvalidCode,
                organization: Some(OrganizationPublic::from(organization.clone())), 
                reseller: Some(reseller),
            });
        }
    };
    let signature = match Signature::from_slice(decoded_code.as_slice()) {
         Ok(sig) => sig,
         Err(_) => {
             return ApiResponse::success(ResellerVerificationResponse {
                status: ResellerVerificationStatus::InvalidCode,
                organization: Some(OrganizationPublic::from(organization.clone())), 
                reseller: Some(reseller),
            });
         }
     };

    // 7. Verify signature
    match public_key.verify(&hashed_message, &signature) {
        Ok(_) => {
            ApiResponse::success(ResellerVerificationResponse {
                status: ResellerVerificationStatus::Success,
                organization: Some(OrganizationPublic::from(organization)),
                reseller: Some(reseller),
            })
        }
        Err(_) => {
            ApiResponse::success(ResellerVerificationResponse {
                status: ResellerVerificationStatus::InvalidCode,
                organization: Some(OrganizationPublic::from(organization)), // Still return org/reseller info on failure
                reseller: Some(reseller),
            })
        }
    }
}

#[update]
pub fn generate_reseller_unique_code_v2(request: GenerateResellerUniqueCodeRequest) -> ApiResponse<ResellerUniqueCodeResponse> {
    let reseller_id = request.reseller_id;
    let context_str = request.context.as_deref().unwrap_or(""); // Use empty string if None

    // Check if a reseller exists
    let mut reseller_found = false;
    let mut reseller_org_id = Principal::anonymous();

    RESELLERS.with(|resellers| {
        if let Some(reseller) = resellers.borrow().get(&reseller_id) {
            reseller_found = true;
            reseller_org_id = reseller.org_id;
        }
    });

    if !reseller_found {
        return ApiResponse::error(ApiError::not_found(&format!(
            "Reseller with ID {} not found",
            reseller_id
        )));
    }

    // Check if an organization exists
    let mut org_found = false;
    let mut org_private_key = String::new();

    ORGANIZATIONS.with(|orgs| {
        if let Some(org) = orgs.borrow().get(&reseller_org_id) {
            org_found = true;
            org_private_key = org.private_key.clone();
        }
    });

    if !org_found {
        return ApiResponse::error(ApiError::not_found(&format!(
            "Organization with ID {} not found for reseller {}",
            reseller_org_id,
            reseller_id
        )));
    }

    // Deserialize private key
    let private_key_bytes = match hex::decode(&org_private_key) {
        Ok(bytes) => bytes,
        Err(_) => {
            return ApiResponse::error(ApiError::internal_error(
                "Malformed secret key for organization",
            ))
        }
    };

    let private_key = match SigningKey::from_slice(&private_key_bytes.as_slice()) {
        Ok(key) => key,
        Err(_) => {
            return ApiResponse::error(ApiError::internal_error(
                "Malformed secret key for organization",
            ))
        }
    };

    // Create message including reseller ID, current timestamp, and context
    let current_time = api::time();
    let msg = format!("{}_{}_{}", reseller_id.to_string(), current_time, context_str);
    
    // Hash and sign
    let mut hasher = Sha256::new();
    hasher.update(msg);
    let hashed_message = hasher.finalize();

    let signature: Signature = private_key.sign(&hashed_message);
    let signature_hex = hex::encode(signature.to_bytes());

    ApiResponse::success(ResellerUniqueCodeResponse {
        unique_code: signature_hex,
        reseller_id,
        timestamp: current_time,
        context: request.context, // Return the original context if provided
    })
}

#[query]
pub fn list_product_serial_numbers(
    organization_id: Option<Principal>,
    product_id: Option<Principal>,
) -> Result<Vec<ProductSerialNumber>, ApiError> {
    match (organization_id, product_id) {
        (None, _) => fetch_all_serial_numbers(),
        (Some(org_id), None) => fetch_organization_serial_numbers(org_id),
        (Some(org_id), Some(p_id)) => fetch_product_serial_numbers(org_id, p_id),
    }
}

fn fetch_all_serial_numbers() -> Result<Vec<ProductSerialNumber>, ApiError> {
    let mut serial_numbers = Vec::new();

    PRODUCT_SERIAL_NUMBERS.with(|sn_store| {
        sn_store.borrow().iter().for_each(|(_, serialized_sn)| {
            let decoded_numbers = decode_product_serial_numbers(&serialized_sn);
            serial_numbers.extend(decoded_numbers);
        });
    });

    Ok(serial_numbers)
}

fn fetch_organization_serial_numbers(
    org_id: Principal,
) -> Result<Vec<ProductSerialNumber>, ApiError> {
    let product_ids = get_organization_product_ids(org_id);
    let mut serial_numbers = Vec::new();

    PRODUCT_SERIAL_NUMBERS.with(|sn_store| {
        let store = sn_store.borrow();
        for product_id in product_ids {
            if let Some(serialized_sn) = store.get(&product_id) {
                let decoded_numbers = decode_product_serial_numbers(&serialized_sn);
                serial_numbers.extend(decoded_numbers);
            }
        }
    });

    Ok(serial_numbers)
}

fn fetch_product_serial_numbers(
    org_id: Principal,
    product_id: Principal,
) -> Result<Vec<ProductSerialNumber>, ApiError> {
    if !is_product_owned_by_organization(product_id, org_id) {
        return Ok(Vec::new());
    }

    let serial_numbers = PRODUCT_SERIAL_NUMBERS.with(|sn_store| {
        sn_store
            .borrow()
            .get(&product_id)
            .map_or(Vec::new(), |serialized_sn| {
                decode_product_serial_numbers(&serialized_sn)
            })
    });

    Ok(serial_numbers)
}

fn get_organization_product_ids(org_id: Principal) -> Vec<Principal> {
    let mut product_ids = Vec::new();

    PRODUCTS.with(|products| {
        products
            .borrow()
            .iter()
            .filter(|(_, product)| product.org_id == org_id)
            .for_each(|(id, _)| product_ids.push(id));
    });

    product_ids
}

fn is_product_owned_by_organization(product_id: Principal, org_id: Principal) -> bool {
    PRODUCTS.with(|products| {
        products
            .borrow()
            .get(&product_id)
            .map_or(false, |product| product.org_id == org_id)
    })
}

#[update]
pub fn create_product_serial_number(
    product_id: Principal,
    user_serial_no: Option<String>,
) -> ProductSerialNumberResult {
    // Check if the product exists
    let product_opt = PRODUCTS.with(|products| products.borrow().get(&product_id));

    if product_opt.is_none() {
        return ProductSerialNumberResult::Error(ApiError::not_found(&format!(
            "Product with ID {} not found",
            product_id
        )));
    }

    let product = product_opt.unwrap();

    // Check for write product permission
    let authorization_result =
        authorize_for_organization(api::caller(), product.org_id, Permission::WriteProduct);
    if authorization_result.is_err() {
        return ProductSerialNumberResult::Error(authorization_result.err().unwrap());
    }

    // Continue with existing logic
    let serial_no = generate_unique_principal(Principal::anonymous());
    let user_serial = user_serial_no.unwrap_or_else(|| serial_no.to_string());

    let product_serial_number = ProductSerialNumber {
        product_id,
        serial_no,
        user_serial_no: user_serial,
        print_version: 0,
        metadata: vec![],
        created_at: api::time(),
        created_by: api::caller(),
        updated_at: api::time(),
        updated_by: api::caller(),
    };

    PRODUCT_SERIAL_NUMBERS.with(|serial_numbers| {
        let mut serial_numbers_mut = serial_numbers.borrow_mut();

        // Get existing serial numbers for this product, if any
        let current_entries = match serial_numbers_mut.get(&product_id) {
            Some(serialized_sn_vec) => decode_product_serial_numbers(&serialized_sn_vec),
            None => Vec::new(),
        };

        // Create a new collection with existing items plus the new one
        let mut updated_entries = current_entries;
        updated_entries.push(product_serial_number.clone());

        // Serialize and store the updated collection
        let serialized_entries = encode_product_serial_numbers(&updated_entries);
        serial_numbers_mut.insert(product_id, serialized_entries);
    });

    ProductSerialNumberResult::Result(product_serial_number)
}

#[update]
pub fn update_product_serial_number(
    product_id: Principal,
    serial_no: Principal,
    user_serial_no: Option<String>,
) -> ProductSerialNumberResult {
    PRODUCT_SERIAL_NUMBERS.with(|serial_numbers| {
        let mut serial_numbers_mut = serial_numbers.borrow_mut();

        // Check if the product exists
        if let Some(serialized_sn_vec) = serial_numbers_mut.get(&product_id) {
            // Decode the collection
            let mut product_sn_vec = decode_product_serial_numbers(&serialized_sn_vec);

            // Check for duplicate user_serial_no
            if let Some(sn) = &user_serial_no {
                let has_duplicate = product_sn_vec
                    .iter()
                    .any(|p_sn| p_sn.user_serial_no == *sn && p_sn.serial_no != serial_no);

                if has_duplicate {
                    return ProductSerialNumberResult::Error(ApiError::already_exists(
                        "Existing user serial number already exists",
                    ));
                }
            }

            // Find the serial number to update
            let sn_index = product_sn_vec.iter().position(|s| s.serial_no == serial_no);

            if let Some(idx) = sn_index {
                // Update the serial number
                let mut updated_sn = product_sn_vec[idx].clone();
                updated_sn.user_serial_no = user_serial_no.unwrap_or_default();
                updated_sn.updated_at = api::time();
                updated_sn.updated_by = api::caller();

                // Update in a collection
                product_sn_vec[idx] = updated_sn.clone();

                // Save an updated collection
                serial_numbers_mut
                    .insert(product_id, encode_product_serial_numbers(&product_sn_vec));

                ProductSerialNumberResult::Result(updated_sn)
            } else {
                ProductSerialNumberResult::Error(ApiError::not_found("Serial number not found"))
            }
        } else {
            ProductSerialNumberResult::Error(ApiError::not_found(
                "Product has no registered serial_nos",
            ))
        }
    })
}

#[update]
pub fn print_product_serial_number(
    product_id: Principal,
    serial_no: Principal,
) -> ProductUniqueCodeResult {
    // Access product serial numbers and product information from stable storage
    PRODUCT_SERIAL_NUMBERS.with(|serial_numbers| {
        let mut serial_numbers_mut = serial_numbers.borrow_mut();

        // Check if the product has any serial numbers
        if let Some(serialized_sn_vec) = serial_numbers_mut.get(&product_id) {
            let mut product_sn_vec = decode_product_serial_numbers(&serialized_sn_vec);

            // Find the specific serial number
            let sn_index = product_sn_vec
                .iter()
                .position(|sn| sn.serial_no == serial_no);
            if sn_index.is_none() {
                return ProductUniqueCodeResult::Error(ApiError::not_found(
                    "Serial number for product is not present",
                ));
            }

            // Get product information
            let mut product_opt = None;
            PRODUCTS.with(|products| {
                let products_ref = products.borrow();
                match products_ref.get(&product_id) {
                    Some(product) => product_opt = Some(product.clone()),
                    None => product_opt = None,
                }
            });

            if product_opt.is_none() {
                return ProductUniqueCodeResult::Error(ApiError::not_found(
                    "Product reference does not exist",
                ));
            }

            let product = product_opt.unwrap();

            // Get organization information
            let mut organization_opt = None;
            ORGANIZATIONS.with(|orgs| {
                let orgs_ref = orgs.borrow();
                match orgs_ref.get(&product.org_id) {
                    Some(org) => organization_opt = Some(org.clone()),
                    None => organization_opt = None,
                }
            });

            if organization_opt.is_none() {
                return ProductUniqueCodeResult::Error(ApiError::not_found(
                    "Organization does not exist",
                ));
            }

            let organization = organization_opt.unwrap();

            // Deserialize private key
            let private_key_bytes = match hex::decode(&organization.private_key) {
                Ok(bytes) => bytes,
                Err(_) => {
                    return ProductUniqueCodeResult::Error(ApiError::internal_error(
                        "Malformed secret key for organization",
                    ))
                }
            };

            let private_key = match SigningKey::from_slice(&private_key_bytes.as_slice()) {
                Ok(key) => key,
                Err(_) => {
                    return ProductUniqueCodeResult::Error(ApiError::internal_error(
                        "Malformed secret key for organization",
                    ))
                }
            };

            // Update the serial number's print version
            let sn_idx = sn_index.unwrap();
            product_sn_vec[sn_idx].print_version += 1;
            product_sn_vec[sn_idx].updated_at = api::time();
            product_sn_vec[sn_idx].updated_by = api::caller();

            let updated_sn = product_sn_vec[sn_idx].clone();

            // Save an updated serial number collection
            serial_numbers_mut.insert(product_id, encode_product_serial_numbers(&product_sn_vec));

            // Create unique code by signing a message
            let msg = format!(
                "{}_{}_{}",
                product_id.to_string(),
                serial_no.to_string(),
                updated_sn.print_version
            );
            let mut hasher = Sha256::new();
            hasher.update(msg);
            let hashed_message = hasher.finalize();

            let signature: Signature = private_key.sign(&hashed_message);

            ProductUniqueCodeResult::Result(ProductUniqueCodeResultRecord {
                unique_code: signature.to_string(),
                print_version: updated_sn.print_version,
                product_id: updated_sn.product_id,
                serial_no: updated_sn.serial_no,
                created_at: updated_sn.updated_at,
            })
        } else {
            ProductUniqueCodeResult::Error(ApiError::not_found(
                "Product has no serial number recorded",
            ))
        }
    })
}

#[update]
pub fn verify_product_v2(request: VerifyProductEnhancedRequest) -> ApiResponse<ProductVerificationEnhancedResponse> {
    let caller = api::caller();
    
    // Check for rate limiting
    let rate_limit_result = rate_limiter::record_verification_attempt(caller, request.product_id);
    if let Err(error) = rate_limit_result {
        return ApiResponse::error(error);
    }
    
    // Check if the product exists
    let product_opt = PRODUCTS.with(|products| products.borrow().get(&request.product_id).map(|p| p.clone()));
    
    if product_opt.is_none() {
        return ApiResponse::error(ApiError::not_found("Product is invalid"));
    }
    
    let product = product_opt.unwrap();

    // Check for serial number
    let mut has_serial_numbers = false;
    let mut product_sn_opt: Option<ProductSerialNumber> = None; // Explicitly type it

    PRODUCT_SERIAL_NUMBERS.with(|serial_numbers| {
        if let Some(serialized_sn_vec) = serial_numbers.borrow().get(&request.product_id) {
            has_serial_numbers = true;
            let product_sn_vec = decode_product_serial_numbers(&serialized_sn_vec);
            // The fix is to do the assignment here, .cloned() will create an owned Option<ProductSerialNumber>
            product_sn_opt = product_sn_vec
                .iter()
                .find(|p_sn| p_sn.serial_no == request.serial_no)
                .cloned(); // Use .cloned() here to get Option<ProductSerialNumber>
        }
    });

    if !has_serial_numbers {
        return ApiResponse::error(ApiError::not_found("Product has no serial numbers registered"));
    }

    if product_sn_opt.is_none() {
        return ApiResponse::error(ApiError::not_found("Serial number not found for this product"));
    }

    let product_sn = product_sn_opt.unwrap();

    // Check if the print version is correct/current
    if product_sn.print_version != request.print_version {
        return ApiResponse::error(ApiError::invalid_input("Unique code expired"));
    }
    
    // Replay attack prevention - check timestamp if provided
    if let Some(client_timestamp) = request.timestamp {
        let current_time = api::time();
        let time_diff = if current_time > client_timestamp {
            current_time - client_timestamp
        } else {
            client_timestamp - current_time
        };
        
        // If timestamp is more than 5 minutes off, reject as potential replay attack
        if time_diff > 300 {  // 5 minutes in seconds
            return ApiResponse::error(ApiError::invalid_input("Request timestamp too old or future dated"));
        }
    }

    // Deserialize public key
    let public_key_bytes = match hex::decode(&product.public_key) {
        Ok(bytes) => bytes,
        Err(_) => {
            return ApiResponse::error(ApiError::internal_error("Malformed public key"));
        }
    };

    let public_key_encoded_point = match EncodedPoint::from_bytes(public_key_bytes) {
        Ok(point) => point,
        Err(_) => {
            return ApiResponse::error(ApiError::internal_error("Malformed public key"));
        }
    };

    let public_key = match VerifyingKey::from_encoded_point(&public_key_encoded_point) {
        Ok(key) => key,
        Err(_) => {
            return ApiResponse::error(ApiError::internal_error("Malformed public key"));
        }
    };

    // Create message to verify, including nonce if provided
    let nonce_suffix = request.nonce.as_deref().unwrap_or("");
    let msg = format!(
        "{}_{}_{}_{}",
        request.product_id.to_string(),
        request.serial_no.to_string(),
        request.print_version,
        nonce_suffix
    );
    
    let mut hasher = Sha256::new();
    hasher.update(msg);
    let hashed_message = hasher.finalize();

    let decoded_code = match hex::decode(&request.unique_code) {
        Ok(bytes) => bytes,
        Err(_) => {
            return ApiResponse::error(ApiError::invalid_input("Malformed unique code"));
        }
    };
    
    let signature = match Signature::from_slice(decoded_code.as_slice()) {
        Ok(sig) => sig,
        Err(_) => {
            return ApiResponse::error(ApiError::invalid_input("Invalid signature format"));
        }
    };
    
    // Verify the signature
    let verify_result = public_key.verify(&hashed_message, &signature);
    
    if verify_result.is_err() {
        let response = ProductVerificationEnhancedResponse {
            status: ProductVerificationStatus::Invalid,
            verification: None,
            rewards: None,
            expiration: None,
        };
        return ApiResponse::success(response);
    }
    
    // Determine if this is first verification for the product
    let verification_status = if rewards::is_first_verification_for_user(caller, request.product_id) {
        ProductVerificationStatus::FirstVerification
    } else {
        ProductVerificationStatus::MultipleVerification
    };
    
    // Calculate rewards
    let rewards_result = rewards::calculate_verification_rewards(
        caller, 
        request.product_id, 
        &verification_status
    );
    
    // Record the verification in stable storage
    let verification_id = generate_unique_principal(Principal::anonymous());
    
    let verification = ProductVerification {
        id: verification_id,
        product_id: request.product_id,
        serial_no: request.serial_no,
        print_version: request.print_version,
        metadata: request.metadata.clone(),
        created_at: api::time(),
        created_by: caller,
        status: verification_status.clone(),
    };
    
    PRODUCT_VERIFICATIONS.with(|verifications| {
        let mut verifications_mut = verifications.borrow_mut();
        
        // Get or create collection for this product
        let mut verification_vec = if let Some(serialized_verifications) = verifications_mut.get(&request.product_id) {
            decode_product_verifications(&serialized_verifications)
        } else {
            Vec::new()
        };
        
        // Add new verification
        verification_vec.push(verification.clone());
        
        // Save updated collection
        verifications_mut.insert(request.product_id, encode_product_verifications(&verification_vec));
    });
    
    // Record successful verification in rate limiter
    rate_limiter::record_successful_verification(caller, request.product_id);
    
    // Calculate expiration time (24 hours from now)
    let expiration_time = api::time() + 86400;
    
    let response = ProductVerificationEnhancedResponse {
        status: verification_status,
        verification: Some(verification),
        rewards: Some(rewards_result),
        expiration: Some(expiration_time),
    };
    
    ApiResponse::success(response)
}

#[query]
pub fn get_verification_rate_limit(product_id: Principal) -> ApiResponse<RateLimitInfo> {
    let caller = api::caller();
    
    match rate_limiter::check_rate_limit(caller, product_id) {
        Ok(rate_limit_info) => ApiResponse::success(rate_limit_info),
        Err(error) => ApiResponse::error(error),
    }
}

#[update]
pub fn list_organizations_v2(request: FindOrganizationsRequest) -> ApiResponse<OrganizationsListResponse> {
    let filter = request.name.trim().to_lowercase();
    let caller = api::caller();

    // Get user to check role and permissions
    let user_opt = USERS.with(|users| users.borrow().get(&caller));

    // Check if user exists
    if user_opt.is_none() {
        return ApiResponse::error(ApiError::unauthorized("User not found"));
    }

    let user = user_opt.unwrap();

    // Check if user has a role
    if user.user_role.is_none() {
        return ApiResponse::error(ApiError::unauthorized("User has no role assigned"));
    }

    let role = user.user_role.unwrap();

    ORGANIZATIONS.with(|orgs| {
        let orgs_borrow = orgs.borrow();
        
        // Filter organizations based on name and user's permissions
        let filtered_orgs: Vec<OrganizationPublic> = if matches!(role, UserRole::Admin) {
            // Admin can see all organizations matching the filter
            orgs_borrow
                .iter()
                .filter(|(_, org)| org.name.to_lowercase().contains(&filter))
                .map(|(_, org)| OrganizationPublic::from(org.clone()))
                .collect()
        } else {
            // Non-admin users can only see organizations they belong to
            orgs_borrow
                .iter()
                .filter(|(org_id, org)| {
                    org.name.to_lowercase().contains(&filter) && user.org_ids.contains(org_id)
                })
                .map(|(_, org)| OrganizationPublic::from(org.clone()))
                .collect()
        };
        
        // Apply pagination if requested
        let pagination_request = request.pagination.unwrap_or_default();
        let (paginated_orgs, pagination) = paginate(filtered_orgs, &pagination_request);
        
        // Create the response
        let response = OrganizationsListResponse {
            organizations: paginated_orgs,
            pagination: Some(pagination),
        };
        
        ApiResponse::success(response)
    })
}

#[update]
pub fn create_organization_v2(request: CreateOrganizationRequest) -> ApiResponse<OrganizationResponse> {
    // Input validation
    if request.name.trim().is_empty() {
        return ApiResponse::error(ApiError::invalid_input("Organization name cannot be empty"));
    }

    // For creation, we don't need to check existing permissions since this creates a brand new org
    // However, we should check if the user has a registered account at minimum
    let caller = api::caller();
    let user_exists = USERS.with(|users| users.borrow().get(&caller).is_some());

    if !user_exists {
        // Register the user automatically
        let register_result = register();
        if register_result.id == Principal::anonymous() {
            return ApiResponse::error(ApiError::internal_error("Failed to register user automatically"));
        }
    }

    let id = generate_unique_principal(Principal::anonymous()); // Generate a unique ID for the organization
    
    // Generate ECDSA keys for demonstration
    let mut rng = StdRng::from_entropy();
    let signing_key = SigningKey::random(&mut rng);
    
    let organization = Organization {
        id,
        name: request.name,
        private_key: hex::encode(&signing_key.to_bytes()),
        description: request.description,
        metadata: request.metadata,
        created_at: api::time(),
        created_by: caller,
        updated_at: api::time(),
        updated_by: caller,
    };

    ORGANIZATIONS.with(|orgs| {
        orgs.borrow_mut().insert(id, organization.clone());
    });

    // Add the organization to the user's organizations
    let add_org_to_user_result = USERS.with(|users| {
        let mut users_mut = users.borrow_mut();
        match users_mut.get(&caller) {
            Some(user) => {
                let mut updated_user = user.clone();
                updated_user.org_ids.push(id);
                updated_user.updated_at = api::time();
                users_mut.insert(caller, updated_user);
                true
            }
            None => false,
        }
    });

    if !add_org_to_user_result {
        // This is unlikely but handle it anyway
        return ApiResponse::error(ApiError::internal_error("Failed to add organization to user"));
    }

    ApiResponse::success(OrganizationResponse {
        organization: OrganizationPublic::from(organization),
    })
}

#[update]
pub fn update_organization_v2(request: UpdateOrganizationRequest) -> ApiResponse<OrganizationResponse> {
    // Input validation
    if request.name.trim().is_empty() {
        return ApiResponse::error(ApiError::invalid_input("Organization name cannot be empty"));
    }

    // Check that user has write permission for this organization
    let result = authorize_for_organization(ic_cdk::caller(), request.id, Permission::WriteOrganization);
    if result.is_err() {
        return ApiResponse::error(result.err().unwrap());
    }

    ORGANIZATIONS.with(|orgs| {
        let mut orgs_mut = orgs.borrow_mut();
        match orgs_mut.get(&request.id) {
            Some(org) => {
                // Create a new organization with updated fields
                let updated_org = Organization {
                    name: request.name,
                    description: request.description,
                    metadata: request.metadata,
                    updated_at: api::time(),
                    updated_by: api::caller(),
                    ..org.clone()
                };

                // Insert the updated organization
                orgs_mut.insert(request.id, updated_org.clone());

                ApiResponse::success(OrganizationResponse {
                    organization: OrganizationPublic::from(updated_org),
                })
            }
            None => ApiResponse::error(ApiError::not_found(&format!(
                "Organization with ID {} not found",
                request.id
            ))),
        }
    })
}

// ===== Configuration Endpoints (Admin Only) =====

#[update]
pub fn set_openai_api_key(key: String) -> ApiResponse<()> {
    // Ensure caller is admin
    if let Err(e) = ensure_admin(api::caller()) {
        return ApiResponse::error(e);
    }
    
    if key.trim().is_empty() {
        return ApiResponse::error(ApiError::invalid_input("OpenAI API key cannot be empty"));
    }

    // Wrap the String in StorableString before setting
    match CONFIG_OPENAI_API_KEY.with(|cell| cell.borrow_mut().set(StorableString(key))) {
        Ok(_) => ApiResponse::success(()),
        Err(e) => {
            ic_cdk::print(format!("❌ ERROR: Failed to set OpenAI API Key: {:?}", e));
            ApiResponse::error(ApiError::internal_error("Failed to update configuration"))
        }
    }
}

#[query]
pub fn get_openai_api_key() -> ApiResponse<String> {
    // Ensure caller is admin
    if let Err(e) = ensure_admin(api::caller()) {
        return ApiResponse::error(e);
    }

    // Get the StorableString, access the inner String with .0, then clone it
    let storable_string = CONFIG_OPENAI_API_KEY.with(|cell| cell.borrow().get().clone());
    ApiResponse::success(storable_string.0) // Return the inner String
}

#[update]
pub fn set_scraper_url(url: String) -> ApiResponse<()> {
    // Ensure caller is admin
    if let Err(e) = ensure_admin(api::caller()) {
        return ApiResponse::error(e);
    }
    
    if url.trim().is_empty() {
        return ApiResponse::error(ApiError::invalid_input("Scraper URL cannot be empty"));
    }
    // Basic URL validation might be added here (e.g., check for http/https)

    // Wrap the String in StorableString before setting
    match CONFIG_SCRAPER_URL.with(|cell| cell.borrow_mut().set(StorableString(url))) {
        Ok(_) => ApiResponse::success(()),
        Err(e) => {
            ic_cdk::print(format!("❌ ERROR: Failed to set Scraper URL: {:?}", e));
            ApiResponse::error(ApiError::internal_error("Failed to update configuration"))
        }
    }
}

#[query]
pub fn get_scraper_url() -> ApiResponse<String> {
    // Ensure caller is admin
    if let Err(e) = ensure_admin(api::caller()) {
        return ApiResponse::error(e);
    }

    // Get the StorableString, access the inner String with .0, then clone it
    let storable_string = CONFIG_SCRAPER_URL.with(|cell| cell.borrow().get().clone());
    ApiResponse::success(storable_string.0) // Return the inner String
}

#[query]
pub fn list_product_verifications_by_org_id(org_id: Principal) -> Vec<ProductVerificationDetail> {
    // Check for read product permission within the organization
    let authorization_result =
        authorize_for_organization(api::caller(), org_id, Permission::ReadProduct);
    if authorization_result.is_err() {
        ic_cdk::print(format!(
            "Authorization failed for listing verifications in org {}: {:?}",
            org_id,
            authorization_result.err()
        ));
        return vec![];
    }

    // Get product IDs for the organization
    let products_in_org = PRODUCTS.with(|products| {
        products
            .borrow()
            .iter()
            .filter(|(_, product)| product.org_id == org_id)
            .map(|(id, product)| (id, product.clone())) // Keep both ID and product
            .collect::<Vec<(Principal, Product)>>()
    });

    let mut all_verification_details = Vec::new();

    // Pre-fetch user emails into a HashMap to avoid multiple reads inside the loop
    let user_emails: std::collections::HashMap<Principal, Option<String>> = USERS.with(|users_store| {
        users_store
            .borrow()
            .iter()
            .map(|(id, user)| (id, user.email.clone()))
            .collect()
    });

    PRODUCT_VERIFICATIONS.with(|verifications_store| {
        let store = verifications_store.borrow();
        for (product_id, product) in products_in_org {
            if let Some(serialized_verifications) = store.get(&product_id) {
                let decoded_verifications = decode_product_verifications(&serialized_verifications);
                
                for verification in decoded_verifications {
                    // Find the user who created the verification using the pre-fetched map
                    // .cloned() on Option<&V> (where V=Option<String>) gives Option<Option<String>>
                    // .flatten() on Option<Option<String>> gives Option<String>
                    let user_email = user_emails.get(&verification.created_by).cloned().flatten();

                    let detail = ProductVerificationDetail {
                        user_email,
                        product_id: verification.product_id,
                        product_name: product.name.clone(), // Use product name from fetched products
                        serial_no: verification.serial_no,
                        created_at: verification.created_at,
                    };
                    all_verification_details.push(detail);
                }
            }
        }
    });

    // Optionally sort the results, e.g., by creation date descending
    all_verification_details.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    all_verification_details
}

#[update]
pub fn reset_all_stable_storage() -> ApiResponse<ResetStorageResponse> {
    ic_cdk::print("🚨 WARNING: Resetting all stable storage initiated.");

    // Clear StableBTreeMaps by iterating and removing
    ORGANIZATIONS.with(|orgs| {
        let mut orgs_mut = orgs.borrow_mut();
        let keys: Vec<_> = orgs_mut.iter().map(|(k, _)| k).collect();
        for key in keys {
            orgs_mut.remove(&key);
        }
    });
    PRODUCTS.with(|prods| {
        let mut prods_mut = prods.borrow_mut();
        let keys: Vec<_> = prods_mut.iter().map(|(k, _)| k).collect();
        for key in keys {
            prods_mut.remove(&key);
        }
    });
    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();
        let keys: Vec<_> = users_mut.iter().map(|(k, _)| k).collect();
        for key in keys {
            users_mut.remove(&key);
        }
    });
    RESELLERS.with(|resellers| {
        let mut resellers_mut = resellers.borrow_mut();
        let keys: Vec<_> = resellers_mut.iter().map(|(k, _)| k).collect();
        for key in keys {
            resellers_mut.remove(&key);
        }
    });
    PRODUCT_SERIAL_NUMBERS.with(|sns| {
        let mut sns_mut = sns.borrow_mut();
        let keys: Vec<_> = sns_mut.iter().map(|(k, _)| k).collect();
        for key in keys {
            sns_mut.remove(&key);
        }
    });
    PRODUCT_VERIFICATIONS.with(|vers| {
        let mut vers_mut = vers.borrow_mut();
        let keys: Vec<_> = vers_mut.iter().map(|(k, _)| k).collect();
        for key in keys {
            vers_mut.remove(&key);
        }
    });

    // Clear StableCells by setting them to default
    match CONFIG_OPENAI_API_KEY.with(|cell| cell.borrow_mut().set(StorableString::default())) {
        Ok(_) => ic_cdk::print("Cleared OpenAI API Key config."),
        Err(e) => {
            ic_cdk::print(format!("❌ ERROR: Failed to reset OpenAI API Key config: {:?}", e));
            return ApiResponse::error(ApiError::internal_error("Failed to reset OpenAI key config"));
        }
    }
    match CONFIG_SCRAPER_URL.with(|cell| cell.borrow_mut().set(StorableString::default())) {
        Ok(_) => ic_cdk::print("Cleared Scraper URL config."),
        Err(e) => {
            ic_cdk::print(format!("❌ ERROR: Failed to reset Scraper URL config: {:?}", e));
            return ApiResponse::error(ApiError::internal_error("Failed to reset scraper URL config"));
        }
    }

    // Consider clearing rate limiter and rewards storage if they use stable memory too
    rate_limiter::reset_rate_limits();
    rewards::reset_rewards_storage();

    ic_cdk::print("✅ All stable storage reset successfully.");

    ApiResponse::success(ResetStorageResponse {
        message: "All stable storage has been successfully reset.".to_string(),
    })
}

#[query]
pub fn check_reseller_verification(org_id: Principal) -> ApiResponse<bool> {
    let caller = api::caller(); 
    
    // Fetch the user based on the caller's principal
    match USERS.with(|users| users.borrow().get(&caller).clone()) {
        Some(user) => {
            // Check if the user has the Reseller role
            if let Some(UserRole::Reseller) = user.user_role {
                // Check if the user is associated with the provided organization ID
                if user.org_ids.contains(&org_id) {
                    // Reseller role and associated with the correct org
                    ApiResponse::success(true) 
                } else {
                    // Reseller role, but not associated with this org
                    ic_cdk::print(format!("ℹ️ User {} is a Reseller but not associated with org {}", caller, org_id));
                    ApiResponse::success(false)
                }
            } else {
                // User exists but is not a Reseller
                ic_cdk::print(format!("ℹ️ User {} is not a Reseller.", caller));
                ApiResponse::success(false)
            }
        }
        None => {
            // User not found
            ic_cdk::print(format!("ℹ️ User {} not found.", caller));
            // Return false to align with previous behaviour on user not found.
            // Alternatively, return an error:
            // ApiResponse::error(ApiError::not_found("User not found"))
            ApiResponse::success(false)
        }
    }
}

// ====== Phase 1: Core Authentication & Context ======

#[query]
pub fn get_available_roles() -> ApiResponse<Vec<UserRole>> {
    ApiResponse::success(vec![UserRole::BrandOwner, UserRole::Reseller])
}

#[update]
pub fn initialize_user_session(selected_role: Option<UserRole>) -> ApiResponse<AuthContextResponse> {
    let session_principal = api::caller(); 
    let user_principal_key = session_principal;

    ic_cdk::print(format!("ℹ️ [initialize_user_session] Called by session_principal: {} with role: {:?}", session_principal, selected_role));

    // Corrected AGAIN: Use .clone() on Option<&User> to get Option<User>
    let user_record_opt = USERS.with(|users| users.borrow().get(&user_principal_key).clone());

    let mut final_user_state: User = match user_record_opt {
        Some(mut user) => { // User exists
            ic_cdk::print(format!("ℹ️ [initialize_user_session] Existing user {} found: {:?}", user_principal_key, user));
            // Assign role if missing
            if user.user_role.is_none() {
                if let Some(role) = selected_role {
                    user.user_role = Some(role);
                    ic_cdk::print(format!("ℹ️ [initialize_user_session] Assigned role {:?} to existing user {}", role, user.id));
                } else {
                    // Role is mandatory if user has no role yet
                    ic_cdk::print(format!("⚠️ [initialize_user_session] Role selection required for user {} to complete registration.", user_principal_key));
                    return ApiResponse::error(ApiError::invalid_input(
                        "Role selection is required to complete your registration.",
                    ));
                }
            } else if let Some(new_role) = selected_role {
                 // Check for role change attempt
                 if user.user_role != Some(new_role) {
                     ic_cdk::print(format!("⚠️ [initialize_user_session] User {} attempted to change role from {:?} to {:?}", user.id, user.user_role, new_role));
                     return ApiResponse::error(ApiError::unauthorized(
                         "User role has already been set and cannot be changed.",
                     ));
                 }
            }

            // ALWAYS add the current session_principal to session_keys if not already present
            if !user.session_keys.contains(&session_principal) {
                ic_cdk::print(format!("ℹ️ [initialize_user_session] Adding session key {} for user {}", session_principal, user.id));
                user.session_keys.push(session_principal);
                user.updated_at = api::time();
                user.updated_by = session_principal;
                // Save the updated user record
                USERS.with(|users| users.borrow_mut().insert(user.id, user.clone()));
            } else {
                 ic_cdk::print(format!("ℹ️ [initialize_user_session] Session key {} already exists for user {}", session_principal, user.id));
            }
            user // Return potentially modified user
        }
        None => { // New user
            ic_cdk::print(format!("ℹ️ [initialize_user_session] New user: {}. Creating record.", user_principal_key));
            match selected_role {
                Some(role) => {
                    // Create user with the calling principal as ID and also add it as the first session key
                    let new_user = User {
                        id: user_principal_key, // User ID is the principal that called this
                        user_role: Some(role),
                        session_keys: vec![session_principal], // Always add the session key used for creation
                        created_by: user_principal_key, // Created by the root identity (same as caller here)
                        updated_by: session_principal, // Updated by the session identity during this call
                        ..Default::default()
                    };
                    USERS.with(|users| users.borrow_mut().insert(user_principal_key, new_user.clone()));
                    ic_cdk::print(format!("ℹ️ [initialize_user_session] Created new user {} with role {:?} and initial session key {}", user_principal_key, role, session_principal));
                    new_user
                }
                None => {
                    ic_cdk::print(format!("⚠️ [initialize_user_session] Role selection required for new user {}", user_principal_key));
                    return ApiResponse::error(ApiError::invalid_input(
                        "Role selection is required for new users.",
                    ));
                }
            }
        }
    };

    // Construct AuthContextResponse using the final helper
    let auth_context = build_auth_context_response(&final_user_state);
    ApiResponse::success(auth_context)
}

// Final version of build_auth_context_response incorporating all phases
fn build_auth_context_response(user: &User) -> AuthContextResponse {
    let user_public = UserPublic {
        id: user.id,
        first_name: user.first_name.clone(),
        last_name: user.last_name.clone(),
        email: user.email.clone(),
        created_at: user.created_at,
    };

    let mut brand_owner_details: Option<BrandOwnerContextDetails> = None;
    if user.user_role == Some(UserRole::BrandOwner) {
        let mut org_public_list = Vec::new();
        let mut active_org_public: Option<OrganizationPublic> = None;
        ORGANIZATIONS.with(|orgs_map| {
            let orgs_ref = orgs_map.borrow();
            for org_id_principal in &user.org_ids {
                if let Some(org_record) = orgs_ref.get(org_id_principal) {
                    org_public_list.push(OrganizationPublic::from(org_record.clone()));
                }
            }
            if let Some(active_org_id_principal) = user.active_org_id {
                if let Some(active_org_record) = orgs_ref.get(&active_org_id_principal) {
                    active_org_public = Some(OrganizationPublic::from(active_org_record.clone()));
                }
            }
        });
        brand_owner_details = Some(BrandOwnerContextDetails {
            has_organizations: !org_public_list.is_empty(),
            organizations: if org_public_list.is_empty() { None } else { Some(org_public_list) },
            active_organization: active_org_public,
        });
    }

    let mut reseller_details_ctx: Option<ResellerContextDetails> = None;
    if user.user_role == Some(UserRole::Reseller) {
        if let Some(reseller_record) = get_reseller_by_user_id(user.id) { // Assuming get_reseller_by_user_id exists
            let associated_org_public = ORGANIZATIONS.with(|orgs_map| {
                orgs_map.borrow().get(&reseller_record.org_id).map(|org| OrganizationPublic::from(org.clone()))
            });

            reseller_details_ctx = Some(ResellerContextDetails {
                is_profile_complete_and_verified: reseller_record.is_verified,
                associated_organization: associated_org_public,
                certification_code: reseller_record.certification_code.clone(),
                certification_timestamp: reseller_record.certification_timestamp,
            });
        } else {
            reseller_details_ctx = Some(ResellerContextDetails {
                is_profile_complete_and_verified: false,
                associated_organization: None,
                certification_code: None,
                certification_timestamp: None,
            });
        }
    }

    AuthContextResponse {
        user: Some(user_public),
        is_registered: true,
        role: user.user_role,
        brand_owner_details,
        reseller_details: reseller_details_ctx,
    }
}

// Final version of get_auth_context
#[query]
pub fn get_auth_context() -> ApiResponse<AuthContextResponse> {
    let caller = api::caller();
    ic_cdk::print(format!("ℹ️ [get_auth_context] Called by: {}", caller));

    match USERS.with(|users| users.borrow().get(&caller).clone()) { // Cloned here
        Some(user) => {
            ic_cdk::print(format!("ℹ️ [get_auth_context] Found user: {:?}", user));
            let auth_context = build_auth_context_response(&user);
            ApiResponse::success(auth_context)
        }
        None => {
            ic_cdk::print(format!("ℹ️ [get_auth_context] User not found: {}. Returning not registered.", caller));
            ApiResponse::success(AuthContextResponse {
                user: None,
                is_registered: false,
                role: None,
                brand_owner_details: None,
                reseller_details: None,
            })
        }
    }
}

#[update]
pub fn logout_user() -> ApiResponse<LogoutResponse> {
    let caller = api::caller();
    ic_cdk::print(format!("ℹ️ [logout_user] User {} attempting to log out.", caller));
    ApiResponse::success(LogoutResponse {
        message: "Successfully logged out.".to_string(),
        redirect_url: None, 
    })
}

// ====== Phase 2: Brand Owner Flow ======

#[update]
pub fn create_organization_for_owner(request: CreateOrganizationWithOwnerContextRequest) -> ApiResponse<OrganizationContextResponse> {
    let caller = api::caller();
    ic_cdk::print(format!("ℹ️ [create_organization_for_owner] Called by: {} with request: {:?}", caller, request));

    let user_opt = USERS.with(|users| users.borrow().get(&caller).clone()); // Cloned here
    if user_opt.is_none() {
        return ApiResponse::error(ApiError::unauthorized("User not registered."));
    }
    let mut user = user_opt.unwrap();

    if user.user_role != Some(UserRole::BrandOwner) {
        return ApiResponse::error(ApiError::unauthorized("Only Brand Owners can create organizations."));
    }

    let org_id = generate_unique_principal(Principal::anonymous());
    let mut rng = StdRng::from_entropy(); 
    let signing_key = SigningKey::random(&mut rng);

    let new_organization = Organization {
        id: org_id,
        name: request.name,
        description: request.description,
        private_key: hex::encode(&signing_key.to_bytes()),
        metadata: request.metadata,
        created_at: api::time(),
        created_by: caller,
        updated_at: api::time(),
        updated_by: caller,
    };

    ORGANIZATIONS.with(|orgs| {
        orgs.borrow_mut().insert(org_id, new_organization.clone());
    });
    ic_cdk::print(format!("ℹ️ [create_organization_for_owner] Organization {} created.", org_id));

    if !user.org_ids.contains(&org_id) {
        user.org_ids.push(org_id);
    }
    user.active_org_id = Some(org_id);
    user.updated_at = api::time();
    user.updated_by = caller;

    USERS.with(|users| {
        users.borrow_mut().insert(caller, user.clone());
    });
    ic_cdk::print(format!("ℹ️ [create_organization_for_owner] User {} updated with new org {} and active org set.", caller, org_id));

    let org_public = OrganizationPublic::from(new_organization);
    let updated_auth_context = build_auth_context_response(&user); 

    ApiResponse::success(OrganizationContextResponse {
        organization: org_public,
        user_auth_context: updated_auth_context,
    })
}

#[update]
pub fn select_active_organization(org_id: Principal) -> ApiResponse<AuthContextResponse> {
    let caller = api::caller();
    ic_cdk::print(format!("ℹ️ [select_active_organization] Called by: {} to select org: {}", caller, org_id));

    let user_opt = USERS.with(|users| users.borrow().get(&caller).clone()); // Cloned here
    if user_opt.is_none() {
        return ApiResponse::error(ApiError::unauthorized("User not registered."));
    }
    let mut user = user_opt.unwrap();

    if user.user_role != Some(UserRole::BrandOwner) {
        return ApiResponse::error(ApiError::unauthorized("Only Brand Owners can select an active organization."));
    }

    if !user.org_ids.contains(&org_id) {
        return ApiResponse::error(ApiError::unauthorized("User is not associated with this organization."));
    }
    
    if ORGANIZATIONS.with(|orgs| orgs.borrow().get(&org_id)).is_none() {
        return ApiResponse::error(ApiError::not_found("Organization not found."));
    }

    user.active_org_id = Some(org_id);
    user.updated_at = api::time();
    user.updated_by = caller;

    USERS.with(|users| {
        users.borrow_mut().insert(caller, user.clone());
    });
    ic_cdk::print(format!("ℹ️ [select_active_organization] User {} set active org to {}.", caller, org_id));

    let updated_auth_context = build_auth_context_response(&user); 
    ApiResponse::success(updated_auth_context)
}

#[query]
pub fn get_my_organizations() -> ApiResponse<Vec<OrganizationPublic>> {
    let caller = api::caller();
    ic_cdk::print(format!("ℹ️ [get_my_organizations] Called by: {}", caller));

    let user_opt = USERS.with(|users| users.borrow().get(&caller).clone()); // Cloned here
    if user_opt.is_none() {
        return ApiResponse::error(ApiError::unauthorized("User not registered."));
    }
    let user = user_opt.unwrap();

    if user.user_role != Some(UserRole::BrandOwner) {
        return ApiResponse::error(ApiError::unauthorized("Only Brand Owners can list their organizations."));
    }

    let mut org_public_list = Vec::new();
    ORGANIZATIONS.with(|orgs_map| {
        let orgs_ref = orgs_map.borrow();
        for org_id_principal in &user.org_ids {
            if let Some(org_record) = orgs_ref.get(org_id_principal) {
                org_public_list.push(OrganizationPublic::from(org_record.clone()));
            }
        }
    });

    ApiResponse::success(org_public_list)
}

// ====== Phase 3: Reseller Flow ======

// Helper to get Reseller record by user_id
fn get_reseller_by_user_id(user_id_principal: Principal) -> Option<Reseller> {
    RESELLERS.with(|resellers_map| {
        resellers_map
            .borrow()
            .iter()
            .find(|(_, reseller_val)| reseller_val.user_id == user_id_principal)
            .map(|(_, reseller_val)| reseller_val.clone())
    })
}

#[update]
pub fn complete_reseller_profile(request: CompleteResellerProfileRequest) -> ApiResponse<AuthContextResponse> {
    let caller = api::caller();
    ic_cdk::print(format!("ℹ️ [complete_reseller_profile] Called by: {} with request: {:?}", caller, request));

    let user_opt = USERS.with(|users| users.borrow().get(&caller).clone()); // Cloned here
    if user_opt.is_none() {
        return ApiResponse::error(ApiError::unauthorized("User not registered."));
    }
    let mut user = user_opt.unwrap();

    if user.user_role != Some(UserRole::Reseller) {
        return ApiResponse::error(ApiError::unauthorized("Only Resellers can complete this profile."));
    }

    if ORGANIZATIONS.with(|orgs| orgs.borrow().get(&request.target_organization_id)).is_none() {
        return ApiResponse::error(ApiError::not_found("Target organization not found."));
    }

    let existing_reseller_opt = get_reseller_by_user_id(caller);

    let reseller_id = existing_reseller_opt.as_ref().map_or_else(
        || generate_unique_principal(Principal::anonymous()), 
        |r| r.id
    );
    
    let cert_code = format!("CERT-{}-{}", request.target_organization_id.to_string().chars().take(5).collect::<String>(), reseller_id.to_string().chars().take(5).collect::<String>());
    let cert_timestamp = api::time();

    let reseller_record = Reseller {
        id: reseller_id,
        user_id: caller,
        org_id: request.target_organization_id,
        name: request.reseller_name,
        contact_email: request.contact_email,
        contact_phone: request.contact_phone,
        ecommerce_urls: request.ecommerce_urls,
        additional_metadata: request.additional_metadata,
        is_verified: true, 
        certification_code: Some(cert_code),
        certification_timestamp: Some(cert_timestamp),
        created_by: caller,
        updated_by: caller,
        date_joined: existing_reseller_opt.as_ref().map_or(api::time(), |r| r.date_joined),
        metadata: existing_reseller_opt.as_ref().map_or(Vec::new(), |r| r.metadata.clone()), 
        public_key: existing_reseller_opt.as_ref().map_or(String::new(), |r| r.public_key.clone()),
        created_at: existing_reseller_opt.as_ref().map_or(api::time(), |r| r.created_at),
        updated_at: api::time(), 
    };

    RESELLERS.with(|resellers| {
        resellers.borrow_mut().insert(reseller_id, reseller_record.clone());
    });
    ic_cdk::print(format!("ℹ️ [complete_reseller_profile] Reseller record {} for user {} processed.", reseller_id, caller));

    user.org_ids = vec![request.target_organization_id];
    user.updated_at = api::time();
    user.updated_by = caller;
    USERS.with(|users| {
        users.borrow_mut().insert(caller, user.clone());
    });
    ic_cdk::print(format!("ℹ️ [complete_reseller_profile] User {} updated with org_id {}.", caller, request.target_organization_id));

    let updated_auth_context = build_auth_context_response(&user); 
    ApiResponse::success(updated_auth_context)
}

#[query]
pub fn get_my_reseller_certification() -> ApiResponse<ResellerCertificationPageContext> {
    let caller = api::caller();
    ic_cdk::print(format!("ℹ️ [get_my_reseller_certification] Called by: {}", caller));

    let user_opt = USERS.with(|users| users.borrow().get(&caller).clone()); // Cloned here
    if user_opt.is_none() {
        return ApiResponse::error(ApiError::unauthorized("User not registered."));
    }
    let user = user_opt.unwrap();

    if user.user_role != Some(UserRole::Reseller) {
        return ApiResponse::error(ApiError::unauthorized("Only Resellers can access certification details."));
    }

    let reseller_record_opt = get_reseller_by_user_id(caller);
    if reseller_record_opt.is_none() || !reseller_record_opt.as_ref().unwrap().is_verified {
        return ApiResponse::error(ApiError::unauthorized("Reseller profile is not complete or verified."));
    }
    let reseller_record = reseller_record_opt.unwrap(); 

    let associated_org_public_opt = ORGANIZATIONS.with(|orgs_map| {
        orgs_map.borrow().get(&reseller_record.org_id).map(|org| OrganizationPublic::from(org.clone()))
    });
    if associated_org_public_opt.is_none() {
        return ApiResponse::error(ApiError::internal_error("Associated organization not found for reseller."));
    }
    let associated_organization = associated_org_public_opt.unwrap();

    let reseller_public = ResellerPublic {
        id: reseller_record.id,
        user_id: reseller_record.user_id,
        organization_id: reseller_record.org_id,
        name: reseller_record.name.clone(),
        contact_email: reseller_record.contact_email.clone(),
        contact_phone: reseller_record.contact_phone.clone(),
        ecommerce_urls: reseller_record.ecommerce_urls.clone(),
        additional_metadata: reseller_record.additional_metadata.clone(),
        is_verified: reseller_record.is_verified,
        certification_code: reseller_record.certification_code.clone(),
        certification_timestamp: reseller_record.certification_timestamp,
        created_at: reseller_record.created_at,
        updated_at: reseller_record.updated_at,
    };

    let user_details_public = UserPublic {
        id: user.id,
        first_name: user.first_name.clone(),
        last_name: user.last_name.clone(),
        email: user.email.clone(),
        created_at: user.created_at,
    };
    
    if reseller_public.certification_code.is_none() || reseller_public.certification_timestamp.is_none() {
        ic_cdk::print(format!("❌ ERROR [get_my_reseller_certification] Missing cert code or timestamp for verified reseller {}", reseller_public.id));
        return ApiResponse::error(ApiError::internal_error("Certification details missing for verified reseller."));
    }

    ApiResponse::success(ResellerCertificationPageContext {
        reseller_profile: reseller_public.clone(),
        associated_organization,
        certification_code: reseller_public.certification_code.unwrap(), 
        certification_timestamp: reseller_public.certification_timestamp.unwrap(), 
        user_details: user_details_public,
    })
}

// ====== Phase 4: Profile and Navigation ======

#[query]
pub fn get_navigation_context() -> ApiResponse<NavigationContextResponse> {
    let caller = api::caller();
    ic_cdk::print(format!("ℹ️ [get_navigation_context] Called by: {}", caller));

    match USERS.with(|users| users.borrow().get(&caller).clone()) { // Cloned here
        Some(user) => {
            let display_name = user.first_name.as_ref().map_or_else(
                || user.email.as_ref().map_or_else(|| user.id.to_string(), |e| e.clone()),
                |f_name| f_name.clone()
            );

            let mut current_org_name: Option<String> = None;

            if user.user_role == Some(UserRole::BrandOwner) {
                if let Some(active_org_id) = user.active_org_id {
                    current_org_name = ORGANIZATIONS.with(|orgs| 
                        orgs.borrow().get(&active_org_id).map(|org| org.name.clone())
                    );
                }
            } else if user.user_role == Some(UserRole::Reseller) {
                if let Some(reseller_record) = get_reseller_by_user_id(user.id) {
                    current_org_name = ORGANIZATIONS.with(|orgs| 
                        orgs.borrow().get(&reseller_record.org_id).map(|org| org.name.clone())
                    );
                }
            }

            ApiResponse::success(NavigationContextResponse {
                user_display_name: display_name,
                user_avatar_id: None, 
                current_organization_name: current_org_name,
            })
        }
        None => {
            ic_cdk::print(format!("ℹ️ [get_navigation_context] User {} not found.", caller));
            ApiResponse::error(ApiError::unauthorized("User not authenticated.")) 
        }
    }
}

// Make sure to export the new types if they are in a different module and used by Candid.
// However, these are directly in models.rs which is part of the crate.
