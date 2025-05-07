import React, { createContext, useContext, useState, useEffect, PropsWithChildren, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import { HttpAgent, Identity } from '@dfinity/agent';
import { logger } from '@/utils/logger';
import { 
  FEUserRole, 
  FEAuthContextResponse 
} from '@/hooks/useQueries/authQueries'; // Adjust if these are moved
import type {
  UserPublic as DidUserPublic,
  BrandOwnerContextDetails as DidBrandOwnerContextDetails,
  ResellerContextDetails as DidResellerContextDetails
} from '@declarations/TrustOrigin_backend/TrustOrigin_backend.did';
import { 
  useGetAuthContext, 
  useInitializeUserSession, 
  useLogoutUser 
} from '@/hooks/api'; // Assuming a central barrel file for API hooks
import { getAuthenticatedActor, getAnonymousActor } from '@/services/canister'; // Import actor services
import type { ActorSubclass } from '@dfinity/agent';
import type { _SERVICE as TrustOriginService } from '@declarations/TrustOrigin_backend/TrustOrigin_backend.did'; // Corrected path via alias

// Keep or remove InlineLoginOptions; for this test, we'll use 'any' directly on the variable
/*
interface InlineLoginOptions {
  identityProvider: string;
  onSuccess: () => void; 
  onError?: (error?: string) => void;
  maxTimeToLive?: bigint;
}
*/

export interface AuthContextType {
  isAuthenticated: boolean;
  isAuthContextLoading: boolean;
  isLoading: boolean;
  authError: Error | null;
  user: DidUserPublic | null;
  role: FEUserRole | null;
  isRegistered: boolean;
  brandOwnerDetails: FEAuthContextResponse['brand_owner_details'];
  resellerDetails: FEAuthContextResponse['reseller_details'];
  currentSelectedRolePreAuth: FEUserRole | null;
  setCurrentSelectedRolePreAuth: (role: FEUserRole | null) => void;
  loginWithII: () => Promise<void>;
  logout: () => Promise<void>;
  refetchAuthContext: () => Promise<void>;
  actor: ActorSubclass<TrustOriginService>; // Expose the actor for direct use if needed
  getActorWithCurrentIdentity: () => Promise<ActorSubclass<TrustOriginService>>; // Function to get actor with current identity
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider: React.FC<PropsWithChildren<{}>> = ({ children }): ReactNode => {
  const [currentSelectedRolePreAuth, setCurrentSelectedRolePreAuth] = useState<FEUserRole | null>(null);
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [currentActor, setCurrentActor] = useState<ActorSubclass<TrustOriginService> | null>(null);
  const [isAuthContextLoading, setIsAuthContextLoading] = useState(true);
  const [userPrincipal, setUserPrincipal] = useState<Principal | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      logger.debug("AuthContext: Initializing...");
      setIsAuthContextLoading(true);
      try {
        const client = await AuthClient.create();
        setAuthClient(client);
        const authenticated = await client.isAuthenticated();
        logger.debug(`AuthContext: II authenticated: ${authenticated}`);

        if (authenticated) {
          const identity = client.getIdentity();
          const principal = identity.getPrincipal();
          setUserPrincipal(principal);
          logger.debug("AuthContext: Setting ACTOR with AUTHENTICATED identity:", principal.toText());
          const newActor = await getAuthenticatedActor(client);
          setCurrentActor(newActor);
        } else {
          logger.debug("AuthContext: Setting ACTOR with ANONYMOUS identity.");
          setUserPrincipal(null);
          const newActor = await getAnonymousActor();
          setCurrentActor(newActor);
        }
      } catch (err) {
        logger.error("AuthContext: Error during auth initialization:", err);
        try {
          const newActor = await getAnonymousActor();
          setCurrentActor(newActor);
        } catch (anonErr) {
          logger.error("AuthContext: Failed to set anonymous actor after init error:", anonErr);
        }
        setUserPrincipal(null);
      } finally {
        setIsAuthContextLoading(false);
        logger.debug("AuthContext: Initialization complete.");
      }
    };

    initializeAuth();
  }, []);

  const { 
    data: authContextData, 
    isLoading: isLoadingAuthQuery, 
    error: authQueryError, 
    refetch: refetchAuthContextQuery 
  } = useGetAuthContext(!isAuthContextLoading && !!currentActor);
  
  const initializeSessionMutation = useInitializeUserSession();
  const logoutMutation = useLogoutUser();

  const loginWithII = useCallback(async () => {
    if (!authClient) {
      logger.error("AuthContext: AuthClient not initialized.");
      initializeSessionMutation.reset();
      return;
    }
    if (!currentSelectedRolePreAuth) {
      logger.warn("AuthContext: Role not selected before II login attempt.");
      initializeSessionMutation.reset();
      return;
    }
    if (!currentActor) {
        logger.error("AuthContext: Actor not initialized before loginWithII attempt.");
        initializeSessionMutation.reset();
        return;
    }

    try {
      const dfxNetwork = process.env.DFX_NETWORK;
      const iiCanisterIdFromEnv = process.env.CANISTER_ID_INTERNET_IDENTITY;
      
      logger.debug("[AuthContext] Preparing login options:", { dfxNetwork, iiCanisterIdFromEnv });

      if (!dfxNetwork) {
        logger.error("[AuthContext] DFX_NETWORK environment variable is not set. Cannot determine identity provider.");
        initializeSessionMutation.reset();
        return;
      }

      const internetIdentityCanisterId = iiCanisterIdFromEnv || 'bd3sg-teaaa-aaaaa-qaaba-cai';
      if (!iiCanisterIdFromEnv) {
        logger.warn(`[AuthContext] CANISTER_ID_INTERNET_IDENTITY not set, using default local II: ${internetIdentityCanisterId}`);
      }

      const identityProviderUrl = dfxNetwork === 'ic'
          ? 'https://identity.ic0.app/#authorize'
          : `http://${internetIdentityCanisterId}.localhost:4943/`;
      
      logger.debug("[AuthContext] Using identityProviderUrl:", identityProviderUrl);

      const loginOptions: any = {
        identityProvider: identityProviderUrl,
        onSuccess: async () => {
          logger.info("AuthContext: Internet Identity login successful.");
          if (authClient) {
            const identity = authClient.getIdentity();
            const principal = identity.getPrincipal();
            setUserPrincipal(principal);
            const newActor = await getAuthenticatedActor(authClient); 
            setCurrentActor(newActor);
            logger.debug("AuthContext: Actor updated with authenticated identity after login:", principal.toText());
            await initializeSessionMutation.mutateAsync({ selected_role: currentSelectedRolePreAuth });
            await refetchAuthContextQuery(); 
            logger.info("AuthContext: Backend session initialized/refreshed after login.");
          } else {
            logger.error("AuthContext: authClient missing after II login success.");
            initializeSessionMutation.reset();
          }
        },
        onError: (errorStr?: string) => {
          logger.error("AuthContext: Internet Identity login error.", errorStr);
          setUserPrincipal(null);
          getAnonymousActor().then(setCurrentActor).catch(err => logger.error("Failed to set anon actor after II error", err));
          initializeSessionMutation.reset();
        },
      };
      await authClient.login(loginOptions);
    } catch (error) {
      logger.error('AuthContext: authClient.login method itself threw an error', error);
      setUserPrincipal(null);
      getAnonymousActor().then(setCurrentActor).catch(err => logger.error("Failed to set anon actor after login method error", err));
      initializeSessionMutation.reset();
    }
  }, [authClient, currentSelectedRolePreAuth, initializeSessionMutation, refetchAuthContextQuery]);

  const logout = useCallback(async () => {
    if (!authClient) {
      logger.error("AuthContext: AuthClient not initialized for logout.");
      return;
    }
    try {
      await logoutMutation.mutateAsync(); 
      if (await authClient.isAuthenticated()) { 
        await authClient.logout();
        logger.info("AuthContext: Logged out from Internet Identity.");
      }
      setCurrentSelectedRolePreAuth(null);
      setUserPrincipal(null);
      const anonymousActor = await getAnonymousActor();
      setCurrentActor(anonymousActor);
      logger.debug("AuthContext: Actor set to anonymous after logout.");
      await refetchAuthContextQuery();
      navigate('/auth/login');
    } catch (error) {
      logger.error("AuthContext: Logout failed", error);
      setCurrentSelectedRolePreAuth(null);
      setUserPrincipal(null);
      try {
        const anonymousActor = await getAnonymousActor();
        setCurrentActor(anonymousActor);
      } catch (anonErr) {
        logger.error("AuthContext: Failed to set anonymous actor after logout error:", anonErr);
      }
    }
  }, [authClient, logoutMutation, navigate, refetchAuthContextQuery]);

  const refetchAuthContext = useCallback(async () => {
    if (!isAuthContextLoading && currentActor) {
        logger.debug("AuthContext: Refetching auth context with current actor.");
        await refetchAuthContextQuery();
    } else {
        logger.warn("AuthContext: Skipping refetch, context still loading or actor not set.");
    }
  }, [isAuthContextLoading, currentActor, refetchAuthContextQuery]);
  
  const getActorWithCurrentIdentity = useCallback(async (): Promise<ActorSubclass<TrustOriginService>> => {
    if (authClient && await authClient.isAuthenticated()) {
        logger.debug("AuthContext (getActorWithCurrentIdentity): Returning AUTHENTICATED actor.");
        return getAuthenticatedActor(authClient);
    }
    logger.debug("AuthContext (getActorWithCurrentIdentity): Returning ANONYMOUS actor.");
    return getAnonymousActor();
  }, [authClient]);

  const isAuthenticated = !!authContextData?.is_registered && !!userPrincipal;
  const isLoading = isAuthContextLoading || isLoadingAuthQuery || initializeSessionMutation.isPending || logoutMutation.isPending;
  const authError = authQueryError || initializeSessionMutation.error || logoutMutation.error;

  const contextValue: AuthContextType = {
    isAuthenticated,
    isAuthContextLoading,
    isLoading,
    authError: authError ? (authError as Error) : null,
    user: authContextData?.user || null,
    role: authContextData?.role || null,
    isRegistered: authContextData?.is_registered || false,
    brandOwnerDetails: authContextData?.brand_owner_details || null,
    resellerDetails: authContextData?.reseller_details || null,
    currentSelectedRolePreAuth,
    setCurrentSelectedRolePreAuth,
    loginWithII,
    logout,
    refetchAuthContext,
    actor: currentActor!,
    getActorWithCurrentIdentity,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
}; 