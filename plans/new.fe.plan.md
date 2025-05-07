# Frontend Implementation Plan for User Authentication Flows (Revised)

## Overview

This document outlines a streamlined frontend implementation plan for the TrueOrigin platform, focusing on enhancing the existing login page to support the authentication flows for brand owners and resellers. The plan emphasizes direct usage of backend-generated DID types, with minimal frontend-specific type transformations primarily handled within React Query hooks.

## Current State Analysis (Assumed from context)

- Robust UI component library (shadcn/ui).
- Basic routing structure.
- Single login page with role selection cards.
- Foundational Brand Owner pages.

## Enhanced Login Flow & Core Authentication Structure

### 1. Environment Variable Usage
- Consistently use `process.env.DFX_NETWORK` (values: 'local', 'ic') for network-dependent configurations (e.g., II provider URL, actor host URL).
- Use `process.env.CANISTER_ID_INTERNET_IDENTITY` (with a fallback for local dev if not injected by `dfx`) for the Internet Identity canister ID.

### 2. Logger Integration (`src/utils/logger.ts`)
- The existing `logger.ts` (configured via `process.env.DFX_NETWORK`) will be used for detailed logging throughout the authentication flow, API calls, and component lifecycle events.

### 3. Actor Service (`src/services/canister.ts`)
- The refactored `canister.ts` will be used. It initializes a default actor and provides `getAuthenticatedActor` for use after login via `AuthClient`.

### 4. Direct DID Type Usage & Minimal Frontend Types
- **Primary Types:** Directly import types from `@declarations/TrustOrigin_backend/TrustOrigin_backend.did.d.ts` (e.g., `UserRole as DidUserRole`, `AuthContextResponse as DidAuthContextResponse`, `UserPublic as DidUserPublic`).
- **Frontend Enums/Transformed Types:**
    - Define `FEUserRole` (string enum: BrandOwner, Reseller, Admin) in `src/hooks/useQueries/authQueries.ts` (or a shared hook utilities file).
    - Define `FEAuthContextResponse` in `authQueries.ts`. This type will be the result of transforming `DidAuthContextResponse`, unwrapping optionals and mapping `DidUserRole` to `FEUserRole`.
    - Helper functions like `unwrap<T>(opt: [] | [T]): T | undefined` and `mapDidUserRoleToFEUserRole(didRole: DidUserRole): FEUserRole | undefined` will reside in `authQueries.ts` (or a shared hook utilities file) and be exported for use in other hooks.
- **Page-Specific Data:** For list pages (`products.tsx`, `resellers.tsx`, `users.tsx`), `useQuery` hooks will return arrays of direct DID types (e.g., `Product[]`, `Reseller[]`). Optional fields within these DID types will be handled directly in JSX using `unwrap` or similar logic.

### 5. Authentication Context (`src/contexts/AuthContext.tsx`)
- `AuthContextType` will be defined using the transformed `FEAuthContextResponse` fields for `role`, `brandOwnerDetails`, `resellerDetails`, and will use `DidUserPublic` for `user`.
- Manages `currentSelectedRolePreAuth: FEUserRole | null`.
- `loginWithII` method:
    - Uses `AuthClient` for Internet Identity authentication.
    - Sets `identityProvider` URL based on `process.env.DFX_NETWORK` and `process.env.CANISTER_ID_INTERNET_IDENTITY`.
    - On II success, calls `useInitializeUserSession` mutation (from `authMutations.ts`), passing the `currentSelectedRolePreAuth`.
    - Updates its internal actor instance using `getAuthenticatedActor`.
- `logout` method:
    - Calls `AuthClient.logout()`.
    - Calls `useLogoutUser` mutation.
    - Resets local auth state and actor to anonymous.
- Exposes `isAuthenticated`, `isLoading`, `authError`, `user` (`DidUserPublic | null`), `role` (`FEUserRole | null`), `isRegistered`, `brandOwnerDetails`, `resellerDetails`, actor instance, etc.

### 6. React Query Hooks (`src/hooks/useQueries/authQueries.ts`, `src/hooks/useMutations/authMutations.ts`)
- **Query Hooks (`authQueries.ts`):**
    - `useGetAvailableRoles`: Returns `FEUserRole[]` after transformation.
    - `useGetAuthContext`: Fetches `DidAuthContextResponse`, transforms it to `FEAuthContextResponse` (this is the primary source of auth state for the app via `AuthContext`).
    - Other query hooks (`useGetMyOrganizations`, `useFindOrganizationsByName`, `useGetNavigationContext`, `useGetMyResellerCertification`) will fetch their respective `Did...` types and transform them as needed for their specific `FE...` return types or return DID types directly if transformation is minimal.
    - All hooks use `logger` and a `handleQueryResponse` helper that unwraps DID optionals (`[] | [T]`) and handles errors.
