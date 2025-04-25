import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';

import {
  AuthContextInterface,
  AuthContextProviderProps,
} from './interface';
import { TrustOrigin_backend } from '../../../../declarations/TrustOrigin_backend';
import type { OrganizationInput, ResellerInput, User, UserDetailsInput, UserRole } from '../../../../declarations/TrustOrigin_backend/TrustOrigin_backend.did';
import { handleUserResult } from '../../utils';
import { Principal } from '@dfinity/principal';

const AuthContext = createContext({} as AuthContextInterface);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => useContext(AuthContext);

// 7 days in nanoseconds
const MAX_TTL = BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000);

export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({children}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authClient, setAuthClient] = useState<AuthClient>();
  const [profile, setProfile] = useState<User | null>(null);
  const IDENTITY_PROVIDER = useMemo(() => 
    process.env.DFX_NETWORK === 'local'
    ? `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`
    : `https://identity.ic0.app`
  , []);

  // Check if user has a specific role
  const hasRole = useCallback((role: UserRole) => {
    if (!profile || !profile.user_role.length) return false;
    const userRole = profile.user_role[0];
    
    // Check if the roles match
    if ('Admin' in role && 'Admin' in userRole) return true;
    if ('BrandOwner' in role && 'BrandOwner' in userRole) return true;
    if ('Reseller' in role && 'Reseller' in userRole) return true;
    
    return false;
  }, [profile]);

  // Login with Internet Identity
  const login = useCallback(() => {
    if (!authClient) return;
    setIsLoading(true);
    
    authClient.login({
      identityProvider: IDENTITY_PROVIDER,
      onSuccess: async () => {
        setIsAuthenticated(true);
        try {
          const user = await TrustOrigin_backend.register();
          setProfile(user);
        } catch (error) {
          console.error('Failed to register user:', error);
        } finally {
          setIsLoading(false);
        }
      },
      onError: (error) => {
        console.error('Login failed:', error);
        setIsLoading(false);
      },
      maxTimeToLive: MAX_TTL,
    });
  }, [authClient, IDENTITY_PROVIDER]);

  // Get user profile information
  const getProfile = useCallback(async () => {
    if (!authClient) return;
    setIsLoading(true);

    try {
      const principal = authClient.getIdentity().getPrincipal();
      if (principal.isAnonymous()) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      const responseData = await TrustOrigin_backend.whoami();
      if ('err' in responseData) {
        setProfile(null);
      } else if (responseData.length > 0) {
        setProfile(responseData[0] as User);
      }
    } catch (error) {
      console.error('Failed to get profile:', error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [authClient]);

  // Create user profile
  const createProfile = useCallback(async (input: Partial<UserDetailsInput>) => {
    if (!authClient) return;
    setIsLoading(true);

    try {
      const responseData = await TrustOrigin_backend.register();
      if (input.first_name) { // only fill in the user details, if the user chooses to do so
        const result = handleUserResult(await TrustOrigin_backend.update_self_details(input as UserDetailsInput))
        if (result) {
          setProfile(result);
        }
      } else {
        setProfile(responseData);
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authClient]);

  // Update user profile
  const updateProfile = useCallback(async (input: UserDetailsInput) => {
    if (!authClient || !input.first_name) return;
    setIsLoading(true);

    try {
      const result = handleUserResult(await TrustOrigin_backend.update_self_details(input as UserDetailsInput))
      if (result) {
        setProfile(result);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authClient]);

  // Set user role
  const setSelfRole = useCallback(async (userRole: UserRole) => {
    setIsLoading(true);
    try {
      const result = handleUserResult(await TrustOrigin_backend.set_self_role(userRole));
      if (result) {
        setProfile(result);
      }
    } catch (error) {
      console.error('Failed to set role:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout user
  const logout = useCallback(async () => {
    if (!authClient) return;
    
    try {
      await authClient.logout();
      setIsAuthenticated(false);
      setProfile(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [authClient]);

  // Register as a brand owner
  const signinAsBrandOwner = useCallback(async (input: OrganizationInput) => {
    setIsLoading(true);
    try {
      const result = handleUserResult(await TrustOrigin_backend.register_as_organization(input));
      if (result) {
        setProfile(result);
      }
    } catch (error) {
      console.error('Failed to register as brand owner:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register as a reseller
  const signinAsReseller = useCallback(async (input: ResellerInput) => {
    setIsLoading(true);
    try {
      const result = handleUserResult(await TrustOrigin_backend.register_as_reseller({
        ...input,
        org_id: Principal.anonymous(),
      }));
      if (result) {
        setProfile(result);
      }
    } catch (error) {
      console.error('Failed to register as reseller:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize Auth Client
  useEffect(() => {
    const initAuthClient = async () => {
      setIsLoading(true);
      try {
        const client = await AuthClient.create();
        setAuthClient(client);
        
        const isAnonymous = client.getIdentity().getPrincipal().isAnonymous();
        setIsAuthenticated(!isAnonymous);
        
        if (!isAnonymous) {
          try {
            const responseData = await TrustOrigin_backend.whoami();
            if ('err' in responseData) {
              setProfile(null);
            } else if (responseData.length > 0) {
              setProfile(responseData[0] as User);
            }
          } catch (error) {
            console.error('Failed to get profile during initialization:', error);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth client:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuthClient();
    // No dependencies to avoid infinite re-renders
  }, []);

  // Update profile when auth client changes
  useEffect(() => {
    if (authClient && !authClient.getIdentity().getPrincipal().isAnonymous()) {
      getProfile();
    }
  }, [authClient, getProfile]);

  const contextValue = useMemo(() => ({
    profile,
    authClient,
    isAuthenticated,
    isLoading,
    hasRole,
    createProfile,
    updateProfile,
    setSelfRole,
    signinAsBrandOwner,
    signinAsReseller,
    login,
    logout,
  }), [
    profile, 
    authClient, 
    isAuthenticated, 
    isLoading,
    hasRole,
    createProfile, 
    updateProfile, 
    setSelfRole, 
    signinAsBrandOwner, 
    signinAsReseller, 
    login, 
    logout
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
