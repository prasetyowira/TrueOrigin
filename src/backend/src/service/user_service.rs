use candid::Principal;
use ic_cdk::api::{self, time};

use crate::error::GenericError;
use crate::global_state::USERS;
use crate::models::{User, UserDetailsInput, UserResult, UserRole, OrganizationInput, ResellerInput};
use crate::service::{organization_service, reseller_service};

/// Register a new user or return existing user
pub fn register() -> User {
    let caller = api::caller();
    ic_cdk::print(format!("📝 INFO: Registering user with principal: {}", caller.to_text()));
    
    let mut users = USERS.lock().unwrap();
    if let Some(user) = users.get(&caller) {
        ic_cdk::print("📝 INFO: User already exists, returning existing user");
        return user.clone();
    }
    
    let user = User {
        id: caller,
        is_principal: users.is_empty(), // First user is principal
        is_enabled: true,
        user_role: None,
        org_ids: Vec::new(),
        first_name: None,
        last_name: None,
        phone_no: None,
        email: None,
        detail_meta: Vec::new(),
        created_at: time(),
        created_by: caller,
        updated_at: time(),
        updated_by: caller,
    };
    
    users.insert(caller, user.clone());
    ic_cdk::print("📝 INFO: New user registered successfully");
    user
}

/// Get user by ID
pub fn get_by_id(id: Principal) -> Option<User> {
    ic_cdk::print(format!("📝 INFO: Fetching user with id: {}", id.to_text()));
    
    let users = USERS.lock().unwrap();
    let user = users.get(&id).cloned();
    
    if user.is_some() {
        ic_cdk::print("📝 INFO: User found");
    } else {
        ic_cdk::print("❌ ERROR: User not found");
    }
    
    user
}

/// Get current user information
pub fn get_current_user() -> Option<User> {
    let caller = api::caller();
    ic_cdk::print(format!("📝 INFO: Fetching current user: {}", caller.to_text()));
    
    let users = USERS.lock().unwrap();
    let user = users.get(&caller).cloned();
    
    if user.is_some() {
        ic_cdk::print("📝 INFO: Current user found");
    } else {
        ic_cdk::print("❌ ERROR: Current user not found");
    }
    
    user
}

/// Update current user's details
pub fn update_self_details(input: UserDetailsInput) -> UserResult {
    let caller = api::caller();
    ic_cdk::print(format!("📝 INFO: Updating details for user: {}", caller.to_text()));
    
    let mut users = USERS.lock().unwrap();
    if let Some(user) = users.get_mut(&caller) {
        user.first_name = Some(input.first_name);
        user.last_name = Some(input.last_name);
        user.phone_no = Some(input.phone_no);
        user.email = Some(input.email);
        user.detail_meta = input.detail_meta;
        user.updated_at = time();
        user.updated_by = caller;
        
        ic_cdk::print("📝 INFO: User details updated successfully");
        UserResult::User(user.clone())
    } else {
        ic_cdk::print("❌ ERROR: User not found for update");
        UserResult::Err(GenericError {
            message: "User not exist!".to_string(),
            ..GenericError::default()
        })
    }
}

/// Set user's role
pub fn set_self_role(role: UserRole) -> UserResult {
    let caller = api::caller();
    ic_cdk::print(format!("📝 INFO: Setting role for user: {}", caller.to_text()));
    
    let mut users = USERS.lock().unwrap();
    if let Some(user) = users.get_mut(&caller) {
        user.user_role = Some(role);
        user.updated_at = time();
        user.updated_by = caller;
        
        ic_cdk::print("📝 INFO: User role updated successfully");
        UserResult::User(user.clone())
    } else {
        ic_cdk::print("❌ ERROR: User not found for role update");
        UserResult::Err(GenericError {
            message: "User not exist!".to_string(),
            ..GenericError::default()
        })
    }
}

/// Register user as organization owner
pub fn register_as_organization(input: OrganizationInput) -> UserResult {
    let caller = api::caller();
    ic_cdk::print(format!("📝 INFO: Registering user {} as organization owner", caller.to_text()));
    
    // Create the organization
    let organization = organization_service::create(input);
    
    // Associate the organization with the user
    let mut users = USERS.lock().unwrap();
    if let Some(user) = users.get_mut(&caller) {
        user.org_ids.push(organization.id);
        user.user_role = Some(UserRole::BrandOwner);
        user.updated_at = time();
        user.updated_by = caller;
        
        ic_cdk::print("📝 INFO: User registered as organization owner successfully");
        UserResult::User(user.clone())
    } else {
        ic_cdk::print("❌ ERROR: User not found for organization registration");
        UserResult::Err(GenericError {
            message: "User not exist!".to_string(),
            ..GenericError::default()
        })
    }
}

