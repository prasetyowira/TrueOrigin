use candid::{CandidType, Deserialize, Principal};
use ic_cdk::{query, update};

use crate::models::{
    Metadata, Organization, OrganizationInput, OrganizationPublic, OrganizationResult,
    Product, ProductInput, ProductResult, ProductSerialNumber, ProductSerialNumberResult,
    ProductUniqueCodeResult, ProductVerification, ProductVerificationResult,
    PrivateKeyResult, UniqueCodeResult, ResellerVerificationResult, User, UserDetailsInput,
    UserResult, UserRole, Reseller, ResellerInput
};
use crate::service::{
    organization_service, product_service, user_service, reseller_service, verification_service
};

// TODO: Enhance API request/response structure
// Current implementation uses a mix of direct parameters and single-struct parameters
// Should be improved with:
// 1. Structured error responses with error codes
// 2. Pagination support for list endpoints
// 3. Input validation at the API level
// 4. Response metadata (timestamp, version, etc.)

// Organization API endpoints
#[query]
pub fn get_organization_by_id(id: Principal) -> OrganizationResult {
    organization_service::get_by_id(id)
}

#[update]
pub fn create_organization(request: OrganizationInput) -> OrganizationPublic {
    organization_service::create(request)
}

#[update]
pub fn update_organization(id: Principal, request: OrganizationInput) -> OrganizationResult {
    organization_service::update(id, request)
}

#[query]
pub fn get_organization_private_key(org_id: Principal) -> PrivateKeyResult {
    organization_service::get_private_key(org_id)
}

#[query]
pub fn find_organizations_by_name(name: String) -> Vec<OrganizationPublic> {
    organization_service::find_by_name(name)
}

// Product API endpoints
#[update]
pub fn create_product(request: ProductInput) -> ProductResult {
    product_service::create(request)
}

#[query]
pub fn list_products(org_id: Principal) -> Vec<Product> {
    product_service::list_by_organization(org_id)
}

#[query]
pub fn get_product_by_id(id: Principal) -> ProductResult {
    product_service::get_by_id(id)
}

#[update]
pub fn update_product(id: Principal, request: ProductInput) -> ProductResult {
    product_service::update(id, request)
}

#[update]
pub fn generate_product_review(product_id: Principal) -> Option<Product> {
    product_service::generate_review(product_id)
}

// User API endpoints
#[update]
pub fn register() -> User {
    user_service::register()
}

#[query]
pub fn get_user_by_id(id: Principal) -> Option<User> {
    user_service::get_by_id(id)
}

#[query]
pub fn whoami() -> Option<User> {
    user_service::get_current_user()
}

#[update]
pub fn update_self_details(request: UserDetailsInput) -> UserResult {
    user_service::update_self_details(request)
}

#[update]
pub fn set_self_role(role: UserRole) -> UserResult {
    user_service::set_self_role(role)
}

#[update]
pub fn register_as_organization(request: OrganizationInput) -> UserResult {
    user_service::register_as_organization(request)
}

#[update]
pub fn register_as_reseller(request: ResellerInput) -> UserResult {
    user_service::register_as_reseller(request)
}

#[update]
pub fn create_user(id: Principal, request: UserDetailsInput) -> UserResult {
    user_service::create(id, request)
}

#[update]
pub fn update_user(id: Principal, request: UserDetailsInput) -> UserResult {
    user_service::update(id, request)
}

#[update]
pub fn update_user_orgs(id: Principal, org_ids: Vec<Principal>) -> UserResult {
    user_service::update_orgs(id, org_ids)
}

// Reseller API endpoints
#[query]
pub fn find_resellers_by_name_or_id(name: String) -> Vec<Reseller> {
    reseller_service::find_by_name_or_id(name)
}

#[query]
pub fn verify_reseller(reseller_id: Principal, unique_code: String) -> ResellerVerificationResult {
    reseller_service::verify(reseller_id, unique_code)
}

#[update]
pub fn generate_reseller_unique_code(reseller_id: Principal) -> UniqueCodeResult {
    reseller_service::generate_unique_code(reseller_id)
}

// Product verification API endpoints
#[query]
pub fn list_product_serial_number(
    organization_id: Option<Principal>, 
    product_id: Option<Principal>
) -> Vec<ProductSerialNumber> {
    verification_service::list_serial_numbers(organization_id, product_id)
}

#[update]
pub fn create_product_serial_number(
    product_id: Principal, 
    user_serial_no: Option<String>
) -> ProductSerialNumberResult {
    verification_service::create_serial_number(product_id, user_serial_no)
}

#[update]
pub fn update_product_serial_number(
    product_id: Principal, 
    serial_no: Principal, 
    user_serial_no: Option<String>
) -> ProductSerialNumberResult {
    verification_service::update_serial_number(product_id, serial_no, user_serial_no)
}

#[update]
pub fn print_product_serial_number(
    product_id: Principal, 
    serial_no: Principal
) -> ProductUniqueCodeResult {
    verification_service::print_serial_number(product_id, serial_no)
}

#[update]
pub fn verify_product(
    product_id: Principal,
    serial_no: Principal,
    print_version: u8,
    unique_code: String,
    metadata: Vec<Metadata>
) -> ProductVerificationResult {
    verification_service::verify(product_id, serial_no, print_version, unique_code, metadata)
}

#[query]
pub fn list_product_verifications(
    organization_id: Option<Principal>,
    product_id: Option<Principal>,
    serial_number: Option<Principal>
) -> Vec<ProductVerification> {
    verification_service::list_verifications(organization_id, product_id, serial_number)
}

#[query]
pub fn list_product_verifications_by_user(
    user_id: Principal, 
    organization_id: Option<Principal>
) -> Vec<ProductVerification> {
    verification_service::list_user_verifications(user_id, organization_id)
}

// Misc API endpoints
#[query]
pub fn greet(name: String) -> String {
    format!("Hello, {}!", name)
} 