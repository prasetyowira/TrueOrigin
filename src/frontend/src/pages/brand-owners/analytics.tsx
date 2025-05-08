/*
 * @module pages/brand-owners/analytics
 * @requires TrustOrigin_backend - Backend canister
 * @exports {FC} BrandOwnerAnalytics - Brand Owner Analytics page component
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type { GetOrganizationAnalyticRequest, OrganizationAnalyticData } from '@declarations/TrustOrigin_backend/TrustOrigin_backend.did';
import { LoadingSpinner } from '@/components/LoadingSpinner'; // Assuming you have this component
import { logger } from '@/utils/logger';

const BrandOwnerAnalytics: React.FC = () => {
  const { actor, brandOwnerDetails, isLoading: authLoading, isAuthenticated } = useAuth();
  const orgId = brandOwnerDetails?.active_organization?.id;

  const { 
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useQuery<OrganizationAnalyticData, Error, OrganizationAnalyticData, (string | undefined)[]>({
    queryKey: ['organizationAnalytics', orgId?.toText()],
    queryFn: async () => {
      if (!actor || !orgId) {
        logger.warn("[BrandOwnerAnalytics] Actor or OrgID not available, skipping analytics fetch.");
        throw new Error("Actor or Organization ID not available");
      }
      logger.debug(`[BrandOwnerAnalytics] Fetching analytics for org: ${orgId.toText()}`);
      const request: GetOrganizationAnalyticRequest = { org_id: orgId };
      const response = await actor.get_organization_analytic(request);
      
      if (response.error && response.error.length > 0) {
        const errorContent = response.error[0];
        logger.error("[BrandOwnerAnalytics] Error fetching analytics:", errorContent);
        let message = "Failed to fetch analytics data";
        if (errorContent) {
            if ('InvalidInput' in errorContent) message = errorContent.InvalidInput.details.message;
            else if ('InternalError' in errorContent) message = errorContent.InternalError.details.message;
            else if ('NotFound' in errorContent) message = errorContent.NotFound.details.message;
            else if ('Unauthorized' in errorContent) message = errorContent.Unauthorized.details.message;
            else if ('AlreadyExists' in errorContent) message = errorContent.AlreadyExists.details.message;
            else if ('MalformedData' in errorContent) message = errorContent.MalformedData.details.message;
            else if ('ExternalApiError' in errorContent) message = errorContent.ExternalApiError.details.message;
        }
        throw new Error(message);
      }

      if (response.data && response.data.length > 0 && response.data[0]) {
        logger.debug("[BrandOwnerAnalytics] Fetched analytics data:", response.data[0]);
        return response.data[0];
      }
      
      logger.warn("[BrandOwnerAnalytics] No data or empty data array returned from analytics API", response);
      throw new Error("No data returned from analytics API");
    },
    enabled: !!actor && !!orgId && isAuthenticated && !authLoading,
  });

  React.useEffect(() => {
    if (isAuthenticated && actor && orgId && !authLoading) {
        logger.debug("[BrandOwnerAnalytics] Auth loaded, attempting to refetch analytics.");
        refetchAnalytics();
    }
  }, [isAuthenticated, actor, orgId, authLoading, refetchAnalytics]);

  const isLoading = authLoading || analyticsLoading;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Brand Owner Dashboard</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-700">
          Welcome to your dashboard. Manage your products, view analytics, and oversee reseller activities here.
        </p>
        
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Quick Stats</h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <LoadingSpinner />
            </div>
          ) : analyticsError ? (
            <div className="text-red-600 p-4 border border-red-300 bg-red-50 rounded-md">
              <p className="font-semibold">Error loading analytics:</p>
              <p>{analyticsError.message}</p>
            </div>
          ) : analyticsData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-100 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-700">{Number(analyticsData.total_products)}</p>
                <p className="text-sm text-blue-600">Total Products</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">{Number(analyticsData.verifications_this_month)}</p>
                <p className="text-sm text-green-600">Verifications This Month</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-700">{Number(analyticsData.active_resellers)}</p>
                <p className="text-sm text-yellow-600">Active Resellers</p>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 p-4 border border-gray-300 bg-gray-50 rounded-md">
              No analytics data available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandOwnerAnalytics; 