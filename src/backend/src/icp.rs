use candid::Principal;
use ic_cdk::{api, query, update};
use k256::{
    ecdsa::{signature::{Signer, Verifier}, Signature, SigningKey, VerifyingKey}, elliptic_curve::sec1::ToEncodedPoint, EncodedPoint, SecretKey,
    sha2::{Sha256, Digest}
};
use rand::{
    rngs::StdRng,
    SeedableRng,
};

use crate::{global_state::{ORGANIZATIONS, PRODUCTS, PRODUCT_SERIAL_NUMBERS, PRODUCT_VERIFICATIONS, RESELLERS, USERS}, models::{ResellerVerificationResultRecord, VerificationStatus}};
use crate::models::{
    Metadata,
    Organization, OrganizationInput, OrganizationPublic, OrganizationResult, PrivateKeyResult,
    Product, ProductInput, ProductResult, ProductSerialNumber, UniqueCodeResult, ProductSerialNumberResult,
    ProductUniqueCodeResult, ProductUniqueCodeResultRecord,
    ProductVerification, ProductVerificationStatus, ProductVerificationResult,
    Reseller, ResellerInput, ResellerVerificationResult,
    User, UserDetailsInput, UserResult, UserRole
};
use crate::auth::authorize_user_organization;
use crate::utils::generate_unique_principal;
use crate::error::GenericError;

use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse, TransformArgs,
    TransformContext, TransformFunc,
};

use serde_json::{self, Value};


#[query]
pub fn get_organization_by_id(id: Principal) -> OrganizationResult {
    let organizations = ORGANIZATIONS.lock().unwrap();
    match organizations.get(&id) {
        Some(org) => OrganizationResult::Organization(OrganizationPublic::from(org.clone())),
        None => OrganizationResult::Error(GenericError {
            message: "Cannot find organization!".to_string(),
            ..Default::default()
        })
    }
}

#[update]
pub fn create_organization(input: OrganizationInput) -> OrganizationPublic {
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
    let mut organizations = ORGANIZATIONS.lock().unwrap();
    organizations.insert(id, organization.clone());
    OrganizationPublic::from(organization)
}

#[update]
pub fn update_organization(id: Principal, input: OrganizationInput) -> OrganizationResult {
    let mut organizations = ORGANIZATIONS.lock().unwrap();
    match organizations.get_mut(&id) {
        Some(org) => {
            org.name = input.name;
            org.description = input.description;
            org.metadata = input.metadata;
            org.updated_at = api::time();
            org.updated_by = api::caller(); // Update with the current user
            OrganizationResult::Organization(OrganizationPublic::from(org.clone()))
        },
        None => OrganizationResult::Error(GenericError {
            message: "Organization not found!".to_string(),
            ..Default::default()
        })
    }
}

#[query]
pub fn get_organization_private_key(org_id: Principal) -> PrivateKeyResult {
    match authorize_user_organization(api::caller(), org_id) {
        Ok(org) => PrivateKeyResult::Key(org.private_key),
        Err(err) => PrivateKeyResult::Error(err)
    }
}

#[query]
pub fn find_organizations_by_name(name: String) -> Vec<OrganizationPublic> {
    let filter = name.trim().to_lowercase();
    ORGANIZATIONS.lock().unwrap().values()
        .filter(|org| org.name.to_lowercase().contains(&filter))
        .map(|org| OrganizationPublic::from(org.clone()))
        .collect()
}

