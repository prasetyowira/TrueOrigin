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

    // Find initial_unique_code from product metadata
    const initialUniqueCodeMeta = product.metadata.find(meta => meta.key === 'initial_unique_code');
    const qrCodeValue = initialUniqueCodeMeta ? initialUniqueCodeMeta.value : 'No Unique Code Available';
    
    // Generate QR code as SVG string
    const qrCodeSvg = ReactDOMServer.renderToString(
      <QRCodeSVG 
        value={qrCodeValue} 
        size={180}
        bgColor="#FFFFFF"
        fgColor="#000000"
        level="H"
      />
    );
    
    // Truncate unique code for display, or use a placeholder
    const displayCode = initialUniqueCodeMeta && initialUniqueCodeMeta.value
      ? initialUniqueCodeMeta.value.substring(0, 8)
      : 'NO-CODE';
    
    // Format date like in ProductCertificate component
    const date = new Date();
    const day = date.getDate();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const formattedDate = `${day}-${month}-${year} ${hours}:${minutes}`;
    
    // Write the certificate to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Product Certificate</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
            
            body {
              font-family: 'Manrope', sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #f5f5f5;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            
            .certificate-container {
              position: relative;
              width: 400px;
              height: 600px;
              margin: 20px auto;
              overflow: hidden;
              background-color: #594748;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            
            .gradient-overlay {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, 
                rgba(238, 224, 242, 0.56) 27%, 
                rgba(241, 230, 247, 0.9) 44%, 
                rgba(241, 232, 248, 1) 48%, 
                rgba(241, 232, 248, 1) 54%, 
                rgba(226, 217, 231, 0.92) 60%, 
                rgba(167, 162, 167, 0.63) 68%, 
                rgba(44, 31, 44, 1) 84%);
              z-index: 1;
            }
            
            .genuine-watermark {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              align-items: center;
              z-index: 2;
              opacity: 0.3;
              transform: rotate(-10deg);
              overflow: hidden;
            }
            
            .genuine-text {
              color: #9E8351;
              font-size: 11px;
              font-weight: 600;
              margin: 0 5px;
              white-space: nowrap;
              line-height: 1.8em;
            }
            
            .blur-circle {
              position: absolute;
              border-radius: 50%;
              z-index: 3;
            }
            
            .blur-circle-1 {
              width: 150px;
              height: 150px;
              background: linear-gradient(to right, #F217F1, #8C0D8B);
              top: 10%;
              left: 10%;
              filter: blur(10px);
            }
            
            .blur-circle-2 {
              width: 100px;
              height: 100px;
              background-color: rgba(111, 66, 230, 0.37);
              top: 20%;
              right: 15%;
              filter: blur(10px);
            }
            
            .blur-circle-3 {
              width: 180px;
              height: 180px;
              background: linear-gradient(to right, rgba(84, 130, 218, 0), rgba(84, 130, 218, 1), #2D4574);
              bottom: 30%;
              left: 20%;
              filter: blur(10px);
            }
            
            .blur-circle-4 {
              width: 120px;
              height: 120px;
              background-color: rgba(121, 109, 72, 0.22);
              bottom: 15%;
              right: 20%;
              filter: blur(30px);
            }
            
            .blur-circle-5 {
              width: 90px;
              height: 90px;
              background-color: rgba(72, 104, 121, 0.38);
              top: 60%;
              left: 30%;
              filter: blur(30px);
            }
            
            .content {
              position: relative;
              z-index: 5;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              padding: 40px 30px;
              box-sizing: border-box;
            }
            
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            
            .title {
              color: #DFDFDF;
              font-size: 20px;
              font-weight: 800;
              line-height: 1em;
              margin: 0;
              text-align: center;
            }
            
            .qr-container {
              background-color: white;
              border-radius: 10px;
              width: 200px;
              height: 200px;
              margin: 0 auto;
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 10px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            
            .key-text {
              color: #000000;
              font-size: 24px;
              font-weight: 700;
              line-height: 0.83;
              margin-top: 20px;
              text-align: center;
            }
            
            .footer {
              display: flex;
              justify-content: flex-start;
              align-items: center;
              margin-top: 40px;
              gap: 15px;
            }
            
            .protected-text {
              color: #000000;
              font-size: 16px;
              font-weight: 800;
              line-height: 1.25em;
            }
            
            .logo {
              height: 30px;
              opacity: 0.6;
              margin-left: auto;
            }
            
            .original-logo {
              height: 40px;
              width: auto;
              margin-top: -5px;
              opacity: 0.7;
            }
            
            .print-button {
              position: fixed;
              bottom: 20px;
              right: 20px;
              background-color: #343FF5;
              color: white;
              border: none;
              border-radius: 8px;
              padding: 10px 20px;
              font-weight: 600;
              cursor: pointer;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
              transition: all 0.2s ease;
            }
            
            .print-button:hover {
              background-color: #2a34c4;
              transform: translateY(-2px);
            }
            
            @media print {
              body {
                background: none;
                margin: 0;
                padding: 0;
              }
              
              .certificate-container {
                margin: 0;
                box-shadow: none;
                page-break-inside: avoid;
              }
              
              .print-button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <div class="gradient-overlay"></div>
            
            <div class="genuine-watermark">
              ${Array(32).fill('<span class="genuine-text">Genuine</span>').join('')}
            </div>
            
            <div class="blur-circle blur-circle-1"></div>
            <div class="blur-circle blur-circle-2"></div>
            <div class="blur-circle blur-circle-3"></div>
            <div class="blur-circle blur-circle-4"></div>
            <div class="blur-circle blur-circle-5"></div>
            
            <div class="content">
              <div class="header">
                <div class="title">Secure by<br/>True Origin</div>
              </div>
              
              <div class="qr-container">
                ${qrCodeSvg}
              </div>
              
              <div class="key-text">KEY: ${displayCode}</div>
              
              <div class="footer">
                <svg width="30" height="36" viewBox="0 0 45 54" fill="none" xmlns="http://www.w3.org/2000/svg" class="original-logo">
                  <path opacity="0.58" d="M18.5232 0.627828L5.46802 5.67749C2.4593 6.83863 0 10.5111 0 13.8325V33.896C0 37.0824 2.04073 41.2679 4.5262 43.1852L15.7762 51.8532C19.4651 54.7156 25.5349 54.7156 29.2238 51.8532L40.4739 43.1852C42.9594 41.2679 45 37.0824 45 33.896V13.8325C45 10.5111 42.5407 6.83863 39.532 5.67749L26.4768 0.627828C24.2529 -0.209276 20.6948 -0.209276 18.5232 0.627828Z" fill="black"/>
                </svg>
                <div class="protected-text">Protected by<br>TrueOrigin</div>
              </div>
            </div>
          </div>
          <button class="print-button" onclick="window.print()">Print Certificate</button>
        </body>
        <script>
          // Document is ready, focus the window
          window.focus();
          
          // Add keyboard shortcut for printing (Ctrl+P)
          document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'p') {
              e.preventDefault();
              window.print();
            }
          });
        </script>
      </html>
    `);
    
    // Close the document for writing and trigger print
    printWindow.document.close();
    
    // Focus on the print window
    setTimeout(() => {
      printWindow.focus();
    }, 300);
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
