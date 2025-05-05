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
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { TrustOrigin_backend } from '../../../../declarations/TrustOrigin_backend';
import { Reseller } from '../../../../declarations/TrustOrigin_backend/TrustOrigin_backend.did';
import { useAuthContext } from '@/contexts/useAuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Assuming Select might be needed for status filter later
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/Pagination';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { format } from 'date-fns';

// Constants
const ITEMS_PER_PAGE = 10;

const ResellerManagementPage: React.FC = () => {
  const { selectedOrgId, isLoading: authLoading } = useAuthContext();
  const orgId = selectedOrgId;

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
  }: UseQueryResult<Reseller[], Error> = useQuery<Reseller[], Error, Reseller[], readonly unknown[]>({
    queryKey: ['resellers', orgId?.toString()],
    queryFn: async (): Promise<Reseller[]> => {
      if (!orgId) return [];
      const result = await TrustOrigin_backend.list_resellers_by_org_id(orgId);
      // Keep date_joined as bigint, handle potential undefined values
      return result.map(reseller => ({
        ...reseller,
        date_joined: reseller.date_joined ?? BigInt(0), // Provide a BigInt fallback or handle appropriately
        public_key: reseller.public_key ?? 'N/A' // Ensure public_key has a fallback
      }));
    },
    enabled: !!orgId, // Only run query if orgId is available
  });

  // Retry fetching resellers when auth loads or orgId changes
  useEffect(() => {
    if (!authLoading && orgId) {
      refetch();
    }
  }, [authLoading, orgId, refetch]);

  // Apply filters to resellers (client-side)
  const filteredResellers = useMemo(() => {
    // Ensure resellers is an array before filtering
    if (!Array.isArray(resellers)) return []; 
    return resellers.filter((reseller: Reseller) => { // Explicitly type reseller
      const nameMatch = 
        nameFilter === '' || 
        reseller.name.toLowerCase().includes(nameFilter.toLowerCase());
      
      const resellerIdString = reseller.id.toString().toLowerCase();
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
    refetch();
  };

  // Determine loading state
  const isLoading = authLoading || resellersLoading;

  // Function to safely format date from bigint
  const formatDate = (timestamp: bigint): string => {
    if (timestamp === undefined || timestamp === null) return 'N/A';
    try {
      // Convert BigInt to Number for Date constructor
      const numericTimestamp = Number(timestamp);
      // Assuming timestamp is in nanoseconds, convert to milliseconds
      const date = new Date(numericTimestamp / 1_000_000); 
      if (isNaN(date.getTime())) { // Check if date is valid
        return 'Invalid Date';
      }
      return format(date, 'PPpp'); // Example format: Sep 18, 2023, 3:30:00 PM
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid Date';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Reseller Management</h1>

      {/* Filters Section */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-lg font-medium">Filter Resellers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="text-sm font-medium">Date Joined</label>
            <Input 
              placeholder="Select Date" 
              disabled 
              title="Date filter not implemented yet"
            />
          </div>
          <div>
            {/* Placeholder for Status/Certification Filter */}
            <label htmlFor="status-filter" className="text-sm font-medium">Certification Status</label>
             <Select 
              value={statusFilter} 
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              disabled // Disable until implemented
            >
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {/* Add status options here when available */}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="reseller-id-filter" className="text-sm font-medium">Reseller ID</label>
            <Input 
              id="reseller-id-filter" 
              placeholder="Enter Reseller ID" 
              value={resellerIdFilter} 
              onChange={(e) => {
                setResellerIdFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
           <div>
            <label htmlFor="reseller-name-filter" className="text-sm font-medium">Reseller Name</label>
            <Input 
              id="reseller-name-filter" 
              placeholder="Enter Name" 
              value={nameFilter} 
              onChange={(e) => {
                setNameFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleClearFilters} 
              disabled={isLoading}
              className="flex-1"
            >
              Clear
            </Button>
            <Button 
              onClick={handleRefresh} 
              disabled={isLoading}
              className="flex-1"
            >
              Refresh
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
        
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reseller Name</TableHead>
                <TableHead>Certification</TableHead> {/* Placeholder Column */}
                <TableHead>Reseller ID</TableHead>
                <TableHead>Date Joined</TableHead>
                <TableHead>ECDSA Public Key</TableHead>
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
                paginatedResellers.map((reseller: Reseller) => ( // Explicitly type reseller
                  <TableRow key={reseller.id.toString()}>
                    <TableCell>{reseller.name}</TableCell>
                    <TableCell>
                      {/* Placeholder for certification status */}
                      <span className="text-gray-400 italic">N/A</span> 
                    </TableCell> 
                    <TableCell className="font-mono text-xs">
                      {reseller.id.toString()}
                    </TableCell>
                    <TableCell>
                      {formatDate(reseller.date_joined)}
                    </TableCell>
                    <TableCell className="truncate max-w-xs font-mono text-xs">
                      {reseller.public_key}
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