#[update]
pub fn create_product(input: ProductInput) -> ProductResult {
    let authorized = authorize_user_organization(api::caller(), input.org_id);
    if authorized.is_err() {
        return ProductResult::Err(authorized.err().unwrap());
    }

    let organization = authorized.ok().unwrap();
    let id = generate_unique_principal(Principal::anonymous()); // Generate a unique ID for the product   
    
    let private_key_bytes = hex::decode(&organization.private_key); 
    if private_key_bytes.is_err() {
        return ProductResult::Err(GenericError {
            message: private_key_bytes.err().unwrap().to_string(),
            ..Default::default()
        })
    }
    let private_key = SigningKey::from_slice(&private_key_bytes.unwrap().as_slice()); 
    if private_key.is_err() {
        return ProductResult::Err(GenericError {
            message: private_key.err().unwrap().to_string(),
            ..Default::default()
        })
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
    let mut products = PRODUCTS.lock().unwrap();
    products.insert(id, product.clone());
    ProductResult::Product(product)
}

#[query]
pub fn list_products(org_id: Principal) -> Vec<Product> {
    PRODUCTS.lock().unwrap().values()
        .filter(|product| product.org_id == org_id)
        .map(|product| product.clone())
        .collect()
}

#[query]
pub fn get_product_by_id(id: Principal) -> ProductResult {
    let products = PRODUCTS.lock().unwrap();
    match products.get(&id) {
        Some(product) => ProductResult::Product(product.clone()),
        None => ProductResult::None
    }
}

#[update]
pub fn update_product(id: Principal, input: ProductInput) -> ProductResult {
    let mut products = PRODUCTS.lock().unwrap();
    match products.get_mut(&id) {
        Some(product) => {
            product.org_id = input.org_id;
            product.name = input.name;
            product.description = input.description;
            product.category = input.category;
            product.metadata = input.metadata;
            product.updated_at = api::time();
            product.updated_by = api::caller(); // Update with the current user
            ProductResult::Product(product.clone())
        },
        None => ProductResult::Err(GenericError {
            message: "Invalid product!".to_string(),
            ..Default::default()
        })
    }
}

#[update]
pub fn register() -> User {
    let mut users = USERS.lock().unwrap();
    let existing_user = users.get_mut(&api::caller());
    if existing_user.is_some() {
        return existing_user.unwrap().clone();
    }
    let user = User {
        id: api::caller(),
        is_principal: users.is_empty(),
        ..Default::default()
    };
    users.insert(api::caller(), user.clone());
    user
}

#[query]
pub fn get_user_by_id(id: Principal) -> Option<User> {
    // TODO access control
    let users = USERS.lock().unwrap();
    users.get(&id).cloned()
}

#[query]
pub fn whoami() -> Option<User> {
    let users = USERS.lock().unwrap();
    users.get(&api::caller()).cloned()
}

#[update]
pub fn update_self_details(input: UserDetailsInput) -> UserResult {
    let mut users = USERS.lock().unwrap();
    if let Some(user) = users.get_mut(&api::caller()) {
        user.first_name = Some(input.first_name);
        user.last_name = Some(input.last_name);
        user.phone_no = Some(input.phone_no);
        user.email = Some(input.email);
        user.detail_meta = input.detail_meta;
        user.updated_at = api::time();
        user.updated_by = api::caller(); // Update with the current user
        UserResult::User(user.clone())
    } else {
        UserResult::Err(GenericError {
            message: "User not exist!".to_string(),
            ..GenericError::default()
        })
    }
}


// DEBUG ONLY
#[update]
pub fn set_self_role(role: UserRole) -> UserResult {
    let mut users = USERS.lock().unwrap();
    if let Some(user) = users.get_mut(&api::caller()) {
        user.user_role = Some(role);
        user.updated_at = api::time();
        user.updated_by = api::caller(); // Update with the current user
        UserResult::User(user.clone())
    } else {
        UserResult::Err(GenericError {
            message: "User not exist!".to_string(),
            ..GenericError::default()
        })
    }
}

#[update]
pub fn register_as_organization(input: OrganizationInput) -> UserResult {
    let mut users = USERS.lock().unwrap();
    let user = users.get_mut(&api::caller());
    if user.is_none() {
        return UserResult::Err(GenericError {
            message: "User not exist!".to_string(),
            ..GenericError::default()
        })
    }
    let user_mut = user.unwrap();
    if user_mut.user_role.is_some() {
        return UserResult::Err(GenericError {
            message: "User already has assigned role!".to_string(),
            ..GenericError::default()
        })
    }

    let mut rng = StdRng::from_entropy();
    let signing_key = SigningKey::random(&mut rng);
    let signing_key_str = hex::encode(&signing_key.to_bytes());

    user_mut.user_role = Some(UserRole::BrandOwner);
    user_mut.updated_at = api::time();
    user_mut.updated_by = api::caller();

    let org_id = generate_unique_principal(Principal::anonymous());
    user_mut.org_ids.push(org_id);

    let organization = Organization {
        id: org_id,
        name: input.name,
        description: input.description,
        metadata: input.metadata,
        private_key: signing_key_str,
        ..Default::default()
    };
    let mut organizations = ORGANIZATIONS.lock().unwrap();
    organizations.insert(organization.id, organization);
    UserResult::User(user_mut.clone())
}


#[update]
pub fn register_as_reseller(input: ResellerInput) -> UserResult {
    let mut users = USERS.lock().unwrap();
    let user = users.get_mut(&api::caller());
    if user.is_none() {
        return UserResult::Err(GenericError {
            message: "User not exist!".to_string(),
            ..GenericError::default()
        })
    }
    let user_mut = user.unwrap();
    if user_mut.user_role.is_some() {
        return UserResult::Err(GenericError {
            message: "User already has assigned role!".to_string(),
            ..GenericError::default()
        })
    }
    let organizations = ORGANIZATIONS.lock().unwrap();
    let organization = organizations.get(&input.org_id);
    if organization.is_none() {
        return UserResult::Err(GenericError {
            message: "Organization not found!".to_string(),
            ..GenericError::default()
        })
    }

    let private_key_bytes = hex::decode(&organization.unwrap().private_key);
    if private_key_bytes.is_err() {
        return UserResult::Err(GenericError {
            message: "Malformed secret key for organization!".to_string(),
            ..GenericError::default()
        })
    }
    let private_key = SecretKey::from_slice(&private_key_bytes.unwrap().as_slice());
    if private_key.is_err() {
        return UserResult::Err(GenericError {
            message: "Malformed secret key for organization!".to_string(),
            ..GenericError::default()
        })
    }
    let public_key = private_key.unwrap().public_key();
    let reseller_id = generate_unique_principal(Principal::anonymous());

    user_mut.user_role = Some(UserRole::Reseller);
    user_mut.updated_at = api::time();
    user_mut.updated_by = api::caller();

    let mut resellers = RESELLERS.lock().unwrap();
    let reseller = Reseller {
        id: reseller_id,
        org_id: input.org_id,
        name: input.name,
        ecommerce_urls: input.ecommerce_urls,
        metadata: input.metadata,
        public_key: hex::encode(public_key.to_encoded_point(false).as_bytes()),
        ..Default::default()
    };
    resellers.insert(reseller_id, reseller);
    UserResult::User(user_mut.clone())
}



#[update]
pub fn create_user(id: Principal, input: UserDetailsInput) -> UserResult {
    // TODO access control
    let mut users = USERS.lock().unwrap();

    if users.get(&id).is_some() {
        return UserResult::Err(GenericError {
            message: "User already exists!".to_string(),
            ..GenericError::default()
        })
    }

    let user = User {
        id: id,
        is_enabled: true,
        is_principal: false,
        first_name: Some(input.first_name),
        last_name: Some(input.last_name),
        email: Some(input.email),
        phone_no: Some(input.phone_no),
        detail_meta: input.detail_meta,
        ..Default::default()
    };
    
    users.insert(id, user.clone());
    UserResult::User(user)
}

#[update]
pub fn update_user(id: Principal, input: UserDetailsInput) -> UserResult {
    // TODO access control
    let mut users = USERS.lock().unwrap();
    if let Some(user) = users.get_mut(&id) {
        user.first_name = Some(input.first_name);
        user.last_name = Some(input.last_name);
        user.phone_no = Some(input.phone_no);
        user.email = Some(input.email);
        user.detail_meta = input.detail_meta;
        user.updated_at = api::time();
        user.updated_by = api::caller(); // Update with the current user
        UserResult::User(user.clone())
    } else {
        UserResult::Err(GenericError {
            message: "User not found!".to_string(),
            ..GenericError::default()
        })
    }
}

#[update]
pub fn update_user_orgs(id: Principal, org_ids: Vec<Principal>) -> UserResult {
    // TODO access control
    let mut users = USERS.lock().unwrap();
    if let Some(user) = users.get_mut(&id) {
        user.org_ids = org_ids;
        UserResult::User(user.clone())
    } else {
        UserResult::Err(GenericError {
            message: "User not found!".to_string(),
            ..GenericError::default()
        })
    }
}

#[ic_cdk::update]
async fn generate_product_review(product_id: Principal) -> Option<Product> {
    let mut products = PRODUCTS.lock().unwrap();
    if let Some(product) = products.get_mut(&product_id) {
        let latest_product_review_generation = product.metadata.iter().find(|v| v.key == "latest_product_review_generation").map(|v| v.value.clone().parse::<u64>().ok()).flatten();
        if latest_product_review_generation.is_none() || latest_product_review_generation.unwrap() < api::time() - 86400 {
            // call scrape function
            // and update product data
            let product_reviews = scrape_product_review(product).await;

            let OPENAI_API_KEY = "OPEN_AI_API_KEY";
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

    return None;
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
            return response_body;
        }

        Err((r, m)) => {
            let message =
                format!("The http_request resulted into error. RejectionCode: {r:?}, Error: {m}");

            ic_cdk::print(message);

            return "No product review!".to_string();
        }
    }
}

#[query]
pub fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

#[ic_cdk::query]
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
        ic_cdk::api::print(format!("Received an error: err = {:?}", raw));
    }
    res
}
#[query]
pub fn find_resellers_by_name_or_id(name: String) -> Vec<Reseller> {
    let filter = name.trim().to_lowercase();

    RESELLERS.lock().unwrap().values()
        .filter(|reseller| reseller.name.to_lowercase().contains(&filter))
        .map(|reseller| reseller.clone())
        .collect()
}