- **Mutation Hooks (`authMutations.ts`):**
    - `useInitializeUserSession`: Takes `{ selected_role: FEUserRole | null }`, converts `FEUserRole` to `DidUserRole` object variant for the actor call, calls backend `initialize_user_session`, transforms response to `FEAuthContextResponse`.
    - `useLogoutUser`: Calls backend `logout_user`.
    - `useCreateOrganizationForOwner`: Takes `OrganizationInput` (DID type), calls backend, transforms response.
    - `useSelectActiveOrganization`: Takes `Principal`, calls backend, transforms response.
    - `useCompleteResellerProfile`: Takes a frontend-defined request payload (`FECompleteResellerProfileRequest`), transforms it to `DidCompleteResellerProfileRequest`, calls backend, transforms response.
    - All hooks use `logger` and a `handleMutationResponse` helper.

### 7. Login Page Logic (`src/pages/auth/login.tsx` - Phase 2 Implementation)
- Uses `useAuth()` hook from `AuthContext`.
- **Role Selection First:** UI allows user to select a role (`FEUserRole`), which updates `currentSelectedRolePreAuth` in `AuthContext`.
- **II Login:** "Authenticate with Internet Identity" button triggers `loginWithII()` from context (disabled if no role selected).
- **Post-Authentication Flow (driven by `useEffect` listening to `isAuthenticated`, `role`, `brandOwnerDetails`, `resellerDetails` from `useAuth()`):**
    - **Brand Owner:**
        - If `!brandOwnerDetails.has_organizations`: Show modal to create an organization (submits to `useCreateOrganizationForOwner`).
        - If `brandOwnerDetails.organizations.length > 1 && !brandOwnerDetails.active_organization`: Show modal to select an active organization (submits to `useSelectActiveOrganization`).
        - Else: Navigate to `/brand-owners/dashboard` (or products page).
    - **Reseller:**
        - If `!resellerDetails.is_profile_complete_and_verified`: Show modal to complete reseller profile (includes org search via `useFindOrganizationsByName`, submits to `useCompleteResellerProfile`).
        - Else: Navigate to `/reseller/certification`.
    - **Admin:** Navigate to `/admin/dashboard`.
    - **Customer/No Specific Role After Init:** Navigate to `/` or `/verify`.
- Modals for organization creation, selection, and reseller profile completion will use shadcn/ui components and be controlled by local state within `LoginPage.tsx`.
- Forms will use local state for input management.

## UI Components & Pages (Alignment)

- **`Sidebar.tsx`:** 
    - Uses `useAuth()` for user display name (derived from `user: DidUserPublic | null`) and `role: FEUserRole | null`.
    - `MenuItem` type (exported from `Sidebar.tsx`) expects `icon: React.ComponentType<{ fillColor: string }>`. Layouts using Lucide icons will need to provide simple wrapper components for icons to match this prop.
- **`ProtectedRoute.tsx`:**
    - Uses `useAuth()`.
    - Accepts `roles?: FEUserRole[]` prop and performs authorization based on `role` from context.
- **Layouts (`BrandOwnerLayout.tsx`, `ResellerLayout.tsx`):**
    - Use `useAuth()` to get user details for display (e.g., `userDisplayName`, `active_organization.name`).
    - Pass correctly typed `menuItems` (with wrapped icons) to `Sidebar`.
- **List Pages (`products.tsx`, `resellers.tsx`, `users.tsx`):**
    - Use `useAuth()` for `actor` and `active_organization.id`.
    - `useQuery` hooks return arrays of direct DID types (e.g., `Product[]`, `Reseller[]`, `ProductVerificationDetail[]`).
    - JSX directly handles unwrapping of optional fields from these DID types using helpers like `unwrapOptional` or `field && field.length > 0 ? field[0] : 'N/A'`.
    - Integrate `logger` for data fetching operations.
- **`UnauthorizedPage.tsx`:**
    - Uses `useAuth()` and correctly displays user information by unwrapping optionals from `user: DidUserPublic | null`.

## Testing Plan (Conceptual)

1.  **Authentication Flow:** Thoroughly test role selection, II login, and all conditional paths in `LoginPage.tsx` (org creation/selection for Brand Owners, profile completion for Resellers).
2.  **Role-Based Access:** Verify `ProtectedRoute` correctly grants/denies access based on `FEUserRole`.
3.  **Data Display:** Ensure all pages correctly display data fetched using DID types, properly handling optional fields.
4.  **Logout:** Test full logout from II and backend.
5.  **Logging:** Verify `logger` provides useful debug information for all critical paths.

## Technical Considerations

- **State Management:** `AuthContext` for global auth state, React Query for server state.
- **Error Handling:** API hooks and `AuthContext` should manage and expose error states. UI should display user-friendly messages (e.g., via Toasts).
- **`LoginOptions` Type:** Investigate and resolve the `LoginOptions` type issue from `@dfinity/auth-client` in `AuthContext.tsx`.
- **Path Aliases:** Ensure `tsconfig.json` path aliases (`@/`, `@declarations/`) are correctly configured and resolved by the linter/TS server.

This revised plan focuses on using direct DID types where feasible, centralizing transformations for complex context objects within hooks, and maintaining clarity through consistent use of `process.env.DFX_NETWORK` and the logger. 
