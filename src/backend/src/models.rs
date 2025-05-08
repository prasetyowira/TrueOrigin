use std::{borrow::Cow, fmt};

use ic_cdk::api;
use candid::{CandidType, Principal, Deserialize, encode_one, decode_one};
use ic_stable_structures::{storable::Bound, Storable};
use serde::Serialize;

use crate::{
    error::{
        ApiError,
    },
    utils::generate_unique_principal
};

macro_rules! impl_storable_for_candid_type {
    ($type:ty) => {
        impl Storable for $type {
            fn to_bytes(&self) -> Cow<[u8]> {
                Cow::Owned(encode_one(self).expect("Failed to encode"))
            }

            fn from_bytes(bytes: Cow<[u8]>) -> Self {
                decode_one(&bytes).expect("Failed to decode")
            }

            const BOUND: Bound = Bound::Unbounded;
        }
    }
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct Metadata {
    pub key: String,
    pub value: String,
}
impl_storable_for_candid_type!(Metadata);

impl fmt::Debug for Metadata {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Meta [{}: {}]", self.key, self.value)
    }
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct Organization {
    pub id: Principal,
    pub name: String,
    pub description: String,
    pub private_key: String,
    pub metadata: Vec<Metadata>,
    pub created_at: u64,
    pub created_by: Principal,
    pub updated_at: u64,
    pub updated_by: Principal,
}
impl_storable_for_candid_type!(Organization);

impl Default for Organization {
    fn default() -> Self {
        Organization {
            id: Principal::anonymous(), // Default value for Principal
            name: String::new(),
            description: String::new(),
            private_key: String::new(),
            metadata: Vec::new(),
            created_at: api::time(),
            created_by: api::caller(), // Default value for Principal
            updated_at: api::time(),
            updated_by: api::caller(), // Default value for Principal
        }
    }
}

impl fmt::Debug for Organization {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Organization")
        .field("id", &self.id)
        .field("name", &self.name)
        .field("description", &self.description)
        .field("private_key", &self.private_key)
        .field("metadata", &self.metadata)
        .field("created_at", &self.created_at)
        .field("created_by", &self.created_by)
        .field("updated_at", &self.updated_at)
        .field("updated_by", &self.updated_by)
        .finish()
    }
}

#[derive(CandidType, Serialize, Deserialize, Debug, Clone)]
pub struct OrganizationPublic {
    pub id: Principal,
    pub name: String,
    pub description: String,
    pub metadata: Vec<Metadata>,
    pub created_at: u64,
    pub created_by: Principal,
    pub updated_at: u64,
    pub updated_by: Principal,
}
impl_storable_for_candid_type!(OrganizationPublic);

impl OrganizationPublic {
    pub fn from(org: Organization) -> OrganizationPublic {
        OrganizationPublic {
            id: org.id,
            name: org.name,
            description: org.description,
            metadata: org.metadata,
            created_at: org.created_at,
            created_by: org.created_by,
            updated_at: org.updated_at,
            updated_by: org.updated_by,
        }
    }
}

#[derive(CandidType, Deserialize, Clone)]
pub enum OrganizationResult {
    #[serde(rename = "organization")]
    Organization(OrganizationPublic),
    #[serde(rename = "error")]
    Error(ApiError)
}

#[derive(CandidType, Deserialize)]
pub struct OrganizationInput {
    pub name: String,
    pub description: String,
    pub metadata: Vec<Metadata>,
}

#[derive(CandidType, Deserialize)]
pub enum PrivateKeyResult {
    #[serde(rename = "key")]
    Key(String),
    #[serde(rename = "error")]
    Error(ApiError),
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct Product {
    pub id: Principal,
    pub name: String,
    pub org_id: Principal,
    pub category: String,
    pub description: String,
    pub metadata: Vec<Metadata>,
    pub public_key: String,
    pub created_at: u64,
    pub created_by: Principal,
    pub updated_at: u64,
    pub updated_by: Principal,
}
impl_storable_for_candid_type!(Product);

impl Default for Product {
    fn default() -> Self {
        Product {
            id: Principal::anonymous(),
            name: String::new(),
            org_id: Principal::anonymous(),
            description: String::new(),
            category: String::new(),
            metadata: Vec::new(),
            public_key: String::new(),
            created_at: api::time(),
            created_by: api::caller(), // Default value for Principal
            updated_at: api::time(),
            updated_by: api::caller(), // Default value for Principal
        }
    }
}

impl fmt::Debug for Product {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Product")
        .field("id", &self.id)
        .field("name", &self.name)
        .field("org_id", &self.org_id)
        .field("category", &self.category)
        .field("metadata", &self.metadata)
        .field("public_key", &self.public_key)
        .field("created_at", &self.created_at)
        .field("updated_at", &self.created_at)
        .finish()
    }
}