#[query]
pub fn verify_reseller(reseller_id: Principal, unique_code: String) -> ResellerVerificationResult {
    let resellers = RESELLERS.lock().unwrap();
    let reseller = resellers.get(&reseller_id);
    if reseller.is_none() {
        return ResellerVerificationResult::Error(GenericError { 
            message: "Reseller does not exist!".to_string(),
            ..Default::default()
        })
    }

    let organizations = ORGANIZATIONS.lock().unwrap();
    let organization = organizations.get(&reseller.unwrap().org_id);
    if organization.is_none() {
        return ResellerVerificationResult::Error(GenericError { 
            message: "Organization does not exist!".to_string(),
            ..Default::default()
        })
    }

    // deserialize public_key
    let public_key_bytes = hex::decode(&reseller.unwrap().public_key);
    if public_key_bytes.is_err() {
        return ResellerVerificationResult::Error(GenericError { 
            message: "Malformed public key!".to_string(),
            ..Default::default()
        })
    }
    let public_key_encoded_point = EncodedPoint::from_bytes(public_key_bytes.unwrap());
    if public_key_encoded_point.is_err() {
        return ResellerVerificationResult::Error(GenericError { 
            message: "Malformed public key!".to_string(),
            ..Default::default()
        })
    }
    let public_key = VerifyingKey::from_encoded_point(&public_key_encoded_point.unwrap());
    if public_key.is_err() {
        return ResellerVerificationResult::Error(GenericError { 
            message: "Malformed public key!".to_string(),
            ..Default::default()
        })
    }

    // hashed message is the reseller_id
    let mut hasher = Sha256::new();
    hasher.update(reseller_id.to_string());
    let hashed_message = hasher.finalize();

    let decoded_code = hex::decode(&unique_code);
    if decoded_code.is_err() {
        return ResellerVerificationResult::Error(GenericError { 
            message: "Malformed code!".to_string(),
            ..Default::default()
        })
    }
    let signature = Signature::from_slice(decoded_code.unwrap().as_slice()).unwrap();

    let match_result = match public_key.unwrap().verify(&hashed_message, &signature) {
        Ok(_) => ResellerVerificationResultRecord {
            status: VerificationStatus::Success,
            organization: OrganizationPublic::from(organization.unwrap().clone()),
            registered_at: Some(reseller.unwrap().date_joined),
        },
        Err(_) => ResellerVerificationResultRecord {
            status: VerificationStatus::Invalid,
            organization: OrganizationPublic::from(organization.unwrap().clone()),
            registered_at: None,
        },
    };
    ResellerVerificationResult::Result(match_result)
}

