use candid::Principal;
use ic_cdk::api::{self, time};
use k256::ecdsa::{Signature, VerifyingKey};

use crate::error::GenericError;
use crate::models::{
    Metadata, ProductSerialNumber, ProductSerialNumberResult, ProductUniqueCodeResult,
    ProductUniqueCodeResultRecord, ProductVerification, ProductVerificationResult,
    ProductVerificationStatus, Product
};
use crate::global_state::{PRODUCTS, PRODUCT_SERIAL_NUMBERS, PRODUCT_VERIFICATIONS};
use crate::utils::generate_unique_principal;

/// List product serial numbers by organization and/or product
pub fn list_serial_numbers(
    organization_id: Option<Principal>, 
    product_id: Option<Principal>
) -> Vec<ProductSerialNumber> {
    ic_cdk::print(format!("📝 INFO: Listing serial numbers for org: {:?}, product: {:?}", 
        organization_id, product_id));
    
    let product_serial_numbers = PRODUCT_SERIAL_NUMBERS.lock().unwrap();
    let products = PRODUCTS.lock().unwrap();
    
    let mut result = Vec::new();
    
    for (pid, serial_numbers) in product_serial_numbers.iter() {
        // Filter by product ID if provided
        if let Some(product_id_filter) = product_id {
            if *pid != product_id_filter {
                continue;
            }
        }
        
        // Filter by organization ID if provided
        if let Some(org_id_filter) = organization_id {
            if let Some(product) = products.get(pid) {
                if product.org_id != org_id_filter {
                    continue;
                }
            } else {
                continue;
            }
        }
        
        // Add matching serial numbers to result
        result.extend(serial_numbers.clone());
    }
    
    ic_cdk::print(format!("📝 INFO: Found {} serial numbers", result.len()));
    result
}

/// Create a new product serial number
pub fn create_serial_number(
    product_id: Principal, 
    user_serial_no: Option<String>
) -> ProductSerialNumberResult {
    ic_cdk::print(format!("📝 INFO: Creating serial number for product: {}", product_id.to_text()));
    
    // Verify product exists
    let products = PRODUCTS.lock().unwrap();
    let product = match products.get(&product_id) {
        Some(p) => p,
        None => {
            ic_cdk::print("❌ ERROR: Product not found");
            return ProductSerialNumberResult::Error(GenericError {
                message: "Product not found!".to_string(),
                ..Default::default()
            });
        }
    };
    
    // Generate serial number
    let serial_no = generate_unique_principal(product_id);
    let user_serial = user_serial_no.unwrap_or_else(|| format!("SN-{}", hex::encode(&serial_no.as_slice()[0..4])));
    
    let serial_number = ProductSerialNumber {
        product_id,
        serial_no,
        user_serial_no: user_serial,
        print_version: 0,
        metadata: Vec::new(),
        created_at: time(),
        created_by: api::caller(),
        updated_at: time(),
        updated_by: api::caller(),
    };
    
    // Store the serial number
    let mut product_serial_numbers = PRODUCT_SERIAL_NUMBERS.lock().unwrap();
    let serial_numbers = product_serial_numbers
        .entry(product_id)
        .or_insert_with(Vec::new);
    
    serial_numbers.push(serial_number.clone());
    
    ic_cdk::print(format!("📝 INFO: Serial number created: {}", serial_no.to_text()));
    ProductSerialNumberResult::Result(serial_number)
}

/// Update an existing product serial number
pub fn update_serial_number(
    product_id: Principal, 
    serial_no: Principal, 
    user_serial_no: Option<String>
) -> ProductSerialNumberResult {
    ic_cdk::print(format!("📝 INFO: Updating serial number: {} for product: {}", 
        serial_no.to_text(), product_id.to_text()));
    
    let mut product_serial_numbers = PRODUCT_SERIAL_NUMBERS.lock().unwrap();
    
    if let Some(serial_numbers) = product_serial_numbers.get_mut(&product_id) {
        if let Some(index) = serial_numbers.iter().position(|sn| sn.serial_no == serial_no) {
            if let Some(user_sn) = user_serial_no {
                serial_numbers[index].user_serial_no = user_sn;
            }
            
            serial_numbers[index].updated_at = time();
            serial_numbers[index].updated_by = api::caller();
            
            ic_cdk::print("📝 INFO: Serial number updated successfully");
            return ProductSerialNumberResult::Result(serial_numbers[index].clone());
        }
    }
    
    ic_cdk::print("❌ ERROR: Serial number not found");
    ProductSerialNumberResult::Error(GenericError {
        message: "Serial number not found!".to_string(),
        ..Default::default()
    })
}

