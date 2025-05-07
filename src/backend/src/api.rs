use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api;
use serde::Serialize;

use crate::error::{ApiError, ErrorDetails};
use crate::models::{Metadata, Organization, OrganizationPublic, Product, ProductSerialNumber, ProductVerification, Reseller, User, ProductVerificationStatus};

// ====== Common API Structures ======

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ResponseMetadata {
    pub timestamp: u64,
    pub version: String,
    pub request_id: Option<String>,
}

impl Default for ResponseMetadata {
    fn default() -> Self {
        ResponseMetadata {
            timestamp: api::time(),
            version: "1.0".to_string(),
            request_id: None,
        }
    }
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PaginationRequest {
    pub page: Option<u32>,
    pub limit: Option<u32>,
}

impl Default for PaginationRequest {
    fn default() -> Self {
        PaginationRequest {
            page: Some(1),
            limit: Some(10),
        }
    }
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PaginationResponse {
    pub page: u32,
    pub limit: u32,
    pub total: u64,
    pub has_more: bool,
}

// ====== Generic API Response Structures ======

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ApiResponse<T> {
    pub data: Option<T>,
    pub error: Option<ApiError>,
    pub metadata: ResponseMetadata,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        ApiResponse {
            data: Some(data),
            error: None,
            metadata: ResponseMetadata::default(),
        }
    }