#[query]
pub fn generate_reseller_unique_code(reseller_id: Principal) -> UniqueCodeResult {
    let resellers = RESELLERS.lock().unwrap();
    let reseller = resellers.get(&reseller_id);
    if reseller.is_none() {
        return UniqueCodeResult::Error(GenericError { 
            message: "Reseller does not exist!".to_string(),
            ..Default::default()
        })
    }

    // verification
    let organizations = ORGANIZATIONS.lock().unwrap();
    let organization = organizations.get(&reseller.unwrap().org_id);
    if organization.is_none() {
        return UniqueCodeResult::Error(GenericError { 
            message: "Organization does not exist!".to_string(),
            ..Default::default()
        })
    }

    // deserialize to 
    let private_key_bytes = hex::decode(&organization.unwrap().private_key);
    if private_key_bytes.is_err() {
        return UniqueCodeResult::Error(GenericError {
            message: "Malformed secret key for organization!".to_string(),
            ..GenericError::default()
        })
    }
    let private_key = SigningKey::from_slice(&private_key_bytes.unwrap().as_slice()); 
    if private_key.is_err() {
        return UniqueCodeResult::Error(GenericError {
            message: "Malformed secret key for organization!".to_string(),
            ..GenericError::default()
        })
    }

    // hash and sign. the sign will be used to provide unique_code of the reseller
    let mut hasher = Sha256::new();
    hasher.update(reseller_id.to_string());
    let hashed_message = hasher.finalize();
    
    let signature: Signature = private_key.unwrap().sign(&hashed_message);
    UniqueCodeResult::UniqueCode(signature.to_string())

}


