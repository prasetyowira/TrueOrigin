/**
 * @file Product verification page
 * @fileoverview Public page for verifying product authenticity using QR codes
 * 
 * Functions:
 * - VerifyPage: Main verification page component
 * - StatusBadge: Displays verification status
 * - ProductInfo: Displays product information
 * 
 * Constants:
 * - None
 * 
 * Flow:
 * 1. User scans product QR code using camera
 * 2. Code is verified with backend API
 * 3. Verification result is displayed to the user
 * 4. Additional product details are shown if authentic
 * 
 * Error Handling:
 * - Camera permission errors
 * - QR code scanning errors
 * - API verification errors
 * - Invalid code format errors
 * 
 * @module pages/verify
 * @requires components/QRCodeScanner - QR code scanner component
 * @requires api/productApi - Product verification API
 * @exports {FC} VerifyPage - Product verification page component
 */

import React from 'react';
import { useState } from 'react';
import QRCodeScanner from '@/components/QRCodeScanner';
import { productApi } from '@/api/productApi';
import type { ProductVerificationStatus } from '@declarations/TrustOrigin_backend/TrustOrigin_backend.did';
import { Link } from 'react-router-dom';

interface VerificationState {
  status: ProductVerificationStatus | null;
  isLoading: boolean;
  error: string | null;
  productInfo: any | null;
}

/**
 * Status badge component for verification results
 * 
 * @param {object} props - Component props
 * @param {ProductVerificationStatus | null} props.status - Verification status
 * @returns {JSX.Element} Status badge component
 */
const StatusBadge = ({ status }: { status: ProductVerificationStatus | null }) => {
  if (!status) return null;

  if ('FirstVerification' in status) {
    return (
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative flex items-center">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <strong>Authentic Product</strong> - First verification
      </div>
    );
  }

  if ('MultipleVerification' in status) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative flex items-center">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <strong>Authentic Product</strong> - Previously verified
      </div>
    );
  }

  if ('Invalid' in status) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <strong>Invalid Product</strong> - Verification failed
      </div>
    );
  }

  return null;
};

/**
 * Product information component
 * 
 * @param {object} props - Component props
 * @param {any} props.product - Product information
 * @returns {JSX.Element} Product information component
 */
const ProductInfo = ({ product }: { product: any }) => {
  if (!product) return null;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-4">
      <h2 className="text-xl font-semibold mb-4">{product.name}</h2>
      
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-500">Description</h3>
        <p className="mt-1">{product.description}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Category</h3>
          <p className="mt-1">{product.category}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Manufacturer</h3>
          <p className="mt-1">{product.organization}</p>
        </div>
      </div>
      
      {product.metadata && Object.keys(product.metadata).length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Additional Details</h3>
          <div className="bg-gray-50 rounded p-3">
            {Object.entries(product.metadata).map(([key, value]) => (
              <div key={key} className="grid grid-cols-2 gap-2 mb-1">
                <span className="text-sm font-medium">{key}:</span>
                <span className="text-sm">{value as string}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Product verification page with QR scanner
 * 
 * @returns {JSX.Element} Verification page component
 */
const VerifyPage: React.FC = () => {
  const [verification, setVerification] = useState<VerificationState>({
    status: null,
    isLoading: false,
    error: null,
    productInfo: null
  });
  const [showScanner, setShowScanner] = useState(true);

  const handleScan = async (result: string) => {
    try {
      setVerification({
        ...verification,
        isLoading: true,
        error: null
      });
      
      // Temporarily hide the scanner to prevent multiple scans
      setShowScanner(false);
      
      // Verify the product
      const verificationResult = await productApi.verifyProduct(result);
      
      setVerification({
        status: verificationResult.status,
        isLoading: false,
        error: verificationResult.error || null,
        productInfo: verificationResult.productInfo || null
      });
    } catch (error) {
      setVerification({
        ...verification,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const handleScanError = (error: string) => {
    setVerification({
      ...verification,
      isLoading: false,
      error
    });
  };

  const resetScanner = () => {
    setVerification({
      status: null,
      isLoading: false,
      error: null,
      productInfo: null
    });
    setShowScanner(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Verify Product Authenticity</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-700">
          Product verification functionality will be implemented here. Users will be able to scan QR codes or enter codes manually.
        </p>
        {/* Placeholder for QR Scanner or input field */}
        <div className="mt-6 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <p className="text-gray-500">QR Code Scanner / Code Input Area</p>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage; 