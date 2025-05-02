/**
 * @file Authentication hook
 * @fileoverview Custom hook for managing user authentication state
 * 
 * Functions:
 * - useAuth: Main hook for authentication
 * 
 * Constants:
 * - None
 * 
 * Flow:
 * 1. Initialize auth context
 * 2. Provide user login/logout functionality
 * 3. Cache authentication state
 * 4. Load user profile and organization data
 * 
 * Error Handling:
 * - Login errors
 * - Session expiration
 * - Network issues
 * 
 * @module hooks/useAuth
 * @requires react - React library
 * @requires TrustOrigin_backend - Backend canister
 * @exports {Hook} useAuth - Authentication hook
 */

import { useState } from 'react';
import { useAuthContext } from '../contexts/useAuthContext';
import { Principal } from '@dfinity/principal';

// Define frontend-specific user types
export interface Organization {
  id: string;
  name: string;
  role: 'Owner' | 'Member';
}

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  // Add organization property
  organization?: Organization;
  [key: string]: any;
}

/**
 * Authentication hook that provides authentication state and methods
 * This hook acts as a wrapper around the AuthContext for components
 * that need authentication functionality
 * 
 * @returns Authentication state and methods
 */
const useAuth = () => {
  const { 
    isAuthenticated, 
    isLoading: isAuthenticating,
    profile,
    login,
    logout,
    selectedOrgId,
    selectOrganization
  } = useAuthContext();
  
  const [error, setError] = useState<string | null>(null);

  console.log("[DEBUG useAuth] Current state:", { 
    isAuthenticated, 
    isAuthenticating, 
    hasProfile: !!profile,
    selectedOrgId: selectedOrgId?.toString(),
    profileDetails: profile ? {
      id: profile.id.toString(),
      userRole: profile.user_role ? profile.user_role.map(r => Object.keys(r)[0]) : [],
      hasOrgIds: profile.org_ids?.length > 0
    } : null
  });

  // Transform backend profile to frontend user format
  let user: User | null = null;
  
  if (profile) {
    // Create a user object with required properties
    const userObj = {
      id: profile.id.toString(),
      name: profile.first_name && profile.last_name && profile.first_name[0] && profile.last_name[0] ? 
        `${profile.first_name[0]} ${profile.last_name[0]}` : 
        'Unknown User',
      email: profile.email && profile.email[0] ? profile.email[0] : '',
      isAdmin: !!(profile.user_role && 
               profile.user_role.length > 0 && 
               profile.user_role[0] && 
               'Admin' in profile.user_role[0])
    } as User;
    
    // Add organization property for users with organization roles
    if (profile.user_role && 
        profile.user_role.length > 0 && 
        profile.user_role[0] && // Ensure user_role[0] exists
        (('BrandOwner' in profile.user_role[0]) || ('Reseller' in profile.user_role[0])) &&
        selectedOrgId) {
      
      userObj.organization = {
        id: selectedOrgId.toString(),
        name: selectedOrgId.toString(), // This will be updated by useGetOrganization in components
        role: 'Owner'
      };
      console.log("[DEBUG useAuth] Added organization to user:", userObj.organization);
    }
    
    user = userObj;
    console.log("[DEBUG useAuth] Transformed user object:", user);
  }

  // Wrapper for login to handle errors
  const handleLogin = async () => {
    try {
      setError(null);
      console.log("[DEBUG useAuth] Calling login method");
      login();
    } catch (err) {
      console.error('[DEBUG useAuth] Login error:', err);
      setError('Failed to login. Please try again.');
    }
  };

  // Wrapper for logout to handle errors
  const handleLogout = async () => {
    try {
      setError(null);
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout. Please try again.');
    }
  };

  // Wrapper for selectOrganization to handle errors
  const handleSelectOrganization = async (orgId: string) => {
    try {
      setError(null);
      console.log("[DEBUG useAuth] Selecting organization:", orgId);
      const principalOrgId = Principal.fromText(orgId);
      selectOrganization(principalOrgId);
    } catch (err) {
      console.error('[DEBUG useAuth] Organization selection error:', err);
      setError('Failed to select organization. Please try again.');
    }
  };

  return {
    isAuthenticated: !!isAuthenticated,
    isAuthenticating,
    user,
    login: handleLogin,
    logout: handleLogout,
    selectOrganization: handleSelectOrganization,
    error,
    isLoading: isAuthenticating
  };
};

export default useAuth; 