#[query]
pub fn list_product_serial_number(organization_id: Option<Principal>, product_id: Option<Principal>) -> Vec<ProductSerialNumber> {
    let serial_numbers = PRODUCT_SERIAL_NUMBERS.lock().unwrap();
    if organization_id.is_none() {
        let mut sn_values: Vec<ProductSerialNumber> = Vec::new();
        serial_numbers.clone().into_values().for_each(|sn_vec| {
            sn_vec.into_iter().for_each(|sn| sn_values.push(sn))
        });
        return sn_values;
    }

    let products = PRODUCTS.lock().unwrap();
    if product_id.is_none() {
        // search all available for orgs
        let mut filtered_serial_numbers: Vec<ProductSerialNumber> = Vec::new();
        let product_ids: Vec<Principal> = products.clone().into_values()
            .filter(|p| p.org_id == organization_id.unwrap())
            .map(|p| p.id)
            .collect();
        product_ids.into_iter().for_each(|p_id| {
            if let Some(product_sn) = serial_numbers.get(&p_id) {
                product_sn.into_iter().for_each(|p_sn| filtered_serial_numbers.push(p_sn.clone()))
            }
        });
        
        return filtered_serial_numbers
    }

    // verify if the product is from the org
    if !products.contains_key(&product_id.unwrap()) {
        return Vec::new();
    }
    let product = products.get(&product_id.unwrap()).unwrap();
    if product.org_id != organization_id.unwrap() {
        return Vec::new();
    }
    
    match serial_numbers.get(&product_id.unwrap()) {
        Some(sn) => sn.clone(),
        None => Vec::new()
    }
}

