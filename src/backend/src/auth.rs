use candid::{CandidType, Principal, Deserialize};
use serde::Serialize;
use std::collections::HashSet;

use crate::error::ApiError;
use crate::global_state::{ORGANIZATIONS, PRODUCTS, USERS};
use crate::models::{Metadata, Organization, UserRole};
use ic_cdk::api;

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

// Check if user has required permission - take a borrowed permission instead of moving it
pub fn check_permission(user_id: Principal, required_permission: &Permission) -> Result<(), ApiError> {
    let user_opt = USERS.with(|users_refcell| users_refcell.borrow().get(&user_id));
    
    if user_opt.is_none() {
        return Err(ApiError::not_found("User not found!"));
    }
    
    let user = user_opt.unwrap();
    
    // Check if user has a role
    if user.user_role.is_none() {
        return Err(ApiError::unauthorized("User has no assigned role"));
    }
    
    // Get permissions for the user's role
    let permissions = get_role_permissions(&user.user_role.unwrap());
    
    // Check if the user has the required permission
    if !permissions.contains(required_permission) {
        return Err(ApiError::unauthorized(&format!("User lacks permission: {:?}", required_permission)));
    }
    
    Ok(())
}

// Check if user belongs to an organization and has permission
pub fn authorize_for_organization(
    user_id: Principal, 
    org_id: Principal, 
    permission: Permission
) -> Result<Organization, ApiError> {
    // First check user has the required permission based on role
    check_permission(user_id, &permission)?;
    
    // Then check user is associated with the organization
    let user_opt = USERS.with(|users_refcell| users_refcell.borrow().get(&user_id));
    
    if user_opt.is_none() {
        return Err(ApiError::not_found("User not found!"));
    }
    
    let user = user_opt.unwrap();
    
    let organization_opt = ORGANIZATIONS.with(|orgs_refcell| orgs_refcell.borrow().get(&org_id));
    
    if organization_opt.is_none() {
        return Err(ApiError::not_found("Organization not found!"));
    }
    
    let organization = organization_opt.unwrap();
    
    // Check user belongs to this organization
    if !user.org_ids.contains(&org_id) {
        return Err(ApiError::unauthorized("User is not authorized for this organization!"));
    }
    
    // Log the access (simplified for now, in real implementation would add to a stable collection)
    let _audit_log = AuditLogEntry {
        user_id,
        action: format!("Access with permission: {:?}", permission),
        resource_type: "Organization".to_string(),
        resource_id: org_id,
        timestamp: api::time(),
        metadata: vec![],
        success: true,
    };
    
    // TODO: Store audit log in a stable collection
    
    Ok(organization.clone())
}

// Legacy function for backward compatibility
pub fn authorize_user_organization(user_id: Principal, org_id: Principal) -> Result<Organization, ApiError> {
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

// Check if caller is admin
pub fn ensure_admin(user_id: Principal) -> Result<(), ApiError> {
    let user_opt = USERS.with(|users_refcell| users_refcell.borrow().get(&user_id));
    
    if user_opt.is_none() {
        return Err(ApiError::not_found("User not found!"));
    }
    
    let user = user_opt.unwrap();
    
    // Check if user has admin role
    match user.user_role {
        Some(UserRole::Admin) => Ok(()),
        _ => Err(ApiError::unauthorized("Admin access required"))
    }
}