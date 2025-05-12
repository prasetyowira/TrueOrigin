import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Principal } from '@dfinity/principal';
import { actor } from '@/services/canister'; // Assuming actor is set up for authenticated calls by the time these run
import {
  AuthContextResponse as DidAuthContextResponse,
  OrganizationContextResponse as DidOrganizationContextResponse,
  CompleteResellerProfileRequest as DidCompleteResellerProfileRequest,
  LogoutResponse as DidLogoutResponse,
  ApiError as DidApiError,
  ResponseMetadata as DidResponseMetadata,
  UserRole as DidUserRole,
  OrganizationInput, // This is correct, as create_organization_for_owner takes OrganizationInput
  Metadata as DidMetadata, // Import DidMetadata
  OrganizationPublic as DidOrganizationPublic
} from '@declarations/TrustOrigin_backend/TrustOrigin_backend.did';
import { logger } from '@/utils/logger';
import { FEUserRole, FEAuthContextResponse, mapDidUserRoleToFEUserRole, unwrap, transformAuthContextResponse } from '@/hooks/useQueries/authQueries'; // Import FE types and mappers

// Helper to handle API responses for mutations (similar to query one but might differ in TReturnData expectation)
const handleMutationResponse = <TDidData, TReturnData>(
  rawResponse: { data: [] | [TDidData], error: [] | [DidApiError], metadata: DidResponseMetadata }, 
  mutationName: string,
  transformFn: (data: TDidData) => TReturnData // Transform function for the data part
): TReturnData => {
  const errorOpt = unwrap(rawResponse.error);
  if (errorOpt) {
    // Simplified error message extraction for now
    const errorMessage = (errorOpt as any).message || (errorOpt as any).InvalidInput?.details?.message || 'API Mutation Error'; 
    logger.error(`API Mutation Error for ${mutationName}:`, { message: errorMessage, fullError: errorOpt });
    throw new Error(errorMessage);
  }
  
  const didData = unwrap(rawResponse.data);

  // If didData is undefined (i.e., backend sent `data: []`), but TReturnData could be void (e.g. for logout)
  // we still call transformFn, which should handle `undefined` if its return type is T | undefined or void.
  // If didData is null (i.e. backend sent `data: [null]`), transformFn will receive null.
  if (didData === undefined && !(null as TDidData === undefined)) { // Check if TDidData can be undefined, to avoid calling transformFn(undefined)
    // This case means data was `[]`, and TReturnData is likely void or undefined.
    // If TReturnData is void, we can return undefined. If TReturnData expects something, transformFn must handle undefined.
    logger.warn(`API Mutation Success for ${mutationName} - data is empty array. Assuming void/undefined return.`);
    return undefined as unknown as TReturnData; 
  }
  // At this point, didData is either the actual data (TDidData) or null (if TDidData could be null)
  return transformFn(didData as TDidData); // Cast because didData could be null if TDidData allows null
};

// Define FE request types if they differ from DID types or for clarity
// Export this type so it can be imported by LoginPage.tsx
export type FECompleteResellerProfileRequest = {
  target_organization_id: Principal;
  reseller_name: string;
  contact_email?: string;
  contact_phone?: string;
  ecommerce_urls: DidMetadata[]; 
  additional_metadata?: DidMetadata[];
};

const transformFeCompleteResellerProfileToDid = (feRequest: FECompleteResellerProfileRequest): DidCompleteResellerProfileRequest => ({
    target_organization_id: feRequest.target_organization_id,
    reseller_name: feRequest.reseller_name,
    contact_email: feRequest.contact_email ? [feRequest.contact_email] : [],
    contact_phone: feRequest.contact_phone ? [feRequest.contact_phone] : [],
    ecommerce_urls: feRequest.ecommerce_urls, 
    additional_metadata: feRequest.additional_metadata ? [feRequest.additional_metadata] : [],
});


// INITIALIZE USER SESSION
export const useInitializeUserSession = () => {
  const queryClient = useQueryClient();
  return useMutation<FEAuthContextResponse, Error, { selected_role: FEUserRole | null }>({
    mutationFn: async (params) => {
      logger.debug('Initializing user session with role:', params.selected_role);
      let roleArg: [] | [DidUserRole] = [];
      if (params.selected_role) {
        if (params.selected_role === FEUserRole.BrandOwner) roleArg = [{BrandOwner: null}];
        else if (params.selected_role === FEUserRole.Reseller) roleArg = [{Reseller: null}];
        else if (params.selected_role === FEUserRole.Admin) roleArg = [{Admin: null}];
        else if (params.selected_role === FEUserRole.Customer) roleArg = [{Customer: null}]; 
      }
      const response = await actor.initialize_user_session(roleArg);
      // The actor.initialize_user_session returns ApiResponse_1, which is { data: [] | [DidAuthContextResponse], ...}
      // transformAuthContextResponse expects DidAuthContextResponse and returns FEAuthContextResponse.
      return handleMutationResponse(response, 'initializeUserSession', transformAuthContextResponse);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['authContext'], data);
      logger.info('User session initialized successfully, authContext updated in cache.', data);
    },
    onError: (error) => {
      logger.error('Failed to initialize user session:', error);
    }
  });
};

