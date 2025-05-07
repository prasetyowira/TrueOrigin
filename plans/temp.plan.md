# Plan: Refactor Authentication Flow

## 1. Refactor Auth Context (`src/frontend/src/contexts/useAuthContext/`)

*   **State:**
    *   Initialize `AuthClient`.
    *   Manage state for `isAuthenticated` (boolean), `isLoading` (boolean), `authClient` (AuthClient instance), `actor` (authenticated ActorSubclass), `profile` (User | null), `selectedOrgId` (Principal | null).
*   **Login (`login` function):**
    *   Implement login logic using `authClient.login()`.
    *   Handle successful login callback:
        *   Set `isAuthenticated = true`.
        *   Create authenticated `HttpAgent` and `actor`.
        *   Call backend `whoami()` using the new `actor`.
        *   Store the result in the `profile` state.
        *   Retrieve selected role from `localStorage`.
        *   Based on role and profile, determine the next step (e.g., show modal, redirect). Handle potential multi-org selection if `profile.org_ids.length > 1`.
    *   Set `isLoading` states appropriately during the process.
*   **Logout (`logout` function):**
    *   Implement logout using `authClient.logout()`.
    *   Reset all auth-related state (`isAuthenticated`, `profile`, `actor`, `selectedOrgId`, etc.).
    *   Clear relevant `localStorage`.
*   **Role Check (`hasRole` function):**
    *   Implement logic to check if the current `profile.user_role` array contains the specified role.
*   **Organization Management:**
    *   Implement `selectOrganization(orgId: Principal)`: Store `orgId` in `selectedOrgId` state and `localStorage`.
    *   Implement `getCurrentOrgId(): Principal | null`: Return `selectedOrgId` from state or `localStorage`.
*   **Initialization (`useEffect`):**
    *   On component mount, initialize `AuthClient`.
    *   Check authentication status (`authClient.isAuthenticated()`).
    *   If authenticated, perform the post-login steps (create actor, call `whoami`, load profile).
    *   Restore `selectedOrgId` from `localStorage`.

## 2. Refactor Auth Hook (`src/frontend/src/hooks/useAuth.ts`)

*   Consume the refactored `useAuthContext`.
*   Update the profile transformation logic to correctly map the backend `User` type (from `whoami`) to the frontend `User` type, including extracting organization details based on `selectedOrgId`.
*   Expose necessary state (`isAuthenticated`, `isLoading`, `user`, `error`) and functions (`login`, `logout`, `selectOrganization`) to components.
*   Fix the TypeScript linter error for the `map` function parameter `r`.

## 3. Update Login Page (`src/frontend/src/pages/auth/login.tsx`)

*   On role selection, store the chosen role (`brandOwner`, `reseller`, `customer`) in `localStorage`.
*   On "Authenticate" button click, call the `login` function from the `useAuth` hook.
*   **Post-Login Logic (triggered by context/hook state changes after successful II login and `whoami`):**
    *   Retrieve the selected role from `localStorage`.
    *   **Brand Owner:**
        *   Check `profile` and `hasRole('BrandOwner')`.
        *   If role missing or profile incomplete -> Show "Complete Brand Owner Profile" modal.
        *   On modal submit -> Call `register_as_organization` via a mutation hook.
        *   If profile exists and role is `BrandOwner` -> Check `profile.org_ids`.
        *   If `org_ids.length > 1` -> Show "Select Organization" modal.
        *   If `org_ids.length === 1` -> Call `selectOrganization` with `org_ids[0]`.
        *   On organization selection (modal or automatic) -> Redirect to `/brand-owners/products`.
    *   **Reseller:**
        *   Check `profile` and `hasRole('Reseller')`.
        *   If role missing or profile incomplete -> Show "Complete Reseller Profile" modal (fetch orgs for dropdown using `find_organizations_by_name` via a query hook).
        *   On modal submit -> Call `register_as_reseller_v2` via a mutation hook. Re-trigger `whoami` or update context profile.
        *   If profile exists and role is `Reseller` -> Call `check_reseller_verification` via a query hook.
        *   If verification fails -> Show "Complete Reseller Profile" modal again.
        *   If verification succeeds -> Redirect to `/reseller/certification`.
    *   **Customer:**
        *   Redirect to `/verify` (or appropriate customer page).

## 4. Update Main App (`src/frontend/src/App.tsx`)

*   Ensure `AuthContextProvider` wraps the entire `Router`.
*   Verify that routes intended to be protected are wrapped with `ProtectedRoute`.

## 5. Refactor Protected Route (`src/frontend/src/components/ProtectedRoute.tsx`)

*   Use `isAuthenticated` from `useAuthContext`. Redirect to `/auth/login` if `false` (after `isLoading` is `false`).
*   (Optional for now, but implement structure) If `requiredRoles` prop is provided:
    *   Use `profile` and `hasRole` from `useAuthContext`.
    *   Redirect to `/unauthorized` if the user doesn't have the required role.
*   Render `children` if authenticated and authorized.

## 6. Update Layouts (`BrandOwnerLayout.tsx`, `ResellerLayout.tsx`)

*   Use `useAuthContext` to get `profile` for principal ID display.
*   Implement logic to fetch/display user avatar based on `profile.detail_meta`.
*   Use `useAuthContext.getCurrentOrgId()` and the `useGetOrganization` hook to fetch and display the selected organization's name/ID in the header.

## 7. Review Dependent Hooks & Pages

*   **`useGetOrganization`:** Ensure it uses `getCurrentOrgId()` from the context correctly. Adapt to potential null `selectedOrgId`.
*   **`useUpdateOrganization`:** Fix the type import error (`ApiResponse_OrganizationResponse`). Ensure it uses `getCurrentOrgId()` if needed for the update request ID.
*   **`ProductsPage`:** Ensure it correctly uses `getCurrentOrgId()` from the context to fetch products.

## 8. API Integration

*   Create necessary React Query mutation hooks for `register_as_organization` and `register_as_reseller_v2`.
*   Create necessary React Query query hooks for `check_reseller_verification` and `find_organizations_by_name`.
*   Ensure all backend calls use the authenticated `actor` provided by `useAuthContext`.

## 9. Cleanup

*   Remove any commented-out or unused authentication-related code from previous implementations.