#[derive(CandidType, Serialize, Deserialize, Debug, Clone)]
pub enum ProductResult {
    #[serde(rename = "product")]
    Product(Product),
    #[serde(rename = "none")]
    None,
    #[serde(rename = "error")]
    Error(ApiError)
}

#[derive(CandidType, Deserialize)]
pub struct ProductInput {
    pub name: String,
    pub org_id: Principal,
    pub category: String,
    pub description: String,
    pub metadata: Vec<Metadata>,
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct ProductSerialNumber {
    pub product_id: Principal,
    pub serial_no: Principal,
    pub print_version: u8,
    pub metadata: Vec<Metadata>,
    pub created_at: u64,
    pub created_by: Principal,
    pub updated_at: u64,
    pub updated_by: Principal,
}
impl_storable_for_candid_type!(ProductSerialNumber);

impl Default for ProductSerialNumber {
    fn default() -> Self {
        ProductSerialNumber { 
            product_id: Principal::anonymous(),
            serial_no: generate_unique_principal(Principal::anonymous()),
            print_version: 0,
            metadata: Vec::new(),
            created_at: api::time(),
            created_by: api::caller(), // Default value for Principal
            updated_at: api::time(),
            updated_by: api::caller(), // Default value for Principal
        }
    }
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct ProductVerification {
    pub id: Principal,
    pub product_id: Principal,
    pub serial_no: Principal,
    pub print_version: u8,
    pub metadata: Vec<Metadata>,
    pub created_at: u64,
    pub created_by: Principal,
    pub status: ProductVerificationStatus,
}
impl_storable_for_candid_type!(ProductVerification);

impl Default for ProductVerification {
    fn default() -> Self {
        ProductVerification {
            id: generate_unique_principal(Principal::anonymous()),
            product_id: Principal::anonymous(),
            serial_no: Principal::anonymous(),
            print_version: 0,
            metadata: Vec::new(),
            created_at: api::time(),
            created_by: api::caller(), // Default value for Principal
            status: ProductVerificationStatus::FirstVerification,
        }
    }
}

#[derive(CandidType, Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum UserRole {
    Admin,
    BrandOwner,
    Reseller,
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: Principal,
    pub user_role: Option<UserRole>,
    pub is_principal: bool,
    pub is_enabled: bool,
    pub org_ids: Vec<Principal>,
    pub active_org_id: Option<Principal>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub phone_no: Option<String>,
    pub email: Option<String>,
    pub detail_meta: Vec<Metadata>,
    pub session_keys: Vec<Principal>,
    pub created_at: u64,
    pub created_by: Principal,
    pub updated_at: u64,
    pub updated_by: Principal,
}
impl_storable_for_candid_type!(User);

impl Default for User {
    fn default() -> Self {
        User {
            id: api::caller(),
            user_role: None,
            org_ids: Vec::new(),
            active_org_id: None,
            is_principal: false,
            is_enabled: true,
            first_name: None,
            last_name: None,
            phone_no: None,
            email: None,
            detail_meta: Vec::new(),
            session_keys: Vec::new(),
            created_at: api::time(),
            created_by: api::caller(),
            updated_at: api::time(),
            updated_by: api::caller(),
        }
    }
}

impl fmt::Debug for User {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("User")
        .field("id", &self.id)
        .field("user_role", &self.user_role)
        .field("org_ids", &self.org_ids.iter()
                                                    .map(|item| item.to_string())
                                                    .collect::<Vec<String>>().join(","))
        .field("active_org_id", &self.active_org_id)
        .field("is_principal", &self.is_principal)
        .field("is_enabled", &self.is_enabled)
        .field("first_name", &self.first_name)
        .field("last_name", &self.last_name)
        .field("phone_no", &self.phone_no)
        .field("email", &self.email)
        .field("detail_meta", &self.detail_meta)
        .field("session_keys", &self.session_keys.iter()
                                                    .map(|item| item.to_string())
                                                    .collect::<Vec<String>>().join(","))
        .field("created_at", &self.created_at)
        .field("created_by", &self.created_by)
        .field("updated_at", &self.updated_at)
        .field("updated_by", &self.updated_by)
        .finish()
    }
}

