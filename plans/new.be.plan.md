# Refined Backend API Plan for User Authentication & Role-Based Flows

## Overview

This document outlines the backend API specifications to support streamlined authentication and role-based user flows for the TrueOrigin platform. It addresses the requirements for Brand Owners and Resellers, ensuring a clear separation of concerns and simplifying frontend state management. This plan assumes an ICP Rust backend.

## Core Principles & Definitions

*   **User Roles:** `Admin`, `BrandOwner`, `Reseller`. A user without an explicitly assigned role is considered a general user until a role is chosen.
*   **Identity:** Each user is uniquely identified by their Internet Identity (II) Principal.
*   **Organization (Brand):** These terms are used interchangeably. Represents a brand entity.
*   **Role Assignment:** A user can only have one role. Role selection precedes II authentication for new users or users without a role. Once a role is set, it generally cannot be changed by the user (admins might have override capabilities, TBD if needed).
*   **Brand Owner:** Can be associated with multiple Organizations.
*   **Reseller:** Associated with exactly one Organization and must complete a profile including e-commerce shop IDs. Their "certification" is an outcome of completing their profile and being linked to an organization.

## API Endpoint Specifications

### 1. Pre-Authentication & Role Initialization

#### 1.1 Get Available Roles
*Description:* Provides a list of selectable roles for the frontend UI, typically shown before II authentication for new users.
*Endpoint:* `#[query] pub fn get_available_roles() -> ApiResponse<Vec<UserRole>>`
*Request:* None
*Response (`Vec<UserRole>` within `ApiResponse`):*
    ```rust
    // From models.rs
    // pub enum UserRole { Admin, BrandOwner, Reseller }
    // Example: vec![UserRole::BrandOwner, UserRole::Reseller]
    ```
    *Data:* `["BrandOwner", "Reseller"]` (Admin role typically not user-selectable)

#### 1.2 Register or Initialize User Session
*Description:* Called by the frontend *after* successful Internet Identity authentication and (if applicable) user role selection.
            If the user (Principal) is new, it creates a `User` record and assigns the chosen `UserRole`.
            If the user exists but has no role, it assigns the chosen `UserRole`.
            If the user exists and already has a role, it prevents role change and returns the current context.
*Endpoint:* `#[update] pub fn initialize_user_session(selected_role: Option<UserRole>) -> ApiResponse<AuthContextResponse>`
*Request (`InitializeUserSessionRequest`, if explicit request body is preferred, otherwise `selected_role` as param):*
    ```rust
    // selected_role: Option<UserRole> // Passed as parameter
    ```
*Response (`AuthContextResponse` - see section 2.1 for details):* Returns the authentication context to drive the next UI steps.

### 2. Core Authentication Context

#### 2.1 Get Authentication Context
*Description:* The primary endpoint called after `initialize_user_session` or on subsequent application loads for an authenticated user. Provides all necessary information for the frontend to determine the user's current state and the next steps in their flow.
*Endpoint:* `#[query] pub fn get_auth_context() -> ApiResponse<AuthContextResponse>`
*Request:* None
*Response (`AuthContextResponse`):*
    ```rust
    // Defined in models.rs or a new api_models.rs
    pub struct AuthContextResponse {
        pub user: Option<UserPublic>, // Sanitized User details
        pub is_registered: bool,      // True if a User record exists for this II Principal
        pub role: Option<UserRole>,
        pub brand_owner_details: Option<BrandOwnerContextDetails>,
        pub reseller_details: Option<ResellerContextDetails>,
    }

    pub struct UserPublic {
        pub id: Principal,
        pub first_name: Option<String>,
        pub last_name: Option<String>,
        pub email: Option<String>, // Primary email from User record
        pub created_at: u64,
    }

    pub struct BrandOwnerContextDetails {
        pub has_organizations: bool,
        // List of organizations if user is BrandOwner. FE can derive count.
        // Only present if role is BrandOwner.
        pub organizations: Option<Vec<OrganizationPublic>>,
        pub active_organization: Option<OrganizationPublic>, // The currently selected org for the session
    }

    pub struct ResellerContextDetails {
        // True if reseller has completed their specific profile form (name, contact, shop IDs) AND is linked to an org.
        pub is_profile_complete_and_verified: bool,
        pub associated_organization: Option<OrganizationPublic>, // Org they are linked to.
        // Details for displaying certification if profile is complete.
        pub certification_code: Option<String>,
        pub certification_timestamp: Option<u64>,
    }
    ```
    *Logic:*
    *   Fetches `User` by `caller()`.
    *   Populates `is_registered`, `role`.
    *   If `role == BrandOwner`, fetches their `org_ids`, then fetches `OrganizationPublic` for each. Sets `has_organizations`. (Consider an `active_org_id` on `User` model).
    *   If `role == Reseller`, checks if a `Reseller` record exists for this user, if they are linked to an `Organization`, and if their profile fields (name, shop IDs) are filled. This determines `is_profile_complete_and_verified`. Fetches associated `OrganizationPublic`. Generates/retrieves certification details if applicable.

