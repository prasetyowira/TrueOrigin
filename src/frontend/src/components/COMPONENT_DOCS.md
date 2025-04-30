# Component Documentation

This document provides an overview and usage examples for the reusable React components in this project.

## Core Components (`src/frontend/src/components/`)

---

### `ConfirmationModal`

A specialized modal dialog that wraps the base `Modal` component to specifically handle confirmation actions (e.g., delete, approve).

**Props:**

| Prop             | Type                          | Default         | Description                                                               |
| ---------------- | ----------------------------- | --------------- | ------------------------------------------------------------------------- |
| `trigger`        | `React.ReactNode`             | **Required**    | The element that opens the modal (e.g., a Button).                        |
| `title`          | `string`                      | **Required**    | The title displayed in the modal header.                                  |
| `description`    | `string`                      | `undefined`     | Optional descriptive text below the title.                                |
| `children`       | `React.ReactNode`             | **Required**    | The main content of the modal, explaining the action or consequences.     |
| `confirmText`    | `string`                      | `"Confirm"`     | Text for the confirmation button.                                         |
| `cancelText`     | `string`                      | `"Cancel"`      | Text for the cancellation button.                                         |
| `onConfirm`      | `() => void`                  | **Required**    | Function called when the confirm button is clicked.                       |
| `onCancel`       | `() => void`                  | `undefined`     | Optional function called when the cancel button is clicked.               |
| `confirmVariant` | `ButtonProps['variant']`      | `"destructive"` | Button variant for the confirm button.                                    |
| `cancelVariant`  | `ButtonProps['variant']`      | `"secondary"`   | Button variant for the cancel button.                                     |
| `open`           | `boolean`                     | `undefined`     | Controls the open state of the modal externally.                          |
| `onOpenChange`   | `(open: boolean) => void`     | `undefined`     | Handler for changes in the open state (when controlled).                  |
| `size`           | `ModalProps['size']`          | `undefined`     | Size of the modal (inherits from base `Modal`).                           |
| `className`      | `string`                      | `undefined`     | Additional CSS classes for the modal content container.                   |

**Usage Example:**

```tsx
import ConfirmationModal from '@/components/ConfirmationModal';
import { Button } from "@/components/ui/button";

function DeleteItemButton() {
  const handleDelete = () => {
    console.log("Item deleted!");
    // ... API call to delete item
  };

  return (
    <ConfirmationModal
      trigger={<Button variant="destructive">Delete Item</Button>}
      title="Are you sure?"
      description="This action cannot be undone."
      onConfirm={handleDelete}
      confirmText="Yes, Delete"
      confirmVariant="destructive"
    >
      <p>Deleting this item will permanently remove it from the system.</p>
    </ConfirmationModal>
  );
}
```

---

### `LandingCard`

A card component specifically designed for the landing page, displaying a title, description, and an image. Uses `shadcn/ui/card` internally.

**Props:**

| Prop          | Type     | Default      | Description                                        |
| ------------- | -------- | ------------ | -------------------------------------------------- |
| `title`       | `string` | **Required** | The main title displayed on the card.              |
| `description` | `string` | **Required** | The descriptive text content of the card.          |
| `image`       | `string` | **Required** | URL for the image displayed at the bottom of the card. |

**Usage Example:**

```tsx
import LandingCard from '@/components/LandingCard';

function FeatureSection() {
  return (
    <LandingCard
      title="Secure Verification"
      description="Verify product authenticity instantly with our secure QR code system."
      image="/images/secure-feature.png"
    />
  );
}
```

---

### `ProductTable` (from `Table.tsx`)

Renders a table specifically for displaying `Product` data, leveraging the `shadcn/ui/table` components. Includes logic for optionally displaying and triggering AI sentiment analysis.

**Props:**

| Prop                  | Type                                                              | Default      | Description                                                                                  |
| --------------------- | ----------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------- |
| `products`            | `(Product & { showSentiment?: boolean; sentimentLoading?: boolean })[]` | **Required** | An array of Product objects, optionally augmented with UI state for sentiment display.       |
| `onSentimentAnalysis` | `(product: Product) => void`                                      | `undefined`  | Callback function invoked when the 'Analyze Sentiment' button is clicked for a product.        |
| `className`           | `string`                                                          | `undefined`  | Optional additional CSS classes for the table's container div.                               |
| `caption`             | `string`                                                          | `undefined`  | Optional caption displayed below the table content.                                            |

**Internal Component:** `ProductSentiment` (handles displaying sentiment or the button to trigger analysis).

**Usage Example:**