#[derive(CandidType, Deserialize)]
pub struct UserDetailsInput {
    pub first_name: String,
    pub last_name: String,
    pub phone_no: String,
    pub email: String,
    pub detail_meta: Vec<Metadata>,
}

#[derive(CandidType, Serialize, Deserialize, Debug, Clone)]
pub enum UserResult {
    #[serde(rename = "user")]
    User(User),
    #[serde(rename = "none")]
    None,
    #[serde(rename = "error")]
    Error(ApiError)
}

#[derive(CandidType, Deserialize)]
pub struct ProductReview {
    pub id: Principal,
    pub product_id: Principal,
    pub score: u64,
    pub review_description: String,
    pub metadata: Vec<Metadata>,
    pub created_at: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct Reseller {
    pub id: Principal,
    pub user_id: Principal,
    pub org_id: Principal,
    pub name: String,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub ecommerce_urls: Vec<Metadata>,
    pub additional_metadata: Option<Vec<Metadata>>,
    pub is_verified: bool,
    pub certification_code: Option<String>,
    pub certification_timestamp: Option<u64>,
    pub date_joined: u64,
    pub metadata: Vec<Metadata>,
    pub public_key: String,
    pub created_at: u64,
    pub created_by: Principal,
    pub updated_at: u64,
    pub updated_by: Principal,
}
impl_storable_for_candid_type!(Reseller);

impl Default for Reseller {
    fn default() -> Self {
        Reseller {
            id: Principal::anonymous(),
            user_id: Principal::anonymous(),
            org_id: Principal::anonymous(),
            name: String::new(),
            contact_email: None,
            contact_phone: None,
            ecommerce_urls: Vec::new(),
            additional_metadata: None,
            is_verified: false,
            certification_code: None,
            certification_timestamp: None,
            date_joined: api::time(),
            metadata: Vec::new(),
            public_key: String::new(),
            created_at: api::time(),
            created_by: api::caller(),
            updated_at: api::time(),
            updated_by: api::caller(),
        }
    }
}

#[derive(CandidType, Deserialize)]
pub struct ResellerInput {
    pub org_id: Principal,
    pub name: String,
    pub metadata: Vec<Metadata>,
    pub ecommerce_urls: Vec<Metadata>
}

#[derive(CandidType, Deserialize)]
pub enum UniqueCodeResult {
    #[serde(rename = "unique_code")]
    UniqueCode(String),
    #[serde(rename = "error")]
    Error(ApiError)
}

#[derive(CandidType, Serialize, Deserialize, PartialEq, Eq, Clone)]
pub enum ProductVerificationStatus {
    FirstVerification,
    MultipleVerification,
    Invalid
}

#[derive(CandidType, Deserialize)]
pub enum ProductVerificationResult {
    #[serde(rename = "status")]
    Status(ProductVerificationStatus),
    #[serde(rename = "error")]
    Error(ApiError),
}

#[derive(CandidType, Serialize, Deserialize, PartialEq, Eq)]
pub enum VerificationStatus {
    Success,
    Invalid
}

#[derive(CandidType, Deserialize)]
pub struct ResellerVerificationResultRecord {
    pub status: VerificationStatus,
    pub organization: OrganizationPublic,
    pub registered_at: Option<u64>
}

#[derive(CandidType, Deserialize)]
pub enum ResellerVerificationResult {
    #[serde(rename = "result")]
    Result(ResellerVerificationResultRecord),
    #[serde(rename = "error")]
    Error(ApiError),
}

#[derive(CandidType, Deserialize)]
pub enum ProductSerialNumberResult {
    #[serde(rename = "result")]
    Result(ProductSerialNumber),
    #[serde(rename = "error")]
    Error(ApiError),
}

#[derive(CandidType, Deserialize)]
pub struct ProductUniqueCodeResultRecord {
    pub unique_code: String,
    pub print_version: u8,
    pub product_id: Principal,
    pub serial_no: Principal,
    pub created_at: u64,
}

#[derive(CandidType, Deserialize)]
pub enum ProductUniqueCodeResult {
    #[serde(rename = "result")]
    Result(ProductUniqueCodeResultRecord),
    #[serde(rename = "error")]
    Error(ApiError),
}

// ====== API Plan Models ======

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UserPublic {
    pub id: Principal,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub created_at: u64,
}
impl_storable_for_candid_type!(UserPublic);

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Default)]
pub struct BrandOwnerContextDetails {
    pub has_organizations: bool,
    pub organizations: Option<Vec<OrganizationPublic>>,
    pub active_organization: Option<OrganizationPublic>,
}
impl_storable_for_candid_type!(BrandOwnerContextDetails);

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Default)]
pub struct ResellerContextDetails {
    pub is_profile_complete_and_verified: bool,
    pub associated_organization: Option<OrganizationPublic>,
    pub certification_code: Option<String>,
    pub certification_timestamp: Option<u64>,
}
impl_storable_for_candid_type!(ResellerContextDetails);

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Default)]
pub struct AuthContextResponse {
    pub user: Option<UserPublic>,
    pub is_registered: bool,
    pub role: Option<UserRole>,
    pub brand_owner_details: Option<BrandOwnerContextDetails>,
    pub reseller_details: Option<ResellerContextDetails>,
}
impl_storable_for_candid_type!(AuthContextResponse);

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct LogoutResponse {
    pub message: String,
    pub redirect_url: Option<String>,
}
impl_storable_for_candid_type!(LogoutResponse);