### 3. Brand Owner Specific Flows

#### 3.1 Create Organization
*Description:* Allows a Brand Owner who has no organizations to create their first one.
*Endpoint:* `#[update] pub fn create_organization_for_owner(request: CreateOrganizationWithOwnerContextRequest) -> ApiResponse<OrganizationContextResponse>`
*Request (`CreateOrganizationWithOwnerContextRequest`):*
    ```rust
    // Reuses CreateOrganizationRequest from api.rs, or a tailored version
    pub struct CreateOrganizationWithOwnerContextRequest {
        pub name: String,
        pub description: String,
        pub metadata: Vec<Metadata>, // e.g., industry, logo URL
    }
    ```
*Response (`OrganizationContextResponse`):*
    ```rust
    // Defined in models.rs or api_models.rs
    pub struct OrganizationContextResponse {
        pub organization: OrganizationPublic,
        pub user_auth_context: AuthContextResponse, // Return the full updated auth context
    }
    ```
*Logic:*
    *   Ensures caller has `BrandOwner` role.
    *   Creates the `Organization`.
    *   Adds the new `org_id` to the `User`'s `org_ids` list.
    *   Sets this new organization as the `active_organization` for the user.
    *   Returns the new `OrganizationPublic` and the updated `AuthContextResponse`.

#### 3.2 Select Active Organization
*Description:* Allows a Brand Owner with multiple organizations to select one as active for their current session.
*Endpoint:* `#[update] pub fn select_active_organization(org_id: Principal) -> ApiResponse<AuthContextResponse>`
*Request:* `org_id: Principal` (passed as parameter)
*Response (`AuthContextResponse`):* Returns the updated authentication context with the newly selected active organization.
*Logic:*
    *   Ensures caller has `BrandOwner` role and `org_id` is in their `org_ids`.
    *   Updates a field on the `User` model (e.g., `active_org_id: Option<Principal>`) or uses another mechanism to persist this choice for the user's session.
    *   Returns the full, updated `AuthContextResponse`.

#### 3.3 Get User's Organizations (Helper, might be covered by `get_auth_context`)
*Description:* Specifically lists all organizations a Brand Owner is part of. This might be redundant if `AuthContextResponse` for BrandOwners already includes the list. Included for completeness if a separate call is desired by FE for specific UI elements (e.g., a dropdown).
*Endpoint:* `#[query] pub fn get_my_organizations() -> ApiResponse<Vec<OrganizationPublic>>`
*Request:* None
*Response:* List of `OrganizationPublic` associated with the calling Brand Owner.

### 4. Reseller Specific Flows