#[update]
pub fn create_product_serial_number(product_id: Principal, user_serial_no: Option<String>) -> ProductSerialNumberResult {
    let mut product_serial_nos = PRODUCT_SERIAL_NUMBERS.lock().unwrap();
    match product_serial_nos.get_mut(&product_id) {
        Some(vec) => {
            if user_serial_no.is_some() {
                if vec.clone().into_iter().any(|p_sn| p_sn.user_serial_no == user_serial_no.clone().unwrap()) {
                    return ProductSerialNumberResult::Error(GenericError {
                        message: "Existing user serial number already exists!".to_string(),
                        ..Default::default()
                    })
                }
            }
            
            let product_sn = ProductSerialNumber {
                product_id: product_id,
                user_serial_no: user_serial_no.unwrap_or_default(),
                ..Default::default()
            };
            vec.push(product_sn.clone());
            ProductSerialNumberResult::Result(product_sn)
        },
        None => {
            let mut product_sn_vec = Vec::new();
            let product_sn = ProductSerialNumber {
                product_id: product_id,
                user_serial_no: user_serial_no.unwrap_or_default(),
                ..Default::default()
            };
            product_sn_vec.push(product_sn.clone());
            product_serial_nos.insert(product_id, product_sn_vec);
            ProductSerialNumberResult::Result(product_sn)
        }
    }
}

#[update]
pub fn update_product_serial_number(product_id: Principal, serial_no: Principal, user_serial_no: Option<String>) -> ProductSerialNumberResult {
    let mut product_serial_nos = PRODUCT_SERIAL_NUMBERS.lock().unwrap();
    match product_serial_nos.get_mut(&product_id) {
        Some(vec) => {
            if user_serial_no.is_some() {
                if vec.clone().into_iter()
                    .any(|p_sn| p_sn.user_serial_no == user_serial_no.clone().unwrap()
                        && p_sn.serial_no != serial_no) {
                    return ProductSerialNumberResult::Error(GenericError {
                        message: "Existing user serial number already exists!".to_string(),
                        ..Default::default()
                    })
                }
            }
            let existing_sn = vec.into_iter().find(|s| s.serial_no == serial_no);
            if existing_sn.is_none() {
                return ProductSerialNumberResult::Error(GenericError {
                    message: "Serial number not found!".to_string(),
                    ..Default::default()
                })
            }
            let sn = existing_sn.unwrap();
            sn.user_serial_no = user_serial_no.unwrap_or_default();
            sn.updated_at = api::time();
            sn.updated_by = api::caller();
            
            ProductSerialNumberResult::Result(sn.clone())
        },
        None => {
            ProductSerialNumberResult::Error(GenericError {
                message: "Product has no registered serial_nos!".to_string(),
                ..Default::default()
            })
        }
    }
}

#[update]
pub fn print_product_serial_number(product_id: Principal, serial_no: Principal) -> ProductUniqueCodeResult {
    // unique_code is
    let mut binding = PRODUCT_SERIAL_NUMBERS.lock().unwrap();
    let product_sn = binding.get_mut(&product_id);
    if product_sn.is_none() {
        return ProductUniqueCodeResult::Error(GenericError { 
            message: "Product has no serial number recorded!".to_string(),
            ..Default::default()
        })
    }

    let product_sn_ref = product_sn.unwrap().iter_mut().find(|sn| sn.serial_no == serial_no);
    if product_sn_ref.is_none() {
        return ProductUniqueCodeResult::Error(GenericError { 
            message: "Serial number for product is not present!".to_string(),
            ..Default::default()
        })
    }

    let products = PRODUCTS.lock().unwrap();
    let product = products.get(&product_id);
    if product.is_none() {
        return ProductUniqueCodeResult::Error(GenericError { 
            message: "Product reference does not exist!".to_string(),
            ..Default::default()
        })
    }
    let organizations = ORGANIZATIONS.lock().unwrap();
    let organization = organizations.get(&product.unwrap().org_id);
    if organization.is_none() {
        return ProductUniqueCodeResult::Error(GenericError { 
            message: "Organization does not exist!".to_string(),
            ..Default::default()
        })
    }
    // deserialize to 
    let private_key_bytes = hex::decode(&organization.unwrap().private_key);
    if private_key_bytes.is_err() {
        return ProductUniqueCodeResult::Error(GenericError {
            message: "Malformed secret key for organization!".to_string(),
            ..GenericError::default()
        })
    }
    let private_key = SigningKey::from_slice(&private_key_bytes.unwrap().as_slice()); 
    if private_key.is_err() {
        return ProductUniqueCodeResult::Error(GenericError {
            message: "Malformed secret key for organization!".to_string(),
            ..GenericError::default()
        })
    }


    let sn_ref = product_sn_ref.unwrap();
    sn_ref.print_version += 1;
    sn_ref.updated_at = api::time();
    sn_ref.updated_by = api::caller();

    // unique code: create a signed message for the product, using the public key
    // message contents will be
    // {serial_no}_{product_id}_{print_version}
    let msg = format!("{}_{}_{}", product_id.to_string(), serial_no.to_string(), sn_ref.print_version);
    let mut hasher = Sha256::new();
    hasher.update(msg);
    let hashed_message = hasher.finalize();
    
    let signature: Signature = private_key.unwrap().sign(&hashed_message);
    ProductUniqueCodeResult::Result(ProductUniqueCodeResultRecord {
        unique_code: signature.to_string(),
        print_version: sn_ref.print_version,
        product_id: sn_ref.product_id,
        serial_no: sn_ref.serial_no,
        created_at: sn_ref.updated_at
    })
}