```tsx
import { ProductTable } from '@/components/Table';
import { useState, useEffect } from 'react';
// Assuming getProducts and analyzeSentiment API functions exist
// and Product type is imported

function ProductManagementPage() {
  const [products, setProducts] = useState<any[]>([]); // Use augmented type in real code

  useEffect(() => {
    // Fetch initial products
    getProducts().then(data => setProducts(data.map(p => ({...p, showSentiment: false, sentimentLoading: false }))));
  }, []);

  const handleSentimentAnalysis = async (productToAnalyze) => {
    // Set loading state
    setProducts(prev => prev.map(p =>
      p.id === productToAnalyze.id ? { ...p, sentimentLoading: true } : p
    ));

    try {
      const sentimentResult = await analyzeSentiment(productToAnalyze.id);
      // Update product with result and hide loading
      setProducts(prev => prev.map(p =>
        p.id === productToAnalyze.id
          ? { ...p, metadata: [...p.metadata, { key: 'sentiment', value: sentimentResult }], showSentiment: true, sentimentLoading: false }
          : p
      ));
    } catch (error) {
      console.error("Sentiment analysis failed:", error);
      // Reset loading state on error
       setProducts(prev => prev.map(p =>
        p.id === productToAnalyze.id ? { ...p, sentimentLoading: false } : p
      ));
    }
  };

  return (
    <ProductTable
      products={products}
      onSentimentAnalysis={handleSentimentAnalysis}
      caption="List of registered products."
      className="mt-4"
    />
  );
}

```

---

### `QRCodeScanner`

Provides QR code scanning functionality using the device camera via the `html5-qrcode` library. Handles camera permissions and displays error states.

**Props:**

| Prop          | Type                      | Default     | Description                                                        |
| ------------- | ------------------------- | ----------- | ------------------------------------------------------------------ |
| `onScan`      | `(result: string) => void`| **Required**| Callback function invoked with the decoded QR code string on success. |
| `onError`     | `(error: string) => void` | `undefined` | Optional callback function for errors (e.g., permission denied).     |
| `width`       | `string`                  | `"100%"`    | Optional width of the scanner container element (CSS value).       |
| `height`      | `string`                  | `"300px"`   | Optional height of the scanner container element (CSS value).      |
| `fps`         | `number`                  | `10`        | Optional frames per second for the scanning process.             |
| `qrbox`       | `number`                  | `250`       | Optional size of the QR code detection box (in pixels).            |
| `disableFlip` | `boolean`                 | `false`     | Optional flag to disable horizontal flipping of the camera feed.   |

**Usage Example:**

```tsx
import QRCodeScanner from '@/components/QRCodeScanner';
import { useState } from 'react';

function ScanPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleScan = (result: string) => {
    console.log("Scanned:", result);
    setScanResult(result);
    setScanError(null);
    // Navigate or process the result
  };

  const handleError = (error: string) => {
    console.error("Scan Error:", error);
    setScanError(error);
    setScanResult(null);
  };

  return (
    <div>
      <h1>Scan Product QR Code</h1>
      <QRCodeScanner onScan={handleScan} onError={handleError} />
      {scanResult && <p>Last Scan: {scanResult}</p>}
      {scanError && <p style={{ color: 'red' }}>Error: {scanError}</p>}
    </div>
  );
}
```

---

### `Filters`

Renders a row of `shadcn/ui/select` dropdowns based on provided filter definitions, along with an 'Apply' button.

**Props:**

| Prop        | Type                                      | Default      | Description                                                                 |
| ----------- | ----------------------------------------- | ------------ | --------------------------------------------------------------------------- |
| `filters`   | `Filter[]` (`{ label: string; options: FilterOption[] }[]`) | **Required** | An array defining the filter dropdowns and their options.                   |
| `onApply`   | `(selectedValues: string[]) => void`      | **Required** | Callback invoked with an array of selected values when 'Apply' is clicked.  |
| `className` | `string`                                  | `undefined`  | Optional additional CSS classes for the container div.                      |

**Types:**

*   `FilterOption`: `{ label: string; value: string; }`
*   `Filter`: `{ label: string; options: FilterOption[]; }`

**Usage Example:**

```tsx
import Filters from '@/components/Filters';

function ProductList() {
  const filterDefinitions = [
    {
      label: "Category",
      options: [
        { label: "Electronics", value: "electronics" },
        { label: "Clothing", value: "clothing" },
        { label: "Books", value: "books" },
      ],
    },
    {
      label: "Status",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Pending", value: "pending" },
      ],
    },
  ];

  const handleApplyFilters = (selectedValues: string[]) => {
    console.log("Applying filters:", selectedValues);
    // Fetch data based on selectedValues[0] (Category) and selectedValues[1] (Status)
  };

  return (
    <div>
      <Filters filters={filterDefinitions} onApply={handleApplyFilters} />
      {/* ... rest of the product list */}
    </div>
  );
}
```

