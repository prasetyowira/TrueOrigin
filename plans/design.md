***Note: Figma assets identified in the "Assets Needed" sections below have been downloaded to `src/frontend/src/assets`.***

# Landing Page Design Implementation Plan

This plan outlines the steps to implement the landing page using **React**, **Tailwind CSS v3.4.10**, and **shadcn/ui** components, based on the Figma design ([Link](https://www.figma.com/design/aTcGv0lx3UQzqE0BsOtdQX/DevCopy---TrueOrigin---ChainFusion-HackerHouse-ICP-2024?node-id=1-27&t=Tv11R0RFTmekzkHg-4)).

## Goal

Create a visually appealing and informative landing page that introduces TrueOrigin, its features, and value propositions to potential users (Brand Owners, Resellers, Customers), built with React and styled with Tailwind CSS v3.4.10, leveraging shadcn/ui where appropriate.

## Structure & Components (Based on Figma Analysis)

1.  **Header Section:**
    *   Logo (`main` ID: `1:618`)
    *   Navigation Links (`Homepage`, `Brand Owners Dashboard`, `Resellers Dashboard`, `Login` - IDs: `1:615`, `1:612`, `1:613`, `1:614`)
    *   "Book Demo" Button (ID: `1:621`)

2.  **Hero Section:**
    *   Main Headline (`Safeguarding on TrueOrigin` - ID: `1:532`)
    *   Sub-headline (`TrueOrigin is an innovative...` - ID: `1:534`)
    *   Call-to-Action Button (`When SupplyChain Meets BlockChain` - ID: `1:535`)
    *   Visual Element (Image/Illustration - ID: `1:537`, `1:541`)

3.  **Value Proposition / Features Section 1 (`Securing Genuine Products`):**
    *   Headline (`Securing Genuine Products` - ID: `1:548`)
    *   Description (`Enjoy a smooth mobile app...` - ID: `1:547`)
    *   Visuals (Icons/Illustrations, Background - IDs: `1:550`, `1:552`, `1:581`, `1:608`)
    *   QR Code Incentive Text (`Validate QR to get ICP now!` - ID: `1:609`, `1:610`)

4.  **Key Stakeholders Section (`Securing the chains...`):**
    *   Section Title (`Securing the chains between parties` - ID: `1:307`)
    *   Sub-description (`We believe that solutions...` - ID: `1:309`)
    *   **Brand Owners Card:** (ID: `1:627` - `1:639`)
        *   Icon/Visual
        *   Title (`Brand Owners`)
        *   Description (`Safeguard Genuine Products...`)
    *   **Resellers Card:** (ID: `1:28` - `1:175`)
        *   Icon/Visual
        *   Title (`Resellers`)
        *   Description (`Get Authorized and Safely resell...`)
    *   **Customers Card:** (ID: `1:310` - `1:529`)
        *   Icon/Visual
        *   Title (`Customers`)
        *   Description (`Scan the QR Code and Gets Paid...`)

5.  **Technology Section (ICP & Ethereum):**
    *   **ICP Card:** (ID: `1:252` - `1:272`)
        *   Icon (ICP Logo)
        *   Title (`ICP`)
        *   Description (`Fully built on the ICP platform...`)
        *   Tag (`ICP INFRASTRUCTURE`)
    *   **Ethereum Card:** (ID: `1:273` - `1:306`)
        *   Icon (Ethereum Logo)
        *   Title (`Ethereum`)
        *   Description (`Support Ethereum through HTTPS Outcalls...`)
        *   Tag (`ETHEREUM COINS`)

6.  **Footer Section:** (Needs design clarification or standard implementation)
    *   Copyright Info
    *   Social Links (Optional)
    *   Additional Navigation (Optional)

## Implementation Steps

1.  **Setup:**
    *   Ensure React, Tailwind CSS (v3.4.10), and shadcn/ui are correctly configured in the project (`frontend.md` setup ✅).
    *   Create a new route for the landing page (e.g., `/`) in the React Router setup.
    *   Create a main `LandingPage.tsx` React component.

2.  **Component Breakdown:**
    *   Create reusable React components for:
        *   `Header` (using shadcn/ui Navigation Menu or custom components styled with Tailwind)
        *   `HeroSection`
        *   `FeatureSection`
        *   `StakeholderCard` (potentially using shadcn/ui Card component as a base)
        *   `TechnologyCard` (potentially using shadcn/ui Card component as a base)
        *   `Footer`
    *   Utilize shadcn/ui components (e.g., `Button`, `Card`) where applicable and style them according to the Figma design using Tailwind CSS.
    *   Leverage existing UI components from the library where possible (`frontend.md` - UI Components section).

3.  **Layout & Styling:**
    *   Implement the overall page layout using Tailwind CSS v3.4.10 grid/flexbox based on Figma structure within React components.
    *   Apply styles (colors, fonts, spacing, borders, shadows) according to Figma specifications using Tailwind utility classes. Theme colors/fonts should align with Tailwind configuration.
    *   Ensure responsiveness across different screen sizes (mobile, tablet, desktop) using Tailwind's responsive modifiers. (`frontend.md` - Mobile Optimization section)

4.  **Content Integration:**
    *   Populate components with text content from Figma.
    *   Integrate images and icons. Consider downloading necessary assets or using SVG components.

5.  **Interactivity & Navigation:**
    *   Implement navigation links in the header to route correctly (e.g., Login links to the auth flow).
    *   Ensure Call-to-Action buttons (`Book Demo`, etc.) are functional or linked appropriately.

6.  **Refinement & Testing:**
    *   Review implementation against Figma design for visual accuracy.
    *   Test responsiveness thoroughly.
    *   Perform basic accessibility checks. (`frontend.md` - Testing Strategy section)

## Sync with `frontend.md`

*   This landing page implementation aligns with the overall **Frontend Framework and Structure**.
*   Utilizes the **UI Component library** development task.
*   Requires adherence to **Mobile Optimization** practices.
*   Needs **Testing Strategy** implementation.
*   Will add "Implement Landing Page based on Figma Design" as a new high-priority task in `frontend.md`.

## Assets Needed

*   Logo SVG/Image (`main`, `1:618`)
*   Hero Section Image (`1:541`)
*   Feature Section Visuals (various IDs like `1:550`, `1:552`, `1:581`)
*   Stakeholder Icons/Visuals (various IDs like `1:637`, `1:31`, `1:314`)
*   ICP Logo (`1:257`)
*   Ethereum Logo (`1:290`)
*   Potentially other background images/SVGs identified in Figma layout.

*(Plan assumes the basic React+Vite+TS+Tailwind (v3.4.10)+shadcn/ui setup is complete as per `frontend.md`)*

# Login Page Design Implementation Plan

This section outlines the steps to implement the login page using **React**, **Tailwind CSS v3.4.10**, and **shadcn/ui** components, based on the Figma design ([Link](https://www.figma.com/design/aTcGv0lx3UQzqE0BsOtdQX/DevCopy---TrueOrigin---ChainFusion-HackerHouse-ICP-2024?node-id=1-1153&t=Tv11R0RFTmekzkHg-4)).

## Goal

Create a login interface using React that allows users to authenticate via Internet Identity after selecting their intended role (Brand Owner, Reseller, or Customer), styled with Tailwind CSS v3.4.10 and potentially using shadcn/ui components.

## Structure & Components (Based on Figma Analysis)

1.  **Main Container:** (Frame `1:1153`)
    *   Background (`fill_QTBU8G` - likely white)
    *   Border (`stroke_24T8QY` - light gray)

2.  **Header/Logo:**
    *   Logo Image (`IMG_9175 1` - ID: `1:1155`)

3.  **Title:**
    *   "Login" Text (ID: `1:1156`)

4.  **Role Selection:**
    *   Section Title (`Select Your Role` - ID: `1:1157`)
    *   **Brand Owner Role Card:** (Selected state - ID: `1:1163`)
        *   Icon/Visual (ID: `1:1192`)
        *   Title (`Brand Owners` - ID: `1:1187`)
        *   Description (`Manage your brand presence...` - ID: `1:1164`)
        *   "Log In" Button (ID: `1:1169`) - *Note: Appears clickable per role, but main auth button is below.*
    *   **Reseller Role Card:** (Default state - ID: `1:1167`)
        *   Icon/Visual (ID: `1:1850`)
        *   Title (`Reseller` - ID: `1:1188`)
        *   Description (`Manage your brand presence...` - ID: `1:1190`)
        *   "Log In" Button (ID: `1:1175`)
    *   **Customer Role Card:** (Default state - ID: `1:1168`)
        *   Icon/Visual (ID: `1:1706`)
        *   Title (`Customers` - ID: `1:1189`)
        *   Description (`Validate QR Code and Get the Incentives` - ID: `1:1191`)
        *   "Log In" Button (ID: `1:1181`)

5.  **Authentication Button:**
    *   Main Button (`Authenticate` - ID: `1:1158`) - *This likely triggers the Internet Identity flow.*

## Implementation Steps

1.  **Setup:**
    *   Ensure React, Tailwind CSS (v3.4.10), and shadcn/ui are set up.
    *   Create a new route for the login page (e.g., `/login`) in the React Router setup.
    *   Create a main `LoginPage.tsx` React component.

2.  **Component Breakdown:**
    *   Create reusable React components for:
        *   `RoleSelectionCard` (props: `roleName`, `description`, `icon`, `isSelected`, `onSelect`). Consider using shadcn/ui `Card` and `Button` as base components.
    *   Leverage existing/shadcn/ui components (e.g., `Button`, Logo display).

3.  **State Management:**
    *   Implement local state within the `LoginPage` React component using `useState` to track the `selectedRole`.
    *   Update the appearance of `RoleSelectionCard` based on `isSelected` state (e.g., applying different Tailwind classes or shadcn/ui variants).

4.  **Layout & Styling:**
    *   Implement the layout using Tailwind CSS v3.4.10 based on Figma (likely a centered container) within the React component structure.
    *   Apply styles (colors, fonts, borders, spacing) according to Figma specs using Tailwind utility classes or customizing shadcn/ui components.
    *   Ensure basic responsiveness using Tailwind modifiers.

5.  **Authentication Integration:**
    *   The main "Authenticate" button (`1:1158`) onClick handler should:
        *   Retrieve the `selectedRole`.
        *   Initiate the Internet Identity authentication flow (using the existing logic mentioned in `frontend.md` - Authentication System ✅).
        *   Potentially pass the `selectedRole` information along during or after authentication if needed for backend role assignment or redirection.
    *   The individual "Log In" buttons within each role card (`1:1169`, `1:1175`, `1:1181`) might be redundant if the main "Authenticate" button handles the flow after role selection. Clarify if these need separate functionality or should just visually indicate the selected role's action. For now, assume they visually reinforce the selection and the main button triggers auth.

6.  **Refinement & Testing:**
    *   Test role selection updates the UI correctly.
    *   Verify the "Authenticate" button triggers the II flow.
    *   Test successful login redirects the user appropriately (likely to a dashboard based on their selected role, integrating with Protected Routes from `frontend.md`).

## Sync with `frontend.md`

*   Directly implements parts of the **Authentication System** (✅) which is already established in the React application.
*   Leverages **React Router** for the `/login` route and redirection.
*   Uses the **UI Component library** (shadcn/ui + custom components) for buttons etc.
*   Requires **State Management** (React state) for tracking the selected role.
*   The task "Implement Login Page UI based on Figma Design" can be added to the frontend plan, likely following the Landing Page implementation.

## Assets Needed

*   Logo Image (`IMG_9175 1` - ID: `1:1155`)
*   Brand Owner Icon (`1:1192`)
*   Reseller Icon (`1:1850`)
*   Customer Icon (`1:1706`)

*(Plan assumes Internet Identity integration is functional within the React application as per `frontend.md`)*

# Brand Owner Dashboard Implementation Plan

This section details the plan to implement the Brand Owner Dashboard using **React**, **Tailwind CSS v3.4.10**, and **shadcn/ui**, based on the Figma designs:
*   Sidebar/Layout: [Link](https://www.figma.com/design/aTcGv0lx3UQzqE0BsOtdQX/DevCopy---TrueOrigin---ChainFusion-HackerHouse-ICP-2024?node-id=2006-628) (Structure inferred from component instances like `Group 57`/`Group 58` in other views)
*   Product Management: [Link](https://www.figma.com/design/aTcGv0lx3UQzqE0BsOtdQX/DevCopy---TrueOrigin---ChainFusion-HackerHouse-ICP-2024?node-id=1-2064)
*   Reseller Management: [Link](https://www.figma.com/design/aTcGv0lx3UQzqE0BsOtdQX/DevCopy---TrueOrigin---ChainFusion-HackerHouse-ICP-2024?node-id=1-2164)
*   User Management: [Link](https://www.figma.com/design/aTcGv0lx3UQzqE0BsOtdQX/DevCopy---TrueOrigin---ChainFusion-HackerHouse-ICP-2024?node-id=1-2264)
*   Add Product Form: [Link](https://www.figma.com/design/aTcGv0lx3UQzqE0BsOtdQX/DevCopy---TrueOrigin---ChainFusion-HackerHouse-ICP-2024?node-id=1-2363)

## Goal

Develop a functional and user-friendly dashboard for Brand Owners to manage their products, resellers, users, and view relevant data, adhering to the provided Figma designs and utilizing the specified tech stack.

## Overall Structure (Based on Figma Analysis)

1.  **Main Layout:**
    *   Collapsible Sidebar (`Group 57`/`Group 58` component instances) for navigation.
    *   Main Content Area (`Rectangle 12` background frame in views like `1:2064`) to display different management sections.
    *   Top Bar/Header (within Main Content Area, e.g., `Rectangle 32` in `1:2064`) potentially showing page title or user info.

2.  **Sidebar Navigation:** (Based on Icons in `Group 57`/`Group 58`)
    *   Dashboard/Overview (Presentation Chart Icon)
    *   Product Management (3D Cube Scan Icon - `vuesax/bulk/3d-cube-scan`)
    *   Add Product (Box Add Icon - `vuesax/bulk/box-add`)
    *   Reseller Management (Convert 3D Cube Icon - `vuesax/bulk/convert-3d-cube`)
    *   User Management (Profile 2 User Icon - `vuesax/bulk/profile-2user`)
    *   Settings (Setting Icon - `vuesax/bold/setting-2`)
    *   User Profile/Logout section (Bottom section with profile image)

3.  **Content Sections (Routed Components):**
    *   **Product Management (`1:2064`):**
        *   Title (`Brand Owners Dashboard`, repurposed likely as "Product Management")
        *   Filter Controls (Date, Category, Product ID, Others - using shadcn/ui `DatePicker`, `Select`, `Input`)
        *   "Apply" Button (shadcn/ui `Button`)
        *   Product Batch Table (using shadcn/ui `Table`)
            *   Columns: Product Name, Category, Description, Product ID, ECDSA Public Key
    *   **Reseller Management (`1:2164`):**
        *   Title ("Resellers Dashboard")
        *   Filter Controls (similar to Product Mgt.)
        *   Reseller Table (using shadcn/ui `Table`)
            *   Columns: Reseller Name, Certification (Status?), Reseller ID, Date Joined, ECDSA Public Key
    *   **User Management (`1:2264`):**
        *   Title ("User Dashboard")
        *   Filter Controls (similar to Product Mgt.)
        *   User/Scan History Table (using shadcn/ui `Table`)
            *   Columns: Internet Identity ICP, Serial Number, Product ID, Product Name, Scan Date
    *   **Add Product (`1:2363`):**
        *   Title ("Add Your Product")
        *   Form Fields (using shadcn/ui `Input`, `Textarea`, `Select`):
            *   Product Name
            *   Category
            *   Description
        *   "Send" Button (shadcn/ui `Button`) - Likely "Save" or "Add Product"

## Implementation Steps

1.  **Setup:**
    *   Define nested routes within the main application router for the brand owner dashboard (e.g., `/brand-owner`, `/brand-owner/products`, `/brand-owner/resellers`, etc.). Use React Router.
    *   Ensure these routes are protected by the existing Authentication/Authorization logic (`frontend.md` - Authentication System ✅).

2.  **Layout Component:**
    *   Create a `BrandOwnerLayout.tsx` component that includes:
        *   A `Sidebar` component (React). Consider using shadcn/ui `Sheet` for collapsibility or build custom with Tailwind. Populate with navigation links (using icons from Figma) routing to the child pages.
        *   A main content area that renders the child route components (`<Outlet />` from React Router).
        *   Style using Tailwind CSS v3.4.10 according to the overall dashboard look.

3.  **Page Components:**
    *   Create React components for each main section:
        *   `ProductManagementPage.tsx`
        *   `ResellerManagementPage.tsx`
        *   `UserManagementPage.tsx`
        *   `AddProductPage.tsx` (or `AddProductForm.tsx` if it's a modal/dialog within another page)
    *   Implement filter sections using shadcn/ui components (`DatePicker`, `Select`, `Input`, `Button`).
    *   Implement data tables using shadcn/ui `Table`. Fetch data using the API client (`frontend.md` - API Integration ✅) and manage state with React Query (`frontend.md` - State Management).
    *   Implement the "Add Product" form using shadcn/ui `Form`, `Input`, `Textarea`, `Select`, and `Button`. Include form validation (e.g., using `react-hook-form` and `zod` as potentially defined in `frontend.md` State Management). Handle form submission by calling the appropriate API endpoint.

4.  **Styling & Responsiveness:**
    *   Apply specific styles using Tailwind CSS v3.4.10 utility classes or by customizing shadcn/ui component themes to match Figma.
    *   Ensure the dashboard layout and tables are reasonably responsive, potentially simplifying table views on smaller screens.

5.  **API Integration:**
    *   Connect filter components to API calls to fetch filtered data for tables.
    *   Implement API calls for:
        *   Fetching products, resellers, users.
        *   Adding a new product.
        *   Potentially fetching filter options (e.g., categories).
    *   Handle loading and error states gracefully (using React Query features).

6.  **Refinement & Testing:**
    *   Test navigation within the dashboard.
    *   Test filtering functionality for all tables.
    *   Test adding a product via the form, including validation.
    *   Verify data display accuracy in tables.
    *   Test responsiveness.

## Sync with `frontend.md`

*   This plan directly addresses the "Build brand owner dashboard" task.
*   Breaks down the dashboard task into sub-tasks:
    *   Implement Dashboard Layout (Sidebar, Content Area)
    *   Implement Product Management Page (Filters, Table, API)
    *   Implement Reseller Management Page (Filters, Table, API)
    *   Implement User Management Page (Filters, Table, API)
    *   Implement Add Product Form/Page (Form, Validation, API)
*   Heavily relies on **UI Component library** (shadcn/ui + custom) and **Tailwind CSS**.
*   Requires significant **API Integration** for fetching and submitting data.
*   Uses **State Management** (React Query for server state, React Hook Form for forms).
*   Needs **Testing Strategy** applied to components and workflows.

## Assets Needed

*   Sidebar Icons (Presentation Chart, 3D Cube Scan, Box Add, Convert 3D Cube, Profile 2 User, Setting). These might need to be sourced as SVGs or from an icon library like `lucide-react` (commonly used with shadcn/ui).
*   User Profile Image placeholder/component.
*   Logo (`IMG_9175 2`) if displayed in the sidebar.

*(Plan assumes React, Tailwind CSS v3.4.10, shadcn/ui, React Router, React Query, and API client setup are complete or in progress as per `frontend.md`)*

# Reseller Dashboard Implementation Plan

This section details the plan to implement the Reseller Dashboard using **React**, **Tailwind CSS v3.4.10**, and **shadcn/ui**, based on the Figma designs:
*   Sidebar/Layout: Inferred from usage in other views (e.g., `Group 58` instance in `1:2383`, `1:2440`). Link: [Figma](https://www.figma.com/design/aTcGv0lx3UQzqE0BsOtdQX/DevCopy---TrueOrigin---ChainFusion-HackerHouse-ICP-2024?node-id=2006-630)
*   Reseller Registration: [Link](https://www.figma.com/design/aTcGv0lx3UQzqE0BsOtdQX/DevCopy---TrueOrigin---ChainFusion-HackerHouse-ICP-2024?node-id=1-2383)
*   Reseller Certification: [Link](https://www.figma.com/design/aTcGv0lx3UQzqE0BsOtdQX/DevCopy---TrueOrigin---ChainFusion-HackerHouse-ICP-2024?node-id=1-2440)

## Goal

Develop a functional dashboard for Resellers to register, manage their profile, view certification status, and eventually manage product codes, adhering to the provided Figma designs and utilizing the specified tech stack.

## Overall Structure (Based on Figma Analysis)

1.  **Main Layout:**
    *   Collapsible Sidebar (similar to Brand Owner, likely `Group 58` instance) for navigation.
    *   Main Content Area to display different sections.
    *   Top Bar/Header (within Main Content Area, e.g., `Rectangle 32` in `1:2383`) showing page title.

2.  **Sidebar Navigation:** (Inferred, needs confirmation/refinement)
    *   Registration Status/Form (User Tick Icon - `vuesax/bulk/user-tick` seen in `1:2434`)
    *   Certification (Book Icon - `vuesax/bulk/book` seen in `1:2428`)
    *   Maybe Product/Code Management (Placeholder)
    *   Settings (Setting Icon - `vuesax/bold/setting-2` seen in `1:2435`)
    *   User Profile/Logout section (Bottom section).

3.  **Content Sections (Routed Components):**
    *   **Reseller Registration (`1:2383`):**
        *   Title (`Reseller`)
        *   Instruction Text (`Fill Your Information...`)
        *   Form Fields (using shadcn/ui `Input`, `Textarea`, potentially `FileInput`):
            *   Name (`1:2390`)
            *   Address (`1:2395`)
            *   Phone Number (`1:2401`)
            *   Shop ID at Tokopedia (`1:2391`)
            *   Shop ID at Shopee (`1:2398`)
            *   Receipt for Transactions (`1:2404`) - Needs clarification on type/purpose.
            *   National ID (`1:2415`) - Needs file upload component (Icon `vuesax/bulk/attach-circle` `1:2407`).
        *   "Send" Button (shadcn/ui `Button` - `1:2417`)
    *   **Reseller Certification (`1:2440`):**
        *   Title (`Reseller Certification`)
        *   Instruction Text (`Download Your Certification` - `1:2444`)
        *   Certificate Display Area (`Mask group` `1:2465`):
            *   Certificate Graphic (Complex group of vectors/images)
            *   Reseller Name Display (`1:2711`)
            *   Brand Owner Name Display (`1:2712`)
            *   Timestamp Display (`1:2713`)
            *   QR Code (`qrcode 4` - `1:2715`)
        *   "Download" Button (shadcn/ui `Button` - `1:2716`)

## Implementation Steps

1.  **Setup:**
    *   Define nested routes for the reseller dashboard (e.g., `/reseller`, `/reseller/register`, `/reseller/certification`). Use React Router.
    *   Ensure routes are protected by Authentication/Authorization (`frontend.md` - Authentication System ✅).

2.  **Layout Component:**
    *   Create a `ResellerLayout.tsx` component:
        *   A `Sidebar` component similar to the Brand Owner's, populated with Reseller-specific navigation links (using icons from Figma). Use shadcn/ui `Sheet` or custom Tailwind.
        *   A main content area rendering child routes (`<Outlet />`).
        *   Style using Tailwind CSS v3.4.10.

3.  **Page Components:**
    *   Create React components:
        *   `ResellerRegistrationPage.tsx`
        *   `ResellerCertificationPage.tsx`
    *   **Registration Page:**
        *   Implement the form using shadcn/ui `Form`, `Input`, `Textarea`, and a suitable file upload component (maybe a custom one or find a shadcn/ui compatible library).
        *   Use `react-hook-form` + `zod` for validation (`frontend.md` - State Management).
        *   Handle form submission: collect data, call the reseller registration API endpoint.
    *   **Certification Page:**
        *   Fetch reseller certification status and data using the API client (`frontend.md` - API Integration ✅) via React Query (`frontend.md` - State Management).
        *   Conditionally render the certification details if available, otherwise show a "pending" or "not certified" state.
        *   Implement the "Download" button functionality (e.g., trigger API endpoint to get PDF/image, or generate client-side if feasible).
        *   Replicate the certificate visual using styled divs/components or potentially rendering an SVG/image fetched from the backend.

4.  **Styling & Responsiveness:**
    *   Apply styles using Tailwind CSS v3.4.10 to match Figma.
    *   Ensure responsiveness, especially for the form and certificate display.

5.  **API Integration:**
    *   Integrate API calls for:
        *   Submitting reseller registration data (including file uploads).
        *   Fetching reseller registration status and certification data.
        *   Downloading the certificate.
    *   Manage loading/error states.

6.  **Refinement & Testing:**
    *   Test navigation.
    *   Test registration form submission, validation, and file upload.
    *   Test fetching and displaying certification status/data.
    *   Test the download functionality.
    *   Verify visual accuracy and responsiveness.

## Sync with `frontend.md`

*   Addresses the "Reseller Interface" task.
*   Breaks it down into sub-tasks:
    *   Implement Reseller Dashboard Layout (Sidebar, Content Area)
    *   Implement Reseller Registration Page (Form, API)
    *   Implement Reseller Certification Page (Data Fetching, Display, Download)
*   Relies on **UI Component library**, **Tailwind CSS**, **API Integration**, **State Management**, and **Testing Strategy**.

## Assets Needed

*   Sidebar Icons (Book, User Tick, Setting - `vuesax/bulk/book`, `vuesax/bulk/user-tick`, `vuesax/bold/setting-2`).
*   National ID Upload Icon (`vuesax/bulk/attach-circle`).
*   Certificate Background Graphic/Elements (complex group `1:2465` - may need export or recreation).
*   QR Code placeholder/component.
*   Logo (`IMG_9175 2`) if used in sidebar.

*(Plan assumes React, Tailwind CSS v3.4.10, shadcn/ui, React Router, React Query, and API client setup are complete or in progress as per `frontend.md`)*

# Customer Verification & Reward Flow Implementation Plan

This plan covers the implementation of the customer-facing QR code scanning, verification result display, and reward redemption flow using **React**, **Tailwind CSS v3.4.10**, and **shadcn/ui**, based on the mobile-first (iPhone 13 layout) Figma designs:
*   Scan Page: [Link](https://www.figma.com/design/aTcGv0lx3UQzqE0BsOtdQX/DevCopy---TrueOrigin---ChainFusion-HackerHouse-ICP-2024?node-id=1-2927)
*   Scan Success (1st Time): [Link](https://www.figma.com/design/aTcGv0lx3UQzqE0BsOtdQX/DevCopy---TrueOrigin---ChainFusion-HackerHouse-ICP-2024?node-id=1-3319)
*   Scan Failed (Already Scanned): [Link](https://www.figma.com/design/aTcGv0lx3UQzqE0BsOtdQX/DevCopy---TrueOrigin---ChainFusion-HackerHouse-ICP-2024?node-id=1-3577)
*   Scan Wallet for Redemption: [Link](https://www.figma.com/design/aTcGv0lx3UQzqE0BsOtdQX/DevCopy---TrueOrigin---ChainFusion-HackerHouse-ICP-2024?node-id=1-2968)
*   Redeem Success: [Link](https://www.figma.com/design/aTcGv0lx3UQzqE0BsOtdQX/DevCopy---TrueOrigin---ChainFusion-HackerHouse-ICP-2024?node-id=1-2989)

## Goal

Implement an intuitive mobile-first interface for customers to scan product QR codes, view verification results (genuine, already scanned, invalid), and redeem potential rewards by providing their wallet address.

## Overall Structure & Flow (Based on Figma Analysis)

1.  **Scan Page (`1:2927`):**
    *   Displays camera feed with a scanning frame/overlay.
    *   Instructions (`Scan Here`, `Place the code inside the frame`).
    *   Company Logo (`1:2931`).
    *   Potential hint/info text (`1:2941`).
    *   "Have a problem?" button/link (`1:2937`).
2.  **Verification Result (Modal or Page Transition):**
    *   **Success (1st Scan - `1:3319`):**
        *   Success Icon/Animation (`Group 81` - `1:3324`).
        *   Title (`Scan Success!`).
        *   Message (`1st Time Scan!`, `Your Product is Genuine!`).
        *   "Click to Redeem Coin" Button (`1:3568`).
    *   **Failed (Already Scanned - `1:3577`):**
        *   Failure Icon/Animation (`Group 64` - `1:3786`).
        *   Title (`Scan Success!` - *Note: Title seems incorrect, should likely be "Scan Failed" or similar*).
        *   Message (`Product is already scanned more than 1 time!`, `Please beware!`).
        *   "Sorry, You are not eligible" Button/Display (`1:3781`).
    *   **(Implicit) Scan Failed (Invalid Code):** Needs a design state, but likely similar structure to Already Scanned, with different text/icon.
3.  **Redeem Flow (Modal or Page Transition from Success):**
    *   **Scan Wallet (`1:2968`):**
        *   Displays camera feed for scanning wallet QR code OR an input field.
        *   Instructions (`Scan Your QR Code Wallet Address`, `Or Paste Your Wallet...`).
        *   "Pro Tips" section (`1:2986`, `1:2987`).
        *   Scanning frame/overlay (`1:2981`, `1:2983`).
    *   **Redeem Success (`1:2989`):**
        *   Success Icon/Animation (`Mask group` `1:2992`).
        *   Title (`Scan Success!` - *Note: Title seems incorrect, should be "Redeem Success" or similar*).
        *   Message (`Coin Sent! Please Check Your Wallet`, `Happy Shopping!`).
        *   "Back to Home" Button (`1:3309`).

## Implementation Steps

1.  **Setup:**
    *   Identify or create routes for the main scan page (e.g., `/verify` or `/`) and potentially separate routes/states for result/redeem steps if not using modals.
    *   Ensure React, Tailwind CSS v3.4.10, and shadcn/ui are configured.

2.  **QR Scanning Component:**
    *   Integrate a React QR code scanning library (e.g., `react-qr-reader` or similar) to access the camera and detect QR codes.
    *   Style the scanner view with the overlay and frame using Tailwind CSS based on Figma (`1:2927`, `1:2968`).

3.  **Page/Component Breakdown:**
    *   `ScanPage.tsx`: Hosts the QR scanner, instructions, logo, and hint text. Handles the QR code detection callback.
    *   `VerificationResultModal.tsx` (or separate pages): Displays success/failure states dynamically based on API response. Uses shadcn/ui `Dialog` or `Alert` components as a base. Requires props for status (success, already_scanned, invalid), messages, and icons.
    *   `RedeemWalletModal.tsx` (or page): Includes the wallet QR scanner component and/or a shadcn/ui `Input` field for pasting address. Includes instructions.
    *   `RedeemSuccessModal.tsx` (or page): Displays the final success message and "Back to Home" button.

4.  **State Management:**
    *   Use component state (`useState`) or potentially a global state manager (like Zustand or Context API, if managing complex flow state) to track the current step (scanning product, showing result, scanning wallet, showing redeem success).
    *   Store API response data (verification status, product info, reward eligibility, wallet address) temporarily in state.

5.  **API Integration:**
    *   On product QR code scan (in `ScanPage.tsx`): Call the `verify_product_v2` backend API endpoint (`frontend.md` - API Integration ✅).
    *   Based on the API response, transition to the appropriate `VerificationResultModal` state.
    *   If successful and eligible for reward, the "Redeem" button onClick should trigger the `RedeemWalletModal`.
    *   On wallet QR scan or address input (in `RedeemWalletModal.tsx`): Call a backend API endpoint to submit the wallet address for reward distribution.
    *   On successful reward submission, transition to the `RedeemSuccessModal`.
    *   Handle loading states during API calls and error states (network errors, invalid wallet address, etc.) using feedback components (`frontend.md` - Error Handling).

6.  **Styling & Mobile First:**
    *   Apply styles using Tailwind CSS v3.4.10, strictly following the mobile layout from Figma (iPhone 13 dimensions). Use responsive modifiers minimally unless specific tablet/desktop designs are provided later.
    *   Utilize shadcn/ui components (`Button`, `Dialog`, `Alert`, `Input`) styled to match.
    *   Ensure icons/illustrations (`loading 1`, success/failure graphics, coin icon) are implemented or exported (`frontend.md` - UI Components).

7.  **Refinement & Testing:**
    *   Test the entire flow on mobile browsers/emulators.
    *   Test scanning different QR codes (valid first scan, valid subsequent scan, invalid).
    *   Test wallet address input/scan and redemption.
    *   Test error handling and loading states.
    *   Verify visual accuracy against Figma.

## Sync with `frontend.md`

*   Directly implements **Public Verification Interface** (✅).
*   Partially implements **User Dashboard** (history might be updated implicitly).
*   Implements **Reward System UI** (✅) for the customer-facing part.
*   Uses **API Integration** (✅) for verification and reward calls.
*   Leverages **State Management** (⏳) for flow control.
*   Requires **UI Components** (⏳) like modals, buttons, scanner.
*   Needs **Error Handling** (⏳) for API calls and invalid states.
*   Critical for **Mobile Optimization** (⏳).

## Assets Needed

*   Logo (`IMG_9175 2` - `1:2931`, `1:3320`, `1:3578`, etc.)
*   Background graphics (`image 11`, `image 12` - various IDs)
*   Scan Success Graphic (`Group 81` - `1:3324`)
*   Scan Failed Graphic (`Group 64` - `1:3786`)
*   Redeem Success Graphic (`Mask group` - `1:2992`)
*   "Have a problem?" Icon (`loading 1` - `1:2940`)
*   Coin Icon (`dollar (1) 1` - `1:3305`)

*(Plan assumes React, Tailwind CSS v3.4.10, shadcn/ui, React Router, API client, and basic state management setup are complete or in progress as per `frontend.md`)*
