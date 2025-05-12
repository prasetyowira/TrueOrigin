use candid::{CandidType, Deserialize};
use serde::Serialize;

use crate::models::Metadata;

#[derive(CandidType, Serialize, Deserialize, Debug, Clone)]
pub struct ErrorDetails {
    pub message: String,
    pub details: Vec<Metadata> // Optional details like field errors
}

impl Default for ErrorDetails {
    fn default() -> Self {
        ErrorDetails {
            message: String::new(),
            details: Vec::new()
        }
    }
}

// Define specific error categories
#[derive(CandidType, Serialize, Deserialize, Debug, Clone)]
pub enum ApiError {
    NotFound { details: ErrorDetails },
    Unauthorized { details: ErrorDetails },
    InvalidInput { details: ErrorDetails },
    InternalError { details: ErrorDetails },
    // Add other specific errors as needed
    AlreadyExists { details: ErrorDetails },
    MalformedData { details: ErrorDetails },
    ExternalApiError { details: ErrorDetails },
}

// Helper functions to create errors (optional, but can be convenient)
impl ApiError {
    pub fn not_found(message: &str) -> Self {
        ApiError::NotFound { details: ErrorDetails { message: message.to_string(), ..Default::default() } }
    }

    pub fn unauthorized(message: &str) -> Self {
        ApiError::Unauthorized { details: ErrorDetails { message: message.to_string(), ..Default::default() } }
    }

    pub fn invalid_input(message: &str) -> Self {
        ApiError::InvalidInput { details: ErrorDetails { message: message.to_string(), ..Default::default() } }
    }

    pub fn internal_error(message: &str) -> Self {
        ApiError::InternalError { details: ErrorDetails { message: message.to_string(), ..Default::default() } }
    }

     pub fn already_exists(message: &str) -> Self {
        ApiError::AlreadyExists { details: ErrorDetails { message: message.to_string(), ..Default::default() } }
    }

    pub fn malformed_data(message: &str) -> Self {
        ApiError::MalformedData { details: ErrorDetails { message: message.to_string(), ..Default::default() } }
    }

    pub fn external_api_error(message: &str) -> Self {
        ApiError::ExternalApiError { details: ErrorDetails { message: message.to_string(), ..Default::default() } }
    }
}