    pub fn error(error: ApiError) -> Self {
        ApiResponse {
            data: None,
            error: Some(error),
            metadata: ResponseMetadata::default(),
        }
    }
}

// ===== Organization API Structures =====

#[derive(CandidType, Deserialize)]
pub struct CreateOrganizationRequest {
    pub name: String,
    pub description: String,
    pub metadata: Vec<Metadata>,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct OrganizationResponse {
    pub organization: OrganizationPublic,
}

#[derive(CandidType, Deserialize)]
pub struct UpdateOrganizationRequest {
    pub id: Principal,
    pub name: String,
    pub description: String,
    pub metadata: Vec<Metadata>,
}

#[derive(CandidType, Deserialize)]
pub struct FindOrganizationsRequest {
    pub name: String,
    pub pagination: Option<PaginationRequest>,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct OrganizationsListResponse {
    pub organizations: Vec<OrganizationPublic>,
    pub pagination: Option<PaginationResponse>,
}

// ===== Product API Structures =====

#[derive(CandidType, Deserialize)]
pub struct CreateProductRequest {
    pub name: String,
    pub org_id: Principal,
    pub category: String,
    pub description: String,
    pub metadata: Vec<Metadata>,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct ProductResponse {
    pub product: Product,
}

#[derive(CandidType, Deserialize)]
pub struct UpdateProductRequest {
    pub id: Principal,
    pub name: String,
    pub org_id: Principal,
    pub category: String,
    pub description: String,
    pub metadata: Vec<Metadata>,
}

#[derive(CandidType, Deserialize)]
pub struct ListProductsRequest {
    pub org_id: Principal,
    pub pagination: Option<PaginationRequest>,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct ProductsListResponse {
    pub products: Vec<Product>,
    pub pagination: Option<PaginationResponse>,
}

// ===== Product Serial Number API Structures =====

#[derive(CandidType, Deserialize)]
pub struct CreateProductSerialNumberRequest {
    pub product_id: Principal,
    pub user_serial_no: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct ProductSerialNumberResponse {
    pub serial_number: ProductSerialNumber,
}

#[derive(CandidType, Deserialize)]
pub struct ListProductSerialNumbersRequest {
    pub organization_id: Option<Principal>,
    pub product_id: Option<Principal>,
    pub pagination: Option<PaginationRequest>,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct ProductSerialNumbersListResponse {
    pub serial_numbers: Vec<ProductSerialNumber>,
    pub pagination: Option<PaginationResponse>,
}

// ===== Product Verification API Structures =====

#[derive(CandidType, Deserialize)]
pub struct VerifyProductRequest {
    pub product_id: Principal,
    pub serial_no: Principal,
    pub print_version: u8,
    pub unique_code: String,
    pub metadata: Vec<Metadata>,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct ProductVerificationResponse {
    pub verification: ProductVerification,
}

#[derive(CandidType, Deserialize)]
pub struct ListProductVerificationsRequest {
    pub organization_id: Option<Principal>,
    pub product_id: Option<Principal>,
    pub serial_number: Option<Principal>,
    pub pagination: Option<PaginationRequest>,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct ProductVerificationsListResponse {
    pub verifications: Vec<ProductVerification>,
    pub pagination: Option<PaginationResponse>,
}

// ===== Product Verification Enhanced API Structures =====

#[derive(CandidType, Deserialize)]
pub struct VerifyProductEnhancedRequest {
    pub product_id: Principal,
    pub serial_no: Principal,
    pub print_version: u8,
    pub unique_code: String,
    pub metadata: Vec<Metadata>,
    pub timestamp: Option<u64>,  // Client timestamp for replay attack prevention
    pub nonce: Option<String>,   // Optional nonce for additional security
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct ProductVerificationEnhancedResponse {
    pub status: ProductVerificationStatus,
    pub verification: Option<ProductVerification>,
    pub rewards: Option<VerificationRewards>,
    pub expiration: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct VerificationRewards {
    pub points: u32,
    pub is_first_verification: bool,
    pub special_reward: Option<String>,
    pub reward_description: Option<String>,
}

// ===== Rate Limiting Structures =====

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct RateLimitInfo {
    pub remaining_attempts: u32,
    pub reset_time: u64,
    pub current_window_start: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct VerificationAttempt {
    pub user_id: Principal,
    pub product_id: Principal,
    pub serial_no: Principal,
    pub timestamp: u64,
    pub success: bool,
}

// ===== User API Structures =====

#[derive(CandidType, Deserialize)]
pub struct RegisterUserRequest {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub phone_no: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct UserResponse {
    pub user: User,
}

#[derive(CandidType, Deserialize)]
pub struct UpdateUserRequest {
    pub id: Principal,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub phone_no: Option<String>,
    pub detail_meta: Option<Vec<Metadata>>,
}

// ===== Reseller API Structures =====

#[derive(CandidType, Deserialize)]
pub struct CreateResellerRequest {
    pub org_id: Principal,
    pub name: String,
    pub metadata: Vec<Metadata>,
    pub ecommerce_urls: Vec<Metadata>,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct ResellerResponse {
    pub reseller: Reseller,
}

#[derive(CandidType, Deserialize)]
pub struct GenerateResellerUniqueCodeRequest {
    pub reseller_id: Principal,
    // Optional context or nonce to include in the code generation
    pub context: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct ResellerUniqueCodeResponse {
    pub unique_code: String,
    pub reseller_id: Principal,
    pub timestamp: u64,
    pub context: Option<String>,
}

#[derive(CandidType, Deserialize)]
pub struct VerifyResellerRequest {
    pub reseller_id: Principal,
    pub unique_code: String,
    pub timestamp: u64, // Timestamp from the generated code
    pub context: Option<String>, // Context must match if provided during generation
}

#[derive(CandidType, Serialize, Deserialize, Debug, Clone)]
pub enum ResellerVerificationStatus {
    Success,
    InvalidCode,
    ExpiredCode,
    ReplayAttackDetected,
    ResellerNotFound,
    OrganizationNotFound,
    InternalError,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct ResellerVerificationResponse {
    pub status: ResellerVerificationStatus,
    pub organization: Option<OrganizationPublic>,
    pub reseller: Option<Reseller>,
}

// Function to apply pagination to any vector of items
pub fn paginate<T: Clone>(
    items: Vec<T>, 
    request: &PaginationRequest
) -> (Vec<T>, PaginationResponse) {
    let page = request.page.unwrap_or(1);
    let limit = request.limit.unwrap_or(10);
    
    let start = ((page - 1) * limit) as usize;
    let end = (page * limit) as usize;
    
    let total = items.len() as u64;
    let paginated_items = if start < items.len() {
        items[start..std::cmp::min(end, items.len())].to_vec()
    } else {
        vec![]
    };
    
    let pagination = PaginationResponse {
        page,
        limit,
        total,
        has_more: end < items.len(),
    };
    
    (paginated_items, pagination)
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ProductVerificationDetail {
    pub user_email: Option<String>,
    pub product_id: Principal,
    pub product_name: String,
    pub serial_no: Principal,
    pub created_at: u64,
}

// ===== Reset API Structures =====

#[derive(CandidType, Serialize, Deserialize)]
pub struct ResetStorageResponse {
    pub message: String,
}