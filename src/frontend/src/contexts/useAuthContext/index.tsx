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
  const [selectedOrgId, setSelectedOrgId] = useState<Principal | null>(null);
  
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
    console.log("[DEBUG AuthContext] Starting login process");
    
    authClient.login({
      identityProvider: IDENTITY_PROVIDER,
      onSuccess: async () => {
        console.log("[DEBUG AuthContext] Login successful, setting authenticated");
        setIsAuthenticated(true);
        try {
          console.log("[DEBUG AuthContext] Calling register() after login");
          const user = await TrustOrigin_backend.register();
          console.log("[DEBUG AuthContext] Register response:", user);
          setProfile(user);
          
          // Check if user has organizations and set the first one as selected
          if (user?.org_ids && user.org_ids.length > 0) {
            console.log("[DEBUG AuthContext] Setting default org ID:", user.org_ids[0].toString());
            setSelectedOrgId(user.org_ids[0]);
            // Store selected org in localStorage for persistence
            localStorage.setItem('selectedOrgId', user.org_ids[0].toString());
          }
        } catch (error) {
          console.error('[DEBUG AuthContext] Failed to register user:', error);
        } finally {
          // Set loading false now that we have the profile
          console.log("[DEBUG AuthContext] Setting loading to false after register()");
          setIsLoading(false);
        }
      },
      onError: (error) => {
        console.error('[DEBUG AuthContext] Login failed:', error);
        setIsLoading(false);
      },
      maxTimeToLive: MAX_TTL,
    });
  }, [authClient, IDENTITY_PROVIDER]);

  // Get user profile information
  const getProfile = useCallback(async () => {
    if (!authClient) return;
    setIsLoading(true);
    console.log("[DEBUG AuthContext] getProfile() called");

    try {
      const principal = authClient.getIdentity().getPrincipal();
      if (principal.isAnonymous()) {
        console.log("[DEBUG AuthContext] Anonymous principal, no profile");
        setProfile(null);
        setIsLoading(false);
        return;
      }

      console.log("[DEBUG AuthContext] Calling whoami() to get profile");
      const responseData = await TrustOrigin_backend.whoami();
      console.log("[DEBUG AuthContext] whoami response:", responseData);
      
      if ('err' in responseData) {
        console.log("[DEBUG AuthContext] Error in whoami response");
        setProfile(null);
      } else if (responseData.length > 0) {
        console.log("[DEBUG AuthContext] Setting profile from whoami data");
        const user = responseData[0] as User;
        setProfile(user);
        
        // Check for stored org ID in localStorage
        const storedOrgId = localStorage.getItem('selectedOrgId');
        
        // If we have a stored org ID and it's in the user's org_ids, use it
        if (storedOrgId && user.org_ids) {
          const matchedOrg = user.org_ids.find(org => org.toString() === storedOrgId);
          if (matchedOrg) {
            console.log("[DEBUG AuthContext] Using stored org ID from localStorage:", storedOrgId);
            setSelectedOrgId(matchedOrg);
          } else if (user.org_ids.length > 0) {
            // If stored org not found in user's orgs, use the first one
            console.log("[DEBUG AuthContext] Stored org not found, using first org:", user.org_ids[0].toString());
            setSelectedOrgId(user.org_ids[0]);
            localStorage.setItem('selectedOrgId', user.org_ids[0].toString());
          }
        } else if (user.org_ids && user.org_ids.length > 0) {
          // No stored org, use the first one if available
          console.log("[DEBUG AuthContext] Setting default org ID:", user.org_ids[0].toString());
          setSelectedOrgId(user.org_ids[0]);
          localStorage.setItem('selectedOrgId', user.org_ids[0].toString());
        }
      }
    } catch (error) {
      console.error('[DEBUG AuthContext] Failed to get profile:', error);
      setProfile(null);
    } finally {
      console.log("[DEBUG AuthContext] Setting isLoading to false after profile fetch");
      setIsLoading(false);
    }
  }, [authClient]);

  // Select an organization
  const selectOrganization = useCallback((orgId: Principal) => {
    console.log("[DEBUG AuthContext] Selecting organization:", orgId.toString());
    setSelectedOrgId(orgId);
    localStorage.setItem('selectedOrgId', orgId.toString());
  }, []);

  // Get current organization ID
  const getCurrentOrgId = useCallback(() => {
    return selectedOrgId;
  }, [selectedOrgId]);

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
      setSelectedOrgId(null);
      localStorage.removeItem('selectedOrgId');
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
        
        // Set the newly created organization as selected if available
        if (result.org_ids && result.org_ids.length > 0) {
          console.log("[DEBUG AuthContext] Setting new brand owner org ID:", result.org_ids[0].toString());
          setSelectedOrgId(result.org_ids[0]);
          localStorage.setItem('selectedOrgId', result.org_ids[0].toString());
        }
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
        
        // Set the organization from the input as selected if available
        if (!input.org_id.isAnonymous()) {
          console.log("[DEBUG AuthContext] Setting reseller org ID:", input.org_id.toString());
          setSelectedOrgId(input.org_id);
          localStorage.setItem('selectedOrgId', input.org_id.toString());
        }
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
      console.log("[DEBUG AuthContext] Initializing auth client, setting loading true");
      
      try {
        const client = await AuthClient.create();
        setAuthClient(client);
        
        const isAnonymous = client.getIdentity().getPrincipal().isAnonymous();
        setIsAuthenticated(!isAnonymous);
        console.log("[DEBUG AuthContext] Auth client initialized, anonymous:", isAnonymous);
        
        if (!isAnonymous) {
          try {
            console.log("[DEBUG AuthContext] Getting user profile during init");
            const responseData = await TrustOrigin_backend.whoami();
            if ('err' in responseData) {
              setProfile(null);
            } else if (responseData.length > 0) {
              const user = responseData[0] as User;
              setProfile(user);
              
              // Check for stored org ID in localStorage
              const storedOrgId = localStorage.getItem('selectedOrgId');
              
              // If we have a stored org ID and it's in the user's org_ids, use it
              if (storedOrgId && user.org_ids) {
                const matchedOrg = user.org_ids.find(org => org.toString() === storedOrgId);
                if (matchedOrg) {
                  console.log("[DEBUG AuthContext] Using stored org ID from localStorage:", storedOrgId);
                  setSelectedOrgId(matchedOrg);
                } else if (user.org_ids.length > 0) {
                  // If stored org not found in user's orgs, use the first one
                  console.log("[DEBUG AuthContext] Stored org not found, using first org:", user.org_ids[0].toString());
                  setSelectedOrgId(user.org_ids[0]);
                  localStorage.setItem('selectedOrgId', user.org_ids[0].toString());
                }
              } else if (user.org_ids && user.org_ids.length > 0) {
                // No stored org, use the first one if available
                console.log("[DEBUG AuthContext] Setting default org ID:", user.org_ids[0].toString());
                setSelectedOrgId(user.org_ids[0]);
                localStorage.setItem('selectedOrgId', user.org_ids[0].toString());
              }
            }
          } catch (error) {
            console.error('Failed to get profile during initialization:', error);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth client:', error);
      } finally {
        console.log("[DEBUG AuthContext] Auth client initialization complete, setting loading false");
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

  // Log state changes
  useEffect(() => {
    console.log("[DEBUG AuthContext] State updated:", { 
      isAuthenticated, 
      isLoading, 
      hasAuthClient: !!authClient,
      hasProfile: !!profile,
      selectedOrgId: selectedOrgId?.toString(),
      profileDetails: profile ? {
        id: profile.id.toString(),
        roles: profile.user_role?.map(r => Object.keys(r)[0]),
        orgCount: profile.org_ids?.length
      } : null
    });
  }, [isAuthenticated, isLoading, authClient, profile, selectedOrgId]);

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
    selectedOrgId,
    selectOrganization,
    getCurrentOrgId,
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
    logout,
    selectedOrgId,
    selectOrganization,
    getCurrentOrgId
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