// Structs for Phase 2: Brand Owner Flow

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CreateOrganizationWithOwnerContextRequest {
    pub name: String,
    pub description: String,
    pub metadata: Vec<Metadata>, // e.g., industry, logo URL
}
impl_storable_for_candid_type!(CreateOrganizationWithOwnerContextRequest);

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct OrganizationContextResponse {
    pub organization: OrganizationPublic,
    pub user_auth_context: AuthContextResponse,
}
impl_storable_for_candid_type!(OrganizationContextResponse);

// Structs for Phase 3: Reseller Flow

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ResellerPublic { // Sanitized Reseller details
    pub id: Principal, // This is the Reseller record's ID
    pub user_id: Principal, // Link to the User principal
    pub organization_id: Principal,
    pub name: String,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub ecommerce_urls: Vec<Metadata>,
    pub additional_metadata: Option<Vec<Metadata>>,
    pub is_verified: bool,
    pub public_key: String,
    pub certification_code: Option<String>,
    pub certification_timestamp: Option<u64>,
    pub created_at: u64,
    pub updated_at: u64,
}
impl_storable_for_candid_type!(ResellerPublic);

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CompleteResellerProfileRequest {
    pub target_organization_id: Principal,
    pub reseller_name: String,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub ecommerce_urls: Vec<Metadata>,
    pub additional_metadata: Option<Vec<Metadata>>,
}
impl_storable_for_candid_type!(CompleteResellerProfileRequest);

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ResellerCertificationPageContext {
    pub reseller_profile: ResellerPublic,
    pub associated_organization: OrganizationPublic,
    pub certification_code: String, // Assuming it will always be present if this context is fetched
    pub certification_timestamp: u64, // Assuming it will always be present
    pub user_details: UserPublic,
}
impl_storable_for_candid_type!(ResellerCertificationPageContext);

// Structs for Phase 4: Profile and Navigation

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct NavigationContextResponse {
    pub user_display_name: String,
    pub user_avatar_id: Option<String>, // Or URL
    pub current_organization_name: Option<String>, // Active org for BrandOwner, associated for Reseller
}
impl_storable_for_candid_type!(NavigationContextResponse);

