# Multi-Role Login Simulation Guide

This guide outlines the steps to simulate and test the Brand Owner and Reseller login flows using the local development environment.

## Prerequisites

1.  **Local DFX Environment:** Ensure your local replica and the Internet Identity canister are running. A clean start is recommended:
    ```bash
    dfx start --clean --background
    ```
2.  **Frontend Server:** Start the frontend development server:
    ```bash
    # Navigate to the frontend directory if needed
    # cd src/frontend 
    npm run dev 
    ```

## Simulation Steps

### 1. Simulate Brand Owner (User P1)

*   **Browser:** Open a standard browser window (e.g., Chrome Profile 1).
*   **Navigate:** Go to the application's login page (usually `http://localhost:<port>/auth/login`).
*   **Select Role:** Click on the "Brand Owner" role card.
*   **Authenticate:** Click the "Authenticate with Internet Identity" button.
*   **Internet Identity (II):**
    *   In the local II window that pops up, create a **new identity**. This identity will represent Principal **P1**.
    *   Complete the II authentication process.
*   **Profile Completion:**
    *   After being redirected back to the app, a modal titled "Complete Brand Owner Profile" should appear (as P1 has no role assigned yet).
    *   Enter an **Organization Name** (e.g., "Test Brand Inc.") and a **Description**.
    *   Click "Complete Profile".
*   **Backend Interaction:** This triggers the `register_as_organization` function on the backend. A new Organization (let's call it **O1**) is created, and User P1 is assigned the `BrandOwner` role and linked to O1.
*   **Outcome:** You should be redirected to the Brand Owner dashboard (e.g., `/brand-owners/products`).
*   **(Optional) Create Product:** Navigate within the Brand Owner section and create a test product associated with O1. This helps verify the Brand Owner's permissions.
*   **Logout:** Use the application's logout functionality.

### 2. Simulate Reseller (User P2)

*   **Browser:** **Crucially**, open a **different browser profile** (e.g., Chrome Profile 2) or use an **Incognito/Private window**. This ensures you get a distinct Principal from II.
*   **Navigate:** Go to the application's login page.
*   **Select Role:** Click on the "Reseller" role card.
*   **Authenticate:** Click the "Authenticate with Internet Identity" button.
*   **Internet Identity (II):**
    *   In the local II window, create **another new identity**. This identity will represent Principal **P2**.
    *   Complete the II authentication process.
*   **Profile Completion:**
    *   After redirection, the "Complete Reseller Profile" modal should appear.
    *   Enter a **Shop Name** (e.g., "Test Reseller Shop").
    *   Optional: Fill in Shopee/Tokopedia IDs.
    *   In the **Brand Organization** search field, type the name of the organization created by P1 ("Test Brand Inc.").
    *   **Select "Test Brand Inc."** from the search results. This should populate the hidden `orgId` field with O1's Principal ID.
    *   Click "Complete Profile".
*   **Backend Interaction:** This triggers the `register_as_reseller_v2` function. User P2 is assigned the `Reseller` role and linked to O1. A `Reseller` record is also created. The frontend then calls `check_reseller_verification(O1)`.
*   **Outcome:** Based on the (corrected) `check_reseller_verification` result, you should be redirected. Since this is a new reseller registration, it will likely return `false` (not verified yet), leading to the `/reseller/register` page (or similar page indicating verification is needed).

## Key Considerations

*   **Distinct Principals:** Always use separate browser profiles or incognito windows for each simulated user role to ensure they have different Internet Identity Principals.
*   **Clean State:** Using `dfx start --clean` ensures you start with a fresh backend state for each full simulation run.
*   **Backend Function:** The simulation relies on the corrected `check_reseller_verification` function in `src/backend/src/icp.rs`. 