---

### `Sidebar`

Renders the main application sidebar navigation, including a logo, menu items with icons, and user profile information.

**Props:**

| Prop         | Type                                                          | Default      | Description                                                            |
| ------------ | ------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------- |
| `menuItems`  | `MenuItem[]` (`{ label: string; icon: ComponentType; active: boolean; onClickEvent: (label: string) => void; }[]`) | **Required** | An array defining the navigation links, their state, and actions.    |
| `userAvatar` | `string`                                                      | **Required** | URL for the user's avatar image.                                       |
| `username`   | `string`                                                      | **Required** | The display name of the logged-in user.                                |

**Types:**

*   `MenuItem`: `{ label: string; icon: React.ComponentType<{ fillColor: string }>; active: boolean; onClickEvent: (label: string) => void; }`

**Usage Example:**

```tsx
import Sidebar from '@/components/Sidebar';
import { HomeIcon, SettingsIcon } from 'lucide-react'; // Example icons
import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Assuming react-router

function AppLayout() {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('Dashboard'); // Example state

  const menuItems = [
    {
      label: 'Dashboard',
      icon: HomeIcon, // Pass the component reference
      active: activeItem === 'Dashboard',
      onClickEvent: (label: string) => {
        setActiveItem(label);
        navigate('/dashboard');
      },
    },
    {
      label: 'Settings',
      icon: SettingsIcon,
      active: activeItem === 'Settings',
      onClickEvent: (label: string) => {
        setActiveItem(label);
        navigate('/settings');
      },
    },
    // ... other menu items
  ];

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar
        menuItems={menuItems}
        userAvatar="/path/to/avatar.jpg"
        username="Wira Prasetyo"
      />
      <main style={{ flexGrow: 1, padding: '20px' }}>
        {/* Outlet for nested routes */}
      </main>
    </div>
  );
}
```

---

### `FormField`

A convenience component wrapping `shadcn/ui/label` and `shadcn/ui/input` to create a labeled form field with integrated error display.

**Props:**

| Prop                 | Type                                         | Default      | Description                                                                          |
| -------------------- | -------------------------------------------- | ------------ | ------------------------------------------------------------------------------------ |
| `id`                 | `string`                                     | **Required** | Unique ID for the input and the `htmlFor` attribute of the label.                  |
| `label`              | `string`                                     | **Required** | The text content for the form field's label.                                         |
| `error`              | `string \| null \| boolean`                   | `undefined`  | Error message string to display, or `true` to indicate an error state visually.    |
| `containerClassName` | `string`                                     | `undefined`  | Optional CSS classes for the div wrapping the label and input.                     |
| `className`          | `string`                                     | `undefined`  | Optional CSS classes specifically for the `Input` component.                       |
| `...props`           | `React.InputHTMLAttributes<HTMLInputElement>` |              | All other standard HTML input attributes (e.g., `type`, `placeholder`, `value`, `onChange`). |

**Usage Example:**

```tsx
import { FormField } from '@/components/FormField';
import { useForm } from 'react-hook-form'; // Example with react-hook-form

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>();

  const onSubmit = (data: { email: string }) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormField
        id="email"
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message} // Pass error message from react-hook-form
        {...register("email", { required: "Email is required" })} // Register with validation
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

### `Modal`

A reusable modal dialog component built on top of `shadcn/ui/dialog`. Provides a consistent structure with trigger, header, content, and optional footer.

**Props:**

| Prop            | Type                          | Default     | Description                                                                 |
| --------------- | ----------------------------- | ----------- | --------------------------------------------------------------------------- |
| `trigger`       | `React.ReactNode`             | **Required**| The element that opens the modal (e.g., a Button).                          |
| `title`         | `string`                      | **Required**| The title displayed in the modal header.                                    |
| `description`   | `string`                      | `undefined` | Optional descriptive text below the title.                                  |
| `children`      | `React.ReactNode`             | **Required**| The main content of the modal.                                              |
| `footerContent` | `React.ReactNode`             | `undefined` | Optional custom content for the modal footer (e.g., action buttons).        |
| `open`          | `boolean`                     | `undefined` | Controls the open state of the modal externally.                            |
| `onOpenChange`  | `(open: boolean) => void`     | `undefined` | Handler for changes in the open state (when controlled).                    |
| `size`          | `"sm" \| "md" \| "lg" \| "xl" \| "full"` | `"md"`      | Defines the maximum width/height of the modal.                        |
| `className`     | `string`                      | `undefined` | Additional CSS classes applied to the `DialogContent` element.              |

**Usage Example:**

```tsx
import Modal from '@/components/Modal';
import { Button } from "@/components/ui/button";
import { FormField } from '@/components/FormField';

