# Backend TODO Items

This document tracks all TODO items identified during the backend refactoring to follow ICP API conventions.

## Storage

- ✅ Replace in-memory storage with ic-stable-structures for persistence across upgrades
  - ✅ Implementation now uses stable memory via ic-stable-structures crate
  - ✅ Data now persists across canister upgrades
  - ✅ Integration with existing storage layer preserves API compatibility

## Global State

- ✅ Replace in-memory global state with stable storage
  - ✅ Implementation now uses StableBTreeMap from ic-stable-structures for all collections
  - ✅ Proper versioning and migration strategy implemented for canister upgrades
  - ✅ Memory efficiency provided by memory manager for different collections
  - ⏳ Further optimizations needed for indices to improve query efficiency
  - ⏳ Add pagination support for retrieving large datasets

## Error Handling

- Enhance error handling with specific error types
  - Current implementation uses a generic error struct for all error cases
  - Should include:
    1. Enum with specific error variants (Auth, NotFound, ValidationError, etc.)
    2. More detailed error categories with error codes
    3. Better context information for debugging
    4. Structured error logging

## Authentication & Authorization

- Enhance authorization system with role-based access control
  - Current implementation only checks if a user is associated with an organization
  - Should include:
    1. Fine-grained permission system (read, write, admin rights)
    2. Role hierarchy (admin, manager, user, etc.)
    3. Permission checking at the API level via decorators/macros
    4. Audit logging for all authorization checks

## API Structure

- Enhance API request/response structure
  - Current implementation uses a mix of direct parameters and single-struct parameters
  - Should be improved with:
    1. Consistent use of Request/Response structs for all endpoints
    2. Structured error responses with error codes
    3. Pagination support for list endpoints
    4. Input validation at the API level
    5. Response metadata (timestamp, version, etc.)

## Product Verification

- Implement proper verification logic with cryptographic validation
  - Current implementation is simplified without actual code verification
  - Should include:
    1. Validation against expected hash pattern
    2. Checking for replay attacks (code reuse)
    3. Expiration check if applicable

- Implement rate limiting for verification attempts
  - Should prevent brute force attacks

- Implement reward mechanism for verified interactions
  - Should include:
    1. Reward token/points distribution for successful verifications
    2. Rate limiting to prevent reward farming
    3. Special rewards for first verifications or promotions
    4. Integration with external reward system if applicable

## Reseller Service

- Implement actual verification logic for reseller unique codes
  - Current implementation does not verify the code at all
  - Should include:
    1. Compare with stored/expected unique code
    2. Check for code expiration if applicable
    3. Validate against replay attacks

## User Service

- Implement proper error handling for reseller creation
  - Current implementation ignores errors from reseller_service::create_reseller
  - Should include:
    1. Return appropriate error if reseller creation fails
    2. Consider transaction-like behavior (rollback if part of operation fails)
    3. Validate input data before attempting creation

## Product Service

- Implement proper review generation with HTTPS outcalls to external API
  - Current implementation is just a placeholder without actual functionality
  - Should include:
    1. Make HTTP outcall to sentiment analysis service (e.g., OpenAI/Gemini API)
    2. Process response and store sentiment results
    3. Handle error cases and retry logic
    4. Add appropriate response formatting
