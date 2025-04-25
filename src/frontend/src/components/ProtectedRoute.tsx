/**
 * @file Protected route component for authentication-based access control
 * @fileoverview This component handles protecting routes based on authentication
 * status and user roles, redirecting unauthorized users to the login page.
 * 
 * Functions:
 * - ProtectedRoute: Main component to protect routes based on authentication
 * 
 * Constants:
 * - ROLES: UserRole - Available user roles in the system
 * 
 * Flow:
 * 1. Check if user is authenticated
 * 2. If not authenticated, redirect to login
 * 3. If authenticated but roles are required, check user role
 * 4. If role check passes, render the protected children
 * 5. If role check fails, redirect to unauthorized page
 * 
 * Error Handling:
 * - Unauthenticated: Redirect to login page
 * - Unauthorized roles: Redirect to unauthorized page
 * 
 * @module components/ProtectedRoute
 * @requires react-router-dom - For navigation and routing
 * @requires contexts/useAuthContext - For authentication state
 * @exports {FC} ProtectedRoute - Protected route component
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/useAuthContext';
import type { UserRole } from '../../../declarations/TrustOrigin_backend/TrustOrigin_backend.did';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
}

// Available roles in the system
const ROLES = {
  ADMIN: { Admin: null } as UserRole,
  BRAND_OWNER: { BrandOwner: null } as UserRole,
  RESELLER: { Reseller: null } as UserRole,
};

/**
 * Loading indicator component
 */
const LoadingIndicator = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
  </div>
);

/**
 * Protected route component that enforces authentication
 * 
 * Checks if user is authenticated and has required roles before
 * rendering the protected content, otherwise redirects to login.
 * 
 * @param {ReactNode} children - The components to render if authorized
 * @param {UserRole[]} requiredRoles - Optional array of roles required to access the route
 * @returns {JSX.Element} The protected component or redirect
 * @example
 * // Basic usage - require authentication only
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * // With role requirements
 * <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
 *   <AdminPanel />
 * </ProtectedRoute>
 */
const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, hasRole, profile } = useAuthContext();
  const location = useLocation();

  // If still loading, show a loading indicator
  if (isLoading) {
    return <LoadingIndicator />;
  }

  // If authentication is explicitly false (not undefined), redirect to login
  if (isAuthenticated === false) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If no profile is set up yet but authenticated, redirect to role selection
  if (isAuthenticated && profile && !profile.user_role?.length) {
    return <Navigate to="/auth/choose-role" replace />;
  }

  // If roles are required, check if user has at least one of them
  if (requiredRoles && requiredRoles.length > 0 && profile) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    
    if (!hasRequiredRole) {
      // User is authenticated but doesn't have the required role
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // User is authenticated and has required roles (if any)
  return <>{children}</>;
};

export { ProtectedRoute, ROLES }; 