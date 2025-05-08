import { useQuery } from '@tanstack/react-query';
import { actor } from '@/services/canister';
import {
  // Directly import types from the .did.d.ts file
  AuthContextResponse as DidAuthContextResponse,
  UserRole as DidUserRole,
  UserPublic as DidUserPublic,
  OrganizationPublic as DidOrganizationPublic, 
  NavigationContextResponse as DidNavigationContextResponse,
  ResellerCertificationPageContext as DidResellerCertificationPageContext,
  ApiError as DidApiError,
  ResponseMetadata as DidResponseMetadata,
  ResellerPublic as DidResellerPublic,
  BrandOwnerContextDetails as DidBrandOwnerContextDetails,
  ResellerContextDetails as DidResellerContextDetails,
  Metadata as DidMetadata
} from '@declarations/TrustOrigin_backend/TrustOrigin_backend.did'; 

import { logger } from '@/utils/logger';

// Helper to unwrap Candid optional: [] | [T]  to T | undefined
export const unwrap = <T,>(optField: [] | [T] | undefined): T | undefined => {
    return optField && optField.length > 0 ? optField[0] : undefined;
};

// Helper to unwrap an array nested in an optional: [] | [T[]] to T[] | undefined
export const unwrapArray = <T,>(optArrayField: [] | [T[]] | undefined): T[] | undefined => {
    return optArrayField && optArrayField.length > 0 ? optArrayField[0] : undefined;
};

// String enum for frontend usage, mapped from DidUserRole
export enum FEUserRole {
  BrandOwner = 'BrandOwner',
  Reseller = 'Reseller',
  Admin = 'Admin',
}

export const mapDidUserRoleToFEUserRole = (didRole: DidUserRole): FEUserRole | undefined => {
  if (typeof didRole === 'string') { // Should not happen if .did types are object variants
    const roleKey = didRole as keyof typeof FEUserRole;
    if (FEUserRole[roleKey]) return FEUserRole[roleKey];
  }
  if (typeof didRole === 'object' && didRole !== null) {
    if ('BrandOwner' in didRole) return FEUserRole.BrandOwner;
    if ('Reseller' in didRole) return FEUserRole.Reseller;
    if ('Admin' in didRole) return FEUserRole.Admin;
  }
  logger.warn('Unknown DidUserRole format or value:', didRole);
  return undefined;
};

// Generic response handler for queries, now expecting raw DID response types
const handleQueryResponse = <TDidData, TReturnData>(
  rawResponse: { data: [] | [TDidData], error: [] | [DidApiError], metadata: DidResponseMetadata }, 
  queryKey: string[],
  transformFn: (data: TDidData) => TReturnData // Transform is now mandatory if TDidData != TReturnData
): TReturnData => {
  const errorOpt = unwrap(rawResponse.error);
  if (errorOpt) {
    // Assuming getApiErrorMessage can take DidApiError or we adapt it
    const errorMessage = (errorOpt as any).InvalidInput?.details?.message || 
                       (errorOpt as any).NotFound?.details?.message || 
                       'API Error'; // Simplified error message extraction
    logger.error(`API Query Error for ${queryKey.join('/')}:`, { message: errorMessage, fullError: errorOpt });
    throw new Error(errorMessage);
  }
  
  const didData = unwrap(rawResponse.data);
  if (didData !== undefined && didData !== null) {
    return transformFn(didData);
  }
  
  logger.warn(`API Query Success for ${queryKey.join('/')} but data is empty or not present. Returning undefined.`);
  // For queries, if no error and no data, it implies an empty successful result (e.g. an empty list)
  // or if a single object was expected, it means not found / null which transformFn should handle by returning undefined.
  // So, if transformFn is designed to return T | undefined, this path is tricky.
  // Let's assume transformFn handles the case where didData is effectively 'not present' by returning undefined.
  // If didData is null/undefined after unwrap, transformFn shouldn't be called if it doesn't expect null/undefined.
  // The current structure calls transformFn only if didData is non-null/non-undefined.
  // If didData is null/undefined, it falls through to here.
  return undefined as unknown as TReturnData; // This might need adjustment based on specific query expectations
};

// Transformed types for frontend use (can be defined here or in a dedicated frontend types file if preferred)
// For simplicity, keeping them here for now as they are direct transformations of DID types.
export type FEAuthContextResponse = {
  is_registered: boolean;
  user?: DidUserPublic; // Using DidUserPublic directly, optionals handled in components
  role?: FEUserRole;
  brand_owner_details?: {
    has_organizations: boolean;
    active_organization?: DidOrganizationPublic;
    organizations?: DidOrganizationPublic[];
  };
  reseller_details?: {
    is_profile_complete_and_verified: boolean;
    certification_code?: string;
    certification_timestamp?: bigint;
    associated_organization?: DidOrganizationPublic;
  };
};