#[update]
pub fn verify_product(
    product_id: Principal,
    serial_no: Principal,
    print_version: u8,
    unique_code: String,
    metadata: Vec<Metadata>
) -> ProductVerificationResult {
    let products = PRODUCTS.lock().unwrap();
    if !products.contains_key(&product_id) {
        return ProductVerificationResult::Error(GenericError { 
            message: "Product is invalid!".to_string(),
            ..Default::default()
        })
    }

    // check parameters validity
    let product = products.get(&product_id).unwrap();
    let product_serial_numbers = PRODUCT_SERIAL_NUMBERS.lock().unwrap();
    if !product_serial_numbers.contains_key(&product_id) {
        return ProductVerificationResult::Error(GenericError { 
            message: "Product has no such serial number!".to_string(),
            ..Default::default()
        })
    }
    let product_sn = product_serial_numbers.get(&product_id).unwrap()
        .into_iter()
        .find(|p_sn| p_sn.serial_no == serial_no);
    if product_sn.is_none() {
        return ProductVerificationResult::Error(GenericError { 
            message: "Serial number is not found!".to_string(),
            ..Default::default()
        })
    }
    if product_sn.unwrap().print_version != print_version {
        return ProductVerificationResult::Error(GenericError { 
            message: "Unique code expired!".to_string(),
            ..Default::default()
        })
    }

    // deserialize public_key
    let public_key_bytes = hex::decode(&product.public_key);
    if public_key_bytes.is_err() {
        return ProductVerificationResult::Error(GenericError { 
            message: "Malformed public key!".to_string(),
            ..Default::default()
        })
    }
    let public_key_encoded_point = EncodedPoint::from_bytes(public_key_bytes.unwrap());
    if public_key_encoded_point.is_err() {
        return ProductVerificationResult::Error(GenericError { 
            message: "Malformed public key!".to_string(),
            ..Default::default()
        })
    }
    let public_key = VerifyingKey::from_encoded_point(&public_key_encoded_point.unwrap());
    if public_key.is_err() {
        return ProductVerificationResult::Error(GenericError { 
            message: "Malformed public key!".to_string(),
            ..Default::default()
        })
    }

    // parameters valid. check unique code
    // unique code: create a signed message for the product, using the public key
    // message contents will be
    // {serial_no}_{product_id}_{print_version}
    let msg = format!("{}_{}_{}", product_id.to_string(), serial_no.to_string(), print_version);
    let mut hasher = Sha256::new();
    hasher.update(msg);
    let hashed_message = hasher.finalize();

    let decoded_code = hex::decode(&unique_code);
    if decoded_code.is_err() {
        return ProductVerificationResult::Error(GenericError { 
            message: "Malformed code!".to_string(),
            ..Default::default()
        })
    }
    let signature = Signature::from_slice(decoded_code.unwrap().as_slice()).unwrap();
    
    let verify_result = public_key.unwrap().verify(&hashed_message, &signature);
    if verify_result.is_err() {
        return ProductVerificationResult::Status(ProductVerificationStatus::Invalid);
    }

    // unique code valid. record the validation result
    let mut verification = ProductVerification {
        product_id: product.id,
        serial_no: serial_no,
        print_version: print_version,
        ..Default::default()
    };
    let mut result = ProductVerificationStatus::FirstVerification;
    let mut product_verifications = PRODUCT_VERIFICATIONS.lock().unwrap();
    if let Some(verifications) = product_verifications.get_mut(&product_id) {
        if verifications.into_iter().any(|c| c.serial_no == serial_no) {
            result = ProductVerificationStatus::MultipleVerification;
        }

        let mut result_meta = Metadata {
            key: "result".to_string(),
            value: "Unique".to_string(),
        };
        if result == ProductVerificationStatus::MultipleVerification {
            result_meta.value = "MultipleVerification".to_string();
        }
        
        verification.metadata = [metadata.clone(), Vec::from([result_meta])].concat();
        verifications.push(verification.clone());
    } else {
        let mut verifications = Vec::new();
        verification.metadata = [metadata.clone(), Vec::from([Metadata {
            key: "result".to_string(),
            value: "Unique".to_string(),
        }])].concat();
        verifications.push(verification);
        product_verifications.insert(product_id, verifications);
    }
    ProductVerificationResult::Status(result)
}

