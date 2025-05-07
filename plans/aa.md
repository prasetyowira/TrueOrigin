# Backend API Enhancement Plan for User Authentication Flows

## Overview

This document outlines a comprehensive plan for backend API enhancements needed to support the frontend authentication flows for brand owners and resellers in the TrueOrigin platform.

## Current State Analysis

The current backend implements several core components:
- User management with role-based permissions (Admin, BrandOwner, Reseller)
- Organization (brand) management
- Product management
- Reseller certification and verification
- Verification and authentication mechanisms

However, the APIs need optimization to better support frontend flows and reduce complexity.

## API Enhancement Requirements

### 1. Authentication & Role Selection APIs

#### 1.1 Role Selection Pre-Authentication
```rust
// New API endpoint to support role selection before II auth
#[query]
pub fn get_available_roles() -> Vec<UserRole> {
    // Return available roles that a user can select during signup
    vec![UserRole::BrandOwner, UserRole::Reseller]
}

// Enhanced whoami API to include role context
#[query]
pub fn get_auth_context() -> ApiResponse<AuthContextResponse> {
    // Return user data with additional auth context:
    // - Role status
    // - Organizations
    // - Registration status
}
```

#### 1.2 Post-Authentication Role Assignment
```rust
// Enhanced register function to accept pre-selected role
#[update]
pub fn register_with_role(role: Option<UserRole>) -> ApiResponse<UserResponse> {
    // Register user and set selected role if provided
    // Return user context with next steps in the flow
}

// Enhance set_self_role to include more context
#[update]
pub fn set_user_role(role: UserRole) -> ApiResponse<AuthFlowResponse> {
    // Set role and return appropriate next steps
    // (Brand form, org selection, reseller form, etc.)
}
```

### 2. Brand Owner Flow APIs

#### 2.1 Organization Status API
```rust
// Check if user has organizations and get registration status
#[query]
pub fn get_user_organization_status() -> ApiResponse<UserOrgStatusResponse> {
    // Return data about:
    // - If user has organizations
    // - Count of organizations
    // - Registration status
}

// Get organizations with richer context
#[query]
pub fn get_user_organizations() -> ApiResponse<UserOrganizationsResponse> {
    // Return all orgs for the user with rich context
}
```

#### 2.2 Enhanced Organization Creation
```rust
// Enhanced organization creation with user context
#[update]
pub fn create_organization_with_context(request: CreateOrganizationRequest) -> ApiResponse<OrganizationContextResponse> {
    // Create org and return contextual data needed for redirect
    // - Organization
    // - User context
}
```

#### 2.3 Organization Selection
```rust
// API to select active organization
#[update]
pub fn select_active_organization(org_id: Principal) -> ApiResponse<OrganizationContextResponse> {
    // Select organization and return context
}
```

### 3. Reseller Flow APIs

#### 3.1 Reseller Status API
```rust
// Get reseller status and verification state
#[query]
pub fn get_reseller_status() -> ApiResponse<ResellerStatusResponse> {
    // Return data about:
    // - If user is registered as reseller
    // - Verification status
    // - Associated organization
}
```

#### 3.2 Enhanced Reseller Registration
```rust
// Updated reseller registration with richer context
#[update]
pub fn register_as_reseller_enhanced(input: ResellerEnhancedInput) -> ApiResponse<ResellerRegistrationResponse> {
    // Register reseller with enhanced data
    // Return contextual data for next steps
}
```

#### 3.3 Certification Context
```rust
// Get certification data with UI context
#[query]
pub fn get_reseller_certification_context() -> ApiResponse<ResellerCertificationContextResponse> {
    // Return certification data and UI context
}

// Generate certification with enhanced context
#[update]
pub fn generate_reseller_certification() -> ApiResponse<ResellerCertificationResponse> {
    // Generate certification and return UI context
}
```

### 4. User Profile and Navigation Context APIs

#### 4.1 User Profile Context
```rust
// Get complete user profile context for UI
#[query]
pub fn get_user_profile_context() -> ApiResponse<UserProfileContextResponse> {
    // Return enhanced user profile with:
    // - Basic user data
    // - Role information
    // - Organization context
}
```

#### 4.2 Logout Context
```rust
// Prepare for logout
#[update]
pub fn prepare_logout() -> ApiResponse<LogoutContextResponse> {
    // Clean up session state
    // Return data needed for logout flow
}
```

## Data Structures

### AuthContextResponse
```rust
pub struct AuthContextResponse {
    pub user: Option<User>,
    pub is_registered: bool,
    pub has_role: bool,
    pub role: Option<UserRole>,
    pub has_organizations: bool,
    pub organization_count: u32,
    pub reseller_verified: Option<bool>,
}
```

### UserOrgStatusResponse
```rust
pub struct UserOrgStatusResponse {
    pub has_organizations: bool,
    pub organization_count: u32,
    pub organizations: Vec<OrganizationPublic>
}
```

### OrganizationContextResponse
```rust
pub struct OrganizationContextResponse {
    pub organization: OrganizationPublic,
    pub user_context: UserProfileContextResponse
}
```

### ResellerStatusResponse
```rust
pub struct ResellerStatusResponse {
    pub is_registered: bool,
    pub is_verified: bool,
    pub organization: Option<OrganizationPublic>,
    pub certification: Option<ResellerUniqueCodeResponse>
}
```

### UserProfileContextResponse
```rust
pub struct UserProfileContextResponse {
    pub user: User,
    pub active_organization: Option<OrganizationPublic>,
    pub role_permissions: Vec<String>
}
```

## Implementation Plan

1. **Phase 1: Core Authentication Enhancements**
   - Create enhanced authentication context endpoints
   - Implement role selection flow

2. **Phase 2: Brand Owner Flow Implementation**
   - Develop organization status and context APIs
   - Enhance organization creation and selection

3. **Phase 3: Reseller Flow Implementation**
   - Implement reseller status APIs
   - Enhance certification generation and context

4. **Phase 4: Profile and Navigation Context**
   - Develop unified profile context API
   - Implement clean data-focused APIs

## Benefits

- **Reduced API Calls**: Contextual responses reduce the need for multiple frontend calls
- **Simplified State Management**: Clean data structures that provide necessary information
- **Better User Experience**: Seamless transitions between authentication states
- **Maintainable Code**: Structured API approach that's easier to extend
- **Clear Separation of Concerns**: Backend focuses on data, frontend handles UI and navigation