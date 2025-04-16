use std::collections::HashMap;
use candid::Principal;

use crate::error::GenericError;
use crate::global_state::stable_storage;
use crate::models::{Organization, Product, ProductSerialNumber, ProductVerification, Reseller, User};

// Storage is now using ic-stable-structures for persistence across upgrades
// This ensures data is preserved during canister upgrades

/// General storage error handling wrapper
pub fn with_storage<T, F>(operation: F) -> Result<T, GenericError>
where
    F: FnOnce() -> Result<T, GenericError>,
{
    match operation() {
        Ok(result) => Ok(result),
        Err(e) => {
            ic_cdk::print(format!("❌ ERROR: Storage operation failed: {}", e.message));
            Err(e)
        }
    }
}

/// Organization storage operations
pub mod organization_store {
    use super::*;
    
    /// Get organization by ID
    pub fn get(id: &Principal) -> Result<Organization, GenericError> {
        with_storage(|| {
            stable_storage::with_organizations(|organizations| {
                organizations.get(id)
                    .cloned()
                    .ok_or_else(|| GenericError {
                        message: format!("Organization with ID {} not found", id.to_text()),
                        ..Default::default()
                    })
            })
        })
    }
    
    /// Insert or update organization
    pub fn insert(org: Organization) -> Result<(), GenericError> {
        with_storage(|| {
            stable_storage::with_organizations_mut(|organizations| {
                organizations.insert(org.id, org);
                Ok(())
            })
        })
    }
    
    /// Get all organizations
    pub fn get_all() -> Result<Vec<Organization>, GenericError> {
        with_storage(|| {
            stable_storage::with_organizations(|organizations| {
                let mut result = Vec::new();
                for (_, org) in organizations.iter() {
                    result.push(org.clone());
                }
                Ok(result)
            })
        })
    }
}

/// Product storage operations
pub mod product_store {
    use super::*;
    
    /// Get product by ID
    pub fn get(id: &Principal) -> Result<Product, GenericError> {
        with_storage(|| {
            stable_storage::with_products(|products| {
                products.get(id)
                    .cloned()
                    .ok_or_else(|| GenericError {
                        message: format!("Product with ID {} not found", id.to_text()),
                        ..Default::default()
                    })
            })
        })
    }
    
    /// Insert or update product
    pub fn insert(product: Product) -> Result<(), GenericError> {
        with_storage(|| {
            stable_storage::with_products_mut(|products| {
                products.insert(product.id, product);
                Ok(())
            })
        })
    }
    
    /// Get products by organization ID
    pub fn get_by_organization(org_id: &Principal) -> Result<Vec<Product>, GenericError> {
        with_storage(|| {
            stable_storage::with_products(|products| {
                let mut result = Vec::new();
                for (_, product) in products.iter() {
                    if product.org_id == *org_id {
                        result.push(product.clone());
                    }
                }
                Ok(result)
            })
        })
    }
}

/// User storage operations
pub mod user_store {
    use super::*;
    
    /// Get user by ID
    pub fn get(id: &Principal) -> Result<User, GenericError> {
        with_storage(|| {
            stable_storage::with_users(|users| {
                users.get(id)
                    .cloned()
                    .ok_or_else(|| GenericError {
                        message: format!("User with ID {} not found", id.to_text()),
                        ..Default::default()
                    })
            })
        })
    }
    
    /// Insert or update user
    pub fn insert(user: User) -> Result<(), GenericError> {
        with_storage(|| {
            stable_storage::with_users_mut(|users| {
                users.insert(user.id, user);
                Ok(())
            })
        })
    }
}

/// Product serial number storage operations
pub mod serial_number_store {
    use super::*;
    
    /// Get serial numbers for a product
    pub fn get_by_product(product_id: &Principal) -> Result<Vec<ProductSerialNumber>, GenericError> {
        with_storage(|| {
            stable_storage::with_product_serial_numbers(|serial_numbers| {
                Ok(serial_numbers.get(product_id)
                    .cloned()
                    .unwrap_or_default())
            })
        })
    }
    
    /// Get specific serial number
    pub fn get(product_id: &Principal, serial_no: &Principal) -> Result<ProductSerialNumber, GenericError> {
        with_storage(|| {
            stable_storage::with_product_serial_numbers(|serial_numbers| {
                if let Some(serials) = serial_numbers.get(product_id) {
                    for serial in serials {
                        if serial.serial_no == *serial_no {
                            return Ok(serial.clone());
                        }
                    }
                }
                
                Err(GenericError {
                    message: format!("Serial number {} not found for product {}", 
                        serial_no.to_text(), product_id.to_text()),
                    ..Default::default()
                })
            })
        })
    }
    
    /// Insert or update serial number
    pub fn insert(serial_number: ProductSerialNumber) -> Result<(), GenericError> {
        with_storage(|| {
            stable_storage::with_product_serial_numbers_mut(|serial_numbers| {
                let mut product_serials = serial_numbers
                    .get(&serial_number.product_id)
                    .cloned()
                    .unwrap_or_default();
                    
                // Find and replace existing or add new
                let index = product_serials.iter()
                    .position(|s| s.serial_no == serial_number.serial_no);
                    
                if let Some(idx) = index {
                    product_serials[idx] = serial_number.clone();
                } else {
                    product_serials.push(serial_number.clone());
                }
                
                serial_numbers.insert(serial_number.product_id, product_serials);
                Ok(())
            })
        })
    }
}

/// Verification storage operations
pub mod verification_store {
    use super::*;
    
    /// Get verifications for a serial number
    pub fn get_by_serial(serial_no: &Principal) -> Result<Vec<ProductVerification>, GenericError> {
        with_storage(|| {
            stable_storage::with_product_verifications(|verifications| {
                Ok(verifications.get(serial_no)
                    .cloned()
                    .unwrap_or_default())
            })
        })
    }
    
    /// Add a verification
    pub fn add(verification: ProductVerification) -> Result<(), GenericError> {
        with_storage(|| {
            stable_storage::with_product_verifications_mut(|verifications| {
                let mut serial_verifications = verifications
                    .get(&verification.serial_no)
                    .cloned()
                    .unwrap_or_default();
                    
                serial_verifications.push(verification.clone());
                verifications.insert(verification.serial_no, serial_verifications);
                Ok(())
            })
        })
    }
}

/// Reseller storage operations
pub mod reseller_store {
    use super::*;
    
    /// Get reseller by ID
    pub fn get(id: &Principal) -> Result<Reseller, GenericError> {
        with_storage(|| {
            stable_storage::with_resellers(|resellers| {
                resellers.get(id)
                    .cloned()
                    .ok_or_else(|| GenericError {
                        message: format!("Reseller with ID {} not found", id.to_text()),
                        ..Default::default()
                    })
            })
        })
    }
    
    /// Insert or update reseller
    pub fn insert(reseller: Reseller) -> Result<(), GenericError> {
        with_storage(|| {
            stable_storage::with_resellers_mut(|resellers| {
                resellers.insert(reseller.id, reseller);
                Ok(())
            })
        })
    }
    
    /// Find resellers by name or ID
    pub fn find_by_name_or_id(query: &str) -> Result<Vec<Reseller>, GenericError> {
        with_storage(|| {
            stable_storage::with_resellers(|resellers| {
                let filter = query.trim().to_lowercase();
                let mut result = Vec::new();
                
                for (_, reseller) in resellers.iter() {
                    if reseller.name.to_lowercase().contains(&filter) || 
                       reseller.reseller_id.to_lowercase().contains(&filter) {
                        result.push(reseller.clone());
                    }
                }
                
                Ok(result)
            })
        })
    }
} 