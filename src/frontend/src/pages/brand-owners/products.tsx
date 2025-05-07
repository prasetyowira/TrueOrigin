/**
 * @file Brand Owner Products Page
 * @fileoverview Allows authenticated brand owners to view their products for the selected organization.
 * 
 * Functions:
 * - ProductsPage: Main page component
 * 
 * Constants:
 * - ITEMS_PER_PAGE: Number of items per page
 * 
 * Flow:
 * 1. Get authenticated actor and selected organization ID from auth context.
 * 2. Fetch products for the organization using the actor.
 * 3. Display products in a filterable and paginated table.
 * 
 * Error Handling:
 * - Displays loading states for auth and product fetching.
 * - Shows error messages if product fetching fails.
 * 
 * @module pages/brand-owners/products
 * @requires @tanstack/react-query - For data fetching
 * @requires @/contexts/AuthContext - For actor and org ID
 * @exports {FC} ProductsPage - Products page component
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
// Import Product type directly from declarations
import type { Product } from '@declarations/TrustOrigin_backend/TrustOrigin_backend.did';
// Import Principal from @dfinity/principal
import { Principal } from '@dfinity/principal';
// Use the new useAuth hook
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/Pagination';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { logger } from '@/utils/logger'; // Import logger

// Constants
const ITEMS_PER_PAGE = 10;

const ProductsPage: React.FC = () => {
  const { actor, brandOwnerDetails, isLoading: authLoading, isAuthenticated } = useAuth();
  const orgId = brandOwnerDetails?.active_organization?.id; // This is Principal | undefined

  // State for filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [productIdFilter, setProductIdFilter] = useState<string>('');

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch products using React Query
  const { 
    data: products = [], 
    isLoading: productsLoading, 
    error: productsError,
    refetch
  } = useQuery<Product[], Error>({
    queryKey: ['products', orgId?.toText()], // Use toText() for query key if orgId is Principal
    queryFn: async () => {
      if (!actor || !orgId) {
        // actor from useAuth might be initially anonymous. 
        // We need to ensure it's the authenticated actor for this call.
        // However, useAuth().actor should be updated by AuthContext upon login.
        logger.warn("[ProductsPage] Actor or Organization ID not available, skipping product fetch.");
        return []; 
      }
      logger.debug(`[ProductsPage] Fetching products for org: ${orgId.toText()}`);
      try {
        const result = await actor.list_products(orgId);
        logger.debug(`[ProductsPage] Fetched ${result.length} products.`);
        return result;
      } catch (e) {
        logger.error("[ProductsPage] Error fetching products:", e);
        throw e; // Re-throw so React Query handles it as an error
      }
    },
    enabled: !!actor && !!orgId && isAuthenticated, // Ensure user is authenticated too
  });

  // Refetch products when actor or orgId changes (after initial auth load)
  useEffect(() => {
    if (isAuthenticated && actor && orgId && !authLoading) {
      logger.debug("[ProductsPage] Auth loaded and actor/orgId present, refetching products.");
      refetch();
    }
  }, [isAuthenticated, actor, orgId, authLoading, refetch]);

  // Extract unique categories from products
  const categories = useMemo(() => {
    if (!products) return [];
    const uniqueCategories = new Set(products.map(p => p.category));
    return Array.from(uniqueCategories);
  }, [products]);

  // Apply filters to products
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product => {
      // Category filter - match 'all' or exact category
      const categoryMatch = 
        categoryFilter === 'all' || 
        product.category.toLowerCase() === categoryFilter.toLowerCase();
      
      // Product ID filter - case insensitive search on Principal ID string
      const productIdString = product.id.toText().toLowerCase(); // Use toText() for Principal
      const productIdMatch = 
        productIdFilter === '' || 
        productIdString.includes(productIdFilter.toLowerCase());
      
      return categoryMatch && productIdMatch;
    });
  }, [products, categoryFilter, productIdFilter]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  // Paginate the filtered products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);

  // Handle page change from pagination component
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handler for clearing all filters
  const handleClearFilters = () => {
    setCategoryFilter('all');
    setProductIdFilter('');
    setCurrentPage(1);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    logger.debug("[ProductsPage] Refresh button clicked.");
    refetch();
  };

  // Handle loading state (auth loading or products loading)
  // Consider a more specific loading state if needed
  const isLoading = authLoading || productsLoading;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Product Management</h1>

      {/* Filters Section */}
      <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-lg font-medium">Filter Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Date Filter - Placeholder */}
          <div>
            <label className="text-sm font-medium text-gray-700">Date</label>
            <Input 
              placeholder="Select Date" 
              disabled 
              title="Date filter not implemented yet"
              className="mt-1"
            />
          </div>
          {/* Category Filter */}
          <div>
            <label htmlFor="category-filter" className="text-sm font-medium text-gray-700">Category</label>
            <Select 
              value={categoryFilter} 
              onValueChange={(value) => {
                setCategoryFilter(value);
                setCurrentPage(1);
              }}
              disabled={isLoading}
            >
              <SelectTrigger id="category-filter" className="mt-1">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Product ID Filter */}
          <div>
            <label htmlFor="product-id-filter" className="text-sm font-medium text-gray-700">Product ID</label>
            <Input 
              id="product-id-filter" 
              placeholder="Enter Product ID" 
              value={productIdFilter} 
              onChange={(e) => {
                setProductIdFilter(e.target.value);
                setCurrentPage(1);
              }}
              disabled={isLoading}
              className="mt-1"
            />
          </div>
          {/* Other Filters - Placeholder */}
          <div>
            <label htmlFor="other-filters" className="text-sm font-medium text-gray-700">Other Filters</label>
            <Input 
              id="other-filters" 
              placeholder="Other Filters" 
              disabled 
              title="Other filters not implemented yet"
              className="mt-1"
            />
          </div>
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleClearFilters} 
              disabled={isLoading || (categoryFilter === 'all' && productIdFilter === '')}
              className="flex-1 mt-1"
            >
              Clear
            </Button>
            <Button 
              onClick={handleRefresh} 
              disabled={isLoading}
              className="flex-1 mt-1"
            >
              {productsLoading ? <LoadingSpinner size="sm"/> : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* Products Table Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">Product List</h2>
          {!isLoading && products && (
            <p className="text-sm text-gray-500">
              Showing {paginatedProducts.length} of {filteredProducts.length} products
            </p>
          )}
        </div>
        
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[20%]">Product Name</TableHead>
                <TableHead className="w-[15%]">Category</TableHead>
                <TableHead className="w-[25%]">Description</TableHead>
                <TableHead className="w-[20%]">Product ID</TableHead>
                <TableHead className="w-[20%]">ECDSA Public Key</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <LoadingSpinner />
                  </TableCell>
                </TableRow>
              ) : productsError ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-red-600">
                    Error loading products: {productsError.message}
                  </TableCell>
                </TableRow>
              ) : paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => (<TableRow key={product.id.toText()}><TableCell className="font-medium">{product.name}</TableCell><TableCell>{product.category}</TableCell><TableCell className="max-w-xs truncate text-sm text-gray-600">{product.description}</TableCell><TableCell className="font-mono text-xs">{product.id.toText()}</TableCell><TableCell className="truncate max-w-xs font-mono text-xs">{product.public_key || 'N/A'}</TableCell></TableRow>))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-gray-500">
                    {products && products.length === 0 
                      ? "No products found for this organization. Add products to get started."
                      : "No products match your current filters."} 
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

export default ProductsPage;
