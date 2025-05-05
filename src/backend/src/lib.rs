pub mod global_state;
pub mod models;
pub mod utils;
pub mod icp;
pub mod error;
pub mod auth;
pub mod api;
pub mod rate_limiter;
pub mod rewards;

use crate::api::{
    ApiResponse,
    CreateOrganizationRequest,
    FindOrganizationsRequest,
    GenerateResellerUniqueCodeRequest,
    OrganizationResponse,
    OrganizationsListResponse,
    ProductResponse,
    ProductVerificationDetail,
    ProductVerificationEnhancedResponse,
    RateLimitInfo,
    ResellerUniqueCodeResponse,
    ResellerVerificationResponse,
    UpdateOrganizationRequest,
    UserResponse,
    VerifyProductEnhancedRequest,
    VerifyResellerRequest,
};
use crate::error::ApiError;
use crate::models::{
    OrganizationInput,
    OrganizationPublic,
    OrganizationResult,
    PrivateKeyResult,
    Product,
    ProductInput,
    ProductResult,
    ProductSerialNumber,
    ProductSerialNumberResult,
    ProductUniqueCodeResult,
    Reseller,
    ResellerInput,
    User,
    UserDetailsInput,
    UserResult,
    UserRole,
};
use candid::Principal;
use ic_cdk::api::management_canister::http_request::{
    HttpResponse,
    TransformArgs,
};

ic_cdk::export_candid!();