#### 4.1 Complete Reseller Profile & Associate with Organization
*Description:* Allows a user with the Reseller role to complete their profile (name, email, phone, shop IDs) and associate with a specific Organization. This is the step that "verifies" them and enables their certification.
*Endpoint:* `#[update] pub fn complete_reseller_profile(request: CompleteResellerProfileRequest) -> ApiResponse<AuthContextResponse>`
*Request (`CompleteResellerProfileRequest`):*
    ```rust
    // Defined in models.rs or api_models.rs
    pub struct CompleteResellerProfileRequest {
        pub target_organization_id: Principal, // The org they are associating with
        pub reseller_name: String,             // Their shop name or public name as reseller
        pub contact_email: Option<String>,     // Specific email for reseller profile, if different from User.email
        pub contact_phone: Option<String>,     // Specific phone for reseller profile
        pub ecommerce_urls: Vec<Metadata>,     // e.g., [{key: "shopee", value: "shop_id_123"}, {key: "tokopedia", value: "shop_id_abc"}]
        pub additional_metadata: Option<Vec<Metadata>>,
    }
    ```
*Response (`AuthContextResponse`):* Returns the updated authentication context, which should now reflect `is_profile_complete_and_verified = true` and provide certification details.
*Logic:*
    *   Ensures caller has `Reseller` role and is not already fully verified with an organization.
    *   Validates `target_organization_id` exists.
    *   Creates/updates a `Reseller` record associated with the `User`'s Principal and the `target_organization_id`.
        *   The `Reseller` struct in `models.rs` should store `reseller_name`, `contact_email`, `contact_phone`, `ecommerce_urls`, `additional_metadata`.
        *   A `user_id: Principal` field should be on the `Reseller` struct linking it back to the `User`.
    *   Updates the `User`'s `org_ids` to include (or be set to) `target_organization_id` (as a reseller is tied to one org).
    *   Generates the unique certification code and timestamp (similar to logic in `generate_reseller_unique_code_v2` but stores it or makes it derivable for `get_auth_context`).
    *   Returns the full, updated `AuthContextResponse`.

#### 4.2 Get Reseller Certification Details (May be covered by `get_auth_context`)
*Description:* If a reseller is already verified, this endpoint (or `get_auth_context`) provides the data needed to display their certification page.
*Endpoint:* `#[query] pub fn get_my_reseller_certification() -> ApiResponse<ResellerCertificationPageContext>`
*Request:* None
*Response (`ResellerCertificationPageContext`):*
    ```rust
    // Defined in models.rs or api_models.rs
    pub struct ResellerCertificationPageContext {
        pub reseller_profile: ResellerPublic, // Contains name, shop IDs etc.
        pub associated_organization: OrganizationPublic,
        pub certification_code: String,
        pub certification_timestamp: u64,
        pub user_details: UserPublic, // Basic user info for the sidebar
    }

    pub struct ResellerPublic { // Sanitized Reseller details
        pub id: Principal,
        pub name: String,
        pub ecommerce_urls: Vec<Metadata>,
        // etc.
    }
    ```
*Logic:* Fetches relevant data if the calling `Reseller` is verified. This is likely part of `ResellerContextDetails` within `AuthContextResponse`.

### 5. General User Profile & Navigation

#### 5.1 Get User Profile for Navigation
*Description:* Provides necessary user information (name, avatar placeholder/ID) and active/associated organization details for display in consistent UI elements (navbar, sidebar). This might be a subset of `AuthContextResponse` or a dedicated, leaner endpoint.
*Endpoint:* `#[query] pub fn get_navigation_context() -> ApiResponse<NavigationContextResponse>`
*Request:* None
*Response (`NavigationContextResponse`):*
    ```rust
    // Defined in models.rs or api_models.rs
    pub struct NavigationContextResponse {
        pub user_display_name: String,
        pub user_avatar_id: Option<String>, // Or URL
        pub current_organization_name: Option<String>, // Active org for BrandOwner, associated for Reseller
    }
    ```
*Logic:* Constructs the response based on the user's role and associated data.

#### 5.2 Logout
*Description:* Allows the user to log out. Backend might need to clear any session-related flags if applicable (though II handles the core session).
*Endpoint:* `#[update] pub fn logout_user() -> ApiResponse<LogoutResponse>`
*Request:* None
*Response (`LogoutResponse`):*
    ```rust
    // Defined in models.rs or api_models.rs
    pub struct LogoutResponse {
        pub message: String, // e.g., "Successfully logged out"
        pub redirect_url: Option<String>, // Optional: URL for FE to redirect to post-logout
    }
    ```

