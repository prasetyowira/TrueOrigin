use candid::Principal;
use ic_cdk::api::{self, time};
use k256::ecdsa::{SigningKey, VerifyingKey};
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse, TransformArgs,
    TransformContext, TransformFunc,
};
use serde_json::{self, Value};

use crate::auth::authorize_user_organization;
use crate::error::GenericError;
use crate::global_state::PRODUCTS;
use crate::models::{Metadata, ProductInput, ProductResult, Product};
use crate::utils::generate_unique_principal;

/// Create a new product
pub fn create(input: ProductInput) -> ProductResult {
    ic_cdk::print(format!("📝 INFO: Creating product: {} for organization: {}", 
        input.name, input.org_id.to_text()));
    
    // Authorize the operation
    let authorized = authorize_user_organization(api::caller(), input.org_id);
    if authorized.is_err() {
        ic_cdk::print(format!("❌ ERROR: Authorization failed: {}", 
            authorized.clone().err().unwrap().message));
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
    // Check the Current implementation
    // Should include:
    // 1. Make HTTP outcall to sentiment analysis service (e.g., OpenAI/Gemini API)
    // 2. Process response and store sentiment results
    // 3. Handle error cases and retry logic
    // 4. Add appropriate response formatting

    let mut products = PRODUCTS.lock().unwrap();
    if let Some(product) = products.get_mut(&product_id) {
        let latest_product_review_generation = product.metadata.iter().find(|v| v.key == "latest_product_review_generation").map(|v| v.value.clone().parse::<u64>().ok()).flatten();
        if latest_product_review_generation.is_none() || latest_product_review_generation.unwrap() < api::time() - 86400 {
            // call scrape function
            // and update product data
            let product_reviews = scrape_product_review(product).await;

            let OPENAI_API_KEY = "TOKEN";
            let host = "api.openai.com";
            let url = format!(
                "https://{}/v1/chat/completions",
                host
            );

            let request_headers = vec![
                HttpHeader {
                    name: "Host".to_string(),
                    value: format!("{host}:443"),
                },
                HttpHeader {
                    name: "User-Agent".to_string(),
                    value: "exchange_rate_canister".to_string(),
                },
                HttpHeader {
                    name: "Content-Type".to_string(),
                    value: "application/json".to_string()
                },
                HttpHeader {
                    name: "Authorization".to_string(),
                    value: format!("Bearer {}", OPENAI_API_KEY)
                },
                HttpHeader {
                    name: "Idempotency-Key".to_string(),
                    value: generate_unique_principal(Principal::anonymous()).to_string()
                }
            ];

            let product_reviews_escaped = product_reviews.replace("\"", "\\\"");

            let json_data = format!(r#"
            {{
                "model": "gpt-4o",
                "messages": [
                    {{
                        "role": "user", "content": "With this product review summary: {}\n Please help summarize what is the overall sentiment of the product"
                    }}
                ],
                "temperature": 0.7
            }}
            "#, product_reviews_escaped);

            let json_utf8: Vec<u8> = json_data.as_bytes().to_vec(); // Convert JSON string to Vec<u8>
            let request_body: Option<Vec<u8>> = Some(json_utf8);

            //note "CanisterHttpRequestArgument" and "HttpMethod" are declared in line 4
            let request = CanisterHttpRequestArgument {
                url: url.to_string(),
                method: HttpMethod::POST,
                body: request_body,
                max_response_bytes: None,
                transform: Some(TransformContext {
                    // The "method" parameter needs to have the same name as the function name of your transform function
                    function: TransformFunc(candid::Func {
                        principal: ic_cdk::api::id(),
                        method: "transform".to_string(),
                    }),
                    // The "TransformContext" function does need a context parameter, it can be empty
                    context: vec![],
                }),
                headers: request_headers,
            };

            let cycles = 230_949_972_000;

            match http_request(request, cycles).await {
                Ok((response,)) => {
                    let response_body = String::from_utf8(response.body).unwrap_or_default(); // Convert Vec<u8> to String
                    let parsed: Value = serde_json::from_str(&response_body).unwrap();
                    let content = &parsed["choices"][0]["message"]["content"];
                    let metadata: Metadata = Metadata { key: "product_review".to_string(), value: content.to_string() };
                    product.metadata.push(metadata);
                    return Some(product.clone());
                }
                Err((r, m)) => {
                    let message =
                        format!("The http_request resulted into error. RejectionCode: {r:?}, Error: {m}");

                    ic_cdk::print(message);

                    return None;
                }
            }
        }
    }

    ic_cdk::print(format!("Product not found"));

    None
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
        url: format!("https://3a31-114-122-138-100.ngrok-free.app/product-review?id={}", product.id.to_string()),
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: None,
        transform: Some(TransformContext {
            function: TransformFunc(candid::Func {
                principal: ic_cdk::api::id(),
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