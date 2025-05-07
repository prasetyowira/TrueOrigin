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
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'; // Import download icon
import { QRCodeSVG } from 'qrcode.react';
import ReactDOMServer from 'react-dom/server';

// Import assets for the certificate
import certificateLogo from '@/assets/product-certificate-logo.svg';
import certificateBgSvg from '@/assets/product-certificate-bg.svg';

// Constants
const ITEMS_PER_PAGE = 10;

const ProductsPage: React.FC = () => {
  const { actor, brandOwnerDetails, isLoading: authLoading, isAuthenticated } = useAuth();
  const orgId = brandOwnerDetails?.active_organization?.id; // This is Principal | undefined
  const orgName = brandOwnerDetails?.active_organization?.name || 'Brand Owner';
  
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

  // Function to download certificate
  const downloadCertificate = (product: Product) => {
    // Open a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      logger.error('Could not open print window. Please check if popup blockers are enabled');
      return;
    }
    
    // Generate QR code as SVG string
    const qrCodeSvg = ReactDOMServer.renderToString(
      <QRCodeSVG 
        value={product.public_key || 'No Public Key'} 
        size={150}
        bgColor="#FFFFFF"
        fgColor="#000000"
        level="H"
      />
    );
    
    // Truncate product key for display
    const truncatedKey = product.public_key ? 
      `KEY: ${product.public_key.substring(0, 5)}...${product.public_key.substring(product.public_key.length - 5)}` : 
      'KEY: N/A';
    
    // Format date like in ProductCertificate component
    const date = new Date();
    const day = date.getDate();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const formattedDate = `${day}-${month}-${year} ${hours}:${minutes}`;
    
    // Prepare the certificate HTML that matches ProductCertificate.tsx exactly
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${product.name} Certificate</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
            
            @media print {
              @page {
                size: landscape;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: 'Manrope', sans-serif;
              background-color: #f5f5f5;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            
            .certificate-wrapper {
              width: 800px;
              height: 600px;
              background-color: white;
              padding: 32px;
              display: flex;
              flex-direction: column;
            }
            
            .certificate-container {
              width: 100%;
              height: 100%;
              border: 4px solid black;
              border-radius: 12px;
              display: flex;
              overflow: hidden;
            }
            
            .left-section {
              width: 60%;
              background-color: #594748;
              color: white;
              padding: 24px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
            }
            
            .qr-container {
              background-color: white;
              padding: 16px;
              border-radius: 8px;
            }
            
            .qr-inner {
              width: 150px;
              height: 150px;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            
            .product-details {
              text-align: center;
              width: 100%;
            }
            
            .product-name {
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 8px;
            }
            
            .product-category {
              font-size: 18px;
              margin-bottom: 4px;
            }
            
            .product-key {
              font-size: 14px;
              color: #e0e0e0;
              margin-bottom: 16px;
            }
            
            .verification-date {
              font-size: 12px;
              color: #cccccc;
            }
            
            .branding {
              text-align: center;
            }
            
            .protected-by {
              font-size: 20px;
              font-weight: 700;
              margin-bottom: 8px;
            }
            
            .company-name {
              font-size: 24px;
              font-weight: 800;
            }
            
            .right-section {
              width: 40%;
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            
            .right-overlay {
              position: absolute;
              inset: 0;
              background-color: #594748;
              opacity: 0.7;
            }
            
            .watermark {
              position: absolute;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              pointer-events: none;
              z-index: 1;
            }
            
            .watermark-inner {
              transform: rotate(-45deg);
              color: white;
              opacity: 0.1;
              display: flex;
              flex-direction: column;
            }
            
            .watermark-row {
              display: flex;
            }
            
            .genuine-text {
              font-size: 24px;
              font-weight: 700;
              padding: 0 16px;
            }
            
            .brand-name {
              position: absolute;
              bottom: 32px;
              right: 32px;
              color: white;
              font-size: 20px;
              font-weight: 700;
              text-align: right;
              z-index: 2;
            }
            
            .print-controls {
              margin-top: 24px;
              display: flex;
              justify-content: center;
              gap: 16px;
            }
            
            @media print {
              .print-controls {
                display: none;
              }
            }
            
            .print-button {
              padding: 12px 24px;
              background-color: #594748;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-weight: 700;
              font-size: 16px;
            }
            
            .print-button:hover {
              background-color: #6e585a;
            }
          </style>
        </head>
        <body>
          <div class="certificate-wrapper">
            <div class="certificate-container">
              <!-- Left Section (60%) -->
              <div class="left-section">
                <!-- QR Code -->
                <div class="qr-container">
                  <div class="qr-inner">
                    ${qrCodeSvg}
                  </div>
                </div>
                
                <!-- Product Details -->
                <div class="product-details">
                  <div class="product-name">${product.name}</div>
                  <div class="product-category">${product.category}</div>
                  <div class="product-key">${truncatedKey}</div>
                  <div class="verification-date">Verified on ${formattedDate}</div>
                </div>
                
                <!-- Branding -->
                <div class="branding">
                  <div class="protected-by">Protected by</div>
                  <div class="company-name">TrueOrigin</div>
                </div>
              </div>
              
              <!-- Right Section (40%) -->
              <div class="right-section">
                <!-- Background overlay -->
                <div class="right-overlay"></div>
                
                <!-- Watermarks -->
                <div class="watermark">
                  <div class="watermark-inner">
                    ${Array(8).fill(0).map(() => `
                      <div class="watermark-row">
                        ${Array(4).fill(0).map(() => `<span class="genuine-text">Genuine</span>`).join('')}
                      </div>
                    `).join('')}
                  </div>
                </div>
                
                <!-- Brand Name -->
                <div class="brand-name">${orgName}</div>
              </div>
            </div>
          </div>
          
          <div class="print-controls">
            <button class="print-button" onclick="window.print()">Print Certificate</button>
            <button class="print-button" onclick="window.close()">Close</button>
          </div>
          
          <script>
            // Auto-print when loaded
            window.onload = function() {
              // Small delay to ensure rendering is complete
              setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    logger.info(`Certificate preview opened for product: ${product.id.toText()}`);
  };

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
                <TableHead className="w-[20%]">Description</TableHead>
                <TableHead className="w-[15%]">Product ID</TableHead>
                <TableHead className="w-[20%]">ECDSA Public Key</TableHead>
                <TableHead className="w-[10%] text-right">Actions</TableHead> 
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <LoadingSpinner />
                  </TableCell>
                </TableRow>
              ) : productsError ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-red-600">
                    Error loading products: {productsError.message}
                  </TableCell>
                </TableRow>
              ) : paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <TableRow key={product.id.toText()}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-gray-600">{product.description}</TableCell>
                    <TableCell className="font-mono text-xs">{product.id.toText()}</TableCell>
                    <TableCell className="truncate max-w-xs font-mono text-xs">{product.public_key || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => downloadCertificate(product)}
                        title="Download Product Certificate"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-gray-500">
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
