/**
 * @file Protected route component for authentication-based access control
 * @fileoverview This component handles protecting routes based on authentication
 * status and user roles, redirecting users as needed.
 * 
 * Functions:
 * - ProtectedRoute: Main component to protect routes
 * 
 * Flow:
 * 1. Check auth context loading state.
 * 2. If loading, show spinner.
 * 3. If not authenticated, redirect to login.
 * 4. If authenticated and `roles` prop is provided, check if user has one of the required roles.
 * 5. If user does not have a required role, redirect to unauthorized page.
 * 6. If authenticated and authorized (or no specific roles required), render children.
 * 
 * @module components/ProtectedRoute
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Updated to use new useAuth hook
import { FEUserRole } from '@/hooks/useQueries/authQueries'; // Import FEUserRole from where it's defined (e.g., authQueries.ts)
import { logger } from '@/utils/logger';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: FEUserRole[]; // Use FEUserRole
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, isLoading, role: currentUserRole } = useAuth(); // role is now FEUserRole | null
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    logger.debug('[ProtectedRoute] Not authenticated, redirecting to login from:', location.pathname);
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0) {
    if (!currentUserRole) {
      logger.warn('[ProtectedRoute] User is authenticated but has no role. Required roles:', roles, 'Path:', location.pathname);
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
    // currentUserRole is FEUserRole, roles is FEUserRole[]
    const hasRequiredRole = roles.includes(currentUserRole);

    if (!hasRequiredRole) {
      logger.warn(
        `[ProtectedRoute] User role '${currentUserRole}' not authorized for path: ${location.pathname}. Required: ${roles.join(', ')}.`
      );
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
    logger.debug(`[ProtectedRoute] User role '${currentUserRole}' authorized for path: ${location.pathname}`);
  } else {
    // If no specific roles are required by the route, just being authenticated is enough.
    logger.debug('[ProtectedRoute] Authenticated user accessing route with no specific role requirements:', location.pathname);
  }

  return <>{children}</>;
};

export default ProtectedRoute; 