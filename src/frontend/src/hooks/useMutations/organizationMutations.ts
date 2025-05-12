import { useMutation, useQueryClient } from '@tanstack/react-query';
import { actor } from '@/services/canister';
import type {
  OrganizationPublic as DidOrganizationPublic,
  UpdateOrganizationRequest as DidUpdateOrganizationRequest,
  OrganizationResponse as DidOrganizationResponse, // Assuming update_organization_v2 returns this
  ApiError as DidApiError,
  ResponseMetadata as DidResponseMetadata
} from '@declarations/TrustOrigin_backend/TrustOrigin_backend.did';
import { logger } from '@/utils/logger';
import { unwrap } from '@/hooks/useQueries/authQueries'; // Re-use unwrap
// If FE types are needed for response, import/define them
// For now, assuming DidOrganizationResponse contains DidOrganizationPublic which is fine

// Helper to handle API responses for mutations (can be shared or defined locally)
const handleMutationResponse = <TDidData, TReturnData>(
  rawResponse: { data: [] | [TDidData], error: [] | [DidApiError], metadata: DidResponseMetadata }, 
  mutationName: string,
  transformFn: (data: TDidData) => TReturnData
): TReturnData => {
  const errorOpt = unwrap(rawResponse.error);
  if (errorOpt) {
    const errorMessage = (errorOpt as any).message || (errorOpt as any).InvalidInput?.details?.message || 'API Mutation Error'; 
    logger.error(`API Mutation Error for ${mutationName}:`, { message: errorMessage, fullError: errorOpt });
    throw new Error(errorMessage);
  }
  const didData = unwrap(rawResponse.data);
  if (didData !== undefined ) { // Allow null if TDidData can be null
    return transformFn(didData as TDidData); // Ensure didData is not undefined before calling transformFn
  }
  logger.warn(`API Mutation Success for ${mutationName} but data is null or undefined after unwrap.`);
  // This case needs careful handling based on what TReturnData expects
  // If TReturnData can be void/undefined, this is okay.
  return undefined as unknown as TReturnData; 
};

// Define a frontend-friendly request type if needed, or use DidUpdateOrganizationRequest directly
export interface FEUpdateOrganizationRequest {
    id: DidUpdateOrganizationRequest['id']; // Principal
    name: string;
    description: string;
    metadata: DidUpdateOrganizationRequest['metadata']; // Array<Metadata>
}

// Transform FE request to DID request if necessary (usually for optionals)
// In this case, DidUpdateOrganizationRequest has all required fields matching FEUpdateOrganizationRequest
const transformFeRequestToDid = (feRequest: FEUpdateOrganizationRequest): DidUpdateOrganizationRequest => {
    return feRequest; // Direct pass-through if types align
};

// Transform DID response to FE response if necessary
const transformUpdateOrgResponse = (didResponse: DidOrganizationResponse): DidOrganizationPublic => {
    // update_organization_v2 returns ApiResponse_3 { data: [] | [OrganizationResponse] }
    // OrganizationResponse is { organization: OrganizationPublic }
    return didResponse.organization; 
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation<
    DidOrganizationPublic, // onSuccess data type (the updated organization)
    Error,                 // Error type
    FEUpdateOrganizationRequest  // Variables type for mutationFn
  >({
    mutationFn: async (request: FEUpdateOrganizationRequest) => {
      logger.debug('[useUpdateOrganization] Attempting to update organization:', request);
      const didRequest = transformFeRequestToDid(request);
      // Assuming actor.update_organization_v2 is the correct backend method
      const response = await actor.update_organization_v2(didRequest);
      logger.debug('[useUpdateOrganization] Backend response:', response);
      return handleMutationResponse(response, 'updateOrganizationV2', transformUpdateOrgResponse);
    },
    onSuccess: (updatedOrganization) => {
      logger.info('[useUpdateOrganization] Organization updated successfully:', updatedOrganization);
      // Invalidate queries that depend on organization data or user's auth context
      queryClient.invalidateQueries({ queryKey: ['authContext'] });
      queryClient.invalidateQueries({ queryKey: ['organization', updatedOrganization.id.toText()] }); // If there was a specific org query
      queryClient.invalidateQueries({ queryKey: ['myOrganizations'] });
      // Potentially update active_organization in authContext cache directly if possible and desired
    },
    onError: (error: Error) => {
      logger.error('[useUpdateOrganization] Error updating organization:', error.message);
      // Toast notification can be handled in the component calling the mutation
    },
  });
}; 