function EditProfileModal() {
  const footer = (
     <>
       <Button type="button" variant="secondary">Cancel</Button> {/* Add DialogClose if needed */}
       <Button type="submit">Save Changes</Button> {/* Assuming form context handles submission */}
     </>
  );

  return (
    <Modal
      trigger={<Button>Edit Profile</Button>}
      title="Edit Your Profile"
      description="Make changes to your profile information below."
      footerContent={footer}
      size="lg"
    >
      {/* Form Content */}
      <form>
         <FormField id="name" label="Name" defaultValue="Wira Prasetyo" />
         <FormField id="email" label="Email" type="email" defaultValue="wira@example.com" />
         {/* ... more fields */}
      </form>
    </Modal>
  );
}
```

---

### `ProtectedRoute`

A component wrapper that enforces authentication and optional role-based access control for its children routes/components. Redirects unauthorized users.

**Props:**

| Prop            | Type         | Default      | Description                                                                |
| --------------- | ------------ | ------------ | -------------------------------------------------------------------------- |
| `children`      | `ReactNode`  | **Required** | The component(s) or route(s) to render if authorization checks pass.       |
| `requiredRoles` | `UserRole[]` | `undefined`  | Optional array of roles required to access the route (using `ROLES` enum). |

**Exports:**

*   `ProtectedRoute`: The main component.
*   `ROLES`: An object containing available `UserRole` definitions (e.g., `ROLES.ADMIN`, `ROLES.BRAND_OWNER`).

**Context:** Relies on `useAuthContext` to get `isAuthenticated`, `isLoading`, `hasRole`, and `profile` status.

**Usage Example (with `react-router-dom`):**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute, ROLES } from '@/components/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import AdminPanelPage from '@/pages/AdminPanelPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import ChooseRolePage from '@/pages/ChooseRolePage'; // Assuming this page exists
import { AuthProvider } from '@/contexts/AuthContext'; // Assuming context provider setup

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/choose-role" element={<ChooseRolePage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Panel (Requires ADMIN role) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
                <AdminPanelPage />
              </ProtectedRoute>
            }
          />

          {/* Other public routes */}
          <Route path="/" element={<div>Public Home</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

---

### `SidebarLogo` Components

This file exports several SVG logo components intended for use within the `Sidebar` or other navigation elements. They accept a `fillColor` prop.

**Exported Logos:**

*   `BrandOwnerLogo`
*   `AddProductLogo`
*   `ResellerLogo`
*   `UserLogo`
*   `HeatmapLogo`

**Props:**

| Prop        | Type     | Default      | Description                   |
| ----------- | -------- | ------------ | ----------------------------- |
| `fillColor` | `string` | **Required** | The fill color for the SVG. |

**Usage Example (within `Sidebar` `menuItems`):**

```tsx
import { BrandOwnerLogo, AddProductLogo } from '@/components/SidebarLogo';

// Inside the component defining menuItems for Sidebar
const menuItems = [
  {
    label: 'Products',
    icon: BrandOwnerLogo, // Pass the component reference
    active: activeItem === 'Products',
    onClickEvent: (label: string) => { /* ... */ },
  },
  {
    label: 'Add Product',
    icon: AddProductLogo,
    active: activeItem === 'Add Product',
    onClickEvent: (label: string) => { /* ... */ },
  },
  // ...
];
```

---

## UI Primitives (`src/frontend/src/components/ui/`)

These components are typically based directly on `shadcn/ui` primitives, providing the building blocks for more complex components. They are generally used as imported via the `@/components/ui` alias.

---

### `Alert`, `AlertTitle`, `AlertDescription`

Displays callout messages for important information. Based on `shadcn/ui/alert`.

**Variants:** `default`, `destructive`

**Usage Example:**

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

function ErrorDisplay({ message }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" /> {/* Icon is typically placed first */}
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
```

---

### `Avatar`, `AvatarImage`, `AvatarFallback`

Displays user avatars with image and fallback content. Based on `shadcn/ui/avatar`.