/// Register user as reseller
pub fn register_as_reseller(input: ResellerInput) -> UserResult {
    let caller = api::caller();
    ic_cdk::print(format!("📝 INFO: Registering user {} as reseller", caller.to_text()));
    
    // TODO: Implement proper error handling for reseller creation
    // Current implementation ignores errors from reseller_service::create_reseller
    // Should include:
    // 1. Return appropriate error if reseller creation fails
    // 2. Consider transaction-like behavior (rollback if part of operation fails)
    // 3. Validate input data before attempting creation
    
    // Create the reseller (this is a simplified version)
    let _ = reseller_service::create_reseller(input.clone(), caller);
    
    // Update the user role
    let mut users = USERS.lock().unwrap();
    if let Some(user) = users.get_mut(&caller) {
        user.org_ids.push(input.org_id);
        user.user_role = Some(UserRole::Reseller);
        user.updated_at = time();
        user.updated_by = caller;
        
        ic_cdk::print("📝 INFO: User registered as reseller successfully");
        UserResult::User(user.clone())
    } else {
        ic_cdk::print("❌ ERROR: User not found for reseller registration");
        UserResult::Err(GenericError {
            message: "User not exist!".to_string(),
            ..GenericError::default()
        })
    }
}

/// Create a new user (admin operation)
pub fn create(id: Principal, input: UserDetailsInput) -> UserResult {
    ic_cdk::print(format!("📝 INFO: Creating user with id: {}", id.to_text()));
    
    let mut users = USERS.lock().unwrap();
    if users.contains_key(&id) {
        ic_cdk::print("❌ ERROR: User already exists");
        return UserResult::Err(GenericError {
            message: "User already exists!".to_string(),
            ..GenericError::default()
        });
    }
    
    let user = User {
        id,
        is_principal: false,
        is_enabled: true,
        user_role: None,
        org_ids: Vec::new(),
        first_name: Some(input.first_name),
        last_name: Some(input.last_name),
        phone_no: Some(input.phone_no),
        email: Some(input.email),
        detail_meta: input.detail_meta,
        created_at: time(),
        created_by: api::caller(),
        updated_at: time(),
        updated_by: api::caller(),
    };
    
    users.insert(id, user.clone());
    ic_cdk::print("📝 INFO: User created successfully");
    UserResult::User(user)
}

/// Update an existing user (admin operation)
pub fn update(id: Principal, input: UserDetailsInput) -> UserResult {
    ic_cdk::print(format!("📝 INFO: Updating user with id: {}", id.to_text()));
    
    let mut users = USERS.lock().unwrap();
    if let Some(user) = users.get_mut(&id) {
        user.first_name = Some(input.first_name);
        user.last_name = Some(input.last_name);
        user.phone_no = Some(input.phone_no);
        user.email = Some(input.email);
        user.detail_meta = input.detail_meta;
        user.updated_at = time();
        user.updated_by = api::caller();
        
        ic_cdk::print("📝 INFO: User updated successfully");
        UserResult::User(user.clone())
    } else {
        ic_cdk::print("❌ ERROR: User not found for update");
        UserResult::Err(GenericError {
            message: "User not exist!".to_string(),
            ..GenericError::default()
        })
    }
}

/// Update user's organization associations
pub fn update_orgs(id: Principal, org_ids: Vec<Principal>) -> UserResult {
    ic_cdk::print(format!("📝 INFO: Updating organizations for user: {}", id.to_text()));
    
    let mut users = USERS.lock().unwrap();
    if let Some(user) = users.get_mut(&id) {
        user.org_ids = org_ids;
        user.updated_at = time();
        user.updated_by = api::caller();
        
        ic_cdk::print("📝 INFO: User organizations updated successfully");
        UserResult::User(user.clone())
    } else {
        ic_cdk::print("❌ ERROR: User not found for organization update");
        UserResult::Err(GenericError {
            message: "User not exist!".to_string(),
            ..GenericError::default()
        })
    }
} 