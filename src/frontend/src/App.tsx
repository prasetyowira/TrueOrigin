/**
 * @file Main application component
 * @fileoverview Root component that sets up routing and global context providers.
 * 
 * Functions:
 * - App: Main application component with routing configuration
 * 
 * Constants:
 * - None
 * 
 * Flow:
 * 1. Set up routing with react-router
 * 2. (Auth removed) Define routes for different sections
 * 
 * Error Handling:
 * - (Auth removed)
 * 
 * @module App
 * @requires react-router-dom - For routing
 * @exports {FC} App - Main application component
 */

import './App.css';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { AuthContextProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import BrandOwnerLayout from '@/layouts/BrandOwnerLayout';
import ResellerLayout from '@/layouts/ResellerLayout';
import { QueryProvider } from '@/providers/QueryProvider';
import { DebugToggle } from '@/components/DebugToggle';

// Lazy load components to improve initial load performance
const Homepage = lazy(() => import('@/pages/home'));
const LoginPage = lazy(() => import('@/pages/auth/login'));
const UnauthorizedPage = lazy(() => import('@/pages/unauthorized'));
const VerifyPage = lazy(() => import('@/pages/verify'));
const ProductsPage = lazy(() => import('@/pages/brand-owners/products'));
const AddProductPage = lazy(() => import('@/pages/brand-owners/add-product'));

const ResellerCertificationPage = lazy(() => import('@/pages/reseller/certification'));

// Lazy load placeholders for future development
const ResellerManagementPage = lazy(() => import('@/pages/brand-owners/resellers'));
const AnalyticsPage = lazy(() => 
  import('@/pages/placeholder').then(module => ({ 
    default: () => module.default({ title: 'Brand Owner Analytics' }) 
  }))
);
const UserManagementPage = lazy(() => import('@/pages/brand-owners/users'));

// Brand Owner Pages
const BrandOwnerDashboard = lazy(() => import('@/pages/brand-owners/dashboard'));

// Reseller Pages
const ResellerDashboard = lazy(() => import('@/pages/reseller/dashboard'));

// Admin Pages (Placeholder)
const AdminDashboard = lazy(() => 
  import('@/pages/placeholder').then(module => ({ 
    default: () => module.default({ title: 'Admin Dashboard' }) 
  }))
);

// Import FEUserRole for ProtectedRoute roles prop
import { FEUserRole } from '@/hooks/useQueries/authQueries'; 

// Layout wrapper component applies layout FIRST, then protects the Outlet (content)
const BrandOwnerLayoutWrapper = () => (
  <BrandOwnerLayout>
    <ProtectedRoute roles={[FEUserRole.BrandOwner]}>
      <Outlet />
    </ProtectedRoute>
  </BrandOwnerLayout>
);

const ResellerLayoutWrapper = () => (
  <ResellerLayout>
    <ProtectedRoute roles={[FEUserRole.Reseller]}>
      <Outlet />
    </ProtectedRoute>
  </ResellerLayout>
);

// Basic Admin Layout Wrapper (Placeholder)
const AdminLayoutWrapper = () => (
  <div>
    <nav>Admin Navigation</nav>
    <ProtectedRoute roles={[FEUserRole.Admin]}>
      <Outlet />
    </ProtectedRoute>
  </div>
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
 * Sets up the application routes.
 * Wraps the application with necessary providers (Auth, Query, etc.)
 * 
 * @returns {JSX.Element} The application component
 * @example
 * <App />
 */
function App() {
  return (
    <QueryProvider>
      <Router>
        <AuthContextProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes - All routes are public for now */}
              <Route path="/" element={<Homepage />} />
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/verify" element={<VerifyPage />} />
              
              {/* Brand Owner routes - Protection applied inside wrapper */}
              <Route path="/brand-owners" element={<BrandOwnerLayoutWrapper />}>
                <Route index element={<BrandOwnerDashboard />} />
                <Route path="dashboard" element={<BrandOwnerDashboard />} />
                <Route path="products" element={<ProductsPage />} /> 
                <Route path="add-product" element={<AddProductPage />} /> 
                <Route path="resellers" element={<ResellerManagementPage />} /> 
                <Route path="users" element={<UserManagementPage />} /> 
                <Route path="analytics" element={<AnalyticsPage />} /> 
              </Route>
              
              {/* Reseller routes - Protection applied inside wrapper */}
              <Route path="/reseller" element={<ResellerLayoutWrapper />}>
                <Route index element={<ResellerDashboard />} />
                <Route path="dashboard" element={<ResellerDashboard />} />
                <Route path="certification" element={<ResellerCertificationPage />} /> 
              </Route>
              
              {/* Admin routes - Placeholder */}
              <Route path="/admin" element={<AdminLayoutWrapper />}>
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
              </Route>
              
            </Routes>
          </Suspense>
          <Toaster />
          {/* Conditionally render DebugToggle based on DFX_NETWORK */}
          {process.env.DFX_NETWORK !== 'ic' && <DebugToggle />}
        </AuthContextProvider>
      </Router>
    </QueryProvider>
  );
}

export default App;