**Usage Example:**

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function UserProfile({ src, name }) {
  const fallback = name ? name.split(' ').map(n => n[0]).join('') : 'U';
  return (
    <Avatar>
      <AvatarImage src={src} alt={name} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}
```

---

### `Button`

Renders a button element with various styles and sizes. Based on `shadcn/ui/button`.

**Props:** See JSDoc comments within `src/frontend/src/components/ui/button.tsx` (added previously). Includes standard button attributes, `variant`, `size`, and `asChild`.

**Variants:** `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `tertiary`, `nav`
**Sizes:** `default`, `sm`, `lg`, `icon`

**Usage Example:**

```tsx
import { Button } from "@/components/ui/button";
import { TrashIcon } from "lucide-react";

function ActionButtons() {
  return (
    <div className="flex gap-2">
      <Button>Primary Action</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive" size="icon">
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

---

### `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardDescription`, `CardContent`

Components for building card layouts. Based on `shadcn/ui/card`.

**Usage Example:**

```tsx
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function InfoCard() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Product Update</CardTitle>
        <CardDescription>New version available.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Version 2.0 includes new features and bug fixes.</p>
      </CardContent>
      <CardFooter>
        <Button>Learn More</Button>
      </CardFooter>
    </Card>
  );
}
```

---

### `Checkbox`

A standard checkbox component. Based on `shadcn/ui/checkbox`.

**Usage Example:**

```tsx
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

function TermsCheckbox() {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  );
}
```

---

### `Dialog`, `DialogTrigger`, `DialogContent`, etc.

Primitives for building modal dialogs. Based on `radix-ui/react-dialog` and styled by `shadcn/ui`. The custom `Modal` and `ConfirmationModal` components build upon these.

**Usage:** Generally preferred to use the higher-level `Modal` or `ConfirmationModal` unless custom dialog behavior is needed.

---

### `Input`

A standard text input field. Based on `shadcn/ui/input`.

**Props:** Standard HTML input attributes (`type`, `placeholder`, `value`, `onChange`, `className`, etc.).

**Usage Example:**

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SearchInput() {
  return (
    <div>
      <Label htmlFor="search">Search</Label>
      <Input id="search" type="search" placeholder="Search products..." />
    </div>
  );
}
```

---

### `Label`

A label component, often used with form inputs. Based on `shadcn/ui/label`.

**Props:** Standard HTML label attributes (`htmlFor`, `className`, etc.).

**Usage Example:** See `Input` and `Checkbox` examples.

---

### `RadioGroup`, `RadioGroupItem`

Components for creating radio button groups where only one option can be selected. Based on `shadcn/ui/radio-group`.

**Usage Example:**

```tsx
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

function NotificationSettings() {
  return (
    <RadioGroup defaultValue="email">
      <Label>Notification Preference</Label>
      <div className="flex items-center space-x-2 mt-2">
        <RadioGroupItem value="email" id="r1" />
        <Label htmlFor="r1">Email</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="sms" id="r2" />
        <Label htmlFor="r2">SMS</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="none" id="r3" />
        <Label htmlFor="r3">None</Label>
      </div>
    </RadioGroup>
  );
}
```

---

### `Select`, `SelectTrigger`, `SelectContent`, etc.

Components for creating dropdown select menus. Based on `shadcn/ui/select`.

**Usage Example:** See `Filters` component usage.

```tsx
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel
} from "@/components/ui/select";

function SortSelect() {
  return (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Criteria</SelectLabel>
          <SelectItem value="name-asc">Name (A-Z)</SelectItem>
          <SelectItem value="name-desc">Name (Z-A)</SelectItem>
          <SelectItem value="date-new">Date (Newest)</SelectItem>
          <SelectItem value="date-old">Date (Oldest)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
```

---

### `Table`, `TableHeader`, `TableBody`, etc.

Primitives for building accessible data tables. Based on `shadcn/ui/table`. The custom `ProductTable` component builds upon these.

**Usage:** Generally preferred to use the higher-level `ProductTable` for displaying product data, or use these primitives directly for other types of tables.

---

### `Toast`, `ToastProvider`, `ToastViewport`, etc. & `Toaster`

Components for displaying non-interruptive "toast" notifications. Requires setting up the `Toaster` component (usually in the root layout) and using the `useToast` hook. Based on `shadcn/ui/toast`.

**Setup:**

1.  Add `<Toaster />` to your main layout component (e.g., `App.tsx` or `RootLayout.tsx`).
2.  Use the `useToast` hook within components where you want to trigger notifications.

**Usage Example (Triggering a Toast):**

```tsx
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast"; // Make sure this hook exists/is configured

function SaveButton() {
  const { toast } = useToast();

  const handleSave = () => {
    // ... perform save operation
    console.log("Saved successfully!");

    toast({
      title: "Changes Saved",
      description: "Your profile has been updated.",
      variant: "default", // or "destructive" for errors
      duration: 3000, // Optional: duration in ms
    });
  };

  return <Button onClick={handleSave}>Save Profile</Button>;
}
```

--- 