use candid::Principal;
use ic_cdk::api::{self, time};
use k256::ecdsa::{SigningKey, VerifyingKey};

use crate::auth::authorize_user_organization;
use crate::error::GenericError;
use crate::global_state::PRODUCTS;
use crate::models::{ProductInput, ProductResult, Product};
use crate::utils::generate_unique_principal;

/// Create a new product
pub fn create(input: ProductInput) -> ProductResult {
    ic_cdk::print(format!("📝 INFO: Creating product: {} for organization: {}", 
        input.name, input.org_id.to_text()));
    
    // Authorize the operation
    let authorized = authorize_user_organization(api::caller(), input.org_id);
    if authorized.is_err() {
        ic_cdk::print(format!("❌ ERROR: Authorization failed: {}", 
            authorized.err().unwrap().message));
        return ProductResult::Err(authorized.err().unwrap());
    }

    let organization = authorized.unwrap();
    let id = generate_unique_principal(Principal::anonymous());
    
    // Generate product public key from organization's private key
    let private_key_bytes = match hex::decode(&organization.private_key) {
        Ok(bytes) => bytes,
        Err(err) => {
            ic_cdk::print(format!("❌ ERROR: Failed to decode private key: {}", err));
            return ProductResult::Err(GenericError {
                message: err.to_string(),
                ..Default::default()
            });
        }
    };
    
    let private_key = match SigningKey::from_slice(&private_key_bytes) {
        Ok(key) => key,
        Err(err) => {
            ic_cdk::print(format!("❌ ERROR: Failed to create signing key: {}", err));
            return ProductResult::Err(GenericError {
                message: err.to_string(),
                ..Default::default()
            });
        }
    };
    
    let public_key = private_key.verifying_key();
    
    let product = Product {
        id,
        org_id: input.org_id,
        name: input.name,
        category: input.category,
        description: input.description,
        metadata: input.metadata,
        public_key: hex::encode(public_key.to_encoded_point(false).as_bytes()),
        created_at: time(),
        created_by: api::caller(),
        updated_at: time(),
        updated_by: api::caller(),
    };
    
    let mut products = PRODUCTS.lock().unwrap();
    products.insert(id, product.clone());
    
    ic_cdk::print(format!("📝 INFO: Product created with id: {}", id.to_text()));
    ProductResult::Product(product)
}

/// List products by organization
pub fn list_by_organization(org_id: Principal) -> Vec<Product> {
    ic_cdk::print(format!("📝 INFO: Listing products for organization: {}", org_id.to_text()));
    
    let result = PRODUCTS.lock().unwrap().values()
        .filter(|product| product.org_id == org_id)
        .cloned()
        .collect();
    
    ic_cdk::print(format!("📝 INFO: Found {} products", result.len()));
    result
}

/// Get product by ID
pub fn get_by_id(id: Principal) -> ProductResult {
    ic_cdk::print(format!("📝 INFO: Fetching product with id: {}", id.to_text()));
    
    let products = PRODUCTS.lock().unwrap();
    match products.get(&id) {
        Some(product) => {
            ic_cdk::print("📝 INFO: Product found");
            ProductResult::Product(product.clone())
        },
        None => {
            ic_cdk::print("❌ ERROR: Product not found");
            ProductResult::None
        }
    }
}

/// Update an existing product
pub fn update(id: Principal, input: ProductInput) -> ProductResult {
    ic_cdk::print(format!("📝 INFO: Updating product with id: {}", id.to_text()));
    
    let mut products = PRODUCTS.lock().unwrap();
    match products.get_mut(&id) {
        Some(product) => {
            product.org_id = input.org_id;
            product.name = input.name;
            product.description = input.description;
            product.category = input.category;
            product.metadata = input.metadata;
            product.updated_at = time();
            product.updated_by = api::caller();
            
            ic_cdk::print("📝 INFO: Product updated successfully");
            ProductResult::Product(product.clone())
        },
        None => {
            ic_cdk::print("❌ ERROR: Product not found for update");
            ProductResult::Err(GenericError {
                message: "Invalid product!".to_string(),
                ..Default::default()
            })
        }
    }
}

/// Generate product review (placeholder for async function)
pub async fn generate_review(product_id: Principal) -> Option<Product> {
    ic_cdk::print(format!("📝 INFO: Generating review for product: {}", product_id.to_text()));
    
    // TODO: Implement proper review generation with HTTPS outcalls to external API
    // Current implementation is just a placeholder without actual functionality
    // Should include:
    // 1. Make HTTP outcall to sentiment analysis service (e.g., OpenAI/Gemini API)
    // 2. Process response and store sentiment results
    // 3. Handle error cases and retry logic
    // 4. Add appropriate response formatting
    
    // For now just return the product
    let products = PRODUCTS.lock().unwrap();
    products.get(&product_id).cloned()
} 