## Data Structure Considerations & Updates (to `models.rs` or a new `api_models.rs`)

*   **`User` struct (`models.rs`):**
    *   `user_role: Option<UserRole>`: Confirm it's singular.
    *   `active_org_id: Option<Principal>`: For BrandOwners to store their currently selected organization for the session.
    *   `reseller_profile_id: Option<Principal>`: If Reseller-specific details (name, contact, shops) are in a separate `Reseller` struct, this links them.

*   **`Reseller` struct (`models.rs`):**
    *   `id: Principal` (PK for the Reseller record itself)
    *   `user_id: Principal` (FK to the `User`'s Principal)
    *   `organization_id: Principal` (The single org they are associated with)
    *   `reseller_name: String`
    *   `contact_email: Option<String>`
    *   `contact_phone: Option<String>`
    *   `ecommerce_urls: Vec<Metadata>`
    *   `additional_metadata: Option<Vec<Metadata>>`
    *   `is_verified: bool` (Set to true once profile is complete and linked to an org)
    *   `certification_code: Option<String>` (Generated and stored/derivable)
    *   `certification_timestamp: Option<u64>`
    *   Standard audit fields (`created_at`, `created_by`, etc.)

*   **New API-specific structs:** `AuthContextResponse`, `UserPublic`, `BrandOwnerContextDetails`, `ResellerContextDetails`, `CreateOrganizationWithOwnerContextRequest`, `OrganizationContextResponse`, `CompleteResellerProfileRequest`, `ResellerCertificationPageContext`, `ResellerPublic`, `NavigationContextResponse`, `LogoutResponse`. (Many of these are detailed in the endpoint definitions above).

## Implementation Notes & Backend Logic Highlights

*   **Role Exclusivity:** Business logic must enforce that a user can only have one role. The `initialize_user_session` endpoint is critical here.
*   **Authorization:** Each endpoint must rigorously check if the calling user has the appropriate role and permissions (e.g., a BrandOwner can't call `complete_reseller_profile`). Helper functions like `ensure_brand_owner(caller())` or `ensure_reseller(caller())` would be useful.
*   **State Management for `active_organization`:** For BrandOwners, the selected `active_organization` needs to be persisted, likely on the `User` record.
*   **Reseller Verification:** The "verification" for a reseller is effectively the completion of their profile via `complete_reseller_profile` and being successfully linked to an organization. The certification details (code, timestamp) are then generated and made available.
*   **Error Handling:** Utilize the existing `ApiError` enum and `ApiResponse<T>` structure for consistent error reporting.
*   **Idempotency:** Consider idempotency for `#[update]` methods where appropriate, especially for creation actions if retries are possible.

## Phased Implementation Suggestion (Matches Frontend Plan)

1.  **Phase 1: Core Authentication & Context**
    *   Implement `get_available_roles`.
    *   Implement `initialize_user_session` (handles new user registration, role assignment, or existing user context).
    *   Implement `get_auth_context` with basic `UserPublic` and `role` info.
    *   Implement `logout_user`.

2.  **Phase 2: Brand Owner Flow - Initial Setup**
    *   Enhance `get_auth_context` to populate `BrandOwnerContextDetails` (checking `org_ids`).
    *   Implement `create_organization_for_owner`.
    *   Implement `select_active_organization`.
    *   (Helper: `get_my_organizations` if strictly needed).

3.  **Phase 3: Reseller Flow - Initial Setup**
    *   Enhance `get_auth_context` to populate `ResellerContextDetails` (checking for linked `Reseller` record and its status).
    *   Implement `complete_reseller_profile` (creates/updates `Reseller` record, links to `User` and `Organization`, generates certification details).
    *   (Helper: `get_my_reseller_certification` if `get_auth_context` isn't sufficient).

4.  **Phase 4: Profile and Navigation Context**
    *   Implement `get_navigation_context` (or ensure `get_auth_context` provides enough for UI).
    *   Refine all data structures and ensure consistent responses.

This refined plan should provide a solid foundation for the backend development, ensuring it meets the frontend's needs for a smooth and logical user experience.