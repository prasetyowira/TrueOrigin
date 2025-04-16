use std::collections::HashMap;
use candid::Principal;

use crate::error::GenericError;
use crate::global_state::{ORGANIZATIONS, PRODUCTS, PRODUCT_SERIAL_NUMBERS, PRODUCT_VERIFICATIONS, RESELLERS, USERS};
use crate::models::{Organization, Product, ProductSerialNumber, ProductVerification, Reseller, User};

// TODO: Replace in-memory storage with ic-stable-structures for persistence across upgrades
// Currently all data is lost on canister upgrades. Implementation should use stable memory
// via ic-stable-structures crate with appropriate migration strategies.

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
            let organizations = ORGANIZATIONS.lock().unwrap();
            organizations.get(id)
                .cloned()
                .ok_or_else(|| GenericError {
                    message: format!("Organization with ID {} not found", id.to_text()),
                    ..Default::default()
                })
        })
    }
    
    /// Insert or update organization
    pub fn insert(org: Organization) -> Result<(), GenericError> {
        with_storage(|| {
            let mut organizations = ORGANIZATIONS.lock().unwrap();
            organizations.insert(org.id, org);
            Ok(())
        })
    }
    
    /// Get all organizations
    pub fn get_all() -> Result<Vec<Organization>, GenericError> {
        with_storage(|| {
            let organizations = ORGANIZATIONS.lock().unwrap();
            Ok(organizations.values().cloned().collect())
        })
    }
}

/// Product storage operations
pub mod product_store {
    use super::*;
    
    /// Get product by ID
    pub fn get(id: &Principal) -> Result<Product, GenericError> {
        with_storage(|| {
            let products = PRODUCTS.lock().unwrap();
            products.get(id)
                .cloned()
                .ok_or_else(|| GenericError {
                    message: format!("Product with ID {} not found", id.to_text()),
                    ..Default::default()
                })
        })
    }
    
    /// Insert or update product
    pub fn insert(product: Product) -> Result<(), GenericError> {
        with_storage(|| {
            let mut products = PRODUCTS.lock().unwrap();
            products.insert(product.id, product);
            Ok(())
        })
    }
    
    /// Get products by organization ID
    pub fn get_by_organization(org_id: &Principal) -> Result<Vec<Product>, GenericError> {
        with_storage(|| {
            let products = PRODUCTS.lock().unwrap();
            Ok(products.values()
                .filter(|p| p.org_id == *org_id)
                .cloned()
                .collect())
        })
    }
}

/// User storage operations
pub mod user_store {
    use super::*;
    
    /// Get user by ID
    pub fn get(id: &Principal) -> Result<User, GenericError> {
        with_storage(|| {
            let users = USERS.lock().unwrap();
            users.get(id)
                .cloned()
                .ok_or_else(|| GenericError {
                    message: format!("User with ID {} not found", id.to_text()),
                    ..Default::default()
                })
        })
    }
    
    /// Insert or update user
    pub fn insert(user: User) -> Result<(), GenericError> {
        with_storage(|| {
            let mut users = USERS.lock().unwrap();
            users.insert(user.id, user);
            Ok(())
        })
    }
}

/// Product serial number storage operations
pub mod serial_number_store {
    use super::*;
    
    /// Get serial numbers for a product
    pub fn get_by_product(product_id: &Principal) -> Result<Vec<ProductSerialNumber>, GenericError> {
        with_storage(|| {
            let serial_numbers = PRODUCT_SERIAL_NUMBERS.lock().unwrap();
            Ok(serial_numbers.get(product_id)
                .cloned()
                .unwrap_or_default())
        })
    }
    
    /// Get specific serial number
    pub fn get(product_id: &Principal, serial_no: &Principal) -> Result<ProductSerialNumber, GenericError> {
        with_storage(|| {
            let serial_numbers = PRODUCT_SERIAL_NUMBERS.lock().unwrap();
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
    }
    
    /// Insert or update serial number
    pub fn insert(serial_number: ProductSerialNumber) -> Result<(), GenericError> {
        with_storage(|| {
            let mut serial_numbers = PRODUCT_SERIAL_NUMBERS.lock().unwrap();
            let product_serials = serial_numbers
                .entry(serial_number.product_id)
                .or_insert_with(Vec::new);
                
            // Find and replace existing or add new
            let index = product_serials.iter()
                .position(|s| s.serial_no == serial_number.serial_no);
                
            if let Some(idx) = index {
                product_serials[idx] = serial_number;
            } else {
                product_serials.push(serial_number);
            }
            
            Ok(())
        })
    }
}

/// Verification storage operations
pub mod verification_store {
    use super::*;
    
    /// Get verifications for a serial number
    pub fn get_by_serial(serial_no: &Principal) -> Result<Vec<ProductVerification>, GenericError> {
        with_storage(|| {
            let verifications = PRODUCT_VERIFICATIONS.lock().unwrap();
            Ok(verifications.get(serial_no)
                .cloned()
                .unwrap_or_default())
        })
    }
    
    /// Add a verification
    pub fn add(verification: ProductVerification) -> Result<(), GenericError> {
        with_storage(|| {
            let mut verifications = PRODUCT_VERIFICATIONS.lock().unwrap();
            let serial_verifications = verifications
                .entry(verification.serial_no)
                .or_insert_with(Vec::new);
                
            serial_verifications.push(verification);
            Ok(())
        })
    }
}

/// Reseller storage operations
pub mod reseller_store {
    use super::*;
    
    /// Get reseller by ID
    pub fn get(id: &Principal) -> Result<Reseller, GenericError> {
        with_storage(|| {
            let resellers = RESELLERS.lock().unwrap();
            resellers.get(id)
                .cloned()
                .ok_or_else(|| GenericError {
                    message: format!("Reseller with ID {} not found", id.to_text()),
                    ..Default::default()
                })
        })
    }
    
    /// Insert or update reseller
    pub fn insert(reseller: Reseller) -> Result<(), GenericError> {
        with_storage(|| {
            let mut resellers = RESELLERS.lock().unwrap();
            resellers.insert(reseller.id, reseller);
            Ok(())
        })
    }
    
    /// Find resellers by name or ID
    pub fn find_by_name_or_id(query: &str) -> Result<Vec<Reseller>, GenericError> {
        with_storage(|| {
            let resellers = RESELLERS.lock().unwrap();
            let filter = query.trim().to_lowercase();
            
            Ok(resellers.values()
                .filter(|r| 
                    r.name.to_lowercase().contains(&filter) || 
                    r.reseller_id.to_lowercase().contains(&filter)
                )
                .cloned()
                .collect())
        })
    }
} 