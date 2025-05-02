/**
 * @file Brand Owner Products Page
 * @fileoverview Allows brand owners to view, create, and manage their products
 * 
 * Functions:
 * - ProductsPage: Main page component
 * - ProductTable: Displays list of products in a table
 * 
 * Constants:
 * - ITEMS_PER_PAGE: Number of items per page
 * 
 * Flow:
 * 1. Fetch products for the brand owner's organization
 * 2. Display products in a table
 * 3. Enable management of existing products
 * 
 * Error Handling:
 * - Loading state for API calls
 * - Error display for failed API requests
 * - Validation for product creation/editing
 * 
 * @module pages/brand-owners/products
 * @requires TrustOrigin_backend - Backend canister
 * @exports {FC} ProductsPage - Products page component
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrustOrigin_backend } from '../../../../declarations/TrustOrigin_backend';
import { Product } from '../../../../declarations/TrustOrigin_backend/TrustOrigin_backend.did';
import { useAuthContext } from '@/contexts/useAuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/Pagination';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Constants
const ITEMS_PER_PAGE = 10;

const ProductsPage: React.FC = () => {
  // Get the authenticated user's profile from AuthContext
  const { profile, isLoading: authLoading } = useAuthContext();
  
  // Get the organization ID from the user's profile
  const orgId = useMemo(() => {
    if (!profile || !profile.org_ids || profile.org_ids.length === 0) return null;
    return profile.org_ids[0]; // Assuming first org is the relevant one
  }, [profile]);

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
    queryKey: ['products', orgId?.toString()],
    queryFn: async () => {
      if (!orgId) return [];
      const result = await TrustOrigin_backend.list_products(orgId);
      return result;
    },
    enabled: !!orgId, // Only run query if orgId is available
  });

  // Retry fetching products when auth loads or orgId changes
  useEffect(() => {
    if (!authLoading && orgId) {
      refetch();
    }
  }, [authLoading, orgId, refetch]);

  // Extract unique categories from products
  const categories = useMemo(() => {
    const uniqueCategories = new Set(products.map(p => p.category));
    return Array.from(uniqueCategories);
  }, [products]);

  // Apply filters to products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Category filter - match 'all' or exact category
      const categoryMatch = 
        categoryFilter === 'all' || 
        product.category.toLowerCase() === categoryFilter.toLowerCase();
      
      // Product ID filter - case insensitive search on Principal ID string
      const productIdString = product.id.toString().toLowerCase();
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
    refetch();
  };

  // Handle loading state (auth loading or products loading)
  const isLoading = authLoading || productsLoading;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Product Management</h1>

      {/* Filters Section */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-lg font-medium">Filter Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="text-sm font-medium">Date</label>
            <Input 
              placeholder="Select Date" 
              disabled 
              title="Date filter not implemented yet"
            />
          </div>
          <div>
            <label htmlFor="category-filter" className="text-sm font-medium">Category</label>
            <Select 
              value={categoryFilter} 
              onValueChange={(value) => {
                setCategoryFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger id="category-filter">
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
          <div>
            <label htmlFor="product-id-filter" className="text-sm font-medium">Product ID</label>
            <Input 
              id="product-id-filter" 
              placeholder="Enter Product ID" 
              value={productIdFilter} 
              onChange={(e) => {
                setProductIdFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div>
            <label htmlFor="other-filters" className="text-sm font-medium">Other Filters</label>
            <Input 
              id="other-filters" 
              placeholder="Other Filters" 
              disabled 
              title="Other filters not implemented yet"
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

      {/* Products Table Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">Product List</h2>
          {filteredProducts.length > 0 && (
            <p className="text-sm text-gray-500">
              Showing {paginatedProducts.length} of {filteredProducts.length} products
            </p>
          )}
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Product ID</TableHead>
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
              ) : productsError ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-red-600">
                    Error loading products: {productsError.message}
                  </TableCell>
                </TableRow>
              ) : paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <TableRow key={product.id.toString()}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {product.description}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {product.id.toString()}
                    </TableCell>
                    <TableCell className="truncate max-w-xs font-mono text-xs">
                      {product.public_key}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {products.length === 0 
                      ? "No products found. Add products to get started."
                      : "No products match your filters."}
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
