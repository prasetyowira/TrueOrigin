use std::fmt;

use ic_cdk::api;
use candid::{CandidType, Principal, Deserialize};

use crate::{error::GenericError, utils::generate_unique_principal};

#[derive(CandidType, Deserialize, Clone)]
pub struct Metadata {
    pub key: String,
    pub value: String,
}

impl fmt::Debug for Metadata {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Meta [{}: {}]", self.key, self.value)
    }
}

#[derive(CandidType, Deserialize, Clone)]
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

#[derive(CandidType, Deserialize, Clone)]
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
    Error(GenericError)
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
    Error(GenericError),
}

#[derive(CandidType, Deserialize, Clone)]
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

#[derive(CandidType, Deserialize)]
pub enum ProductResult {
    #[serde(rename = "none")]
    None,
    #[serde(rename = "product")]
    Product(Product),
    #[serde(rename = "error")]
    Err(GenericError)
}

#[derive(CandidType, Deserialize)]
pub struct ProductInput {
    pub name: String,
    pub org_id: Principal,
    pub category: String,
    pub description: String,
    pub metadata: Vec<Metadata>,
}

#[derive(CandidType, Deserialize, Clone)]
pub struct ProductSerialNumber {
    pub product_id: Principal,
    pub serial_no: Principal,
    pub user_serial_no: String,
    pub print_version: u8,
    pub metadata: Vec<Metadata>,
    pub created_at: u64,
    pub created_by: Principal,
    pub updated_at: u64,
    pub updated_by: Principal,
}

impl Default for ProductSerialNumber {
    fn default() -> Self {
        ProductSerialNumber { 
            product_id: Principal::anonymous(),
            serial_no: generate_unique_principal(Principal::anonymous()),
            user_serial_no: String::new(),
            print_version: 0,
            metadata: Vec::new(),
            created_at: api::time(),
            created_by: api::caller(), // Default value for Principal
            updated_at: api::time(),
            updated_by: api::caller(), // Default value for Principal
        }
    }
}

#[derive(CandidType, Deserialize, Clone)]
pub struct ProductVerification {
    pub id: Principal,
    pub product_id: Principal,
    pub serial_no: Principal,
    pub print_version: u8,
    pub metadata: Vec<Metadata>,
    pub created_at: u64,
    pub created_by: Principal,
}

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
        }
    }
}

#[derive(CandidType, Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum UserRole {
    Admin,
    BrandOwner,
    Reseller,
}

#[derive(CandidType, Deserialize, Clone)]
pub struct User {
    pub id: Principal,
    pub user_role: Option<UserRole>,
    pub is_principal: bool,
    pub is_enabled: bool,
    pub org_ids: Vec<Principal>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub phone_no: Option<String>,
    pub email: Option<String>,
    pub detail_meta: Vec<Metadata>,
    pub created_at: u64,
    pub created_by: Principal,
    pub updated_at: u64,
    pub updated_by: Principal,
}

impl Default for User {
    fn default() -> Self {
        User {
            id: api::caller(),
            user_role: None,
            org_ids: Vec::new(),
            is_principal: false,
            is_enabled: true,
            first_name: None,
            last_name: None,
            phone_no: None,
            email: None,
            detail_meta: Vec::new(),
            created_at: api::time(),
            created_by: api::caller(), // Default value for Principal
            updated_at: api::time(),
            updated_by: api::caller(), // Default value for Principal
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
        .field("is_principal", &self.is_principal)
        .field("is_enabled", &self.is_enabled)
        .field("first_name", &self.first_name)
        .field("last_name", &self.last_name)
        .field("phone_no", &self.phone_no)
        .field("email", &self.email)
        .field("detail_meta", &self.detail_meta)
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

#[derive(CandidType, Deserialize)]
pub enum UserResult {
    #[serde(rename = "none")]
    None,
    #[serde(rename = "user")]
    User(User),
    #[serde(rename = "error")]
    Err(GenericError)
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

#[derive(CandidType, Deserialize, Clone)]
pub struct Reseller {
    pub id: Principal,
    pub org_id: Principal,
    pub reseller_id: String,
    pub name: String,
    pub date_joined: u64,
    pub metadata: Vec<Metadata>,
    pub ecommerce_urls: Vec<Metadata>,
    pub public_key: String,
    pub created_at: u64,
    pub created_by: Principal,
    pub updated_at: u64,
    pub updated_by: Principal,
}

impl Default for Reseller {
    fn default() -> Self {
        Reseller {
            id: Principal::anonymous(),
            org_id: Principal::anonymous(),
            reseller_id: String::new(),
            name: String::new(),
            date_joined: api::time(),
            metadata: Vec::new(),
            ecommerce_urls: Vec::new(),
            public_key: String::new(),
            created_at: api::time(),
            created_by: api::caller(), // Default value for Principal
            updated_at: api::time(),
            updated_by: api::caller(), // Default value for Principal
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
    Error(GenericError)
}

#[derive(CandidType, Deserialize, PartialEq, Eq)]
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
    Error(GenericError),
}

#[derive(CandidType, Deserialize, PartialEq, Eq)]
pub enum VerificationStatus {
    Success,
    MultipleVerification,
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
    Error(GenericError),
}

#[derive(CandidType, Deserialize)]
pub enum ProductSerialNumberResult {
    #[serde(rename = "result")]
    Result(ProductSerialNumber),
    #[serde(rename = "error")]
    Error(GenericError),
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
    Error(GenericError),
}