export const transformAuthContextResponse = (didResponse: DidAuthContextResponse): FEAuthContextResponse => {
  const unwrappedRole = unwrap(didResponse.role);
  return {
    is_registered: didResponse.is_registered,
    user: unwrap(didResponse.user),
    role: unwrappedRole ? mapDidUserRoleToFEUserRole(unwrappedRole) : undefined,
    brand_owner_details: unwrap(didResponse.brand_owner_details) ? {
      has_organizations: unwrap(didResponse.brand_owner_details)!.has_organizations,
      active_organization: unwrap(unwrap(didResponse.brand_owner_details)!.active_organization),
      organizations: unwrapArray(unwrap(didResponse.brand_owner_details)!.organizations),
    } : undefined,
    reseller_details: unwrap(didResponse.reseller_details) ? {
      is_profile_complete_and_verified: unwrap(didResponse.reseller_details)!.is_profile_complete_and_verified,
      certification_code: unwrap(unwrap(didResponse.reseller_details)!.certification_code),
      certification_timestamp: unwrap(unwrap(didResponse.reseller_details)!.certification_timestamp),
      associated_organization: unwrap(unwrap(didResponse.reseller_details)!.associated_organization),
    } : undefined,
  };
};

export const useGetAvailableRoles = () => {
  const queryKey = ['availableRoles'];
  return useQuery<FEUserRole[], Error>({
    queryKey,
    queryFn: async () => {
      const response = await actor.get_available_roles(); 
      const transform = (didRolesArray: DidUserRole[]): FEUserRole[] => 
        didRolesArray.map(role => mapDidUserRoleToFEUserRole(role)).filter(Boolean) as FEUserRole[];
      return handleQueryResponse(response, queryKey, transform);
    },
  });
};

export const useGetAuthContext = (enabled: boolean = true) => {
  const queryKey = ['authContext'];
  return useQuery<FEAuthContextResponse, Error>({
    queryKey,
    queryFn: async () => {
      const response = await actor.get_auth_context(); 
      return handleQueryResponse(response, queryKey, transformAuthContextResponse);
    },
    enabled, 
    staleTime: 5 * 60 * 1000, 
    refetchOnWindowFocus: true,
  });
};

export const useGetMyOrganizations = () => {
  const { data: authCtx } = useGetAuthContext(); 
  const queryKey = ['myOrganizations'];
  return useQuery<DidOrganizationPublic[], Error>({
    queryKey,
    queryFn: async () => {
      const response = await actor.get_my_organizations(); 
      return handleQueryResponse(response, queryKey, (orgs: DidOrganizationPublic[]) => orgs); // Pass through if type is same
    },
    enabled: !!authCtx?.is_registered && authCtx.role === FEUserRole.BrandOwner,
  });
};

export const useFindOrganizationsByName = (name: string, enabledFlag: boolean = true) => {
  const queryKey = ['findOrganizationsByName', name];
  return useQuery<DidOrganizationPublic[], Error>({
    queryKey,
    queryFn: async () => {
      const orgs = await actor.find_organizations_by_name(name); 
      if(!orgs) throw new Error('No organizations array from find_organizations_by_name.');
      return orgs; 
    },
    enabled: enabledFlag && name.length >= 3, 
  });
};

export type FENavigationContextResponse = {
    user_display_name: string;
    user_avatar_id?: string;
    current_organization_name?: string;
};
const transformNavigationContextResponse = (navCtx: DidNavigationContextResponse): FENavigationContextResponse => ({
    user_display_name: navCtx.user_display_name,
    user_avatar_id: unwrap(navCtx.user_avatar_id),
    current_organization_name: unwrap(navCtx.current_organization_name),
});

export const useGetNavigationContext = () => {
  const { data: authCtx } = useGetAuthContext();
  const queryKey = ['navigationContext'];
  return useQuery<FENavigationContextResponse, Error>({
    queryKey,
    queryFn: async () => {
      const response = await actor.get_navigation_context(); 
      return handleQueryResponse(response, queryKey, transformNavigationContextResponse);
    },
    enabled: !!authCtx?.is_registered, 
  });
};

export type FEResellerCertificationPageContext = {
    certification_code: string; 
    certification_timestamp: bigint; 
    reseller_profile: DidResellerPublic; // Corrected: Should be DidResellerPublic
    user_details: DidUserPublic; 
    associated_organization: DidOrganizationPublic; 
};

const transformResellerCertificationPageContext = (certCtx: DidResellerCertificationPageContext): FEResellerCertificationPageContext => {
    // Here, we map to a structure that uses the DidTypes directly for nested objects,
    // assuming components will handle unwrapping of optionals from these DidTypes.
    // This simplifies transformation if the main structure is the same.
    return {
        certification_code: certCtx.certification_code, 
        certification_timestamp: certCtx.certification_timestamp, 
        // The following are already in their Did... forms from certCtx
        reseller_profile: certCtx.reseller_profile,
        user_details: certCtx.user_details,
        associated_organization: certCtx.associated_organization,
    };
};

export const useGetMyResellerCertification = () => {
  const { data: authCtx } = useGetAuthContext();
  const queryKey = ['myResellerCertification'];
  return useQuery<FEResellerCertificationPageContext, Error>({
    queryKey,
    queryFn: async () => {
      const response = await actor.get_my_reseller_certification(); 
      logger.info('useGetMyResellerCertification response:', response);
      return handleQueryResponse(response, queryKey, transformResellerCertificationPageContext);
    },
    enabled: 
      !!authCtx?.is_registered && 
      authCtx.role === FEUserRole.Reseller &&
      !!authCtx.reseller_details?.is_profile_complete_and_verified,
  });
}; 