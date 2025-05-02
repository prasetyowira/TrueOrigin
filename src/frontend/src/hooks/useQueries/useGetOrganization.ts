/**
 * @file useGetOrganization hook
 * @fileoverview Custom React Query hook for fetching organization details
 * 
 * Functions:
 * - useGetOrganization: Main hook
 * 
 * Flow:
 * 1. Get user's selected organization ID from auth context
 * 2. Fetch organization details from backend
 * 3. Cache results and handle refetching
 * 
 * Error Handling:
 * - API error handling
 * - Loading state for submission
 * 
 * @module hooks/useQueries/useGetOrganization
 * @requires TrustOrigin_backend - Backend canister
 * @exports {Hook} useGetOrganization - Get organization query hook
 */

import { useQuery } from '@tanstack/react-query';
import { TrustOrigin_backend } from '../../../../declarations/TrustOrigin_backend';
import { 
  ApiError, 
  ApiResponse_OrganizationResponse, 
  OrganizationPublic 
} from '../../../../declarations/TrustOrigin_backend/TrustOrigin_backend.did';
import { useAuthContext } from '@/contexts/useAuthContext';

/**
 * Custom hook for fetching organization details
 * 
 * @returns Query result containing organization details
 */
export const useGetOrganization = () => {
  const { selectedOrgId } = useAuthContext();
  
  console.log("[DEBUG useGetOrganization] Current selectedOrgId:", selectedOrgId?.toString());
  
  return useQuery({
    queryKey: ['organization', selectedOrgId?.toString()],
    queryFn: async (): Promise<OrganizationPublic | null> => {
      if (!selectedOrgId) {
        console.log("[DEBUG useGetOrganization] No selectedOrgId, returning null");
        return null;
      }
      
      console.log("[DEBUG useGetOrganization] Fetching organization with ID:", selectedOrgId.toString());
      
      // Call backend to get organization details using v2 endpoint
      const response: ApiResponse_OrganizationResponse = await TrustOrigin_backend.get_organization_by_id_v2(selectedOrgId);
      
      // Handle error response
      if (response.error && response.error.length > 0) {
        const apiError = response.error[0];
        let errorMessage = "Failed to fetch organization";
        
        // Extract detailed error message if available
        if (apiError && 'InvalidInput' in apiError) {
          errorMessage = apiError.InvalidInput.details.message;
        } else if (apiError && 'NotFound' in apiError) {
          errorMessage = apiError.NotFound.details.message;
        } else if (apiError && 'Unauthorized' in apiError) {
          errorMessage = apiError.Unauthorized.details.message;
        } else if (apiError && 'InternalError' in apiError) {
          errorMessage = apiError.InternalError.details.message;
        }
        
        console.error("[DEBUG useGetOrganization] Error fetching organization:", errorMessage);
        throw new Error(errorMessage);
      }
      
      // Extract organization from response
      if (!response.data || response.data.length === 0 || !response.data[0].organization) {
        console.log("[DEBUG useGetOrganization] No organization found in response");
        return null; // No organization found, but not an error
      }
      
      console.log("[DEBUG useGetOrganization] Successfully fetched organization:", response.data[0].organization.name);
      return response.data[0].organization;
    },
    enabled: !!selectedOrgId, // Only run query if selectedOrgId is available
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
};

export default useGetOrganization; 