/// Generate unique code for a product serial number (print version)
pub fn print_serial_number(
    product_id: Principal, 
    serial_no: Principal
) -> ProductUniqueCodeResult {
    ic_cdk::print(format!("📝 INFO: Printing serial number: {} for product: {}", 
        serial_no.to_text(), product_id.to_text()));
    
    let mut product_serial_numbers = PRODUCT_SERIAL_NUMBERS.lock().unwrap();
    
    if let Some(serial_numbers) = product_serial_numbers.get_mut(&product_id) {
        if let Some(index) = serial_numbers.iter().position(|sn| sn.serial_no == serial_no) {
            // Increment print version
            serial_numbers[index].print_version += 1;
            
            // Generate unique code
            let serial_number = &serial_numbers[index];
            let print_version = serial_number.print_version;
            
            // Create a timestamp-based unique code
            let timestamp = time().to_string();
            let mut hasher = sha2::Sha256::new();
            sha2::Digest::update(&mut hasher, 
                format!("{}:{}:{}:{}", 
                    product_id.to_text(), 
                    serial_no.to_text(), 
                    print_version, 
                    timestamp
                ).as_bytes()
            );
            let result = hasher.finalize();
            let unique_code = hex::encode(&result[0..8]); // Use first 8 bytes
            
            ic_cdk::print(format!("📝 INFO: Generated unique code: {}", unique_code));
            
            return ProductUniqueCodeResult::Result(ProductUniqueCodeResultRecord {
                unique_code,
                print_version,
                product_id,
                serial_no,
                created_at: time(),
            });
        }
    }
    
    ic_cdk::print("❌ ERROR: Serial number not found");
    ProductUniqueCodeResult::Error(GenericError {
        message: "Serial number not found!".to_string(),
        ..Default::default()
    })
}

/// Verify a product using its unique code
pub fn verify(
    product_id: Principal,
    serial_no: Principal,
    print_version: u8,
    unique_code: String,
    metadata: Vec<Metadata>
) -> ProductVerificationResult {
    ic_cdk::print(format!("📝 INFO: Verifying product: {}, serial: {}, version: {}, code: {}", 
        product_id.to_text(), serial_no.to_text(), print_version, unique_code));
    
    // TODO: Implement proper verification logic with cryptographic validation of the unique code
    // Current implementation is simplified and does not actually verify the code's authenticity
    // Should include:
    // 1. Validation against expected hash pattern
    // 2. Checking for replay attacks (code reuse)
    // 3. Expiration check if applicable
    
    // TODO: Implement rate limiting for verification attempts
    // Should prevent brute force attacks by limiting verification attempts
    
    // Check if this is the first verification
    let product_verifications = PRODUCT_VERIFICATIONS.lock().unwrap();
    let existing_verifications = product_verifications
        .get(&serial_no)
        .map(|v| v.len())
        .unwrap_or(0);
    
    let verification_status = if existing_verifications == 0 {
        ProductVerificationStatus::FirstVerification
    } else {
        ProductVerificationStatus::MultipleVerification
    };
    
    // Record the verification
    let verification = ProductVerification {
        id: generate_unique_principal(serial_no),
        product_id,
        serial_no,
        print_version,
        metadata,
        created_at: time(),
        created_by: api::caller(),
    };
    
    drop(product_verifications);
    
    let mut product_verifications = PRODUCT_VERIFICATIONS.lock().unwrap();
    let verifications = product_verifications
        .entry(serial_no)
        .or_insert_with(Vec::new);
    
    verifications.push(verification);
    
    ic_cdk::print(format!("📝 INFO: Verification recorded with status: {:?}", verification_status));
    
    // TODO: Implement reward mechanism for verified interactions
    // Should include:
    // 1. Reward token/points distribution for successful verifications
    // 2. Rate limiting to prevent reward farming
    // 3. Special rewards for first verifications or promotions
    // 4. Integration with external reward system if applicable
    
    ProductVerificationResult::Status(verification_status)
}

/// List product verifications
pub fn list_verifications(
    organization_id: Option<Principal>,
    product_id: Option<Principal>,
    serial_number: Option<Principal>
) -> Vec<ProductVerification> {
    ic_cdk::print(format!("📝 INFO: Listing verifications for org: {:?}, product: {:?}, serial: {:?}", 
        organization_id, product_id, serial_number));
    
    let product_verifications = PRODUCT_VERIFICATIONS.lock().unwrap();
    let products = PRODUCTS.lock().unwrap();
    
    let mut result = Vec::new();
    
    for (sn, verifications) in product_verifications.iter() {
        // Filter by serial number if provided
        if let Some(serial_filter) = serial_number {
            if *sn != serial_filter {
                continue;
            }
        }
        
        for verification in verifications {
            // Filter by product ID if provided
            if let Some(product_id_filter) = product_id {
                if verification.product_id != product_id_filter {
                    continue;
                }
            }
            
            // Filter by organization ID if provided
            if let Some(org_id_filter) = organization_id {
                if let Some(product) = products.get(&verification.product_id) {
                    if product.org_id != org_id_filter {
                        continue;
                    }
                } else {
                    continue;
                }
            }
            
            result.push(verification.clone());
        }
    }
    
    ic_cdk::print(format!("📝 INFO: Found {} verifications", result.len()));
    result
}

/// List product verifications by user
pub fn list_user_verifications(
    user_id: Principal,
    organization_id: Option<Principal>
) -> Vec<ProductVerification> {
    ic_cdk::print(format!("📝 INFO: Listing verifications for user: {}, org: {:?}", 
        user_id.to_text(), organization_id));
    
    let product_verifications = PRODUCT_VERIFICATIONS.lock().unwrap();
    let products = PRODUCTS.lock().unwrap();
    
    let mut result = Vec::new();
    
    for (_, verifications) in product_verifications.iter() {
        for verification in verifications {
            // Filter by creator (user)
            if verification.created_by != user_id {
                continue;
            }
            
            // Filter by organization ID if provided
            if let Some(org_id_filter) = organization_id {
                if let Some(product) = products.get(&verification.product_id) {
                    if product.org_id != org_id_filter {
                        continue;
                    }
                } else {
                    continue;
                }
            }
            
            result.push(verification.clone());
        }
    }
    
    ic_cdk::print(format!("📝 INFO: Found {} verifications for user", result.len()));
    result
} 