use candid::{CandidType, Principal, Deserialize};
use serde::Serialize;
use std::collections::HashSet;

use crate::error::ApiError;
use crate::global_state::{ORGANIZATIONS, PRODUCTS, USERS};
use crate::models::{Metadata, Organization, UserRole};
use crate::models::User;
use ic_cdk::api;
use std::convert::TryInto;

// Define permission types
#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq, Hash)]
pub enum Permission {
    ReadOrganization,
    WriteOrganization,
    ReadProduct,
    WriteProduct,
    ReadUser,
    WriteUser,
    ReadReseller,
    WriteReseller,
    ManageVerifications,
    AdminAccess,
}

// Define audit log entry
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AuditLogEntry {
    pub user_id: Principal,
    pub action: String,
    pub resource_type: String,
    pub resource_id: Principal,
    pub timestamp: u64,
    pub metadata: Vec<Metadata>,
    pub success: bool,
}

// Get permissions based on role
pub fn get_role_permissions(role: &UserRole) -> HashSet<Permission> {
    let mut permissions = HashSet::new();
    
    match role {
        UserRole::Admin => {
            // Admins have all permissions
            permissions.insert(Permission::ReadOrganization);
            permissions.insert(Permission::WriteOrganization);
            permissions.insert(Permission::ReadProduct);
            permissions.insert(Permission::WriteProduct);
            permissions.insert(Permission::ReadUser);
            permissions.insert(Permission::WriteUser);
            permissions.insert(Permission::ReadReseller);
            permissions.insert(Permission::WriteReseller);
            permissions.insert(Permission::ManageVerifications);
            permissions.insert(Permission::AdminAccess);
        },
        UserRole::BrandOwner => {
            // Brand owners can manage their own organizations and products
            permissions.insert(Permission::ReadOrganization);
            permissions.insert(Permission::WriteOrganization);
            permissions.insert(Permission::ReadProduct);
            permissions.insert(Permission::WriteProduct);
            permissions.insert(Permission::ReadUser);
            permissions.insert(Permission::WriteUser);
            permissions.insert(Permission::ReadReseller);
            permissions.insert(Permission::WriteReseller);
            permissions.insert(Permission::ManageVerifications);
        },
        UserRole::Reseller => {
            // Resellers have limited permissions
            permissions.insert(Permission::ReadOrganization);
            permissions.insert(Permission::ReadProduct);
            permissions.insert(Permission::ReadReseller);
            permissions.insert(Permission::ManageVerifications);
        }
    }
    
    permissions
}

// Helper function to find user by session key or direct principal
fn find_user_by_caller(caller_principal: Principal) -> Option<User> {
    // 1. Try direct lookup (caller might be the root principal)
    let direct_user = USERS.with(|users| users.borrow().get(&caller_principal).clone());
    if direct_user.is_some() {
        return direct_user;
    }

    // 2. If direct lookup fails, iterate to find user by session key
    // Caution: This is inefficient for large numbers of users.
    USERS.with(|users| {
        users.borrow().iter().find_map(|(_, user)| {
            if user.session_keys.contains(&caller_principal) {
                ic_cdk::print(format!("ℹ️ [find_user_by_caller] Found user {} via session key {}", user.id, caller_principal));
                Some(user.clone())
            } else {
                None
            }
        })
    })
}

// Check if user has required permission - uses find_user_by_caller
pub fn check_permission(user_id: Principal, required_permission: &Permission) -> Result<(), ApiError> {
    let caller_principal = user_id; // user_id passed is api::caller()
    ic_cdk::print(format!("ℹ️ [check_permission] Checking permission for caller: {} for permission: {:?}", caller_principal, required_permission)); 
    
    let user_opt = find_user_by_caller(caller_principal);
    ic_cdk::print(format!("ℹ️ [check_permission] User lookup result for caller {}: {:?}", caller_principal, user_opt.is_some()));
    
    if user_opt.is_none() {
        ic_cdk::print(format!("❌ ERROR [check_permission] User NOT FOUND for caller: {}", caller_principal)); 
        return Err(ApiError::not_found("User not found or session key invalid!")); // Modified error
    }
    
    let user = user_opt.unwrap();
    ic_cdk::print(format!("ℹ️ [check_permission] Found user record with ID: {}", user.id));
    
    // Check if user has a role
    if user.user_role.is_none() {
        ic_cdk::print(format!("❌ ERROR [check_permission] User {} has no role assigned.", user.id)); 
        return Err(ApiError::unauthorized("User has no assigned role"));
    }
    let user_role = user.user_role.unwrap(); // Safe to unwrap here
    
    // Get permissions for the user's role
    let permissions = get_role_permissions(&user_role);
    ic_cdk::print(format!("ℹ️ [check_permission] Permissions for user {} (Role: {:?}): {:?}", user.id, user_role, permissions)); 
    
    // Check if the user has the required permission
    if !permissions.contains(required_permission) {
         ic_cdk::print(format!("❌ ERROR [check_permission] User {} (Role: {:?}) lacks required permission: {:?}", user.id, user_role, required_permission)); 
        return Err(ApiError::unauthorized(&format!("User lacks permission: {:?}", required_permission)));
    }
    
    ic_cdk::print(format!("✅ [check_permission] User {} (Role: {:?}) has required permission: {:?}", user.id, user_role, required_permission)); 
    Ok(())
}

