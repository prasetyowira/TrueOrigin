/**
 * @file useUpdateOrganization hook
 * @fileoverview Custom React Query mutation hook for updating organization details
 * 
 * Functions:
 * - useUpdateOrganization: Main hook
 * 
 * Flow:
 * 1. Get user's organization ID from profile
 * 2. Create mutation for updating organization
 * 3. Handle success and error cases
 * 
 * Error Handling:
 * - API error handling
 * - Loading state for submission
 * 
 * @module hooks/useMutations/useUpdateOrganization
 * @requires TrustOrigin_backend - Backend canister
 * @exports {Hook} useUpdateOrganization - Update organization mutation hook
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TrustOrigin_backend } from '../../../../declarations/TrustOrigin_backend';
import { 
  ApiError,
  ApiResponse_OrganizationResponse, 
  OrganizationPublic, 
  UpdateOrganizationRequest 
} from '../../../../declarations/TrustOrigin_backend/TrustOrigin_backend.did';
import { useAuthContext } from '@/contexts/useAuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Type for the input data required to update an organization
 */
export interface UpdateOrganizationData {
  name: string;
  description: string;
}

/**
 * Custom hook for updating organization details
 * 
 * @returns Mutation for updating organization details
 */
export const useUpdateOrganization = () => {
  const { profile } = useAuthContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get the organization ID from the user's profile
  const orgId = profile?.org_ids && profile.org_ids.length > 0 ? profile.org_ids[0] : null;
  
  return useMutation({
    mutationFn: async (data: UpdateOrganizationData): Promise<OrganizationPublic> => {
      if (!orgId) {
        throw new Error("No organization found. Please create an organization first.");
      }
      
      // Create update organization request object
      const updateRequest: UpdateOrganizationRequest = {
        id: orgId,
        name: data.name,
        description: data.description,
        metadata: [], // Empty metadata array
      };
      
      // Call backend to update organization using v2 endpoint
      const response: ApiResponse_OrganizationResponse = await TrustOrigin_backend.update_organization_v2(
        updateRequest
      );
      
      // Handle error response
      if (response.error && response.error.length > 0) {
        // Safely get the first error if it exists
        const apiError = response.error[0];
        let errorMessage = "Failed to update organization";
        
        // Extract detailed error message if available
        if (apiError && 'InvalidInput' in apiError) {
          errorMessage = apiError.InvalidInput.details.message;
        } else if (apiError && 'NotFound' in apiError) {
          errorMessage = apiError.NotFound.details.message;
        } else if (apiError && 'Unauthorized' in apiError) {
          errorMessage = apiError.Unauthorized.details.message;
        } else if (apiError && 'AlreadyExists' in apiError) {
          errorMessage = apiError.AlreadyExists.details.message;
        } else if (apiError && 'InternalError' in apiError) {
          errorMessage = apiError.InternalError.details.message;
        } else if (apiError && 'ExternalApiError' in apiError) {
          errorMessage = apiError.ExternalApiError.details.message;
        } else if (apiError && 'MalformedData' in apiError) {
          errorMessage = apiError.MalformedData.details.message;
        }
        
        throw new Error(errorMessage);
      }
      
      // Extract organization from response
      if (!response.data || response.data.length === 0 || !response.data[0].organization) {
        throw new Error("No organization data received from server");
      }
      
      return response.data[0].organization;
    },
    onSuccess: (data) => {
      // Invalidate related queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['organization', orgId?.toString()] });
      
      // Show success message
      toast({
        title: "Success",
        description: "Organization details updated successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      // Show error message
      toast({
        title: "Error",
        description: `Failed to update organization: ${error.message}`,
        variant: "destructive",
      });
      console.error("Failed to update organization:", error.message);
    },
  });
};

export default useUpdateOrganization; 