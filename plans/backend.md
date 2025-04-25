# Backend TODO Items

This document tracks all TODO items identified during the backend refactoring to follow ICP API conventions.

## Storage

- Replace in-memory storage with ic-stable-structures for persistence across upgrades ✅
  - Implementation now uses stable memory via ic-stable-structures crate
  - Data now persists across canister upgrades
  - Integration with existing storage layer preserves API compatibility

## Global State

- Replace in-memory global state with stable storage ✅
  - Implementation now uses StableBTreeMap from ic-stable-structures for all collections
  - Proper versioning and migration strategy implemented for canister upgrades
  - Memory efficiency provided by memory manager for different collections
  - Further optimizations needed for indices to improve query efficiency
  - Add pagination support for retrieving large datasets

## Error Handling

- Enhance error handling with specific error types ✅
  - Current implementation uses a generic error struct for all error cases
  - Should include:
    1. Enum with specific error variants (Auth, NotFound, ValidationError, etc.)
    2. More detailed error categories with error codes
    3. Better context information for debugging
    4. Structured error logging

## Authentication & Authorization ✅

- Enhance authorization system with role-based access control ✅
  - Implementation now includes:
    1. Fine-grained permission system (ReadOrganization, WriteProduct, etc.)
    2. Role hierarchy (Admin, BrandOwner, Reseller)
    3. Permission checking at the API level for all endpoints
    4. Audit logging infrastructure for authorization checks
  - Improved API security with consistent permission checks
  - Legacy function maintained for backward compatibility
  - Users can only access resources they have permissions for
  - Special admin role with elevated privileges

## API Structure

- Enhance API request/response structure ✅
  - Current implementation uses a mix of direct parameters and single-struct parameters
  - Now improved with:
    1. Consistent use of Request/Response structs for all endpoints ✅
    2. Structured error responses with error codes ✅
    3. Pagination support for list endpoints ✅
    4. Input validation at the API level ✅
    5. Response metadata (timestamp, version, etc.) ✅
    
  - Implementation details:
    1. Created a new `api.rs` module with consistent request/response structures
    2. Implemented generic `ApiResponse<T>` for all endpoint responses
    3. Added pagination support with `PaginationRequest` and `PaginationResponse`
    4. Used the new structures in organization-related endpoints as examples
    5. Updated the Candid interface file to include the new types and endpoints
    
  - Next steps:
    1. Refactor remaining endpoints to use the new API structure
    2. Add validation for all input parameters
    3. Implement proper error codes in the API error responses

## Product Verification

- Implement proper verification logic with cryptographic validation ✅
  - Current implementation is simplified without actual code verification
  - Now improved with:
    1. Validation against expected hash pattern ✅ 
    2. Checking for replay attacks (timestamp-based protection) ✅
    3. Expiration check for verification codes ✅
    4. Support for nonce to prevent replay attacks ✅
    5. Proper signature validation with error handling ✅

- Implement rate limiting for verification attempts ✅
  - Prevents brute force attacks
  - Implementation details:
    1. Time-window based approach (5 attempts per 5 minutes) ✅
    2. Per-user and per-product rate limiting ✅ 
    3. Stable storage for persistent rate limiting across upgrades ✅
    4. API to check current rate limit status ✅

- Implement reward mechanism for verified interactions ✅
  - Implementation includes:
    1. Reward token/points distribution for successful verifications ✅
    2. Rate limiting to prevent reward farming ✅
    3. Special rewards for first verifications or promotions ✅
    4. Integration with user rewards system ✅

## Reseller Service

- Implement actual verification logic for reseller unique codes ✅
  - Previous implementation verified signatures but lacked expiration and replay protection.
  - Now enhanced with:
    1. Cryptographic signature verification using organization key pair ✅
    2. Timestamp embedded in generated code for expiration checks (5-minute validity) ✅
    3. Timestamp validation during verification to prevent replay attacks ✅
    4. Optional context included in signing/verification process ✅
    5. Dedicated v2 endpoints (`generate_reseller_unique_code_v2`, `verify_reseller_v2`) with updated API structures ✅

## User Service

- Implement proper error handling for reseller creation ✅
  - Previous implementation (`register_as_reseller`) had basic checks but lacked explicit error handling for storage operations and used a less standard result type.
  - Now implemented in `register_as_reseller_v2`:
    1. Returns appropriate `ApiError` variants for failures (user not found, org not found, user role conflict, invalid input, internal error) ✅
    2. Includes basic rollback logic (attempts to remove reseller if user update fails) ✅
    3. Validates input data (reseller name cannot be empty) ✅
    4. Uses standard `ApiResponse` for consistency ✅
    5. Handles potential (though unlikely) stable storage insertion errors ✅

## Product Service

- Implement proper review generation with HTTPS outcalls to external API ✅
  - Previous implementation existed but lacked configuration, retry logic, and consistent API response.
  - Now improved with:
    1. HTTPS outcall to sentiment analysis service (OpenAI) using configured API key ✅
    2. HTTPS outcall to external scraper service using configured URL ✅
    3. Processing and storing sentiment results in product metadata ✅
    4. Basic retry logic (3 attempts, exponential backoff) for both scraper and OpenAI outcalls ✅
    5. Configurable API key and scraper URL via admin endpoints ✅
    6. Consistent API response using `ApiResponse<ProductResponse>` for `generate_product_review_v2` ✅
    7. Improved error handling and logging during outcalls ✅