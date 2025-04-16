# 🧠 TrueOrigin – Internal Architecture & Documentation

## Overview
TrueOrigin is a decentralized product authentication service built on the Internet Computer Protocol (ICP). It allows brands to issue tamper-proof product certificates and enables users to verify QR codes on-chain. This document outlines the core architecture, module responsibilities, and code flow.

---

## 📐 High-Level Architecture

```
+-------------+             +----------------+              +------------------+
|  Frontend   |  <------->  |   Canister     |  <---------> |  ICP System APIs |
| (React/Vite)|             | (Rust Backend) |              | (ECDSA, Rand)    |
+-------------+             +----------------+              +------------------+
       |                           |                                  |
       |  [verify_product()]       |                                  |
       |-------------------------->|                                  |
       |                           | [raw_rand()]                     |
       |                           |------------------------------->  |
```

---

## Folder Structure
```
/src
  /backend
    /src
      - lib.rs          # Main entry point, module declarations
      - api.rs          # API endpoint definitions (update & query)
      - service/        # Service implementation modules
        - mod.rs        # Service module definitions
        - organization_service.rs  # Organization business logic
        - product_service.rs       # Product business logic
        - user_service.rs          # User business logic
        - reseller_service.rs      # Reseller business logic
        - verification_service.rs  # Verification business logic
      - auth.rs         # Authentication and authorization
      - error.rs        # Error handling
      - global_state.rs # In-memory data storage
      - models.rs       # Data structures and type definitions
      - storage.rs      # Storage layer for interacting with state
      - utils.rs        # Helper functions
    - Cargo.toml        # Dependencies
    - backend.did       # Canister interface definition
```

--- 

## 🧱 Module Responsibilities

### `lib.rs` (Canister entrypoint)
- Handles module declarations and re-exports
- Exposes public API by re-exporting from api.rs

### `api.rs`
- Defines all public endpoints using `#[update]` and `#[query]` annotations
- Delegates implementation to service modules
- Clean, simple endpoint definitions following RPC-style naming conventions

### `service/` modules
- Contain all business logic implementation
- Grouped by domain (organization, product, user, etc.)
- Each service module focuses on a specific domain area
- Contains detailed logging for observability
- Handles validation and error generation

### `auth.rs`
- Organization-based access control
- `authorize_user_organization()` for verifying permissions

### `global_state.rs`
- In-memory data storage using Mutex-protected HashMaps
- Random number generation using ICP's `raw_rand()`
- Provides data structures for entities:
  - Organizations
  - Products
  - Users
  - Resellers
  - Product serial numbers
  - Product verifications

### `storage.rs`
- Repository pattern implementation for data access
- Abstracts direct state manipulation
- Error handling for storage operations
- Namespaced modules for each entity type

### `models.rs`
- All core structs & enums:
  - `Organization`, `Product`, `User`, `Reseller`
  - `ProductSerialNumber`, `ProductVerification`
  - Various result types for API responses

### `error.rs`
- `GenericError` struct for consistent error handling

### `utils.rs`
- Utility functions:
  - `generate_unique_principal()` → Generate unique principal IDs

---

## 🔄 Product Verification Lifecycle

### 1. Organization Registration
1. User registers via `register()` API endpoint
2. `user_service` creates user account
3. Organization is created via `organization_service`
4. ECDSA key pair is generated for the organization

### 2. Product Registration
1. `create_product()` API endpoint is called
2. `product_service` validates authorization using `auth.rs`
3. Product is assigned to organization and uses organization's public key
4. Product metadata is stored via `storage.rs`

### 3. Product Serial Number Generation
1. `create_product_serial_number()` API endpoint is called
2. `verification_service` creates a unique serial number
3. Serial number is assigned to product and stored

### 4. QR Code Generation
1. `print_product_serial_number()` API endpoint is called
2. `verification_service` generates a unique code for the product serial
3. This code is used to create a QR code for the product

### 5. Verification
1. User scans QR code to get unique code
2. `verify_product()` API endpoint is called
3. `verification_service` validates the authenticity
4. Verification result is returned (Success, Invalid)
5. Verification event is recorded in storage

---

## 🔐 Security Highlights
- Organization-based access control system
- ECDSA signatures for cryptographic verification
- Secure random number generation using ICP's `raw_rand()`
- Authorization checks for sensitive operations
- Standardized logging with `ic_cdk::print()`
- No sensitive information in logs

---

## 📝 Logging & Observability
- All operations are logged using `ic_cdk::print()` (not `println!`)
- Logs use emoji tagging for readability: 
  - 📝 INFO: Informational messages
  - ❌ ERROR: Error conditions
- Log entries include operation context and relevant identifiers

---

## Data Storage Strategy
- In-memory storage using thread-safe Mutex-protected HashMaps
- Repository pattern via `storage.rs` module
- No persistent storage implemented yet (future enhancement)

---

## Future Enhancements (Notes)
- Implement persistent storage using `ic-stable-structures`
- Add rate limiting for verification attempts
- Implement reward mechanisms for verified interactions
- Add sentiment analysis via HTTPS outcalls

---

_Last updated: [Current Date]_