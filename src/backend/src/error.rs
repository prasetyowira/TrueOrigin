use candid::{CandidType, Deserialize};

use crate::models::Metadata;

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