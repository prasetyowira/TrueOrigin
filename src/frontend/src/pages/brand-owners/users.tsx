/**
 * @file Brand Owner User Management Page
 * @fileoverview Displays product scan verification history for the brand owner's organization.
 * 
 * Functions:
 * - UserManagementPage: Main page component for viewing scan history.
 * 
 * Constants:
 * - ITEMS_PER_PAGE: Number of verification records per page.
 * 
 * Flow:
 * 1. Fetch product verification records for the selected organization.
 * 2. Display records in a filterable and paginated table.
 * 
 * Error Handling:
 * - Displays loading state during API calls.
 * - Shows error messages for failed API requests.
 * 
 * @module pages/brand-owners/users
 * @requires react - For component creation and state management.
 * @requires @tanstack/react-query - For data fetching and caching.
 * @requires ../../../../declarations/TrustOrigin_backend - Backend canister definitions.
 * @requires ../../../../declarations/TrustOrigin_backend/TrustOrigin_backend.did - Backend DID types.
 * @requires @/contexts/useAuthContext - To get the selected organization ID.
 * @requires @/components/ui/* - Shadcn UI components (Input, Button, Table, etc.).
 * @requires @/components/Pagination - For table pagination.
 * @requires @/components/LoadingSpinner - For loading indication.
 * @exports {FC} UserManagementPage - The main component for this page.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
// Import types directly from declarations
import type { ProductVerificationDetail } from '@declarations/TrustOrigin_backend/TrustOrigin_backend.did';
import { Principal } from '@dfinity/principal';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/Pagination';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { formatTimestamp, formatPrincipal } from '@/utils/formatters'; 
import { unwrap as unwrapOptional } from '@/hooks/useQueries/authQueries';
import { logger } from '@/utils/logger'; // Import logger

// Constants
const ITEMS_PER_PAGE = 10;

const UserManagementPage: React.FC = () => {
  const { actor, brandOwnerDetails, isLoading: authLoading, isAuthenticated } = useAuth();
  const orgId = brandOwnerDetails?.active_organization?.id;

  // State for filters
  const [internetIdFilter, setInternetIdFilter] = useState<string>('');
  const [serialNumberFilter, setSerialNumberFilter] = useState<string>('');
  const [productIdFilter, setProductIdFilter] = useState<string>('');
  const [productNameFilter, setProductNameFilter] = useState<string>('');

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch product verification history using React Query
  const { 
    data: verifications = [], 
    isLoading: verificationsLoading, 
    error: verificationsError,
    refetch
  } = useQuery<ProductVerificationDetail[], Error>({
    queryKey: ['productVerifications', orgId?.toText()], 
    queryFn: async () => {
      if (!actor || !orgId) {
        logger.warn("[UserScansPage] Actor or OrgID not available, skipping verification fetch.");
        return []; 
      }
      logger.debug(`[UserScansPage] Fetching verifications for org: ${orgId.toText()}`);
      try {
        const result: ProductVerificationDetail[] = await actor.list_product_verifications_by_org_id(orgId);
        logger.debug(`[UserScansPage] Fetched ${result.length} verifications.`);
        // Sort directly on the DID type array
        return result.sort((a, b) => Number(b.created_at) - Number(a.created_at));
      } catch (e) {
        logger.error("[UserScansPage] Error fetching verifications:", e);
        throw e;
      }
    },
    enabled: !!actor && !!orgId && isAuthenticated, 
  });

  // Refetch data when auth context finishes loading or orgId changes
  useEffect(() => {
    if (isAuthenticated && actor && orgId && !authLoading) {
        logger.debug("[UserScansPage] Auth loaded, attempting to refetch verifications.");
        refetch();
    }
  }, [isAuthenticated, actor, orgId, authLoading, refetch]);

  // Apply filters to verification records
  const filteredVerifications = useMemo(() => {
    return verifications.filter(verification => {
      const unwrappedUserEmail = unwrapOptional(verification.user_email);
      const userEmailForFilter = unwrappedUserEmail?.toLowerCase() || '';
      const internetIdMatch = 
        internetIdFilter === '' || 
        userEmailForFilter.includes(internetIdFilter.toLowerCase());

      const serialNumberString = verification.serial_no.toText().toLowerCase();
      const serialNumberMatch = 
        serialNumberFilter === '' || 
        serialNumberString.includes(serialNumberFilter.toLowerCase());

      const productIdString = verification.product_id.toText().toLowerCase();
      const productIdMatch = 
        productIdFilter === '' || 
        productIdString.includes(productIdFilter.toLowerCase());
      
      const productNameMatch = 
        productNameFilter === '' || 
        verification.product_name.toLowerCase().includes(productNameFilter.toLowerCase());
      
      return internetIdMatch && serialNumberMatch && productIdMatch && productNameMatch;
    });
  }, [verifications, internetIdFilter, serialNumberFilter, productIdFilter, productNameFilter]);

  // Calculate total pages for pagination based on filtered results
  const totalPages = Math.ceil(filteredVerifications.length / ITEMS_PER_PAGE);

  // Paginate the filtered verification records
  const paginatedVerifications = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredVerifications.slice(startIndex, endIndex);
  }, [filteredVerifications, currentPage]);

  // Handle page change from pagination component
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handler for clearing all filters
  const handleClearFilters = () => {
    setInternetIdFilter('');
    setSerialNumberFilter('');
    setProductIdFilter('');
    setProductNameFilter('');
    setCurrentPage(1); // Reset to first page when filters clear
  };

  // Handle refresh button click
  const handleRefresh = () => {
    logger.debug("[UserScansPage] Refresh button clicked.");
    refetch(); // Trigger a refetch of the data
  };

  // Combined loading state
  const isLoading = authLoading || verificationsLoading;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">User Scan History</h1>

      {/* Filters Section - Adjusted for User Management */}
      <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-lg font-medium">Filter Scan History</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label htmlFor="internet-id-filter" className="text-sm font-medium text-gray-700">User Email</label>
            <Input 
              id="internet-id-filter" 
              placeholder="Enter User Email"
              value={internetIdFilter} 
              onChange={(e) => {
                setInternetIdFilter(e.target.value);
                setCurrentPage(1);
              }}
              disabled={isLoading}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="serial-number-filter" className="text-sm font-medium text-gray-700">Serial Number</label>
            <Input 
              id="serial-number-filter" 
              placeholder="Enter Serial Number" 
              value={serialNumberFilter} 
              onChange={(e) => {
                setSerialNumberFilter(e.target.value);
                setCurrentPage(1);
              }}
              disabled={isLoading}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="product-id-filter" className="text-sm font-medium text-gray-700">Product ID</label>
            <Input 
              id="product-id-filter" 
              placeholder="Enter Product Principal ID" 
              value={productIdFilter} 
              onChange={(e) => {
                setProductIdFilter(e.target.value);
                setCurrentPage(1);
              }}
              disabled={isLoading}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="product-name-filter" className="text-sm font-medium text-gray-700">Product Name</label>
            <Input 
              id="product-name-filter" 
              placeholder="Enter Product Name" 
              value={productNameFilter} 
              onChange={(e) => {
                setProductNameFilter(e.target.value);
                setCurrentPage(1);
              }}
              disabled={isLoading}
              className="mt-1"
            />
          </div>
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleClearFilters} 
              disabled={isLoading || (internetIdFilter === '' && serialNumberFilter === '' && productIdFilter === '' && productNameFilter === '')}
              className="flex-1 mt-1"
            >
              Clear
            </Button>
            <Button 
              onClick={handleRefresh} 
              disabled={isLoading}
              className="flex-1 mt-1"
            >
              {verificationsLoading ? <LoadingSpinner size="sm"/> : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* Verifications Table Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">Verification Records</h2>
          {filteredVerifications.length > 0 && (
            <p className="text-sm text-gray-500">
              Showing {paginatedVerifications.length} of {filteredVerifications.length} records
            </p>
          )}
        </div>
        
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Email</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Product ID</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Scan Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <LoadingSpinner /> {/* Show spinner while loading */}
                  </TableCell>
                </TableRow>
              ) : verificationsError ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-red-600">
                    {/* Display error message if fetching fails */}
                    Error loading verification history: {verificationsError.message}
                  </TableCell>
                </TableRow>
              ) : paginatedVerifications.length > 0 ? (
                // Map through paginated results and render table rows
                paginatedVerifications.map((verification, index) => {
                  const userEmailDisplay = unwrapOptional(verification.user_email) || 'Anonymous';
                  return (
                    <TableRow key={`${verification.serial_no.toText()}-${index}-${verification.product_id.toText()}`}> 
                      <TableCell className="font-mono text-xs" title={userEmailDisplay}>
                        {userEmailDisplay} 
                      </TableCell>
                      <TableCell className="font-mono text-xs" title={verification.serial_no.toText()}>
                        {formatPrincipal(verification.serial_no)}
                      </TableCell>
                      <TableCell className="font-mono text-xs" title={verification.product_id.toText()}>
                        {formatPrincipal(verification.product_id)}
                      </TableCell>
                      {/* Display product name */}
                      <TableCell>{verification.product_name}</TableCell>
                      {/* Display formatted timestamp */}
                      <TableCell>{formatTimestamp(verification.created_at)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {/* Message when no data matches filters or no data exists */}
                    {verifications.length === 0 
                      ? "No verification records found for this organization."
                      : "No records match your current filters."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Controls - only show if more than one page */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
};

export default UserManagementPage; 