// Check if user belongs to an organization and has permission - uses find_user_by_caller
pub fn authorize_for_organization(
    user_id: Principal, 
    org_id: Principal, 
    permission: Permission
) -> Result<Organization, ApiError> {
    let caller_principal = user_id; // user_id passed is api::caller()
    ic_cdk::print(format!("ℹ️ [authorize_for_organization] Authorizing caller: {} for org: {} with permission: {:?}", caller_principal, org_id, permission)); 
    
    let user = find_user_by_caller(caller_principal)
        .ok_or_else(|| {
            ic_cdk::print(format!("❌ ERROR [authorize_for_organization] User NOT FOUND for caller: {}", caller_principal)); 
            ApiError::not_found("User not found or session key invalid!")
        })?;    
    ic_cdk::print(format!("ℹ️ [authorize_for_organization] Found user record ID: {} for caller {}", user.id, caller_principal));

    let user_role = user.user_role.ok_or_else(|| {
        ic_cdk::print(format!("❌ ERROR [authorize_for_organization] User {} has no role.", user.id));
        ApiError::unauthorized("User has no assigned role")
    })?; 
    let permissions = get_role_permissions(&user_role);
    if !permissions.contains(&permission) {
        ic_cdk::print(format!("❌ ERROR [authorize_for_organization] User {} (Role: {:?}) lacks required permission: {:?}", user.id, user_role, permission));
       return Err(ApiError::unauthorized(&format!("User lacks permission: {:?}", permission)));
    }
    ic_cdk::print(format!("ℹ️ [authorize_for_organization] User {} (Role: {:?}) has required permission: {:?}. Checking org association...", user.id, user_role, permission));
    
    let organization_opt = ORGANIZATIONS.with(|orgs_refcell| orgs_refcell.borrow().get(&org_id).clone());
    if organization_opt.is_none() {
        ic_cdk::print(format!("❌ ERROR [authorize_for_organization] Organization not found: {}", org_id)); 
        return Err(ApiError::not_found("Organization not found!"));
    }
    let organization = organization_opt.unwrap();
    
    if user_role != UserRole::Admin && !user.org_ids.contains(&org_id) {
        ic_cdk::print(format!("❌ ERROR [authorize_for_organization] User {} (Role: {:?}) is not associated with org {}", user.id, user_role, org_id)); 
        return Err(ApiError::unauthorized("User is not authorized for this organization!"));
    }
    
    let _audit_log = AuditLogEntry {
        user_id: caller_principal, 
        action: format!("Access with permission: {:?}", permission),
        resource_type: "Organization".to_string(),
        resource_id: org_id,
        timestamp: api::time(),
        metadata: vec![],
        success: true,
    };
    ic_cdk::print(format!("✅ [authorize_for_organization] Authorization successful for caller {} (User ID: {}) on org {}", caller_principal, user.id, org_id)); 
    
    Ok(organization) // Return the organization (already cloned)
}

// Legacy function for backward compatibility
pub fn authorize_user_organization(user_id: Principal, org_id: Principal) -> Result<Organization, ApiError> {
    // This now correctly uses the updated authorize_for_organization logic
    authorize_for_organization(user_id, org_id, Permission::ReadOrganization)
}

// Authorized access to a product
pub fn authorize_for_product(
    user_id: Principal,
    product_id: Principal,
    permission: Permission
) -> Result<(), ApiError> {
    // First check user has the required permission
    check_permission(user_id, &permission)?;
    
    // Get the product to find its organization
    let product_opt = PRODUCTS.with(|products_refcell| products_refcell.borrow().get(&product_id));
    
    if product_opt.is_none() {
        return Err(ApiError::not_found("Product not found!"));
    }
    
    let product = product_opt.unwrap();
    
    // Now check user has access to the product's organization
    let user_opt = USERS.with(|users_refcell| users_refcell.borrow().get(&user_id));
    
    if user_opt.is_none() {
        return Err(ApiError::not_found("User not found!"));
    }
    
    let user = user_opt.unwrap();
    
    // Check user belongs to this product's organization
    if !user.org_ids.contains(&product.org_id) {
        return Err(ApiError::unauthorized("User is not authorized for this product's organization!"));
    }
    
    // Log the access
    let _audit_log = AuditLogEntry {
        user_id,
        action: format!("Access with permission: {:?}", permission),
        resource_type: "Product".to_string(),
        resource_id: product_id,
        timestamp: api::time(),
        metadata: vec![],
        success: true,
    };
    
    // TODO: Store audit log in a stable collection
    
    Ok(())
}

// Check if caller is admin - uses find_user_by_caller
pub fn ensure_admin(user_id: Principal) -> Result<(), ApiError> {
    let caller_principal = user_id; // user_id passed is api::caller()
    ic_cdk::print(format!("ℹ️ [ensure_admin] Checking admin status for caller: {}", caller_principal));

    let user_opt = find_user_by_caller(caller_principal);
    if user_opt.is_none() {
         ic_cdk::print(format!("❌ ERROR [ensure_admin] User NOT FOUND for caller: {}", caller_principal)); 
        return Err(ApiError::not_found("User not found or session key invalid!"));
    }
    
    let user = user_opt.unwrap();
    ic_cdk::print(format!("ℹ️ [ensure_admin] Found user record ID: {}", user.id));
    
    // Check if user has admin role
    match user.user_role {
        Some(UserRole::Admin) => {
             ic_cdk::print(format!("✅ [ensure_admin] User {} is Admin.", user.id));
             Ok(())
        },
        _ => {
            ic_cdk::print(format!("❌ ERROR [ensure_admin] User {} is NOT Admin (Role: {:?})", user.id, user.user_role));
            Err(ApiError::unauthorized("Admin access required"))
        }
    }
}