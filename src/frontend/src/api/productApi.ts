/**
 * @file Product API client
 * @fileoverview API client for product-related operations including verification
 * 
 * Functions:
 * - verifyProduct: Verifies a product using its unique code
 * - getProductDetails: Gets details of a product
 * - parseVerificationCode: Parses a verification code into its components
 * 
 * Constants:
 * - None
 * 
 * Flow:
 * 1. Parse verification code
 * 2. Call appropriate backend API methods
 * 3. Handle response formatting
 * 
 * Error Handling:
 * - API call failures
 * - Invalid code format
 * - Backend errors
 * 
 * @module api/productApi
 * @requires declarations/TrustOrigin_backend - Backend API declarations
 * @exports productApi - Product API client methods
 */

import { TrustOrigin_backend } from "../../../declarations/TrustOrigin_backend";
import { Principal } from "@dfinity/principal";
import type { Metadata, ProductVerificationStatus } from "../../../declarations/TrustOrigin_backend/TrustOrigin_backend.did";

interface VerificationResult {
  status: ProductVerificationStatus;
  productInfo?: {
    id: string;
    name: string;
    description: string;
    category: string;
    organization: string;
    metadata: Record<string, string>;
  };
  error?: string;
}

interface VerificationCodeComponents {
  productId: Principal;
  serialNo: Principal;
  printVersion: number;
  uniqueCode: string;
  valid: boolean;
}

/**
 * Parse a verification code into its components
 * 
 * @param {string} code - The verification code to parse
 * @returns {VerificationCodeComponents} Parsed components of the verification code
 */
const parseVerificationCode = (code: string): VerificationCodeComponents => {
  try {
    // Format should be: productId:serialNo:printVersion:uniqueCode
    const parts = code.split(':');
    
    if (parts.length !== 4) {
      return {
        productId: Principal.anonymous(),
        serialNo: Principal.anonymous(),
        printVersion: 0,
        uniqueCode: '',
        valid: false
      };
    }
    
    return {
      productId: Principal.fromText(parts[0]),
      serialNo: Principal.fromText(parts[1]),
      printVersion: parseInt(parts[2], 10),
      uniqueCode: parts[3],
      valid: true
    };
  } catch (error) {
    console.error("Failed to parse verification code:", error);
    return {
      productId: Principal.anonymous(),
      serialNo: Principal.anonymous(),
      printVersion: 0,
      uniqueCode: '',
      valid: false
    };
  }
};

/**
 * Convert metadata array to a key-value object
 * 
 * @param {Metadata[]} metadata - Array of metadata objects
 * @returns {Record<string, string>} Metadata as key-value object
 */
const metadataToObject = (metadata: Metadata[]): Record<string, string> => {
  return metadata.reduce((obj, item) => {
    obj[item.key] = item.value;
    return obj;
  }, {} as Record<string, string>);
};

/**
 * Verify a product using its verification code
 * 
 * @param {string} verificationCode - The code from the QR scan
 * @returns {Promise<VerificationResult>} Result of verification
 * @example
 * const result = await verifyProduct("abc123:def456:1:xyz789");
 */
const verifyProduct = async (verificationCode: string): Promise<VerificationResult> => {
  try {
    const { productId, serialNo, printVersion, uniqueCode, valid } = parseVerificationCode(verificationCode);
    
    if (!valid) {
      return {
        status: { Invalid: null },
        error: "Invalid verification code format"
      };
    }
    
    // Additional metadata for verification
    const metadata: Metadata[] = [
      { key: "source", value: "frontend-verification" },
      { key: "timestamp", value: Date.now().toString() }
    ];
    
    // Call backend verification API
    const result = await TrustOrigin_backend.verify_product(
      productId,
      serialNo,
      printVersion,
      uniqueCode,
      metadata
    );
    
    if ('error' in result) {
      return {
        status: { Invalid: null },
        error: result.error.message
      };
    }
    
    // Get product details if verification was successful
    if ('status' in result) {
      const productResult = await TrustOrigin_backend.get_product_by_id(productId);
      
      if ('product' in productResult) {
        const product = productResult.product;
        const organization = await TrustOrigin_backend.get_organization_by_id(product.org_id);
        
        return {
          status: result.status,
          productInfo: {
            id: product.id.toString(),
            name: product.name,
            description: product.description,
            category: product.category,
            organization: organization.name,
            metadata: metadataToObject(product.metadata)
          }
        };
      }
      
      return {
        status: result.status
      };
    }
    
    return {
      status: { Invalid: null },
      error: "Unknown error during verification"
    };
  } catch (error) {
    console.error("Product verification failed:", error);
    return {
      status: { Invalid: null },
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

/**
 * Get product details by ID
 * 
 * @param {string} productId - The ID of the product
 * @returns {Promise<any>} Product details
 */
const getProductDetails = async (productId: string) => {
  try {
    const principal = Principal.fromText(productId);
    const result = await TrustOrigin_backend.get_product_by_id(principal);
    
    if ('product' in result) {
      const product = result.product;
      const organization = await TrustOrigin_backend.get_organization_by_id(product.org_id);
      
      return {
        id: product.id.toString(),
        name: product.name,
        description: product.description,
        category: product.category,
        organization: organization.name,
        metadata: metadataToObject(product.metadata)
      };
    }
    
    throw new Error('Product not found');
  } catch (error) {
    console.error("Failed to get product details:", error);
    throw error;
  }
};

export const productApi = {
  verifyProduct,
  getProductDetails,
  parseVerificationCode
}; 