// LOGOUT USER
// FEType for LogoutResponse for consistency, though it's simple
export type FELogoutResponse = { message: string; redirect_url?: string };
const transformLogoutResponse = (didResponse: DidLogoutResponse | null | undefined): FELogoutResponse => {
    // If didResponse is null (from data: [null]) or undefined (from data: [])
    if (didResponse === null || didResponse === undefined) {
        logger.warn('Logout response data from backend is null or undefined, returning default success message.');
        return { message: 'Logout successful (no data from backend).', redirect_url: undefined };
    }
    return {
        message: didResponse.message,
        redirect_url: unwrap(didResponse.redirect_url),
    };
};

export const useLogoutUser = () => {
  const queryClient = useQueryClient();
  return useMutation<FELogoutResponse, Error, void>({
    mutationFn: async () => {
      const response = await actor.logout_user();
      // actor.logout_user() returns ApiResponse_13 { data: [] | [DidLogoutResponse], ...}
      return handleMutationResponse(response, 'logoutUser', transformLogoutResponse);
    },
    onSuccess: (data) => {
      logger.info('User logged out successfully.', data.message);
      queryClient.setQueryData(['authContext'], null);
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      logger.error('Logout failed:', error);
      queryClient.setQueryData(['authContext'], null);
      queryClient.invalidateQueries();
    }
  });
};

// FEType for OrganizationContextResponse
export type FEOrganizationContextResponse = { organization: DidOrganizationPublic; user_auth_context: FEAuthContextResponse };
const transformOrganizationContextResponse = (didResponse: DidOrganizationContextResponse): FEOrganizationContextResponse => ({
    organization: didResponse.organization, 
    user_auth_context: transformAuthContextResponse(didResponse.user_auth_context),
});

// CREATE ORGANIZATION FOR OWNER
// Backend `create_organization_for_owner` expects `OrganizationInput` not `CreateOrganizationWithOwnerContextRequest`
export const useCreateOrganizationForOwner = () => {
  const queryClient = useQueryClient();
  // create_organization_for_owner takes OrganizationInput and returns ApiResponse_2 { data: [] | [DidOrganizationContextResponse], ...}
  return useMutation<FEOrganizationContextResponse, Error, OrganizationInput>({
    mutationFn: async (request: OrganizationInput) => { 
      const response = await actor.create_organization_for_owner(request);
      return handleMutationResponse(response, 'createOrganizationForOwner', transformOrganizationContextResponse);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['authContext'], data.user_auth_context);
      queryClient.invalidateQueries({ queryKey: ['myOrganizations'] });
      logger.info('Organization created successfully', data.organization);
    },
  });
};

// SELECT ACTIVE ORGANIZATION
export const useSelectActiveOrganization = () => {
  const queryClient = useQueryClient();
  // select_active_organization returns ApiResponse_1 { data: [] | [DidAuthContextResponse], ...}
  return useMutation<FEAuthContextResponse, Error, Principal>({
    mutationFn: async (orgId) => {
      const response = await actor.select_active_organization(orgId);
      return handleMutationResponse(response, 'selectActiveOrganization', transformAuthContextResponse);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['authContext'], data);
      logger.info('Active organization selected, authContext updated.');
    },
  });
};

// COMPLETE RESELLER PROFILE
export const useCompleteResellerProfile = () => {
  const queryClient = useQueryClient();
  // complete_reseller_profile returns ApiResponse_1 { data: [] | [DidAuthContextResponse], ...}
  return useMutation<FEAuthContextResponse, Error, FECompleteResellerProfileRequest>({
    mutationFn: async (feRequest: FECompleteResellerProfileRequest) => {
      const didRequest = transformFeCompleteResellerProfileToDid(feRequest);
      const response = await actor.complete_reseller_profile(didRequest);
      return handleMutationResponse(response, 'completeResellerProfile', transformAuthContextResponse);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['authContext'], data);
      queryClient.invalidateQueries({ queryKey: ['myResellerCertification'] });
      logger.info('Reseller profile completed, authContext updated.');
    },
  });
}; 