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
  // Add index signature for organization property
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
    logout
  } = useAuthContext();
  
  const [error, setError] = useState<string | null>(null);

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
    
    // Only add organization if it exists in the profile
    if (profile.organization) {
      (userObj as any).organization = {
        id: profile.organization.id.toString(),
        name: profile.organization.name || '',
        role: profile.user_role && 
              profile.user_role.length > 0 && 
              profile.user_role[0] && 
              'BrandOwner' in profile.user_role[0] ? 'Owner' : 'Member'
      };
    }
    
    user = userObj;
  }

  // Wrapper for login to handle errors
  const handleLogin = async () => {
    try {
      setError(null);
      login();
    } catch (err) {
      console.error('Login error:', err);
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

  return {
    isAuthenticated: !!isAuthenticated,
    isAuthenticating,
    user,
    login: handleLogin,
    logout: handleLogout,
    error
  };
};

export default useAuth; 