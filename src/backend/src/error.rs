use candid::{CandidType, Deserialize};

use crate::models::Metadata;

// TODO: Enhance error handling with specific error types
// Current implementation uses a generic error struct for all error cases
// Should include:
// 1. Enum with specific error variants for different error types (Auth, NotFound, ValidationError, etc.)
// 2. More detailed error categories with error codes
// 3. Better context information for debugging
// 4. Structured error logging

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct GenericError {
    pub message: String,
    pub details: Vec<Metadata>
}

impl Default for GenericError {
    fn default() -> Self {
        GenericError {
            message: String::new(),
            details: Vec::new()
        }
    }
}