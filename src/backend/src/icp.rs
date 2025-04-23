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
use crate::models::{Metadata, Organization, OrganizationInput, OrganizationPublic, OrganizationResult, PrivateKeyResult, Product, ProductInput, ProductResult, ProductSerialNumber, ProductSerialNumberResult, ProductUniqueCodeResult, ProductUniqueCodeResultRecord, ProductVerification, ProductVerificationResult, ProductVerificationStatus, Reseller, ResellerInput, ResellerVerificationResult, UniqueCodeResult, User, UserDetailsInput, UserResult, UserRole};
use crate::utils::generate_unique_principal;
use crate::{
    global_state::{
        decode_product_serial_numbers, decode_product_verifications, encode_product_serial_numbers,
        encode_product_verifications, ORGANIZATIONS, PRODUCTS, PRODUCT_SERIAL_NUMBERS,
        PRODUCT_VERIFICATIONS, RESELLERS, USERS,
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

use crate::api::{
    ApiResponse, CreateOrganizationRequest, FindOrganizationsRequest, OrganizationResponse,
    UpdateOrganizationRequest, OrganizationsListResponse, PaginationRequest, paginate
};

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
            // Check if user belongs to this organization or is an admin
            if !user.org_ids.contains(&id) && !matches!(role, UserRole::Admin) {
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
    let caller = ic_cdk::caller();

    // Get user to check role and permissions
    let user_opt = USERS.with(|users| users.borrow().get(&caller));

    ORGANIZATIONS.with(|orgs| {
        let orgs_borrow = orgs.borrow();

        // If user is admin, they can see all organizations
        if let Some(user) = &user_opt {
            if let Some(role) = &user.user_role {
                if matches!(role, UserRole::Admin) {
                    return orgs_borrow
                        .iter()
                        .filter(|(_, org)| org.name.to_lowercase().contains(&filter))
                        .map(|(_, org)| OrganizationPublic::from(org.clone()))
                        .collect();
                }
            }

            // For non-admin users, only show organizations they belong to
            return orgs_borrow
                .iter()
                .filter(|(org_id, org)| {
                    org.name.to_lowercase().contains(&filter) && user.org_ids.contains(org_id)
                })
                .map(|(_, org)| OrganizationPublic::from(org.clone()))
                .collect();
        }

        // If no user found or no role, return empty list
        vec![]
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

        // Return an existing user if found
        if let Some(existing_user) = users_mut.get(&caller) {
            return existing_user.clone();
        }

        // Create a new user
        let user = User {
            id: caller,
            is_principal: users_mut.is_empty(),
            ..Default::default()
        };

        users_mut.insert(caller, user.clone());
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
        match users_ref.get(&caller) {
            Some(user) => Some(user.clone()),
            None => None,
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

// DEBUG ONLY
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

            let updated_user = User {
                user_role: Some(role),
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
pub fn register_as_reseller(input: ResellerInput) -> UserResult {
    let caller = api::caller();
    let mut is_user_found = false;
    let mut user_already_has_role = false;
    let mut user_clone = User::default();

    // Check if a user exists and its role
    USERS.with(|users| {
        if let Some(user) = users.borrow().get(&caller) {
            is_user_found = true;
            user_already_has_role = user.user_role.is_some();
            user_clone = user.clone();
        }
    });

    if !is_user_found {
        return UserResult::Error(ApiError::not_found("User not found"));
    }

    if user_already_has_role {
        return UserResult::Error(ApiError::unauthorized("User already has assigned role"));
    }

    // Get organization information
    let mut org_found = false;
    let mut org_private_key = String::new();

    ORGANIZATIONS.with(|orgs| {
        if let Some(org) = orgs.borrow().get(&input.org_id) {
            org_found = true;
            org_private_key = org.private_key.clone();
        }
    });

    if !org_found {
        return UserResult::Error(ApiError::not_found(&format!(
            "Organization with ID {} not found",
            input.org_id
        )));
    }

    // Process private key
    let private_key_bytes = match hex::decode(&org_private_key) {
        Ok(bytes) => bytes,
        Err(_) => {
            return UserResult::Error(ApiError::internal_error(
                "Malformed secret key for organization",
            ))
        }
    };

    let private_key = match SecretKey::from_slice(&private_key_bytes.as_slice()) {
        Ok(key) => key,
        Err(_) => {
            return UserResult::Error(ApiError::internal_error(
                "Malformed secret key for organization",
            ))
        }
    };

    let public_key = private_key.public_key();
    let reseller_id = generate_unique_principal(Principal::anonymous());

    // Create reseller
    let reseller = Reseller {
        id: reseller_id,
        org_id: input.org_id,
        name: input.name,
        ecommerce_urls: input.ecommerce_urls,
        metadata: input.metadata,
        public_key: hex::encode(public_key.to_encoded_point(false).as_bytes()),
        ..Default::default()
    };

    // Update resellers collection
    RESELLERS.with(|resellers| {
        resellers.borrow_mut().insert(reseller_id, reseller);
    });

    // Update a user with a reseller role
    let updated_user = User {
        user_role: Some(UserRole::Reseller),
        updated_at: api::time(),
        updated_by: caller,
        ..user_clone
    };

    // Save the updated user
    USERS.with(|users| {
        users.borrow_mut().insert(caller, updated_user.clone());
    });

    UserResult::User(updated_user)
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
const OPENAI_API_KEY: &str = "OPEN_AI_API_KEY";
const OPENAI_HOST: &str = "api.openai.com";
const GPT_MODEL: &str = "gpt-4o";

const REQUEST_CYCLES: u64 = 230_949_972_000;

#[update]
async fn generate_product_review(product_id: Principal) -> Result<Product, ApiError> {
    let product = get_product(&product_id)?;

    if !should_generate_new_review(&product) {
        return Ok(product);
    }

    let review_summary = scrape_product_review(&product).await;
    let sentiment_analysis = analyze_sentiment_with_openai(&review_summary).await?;
    let updated_product = update_product_with_review(product, sentiment_analysis)?;

    Ok(updated_product)
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
    let request = create_openai_request(review_text)?;

    match http_request(request, REQUEST_CYCLES as u128).await {
        Ok((response,)) => {
            let response_body = String::from_utf8(response.body)
                .map_err(|_| ApiError::external_api_error("Invalid UTF-8 in response"))?;

            let parsed: Value = serde_json::from_str(&response_body)
                .map_err(|_| ApiError::external_api_error("Invalid JSON response"))?;

            Ok(parsed["choices"][0]["message"]["content"]
                .as_str()
                .unwrap_or_default()
                .to_string())
        }
        Err((code, message)) => {
            ic_cdk::print(format!("OpenAI API error: {code:?} - {message}"));
            Err(ApiError::external_api_error(
                "Failed to get sentiment analysis",
            ))
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
            value: format!("Bearer {OPENAI_API_KEY}"),
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

async fn scrape_product_review(product: &Product) -> String {
    // let product_url = product.metadata.iter().find(|v| v.key == "ecommerce_url").map(|v| v.value.clone()).unwrap_or_default();

    // let json_data = format!(r#"
    // {{
    //     "url": "{}",
    //     "product_id: "{}"
    // }}
    // "#, product_url, product.id);

    // let json_utf8: Vec<u8> = json_data.as_bytes().to_vec(); // Convert JSON string to Vec<u8>
    // let request_body: Option<Vec<u8>> = Some(json_utf8);

    let request = CanisterHttpRequestArgument {
        url: format!(
            "https://3a31-114-122-138-100.ngrok-free.app/product-review?id={}",
            product.id.to_string()
        ),
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: None,
        transform: Some(TransformContext {
            function: TransformFunc(candid::Func {
                principal: api::id(),
                method: "transform".to_string(),
            }),
            context: vec![],
        }),
        headers: vec![],
    };

    let cycles = 230_949_972_000;

    match http_request(request, cycles).await {
        Ok((response,)) => {
            let response_body = String::from_utf8(response.body).unwrap_or_default(); // Convert Vec<u8> to String
            response_body
        }

        Err((r, m)) => {
            let message =
                format!("The http_request resulted into error. RejectionCode: {r:?}, Error: {m}");

            ic_cdk::print(message);

            "No product review!".to_string()
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
pub fn verify_reseller(reseller_id: Principal, unique_code: String) -> ResellerVerificationResult {
    // Check if a reseller exists
    let mut reseller_found = false;
    let mut reseller_clone = Reseller::default();

    RESELLERS.with(|resellers| {
        if let Some(reseller) = resellers.borrow().get(&reseller_id) {
            reseller_found = true;
            reseller_clone = reseller.clone();
        }
    });

    if !reseller_found {
        return ResellerVerificationResult::Error(ApiError::not_found(&format!(
            "Reseller with ID {} not found",
            reseller_id
        )));
    }

    // Check if an organization exists
    let mut org_found = false;
    let mut org_clone = Organization::default();

    ORGANIZATIONS.with(|orgs| {
        if let Some(org) = orgs.borrow().get(&reseller_clone.org_id) {
            org_found = true;
            org_clone = org.clone();
        }
    });

    if !org_found {
        return ResellerVerificationResult::Error(ApiError::not_found(&format!(
            "Organization with ID {} not found",
            reseller_clone.org_id
        )));
    }

    // Deserialize public key
    let public_key_bytes = match hex::decode(&reseller_clone.public_key) {
        Ok(bytes) => bytes,
        Err(_) => {
            return ResellerVerificationResult::Error(ApiError::internal_error(
                "Malformed public key",
            ))
        }
    };

    let public_key_encoded_point = match EncodedPoint::from_bytes(public_key_bytes) {
        Ok(point) => point,
        Err(_) => {
            return ResellerVerificationResult::Error(ApiError::internal_error(
                "Malformed public key",
            ))
        }
    };

    let public_key = match VerifyingKey::from_encoded_point(&public_key_encoded_point) {
        Ok(key) => key,
        Err(_) => {
            return ResellerVerificationResult::Error(ApiError::internal_error(
                "Malformed public key",
            ))
        }
    };

    // Hash message is the reseller_id
    let mut hasher = Sha256::new();
    hasher.update(reseller_id.to_string());
    let hashed_message = hasher.finalize();

    // Decode signature
    let decoded_code = match hex::decode(&unique_code) {
        Ok(bytes) => bytes,
        Err(_) => {
            return ResellerVerificationResult::Error(ApiError::invalid_input("Malformed code"))
        }
    };

    let signature = Signature::from_slice(decoded_code.as_slice()).unwrap();

    // Verify signature
    let match_result = match public_key.verify(&hashed_message, &signature) {
        Ok(_) => ResellerVerificationResultRecord {
            status: VerificationStatus::Success,
            organization: OrganizationPublic::from(org_clone),
            registered_at: Some(reseller_clone.date_joined),
        },
        Err(_) => ResellerVerificationResultRecord {
            status: VerificationStatus::Invalid,
            organization: OrganizationPublic::from(org_clone),
            registered_at: None,
        },
    };

    ResellerVerificationResult::Result(match_result)
}

#[query]
pub fn generate_reseller_unique_code(reseller_id: Principal) -> UniqueCodeResult {
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
        return UniqueCodeResult::Error(ApiError::not_found(&format!(
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
        return UniqueCodeResult::Error(ApiError::not_found(&format!(
            "Organization with ID {} not found",
            reseller_org_id
        )));
    }

    // Deserialize private key
    let private_key_bytes = match hex::decode(&org_private_key) {
        Ok(bytes) => bytes,
        Err(_) => {
            return UniqueCodeResult::Error(ApiError::internal_error(
                "Malformed secret key for organization",
            ))
        }
    };

    let private_key = match SigningKey::from_slice(&private_key_bytes.as_slice()) {
        Ok(key) => key,
        Err(_) => {
            return UniqueCodeResult::Error(ApiError::internal_error(
                "Malformed secret key for organization",
            ))
        }
    };

    // Hash and sign. The signature will be used as the unique code for the reseller
    let mut hasher = Sha256::new();
    hasher.update(reseller_id.to_string());
    let hashed_message = hasher.finalize();

    let signature: Signature = private_key.sign(&hashed_message);
    UniqueCodeResult::UniqueCode(signature.to_string())
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
pub fn verify_product(
    product_id: Principal,
    serial_no: Principal,
    print_version: u8,
    unique_code: String,
    metadata: Vec<Metadata>,
) -> ProductVerificationResult {
    // Check if the product exists
    let mut product_opt = None;

    PRODUCTS.with(|products| {
        let products_ref = products.borrow();
        match products_ref.get(&product_id) {
            Some(product) => product_opt = Some(product.clone()),
            None => product_opt = None,
        }
    });

    if product_opt.is_none() {
        return ProductVerificationResult::Error(ApiError::not_found("Product is invalid"));
    }

    let product = product_opt.unwrap();

    // Check if the product has serial numbers
    let mut has_serial_numbers = false;
    let mut product_sn_opt = None;

    PRODUCT_SERIAL_NUMBERS.with(|serial_numbers| {
        if let Some(serialized_sn_vec) = serial_numbers.borrow().get(&product_id) {
            has_serial_numbers = true;
            let product_sn_vec = decode_product_serial_numbers(&serialized_sn_vec);
            product_sn_opt = product_sn_vec
                .iter()
                .find(|p_sn| p_sn.serial_no == serial_no)
                .cloned();
        }
    });

    if !has_serial_numbers {
        return ProductVerificationResult::Error(ApiError::not_found(
            "Product has no such serial number",
        ));
    }

    if product_sn_opt.is_none() {
        return ProductVerificationResult::Error(ApiError::not_found("Serial number is not found"));
    }

    let product_sn = product_sn_opt.unwrap();

    if product_sn.print_version != print_version {
        return ProductVerificationResult::Error(ApiError::invalid_input("Unique code expired"));
    }

    // Deserialize public key
    let public_key_bytes = match hex::decode(&product.public_key) {
        Ok(bytes) => bytes,
        Err(_) => {
            return ProductVerificationResult::Error(ApiError::internal_error(
                "Malformed public key",
            ))
        }
    };

    let public_key_encoded_point = match EncodedPoint::from_bytes(public_key_bytes) {
        Ok(point) => point,
        Err(_) => {
            return ProductVerificationResult::Error(ApiError::internal_error(
                "Malformed public key",
            ))
        }
    };

    let public_key = match VerifyingKey::from_encoded_point(&public_key_encoded_point) {
        Ok(key) => key,
        Err(_) => {
            return ProductVerificationResult::Error(ApiError::internal_error(
                "Malformed public key",
            ))
        }
    };

    // Check unique code
    let msg = format!(
        "{}_{}_{}",
        product_id.to_string(),
        serial_no.to_string(),
        print_version
    );
    let mut hasher = Sha256::new();
    hasher.update(msg);
    let hashed_message = hasher.finalize();

    let decoded_code = match hex::decode(&unique_code) {
        Ok(bytes) => bytes,
        Err(_) => {
            return ProductVerificationResult::Error(ApiError::invalid_input("Malformed code"))
        }
    };

    let signature = Signature::from_slice(decoded_code.as_slice()).unwrap();

    let verify_result = public_key.verify(&hashed_message, &signature);
    if verify_result.is_err() {
        return ProductVerificationResult::Status(ProductVerificationStatus::Invalid);
    }

    // Record the verification result in stable storage
    PRODUCT_VERIFICATIONS.with(|verifications| {
        let mut verifications_mut = verifications.borrow_mut();

        // Create a new verification record
        let verification = ProductVerification {
            product_id: product.id,
            serial_no,
            print_version,
            status: ProductVerificationStatus::FirstVerification,
            ..Default::default()
        };

        // Check if this product has any previous verifications
        let mut result = ProductVerificationStatus::FirstVerification;
        let mut verification_with_metadata = verification.clone();

        if let Some(serialized_verification_vec) = verifications_mut.get(&product_id) {
            let mut verification_vec = decode_product_verifications(&serialized_verification_vec);

            // Check if this serial number has been verified before
            if verification_vec.iter().any(|v| v.serial_no == serial_no) {
                result = ProductVerificationStatus::MultipleVerification;
            }

            // Add result metadata
            let mut result_meta = Metadata {
                key: "result".to_string(),
                value: "Unique".to_string(),
            };

            if result == ProductVerificationStatus::MultipleVerification {
                result_meta.value = "MultipleVerification".to_string();
            }

            verification_with_metadata.metadata =
                [metadata.clone(), Vec::from([result_meta])].concat();
            verification_with_metadata.status = result.clone();

            // Add new verification to a collection
            verification_vec.push(verification_with_metadata);

            // Save an updated collection
            verifications_mut.insert(product_id, encode_product_verifications(&verification_vec));
        } else {
            // First verification for this product
            let result_meta = Metadata {
                key: "result".to_string(),
                value: "Unique".to_string(),
            };

            verification_with_metadata.metadata =
                [metadata.clone(), Vec::from([result_meta])].concat();

            // Create a new collection with this verification
            let verification_vec = vec![verification_with_metadata];

            // Save the new collection
            verifications_mut.insert(product_id, encode_product_verifications(&verification_vec));
        }

        ProductVerificationResult::Status(result.clone())
    })
}

#[query]
pub fn list_product_verifications(
    organization_id: Option<Principal>,
    product_id: Option<Principal>,
    serial_number: Option<Principal>,
) -> Vec<ProductVerification> {
    // If no organization_id is provided, return all verifications
    if organization_id.is_none() {
        let mut all_verifications: Vec<ProductVerification> = Vec::new();

        PRODUCT_VERIFICATIONS.with(|verifications| {
            verifications
                .borrow()
                .iter()
                .for_each(|(_, serialized_verifications)| {
                    let verification_vec = decode_product_verifications(&serialized_verifications);
                    all_verifications.extend(verification_vec);
                });
        });

        return all_verifications;
    }

    let org_id = organization_id.unwrap();

    // If no specific product_id is provided, find all products for the organization
    if product_id.is_none() {
        let mut filtered_verifications: Vec<ProductVerification> = Vec::new();
        let mut product_ids: Vec<Principal> = Vec::new();

        // Get all products for this organization
        PRODUCTS.with(|products| {
            products
                .borrow()
                .iter()
                .filter(|(_, p)| p.org_id == org_id)
                .for_each(|(id, _)| product_ids.push(id));
        });

        // Get verifications for these products
        PRODUCT_VERIFICATIONS.with(|verifications| {
            let verifications_ref = verifications.borrow();

            for p_id in product_ids {
                if let Some(serialized_verifications) = verifications_ref.get(&p_id) {
                    let verification_vec = decode_product_verifications(&serialized_verifications);
                    filtered_verifications.extend(verification_vec);
                }
            }
        });

        return filtered_verifications;
    }

    // Verify if the product belongs to the organization
    let p_id = product_id.unwrap();
    let mut is_valid_product = false;

    PRODUCTS.with(|products| {
        if let Some(product) = products.borrow().get(&p_id) {
            is_valid_product = product.org_id == org_id;
        }
    });

    if !is_valid_product {
        return Vec::new();
    }

    // Get verifications for this specific product
    let mut product_verifications = Vec::new();

    PRODUCT_VERIFICATIONS.with(|verifications| {
        if let Some(serialized_verifications) = verifications.borrow().get(&p_id) {
            product_verifications = decode_product_verifications(&serialized_verifications);
        }
    });

    // Filter by serial number if provided
    if let Some(sn) = serial_number {
        product_verifications = product_verifications
            .into_iter()
            .filter(|pv| pv.serial_no == sn)
            .collect();
    }

    product_verifications
}

#[query]
pub fn list_product_verifications_by_user(
    user_id: Principal,
    organization_id: Option<Principal>,
) -> Vec<ProductVerification> {
    let mut filtered_verifications: Vec<ProductVerification> = Vec::new();

    if let Some(org_id) = organization_id {
        // Get all products for this organization
        let mut product_ids: Vec<Principal> = Vec::new();

        PRODUCTS.with(|products| {
            products
                .borrow()
                .iter()
                .filter(|(_, p)| p.org_id == org_id)
                .for_each(|(id, _)| product_ids.push(id));
        });

        // Get verifications by this user for these products
        PRODUCT_VERIFICATIONS.with(|verifications| {
            let verifications_ref = verifications.borrow();

            for p_id in product_ids {
                if let Some(serialized_verifications) = verifications_ref.get(&p_id) {
                    let verification_vec = decode_product_verifications(&serialized_verifications);

                    // Filter by user_id
                    for verification in &verification_vec {
                        if verification.created_by == user_id {
                            filtered_verifications.push(verification.clone());
                        }
                    }
                }
            }
        });
    } else {
        // Get all verifications by this user across all products
        PRODUCT_VERIFICATIONS.with(|verifications| {
            verifications
                .borrow()
                .iter()
                .for_each(|(_, serialized_verifications)| {
                    let verification_vec = decode_product_verifications(&serialized_verifications);

                    // Filter by user_id
                    for verification in &verification_vec {
                        if verification.created_by == user_id {
                            filtered_verifications.push(verification.clone());
                        }
                    }
                });
        });
    }

    filtered_verifications
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