#[query]
pub fn list_product_verifications(
    organization_id: Option<Principal>,
    product_id: Option<Principal>,
    serial_number: Option<Principal>
) -> Vec<ProductVerification> {
    let verifications = PRODUCT_VERIFICATIONS.lock().unwrap();
    if organization_id.is_none() {
        let mut sn_values: Vec<ProductVerification> = Vec::new();
        verifications.clone().into_values().for_each(|sn_vec| {
            sn_vec.into_iter().for_each(|sn| sn_values.push(sn))
        });
        return sn_values;
    }

    let products = PRODUCTS.lock().unwrap();
    if product_id.is_none() {
        let mut filtered_verifications: Vec<ProductVerification> = Vec::new();
        let product_ids: Vec<Principal> = products.clone().into_values()
            .filter(|p| p.org_id == organization_id.unwrap())
            .map(|p| p.clone().id)
            .collect();
        product_ids.into_iter().for_each(|p_id| {
            if let Some(product_sn) = verifications.get(&p_id) {
                product_sn.into_iter().for_each(|p_sn| filtered_verifications.push(p_sn.clone()))
            }
        });
        
        return filtered_verifications
    }

    // verify if the product is from the org
    if !products.contains_key(&product_id.unwrap()) {
        return Vec::new();
    }
    let product = products.get(&product_id.unwrap()).unwrap();
    if product.org_id != organization_id.unwrap() {
        return Vec::new();
    }
    if !verifications.contains_key(&product_id.unwrap()) {
        return Vec::new();
    }

    let product_verifications = verifications.get(&product_id.unwrap()).unwrap().clone();
    match serial_number {
        Some(sn) => product_verifications.into_iter().filter(|pv| pv.serial_no == sn).collect(),
        None => product_verifications
    }

}

#[query]
pub fn list_product_verifications_by_user(user_id: Principal, organization_id: Option<Principal>) -> Vec<ProductVerification> {
    let verifications = PRODUCT_VERIFICATIONS.lock().unwrap();
    let mut filtered_verifications: Vec<ProductVerification> = Vec::new();
    match organization_id {
        Some(org_id) => {
            let products = PRODUCTS.lock().unwrap();
            let product_ids: Vec<Principal> = products.clone().into_values()
                .filter(|p| p.org_id == org_id)
                .map(|p| p.id)
                .collect();
            product_ids.into_iter().for_each(|p_id| {
                if let Some(pv) = verifications.get(&p_id) {
                    pv.into_iter().for_each(|v| {
                        if v.created_by == user_id {
                            filtered_verifications.push(v.clone())
                        }
                    })
                }
            })
        },
        None => {
            verifications.clone().into_values().for_each(|pv| {
                pv.into_iter().for_each(|v| {
                    if v.created_by == user_id {
                        filtered_verifications.push(v)
                    }
                })
            });
        }
    }
    filtered_verifications
}