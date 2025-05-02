/**
 * @file Main application component
 * @fileoverview Root component that sets up routing for the application
 * with authentication and role-based access control
 * 
 * Functions:
 * - App: Main application component with routing configuration
 * 
 * Constants:
 * - None
 * 
 * Flow:
 * 1. Set up routing with react-router
 * 2. Protect routes that require authentication
 * 3. Apply role-based access control to protected routes
 * 
 * Error Handling:
 * - Unauthorized access is handled by ProtectedRoute component
 * 
 * @module App
 * @requires react-router-dom - For routing
 * @requires components/ProtectedRoute - For authentication protection
 * @exports {FC} App - Main application component
 */

import './App.css';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ProtectedRoute, ROLES } from './components/ProtectedRoute';
import { AuthContextProvider } from './contexts/useAuthContext';
import { Toaster } from "@/components/ui/toaster";
import BrandOwnerLayout from './layouts/BrandOwnerLayout';
import { QueryProvider } from './providers/QueryProvider';

// Lazy load components to improve initial load performance
const Homepage = lazy(() => import('@/pages/home'));
const LoginPage = lazy(() => import('@/pages/auth/login'));
const UnauthorizedPage = lazy(() => import('@/pages/unauthorized'));
const VerifyPage = lazy(() => import('@/pages/verify'));
const ProductsPage = lazy(() => import('@/pages/brand-owners/products'));

// Lazy load placeholders for future development
const AddProductPage = lazy(() => 
  import('@/pages/placeholder').then(module => ({ 
    default: () => module.default({ title: 'Add Product' }) 
  }))
);
const ResellerManagementPage = lazy(() => 
  import('@/pages/placeholder').then(module => ({ 
    default: () => module.default({ title: 'Reseller Dashboard' }) 
  }))
);
const AnalyticsPage = lazy(() => 
  import('@/pages/placeholder').then(module => ({ 
    default: () => module.default({ title: 'Analytics Dashboard' }) 
  }))
);
const UserManagementPage = lazy(() => 
  import('@/pages/placeholder').then(module => ({ 
    default: () => module.default({ title: 'User Dashboard' }) 
  }))
);

// Layout wrapper component for brand owner routes
const BrandOwnerLayoutWrapper = () => (
  <BrandOwnerLayout>
    <Outlet />
  </BrandOwnerLayout>
);

// Loading fallback for lazy-loaded components
const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
  </div>
);

/**
 * Main application component with routing configuration
 * 
 * Sets up the application routes with authentication protection
 * and role-based access control
 * 
 * @returns {JSX.Element} The application component
 * @example
 * <App />
 */
function App() {
  return (
    <QueryProvider>
      <AuthContextProvider>
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Homepage />} />
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/verify" element={<VerifyPage />} />
              
              {/* Admin routes - require Admin role */}
              <Route path="/admin/*" element={
                <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
                  <div>Admin Dashboard</div>
                </ProtectedRoute>
              } />
              
              {/* Brand Owner routes - require BrandOwner role */}
              <Route path="/brand-owners/*" element={
                <ProtectedRoute requiredRoles={[ROLES.BRAND_OWNER]}>
                  <Routes>
                    <Route element={<BrandOwnerLayoutWrapper />}>
                      <Route path="products" element={<ProductsPage />} />
                      <Route path="add-product" element={<AddProductPage />} />
                      <Route path="resellers" element={<ResellerManagementPage />} />
                      <Route path="users" element={<UserManagementPage />} />
                      <Route path="analytics" element={<AnalyticsPage />} />
                      <Route path="*" element={<ProductsPage />} />
                    </Route>
                  </Routes>
                </ProtectedRoute>
              } />
              
              {/* Reseller routes - require Reseller role */}
              <Route path="/reseller/*" element={
                <ProtectedRoute requiredRoles={[ROLES.RESELLER]}>
                  <div>Reseller Dashboard</div>
                </ProtectedRoute>
              } />
              
            </Routes>
          </Suspense>
          <Toaster />
        </Router>
      </AuthContextProvider>
    </QueryProvider>
  );
}

export default App;
