/**
 * @file Brand Owner Reseller Management Page
 * @fileoverview Allows brand owners to view and manage their resellers
 * 
 * Functions:
 * - ResellerManagementPage: Main page component
 * 
 * Constants:
 * - ITEMS_PER_PAGE: Number of items per page
 * 
 * Flow:
 * 1. Fetch resellers for the brand owner's organization
 * 2. Display resellers in a table
 * 3. Implement filtering and pagination
 * 
 * Error Handling:
 * - Loading state for API calls
 * - Error display for failed API requests
 * 
 * @module pages/brand-owners/resellers
 * @requires TrustOrigin_backend - Backend canister
 * @exports {FC} ResellerManagementPage - Resellers page component
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
// Import types directly from declarations
import type { Reseller, Metadata as DidMetadata } from '@declarations/TrustOrigin_backend/TrustOrigin_backend.did';
import { Principal } from '@dfinity/principal'; // Corrected import
// Use the new useAuth hook
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/Pagination';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { format } from 'date-fns';
import { unwrap as unwrapOptional } from '@/hooks/useQueries/authQueries'; 
import { logger } from '@/utils/logger'; // Ensure logger is imported

// Constants
const ITEMS_PER_PAGE = 10;

const ResellerManagementPage: React.FC = () => {
  const { actor, brandOwnerDetails, isLoading: authLoading, isAuthenticated } = useAuth();
  const orgId = brandOwnerDetails?.active_organization?.id;

  // State for filters
  const [nameFilter, setNameFilter] = useState<string>('');
  const [resellerIdFilter, setResellerIdFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // Placeholder for future status filter

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch resellers using React Query with explicit type assertion for UseQueryResult
  const { 
    data: resellers = [], 
    isLoading: resellersLoading, 
    error: resellersError,
    refetch
  } = useQuery<Reseller[], Error>({
    queryKey: ['resellers', orgId?.toText()],
    queryFn: async (): Promise<Reseller[]> => {
      if (!actor || !orgId) {
        logger.warn("[ResellersPage] Actor or OrgID not available, skipping reseller fetch.");
        return [];
      }
      logger.debug(`[ResellersPage] Fetching resellers for org: ${orgId.toText()}`);
      try {
        const result: Reseller[] = await actor.list_resellers_by_org_id(orgId);
        logger.debug(`[ResellersPage] Fetched ${result.length} resellers.`);
        return result.sort((a,b) => a.name.localeCompare(b.name)); 
      } catch (e) {
        logger.error("[ResellersPage] Error fetching resellers:", e);
        throw e;
      }
    },
    enabled: !!actor && !!orgId && isAuthenticated,
  });

  // Retry fetching resellers when auth loads or orgId changes
  useEffect(() => {
    if (isAuthenticated && actor && orgId && !authLoading) {
      logger.debug("[ResellersPage] Auth loaded, attempting to refetch resellers.");
      refetch();
    }
  }, [isAuthenticated, actor, orgId, authLoading, refetch]);

  // Apply filters to resellers (client-side)
  const filteredResellers = useMemo(() => {
    // Ensure resellers is an array before filtering
    if (!Array.isArray(resellers)) return []; 
    return resellers.filter((reseller: Reseller) => { // Explicitly type reseller
      const nameMatch = 
        nameFilter === '' || 
        reseller.name.toLowerCase().includes(nameFilter.toLowerCase());
      
      const resellerIdString = reseller.id.toText().toLowerCase();
      const resellerIdMatch = 
        resellerIdFilter === '' || 
        resellerIdString.includes(resellerIdFilter.toLowerCase());

      // Placeholder for status filter logic when implemented
      const statusMatch = statusFilter === 'all'; // Always true for now

      return nameMatch && resellerIdMatch && statusMatch;
    });
  }, [resellers, nameFilter, resellerIdFilter, statusFilter]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(filteredResellers.length / ITEMS_PER_PAGE);

  // Paginate the filtered resellers
  const paginatedResellers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredResellers.slice(startIndex, endIndex);
  }, [filteredResellers, currentPage]);

  // Handle page change from pagination component
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handler for clearing all filters
  const handleClearFilters = () => {
    setNameFilter('');
    setResellerIdFilter('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    logger.debug("[ResellersPage] Refresh button clicked.");
    refetch();
  };

  // Determine loading state
  const isLoading = authLoading || resellersLoading;

  // Function to safely format date from bigint
  const formatDate = (timestampOpt: [] | [bigint] | bigint | undefined): string => {
    // First, unwrap if it's the Candid opt array form `[] | [bigint]`
    let timestamp = Array.isArray(timestampOpt) ? unwrapOptional(timestampOpt) : timestampOpt;
    
    if (timestamp === undefined || timestamp === null) return 'N/A';
    try {
      const numericTimestamp = Number(timestamp);
      // Timestamps from backend (date_joined, certification_timestamp) are Nat64 (bigint)
      // They represent nanoseconds. Convert to milliseconds for Date constructor.
      const date = new Date(numericTimestamp / 1_000_000); 
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, 'PPpp'); 
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid Date';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Reseller Management</h1>

      {/* Filters Section */}
      <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-lg font-medium">Filter Resellers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="text-sm font-medium text-gray-700">Date Joined</label>
            <Input 
              placeholder="Select Date" 
              disabled 
              title="Date filter not implemented yet"
              className="mt-1"
            />
          </div>
          <div>
            {/* Placeholder for Status/Certification Filter */}
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Certification Status</label>
             <Select 
              value={statusFilter} 
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              disabled // Disable until implemented
            >
              <SelectTrigger id="status-filter" > 
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {/* Add status options here when available */}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="reseller-id-filter" className="text-sm font-medium text-gray-700">Reseller ID</label>
            <Input 
              id="reseller-id-filter" 
              placeholder="Enter Reseller ID" 
              value={resellerIdFilter} 
              onChange={(e) => {
                setResellerIdFilter(e.target.value);
                setCurrentPage(1);
              }}
              disabled={isLoading}
              className="mt-1"
            />
          </div>
           <div>
            <label htmlFor="reseller-name-filter" className="text-sm font-medium text-gray-700">Reseller Name</label>
            <Input 
              id="reseller-name-filter" 
              placeholder="Enter Name" 
              value={nameFilter} 
              onChange={(e) => {
                setNameFilter(e.target.value);
                setCurrentPage(1);
              }}
              disabled={isLoading}
              className="mt-1"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleClearFilters} 
              disabled={isLoading || (nameFilter === '' && resellerIdFilter === '' && statusFilter === 'all')}
              className="flex-1 mt-1"
            >
              Clear
            </Button>
            <Button 
              onClick={handleRefresh} 
              disabled={isLoading}
              className="flex-1 mt-1"
            >
              {resellersLoading ? <LoadingSpinner size="sm"/> : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* Resellers Table Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">Reseller List</h2>
           {filteredResellers.length > 0 && (
            <p className="text-sm text-gray-500">
              Showing {paginatedResellers.length} of {filteredResellers.length} resellers
            </p>
          )}
        </div>
        
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reseller Name</TableHead>
                <TableHead>Certification Code</TableHead> 
                <TableHead>Reseller ID</TableHead>
                <TableHead>Date Joined</TableHead>
                <TableHead>Contact Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <LoadingSpinner /> 
                  </TableCell>
                </TableRow>
              ) : resellersError ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-red-600">
                    Error loading resellers: {resellersError.message}
                  </TableCell>
                </TableRow>
              ) : paginatedResellers.length > 0 ? (
                paginatedResellers.map((reseller: Reseller) => ( 
                  <TableRow key={reseller.id.toText()}>
                    <TableCell>{reseller.name}</TableCell>
                    <TableCell>
                      {unwrapOptional(reseller.certification_code) || 'N/A'} 
                    </TableCell> 
                    <TableCell className="font-mono text-xs">
                      {reseller.id.toText()}
                    </TableCell>
                    <TableCell>
                      {formatDate(reseller.date_joined)}
                    </TableCell>
                    <TableCell className="truncate max-w-xs">
                      {unwrapOptional(reseller.contact_email) || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {(Array.isArray(resellers) && resellers.length === 0) 
                      ? "No resellers found for this organization."
                      : "No resellers match your filters."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Controls */}
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

export default ResellerManagementPage; 