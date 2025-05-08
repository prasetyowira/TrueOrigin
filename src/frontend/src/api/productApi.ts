/**
 * @file Product API client
 * @fileoverview API client for product-related operations including verification
 * 
 * Functions:
 * - verifyProduct: Verifies a product using its unique code
 * - verifyProductEnhanced: Verifies a product using separate serial number and unique code
 * - getProductDetails: Gets details of a product
 * - parseVerificationCode: Parses a verification code into its components
 * - redeemReward: Submits a wallet address to redeem rewards from a verified product
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
 * @requires @dfinity/principal - Principal library for Internet Computer
 * @exports productApi - Product API client methods
 */

import { TrustOrigin_backend } from "../../../declarations/TrustOrigin_backend";
import { Principal } from "@dfinity/principal";
import type { Metadata, ProductVerificationStatus, VerificationRewards } from "../../../declarations/TrustOrigin_backend/TrustOrigin_backend.did";

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

interface EnhancedVerificationResult extends VerificationResult {
  rewards?: VerificationRewards;
}

interface ProductVerificationRequest {
  serial_no: string;
  unique_code: string;
}

interface VerificationCodeComponents {
  productId: Principal;
  serialNo: Principal;
  printVersion: number;
  uniqueCode: string;
  valid: boolean;
}

interface RedeemRewardRequest {
  walletAddress: string;
  serialNo: string;
  uniqueCode: string;
}

interface RedeemRewardResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
  message?: string;
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
    // Note: This function uses the older API which might be deprecated
    // Consider using verifyProductEnhanced instead
    const request = {
      serial_no: serialNo,
      unique_code: uniqueCode
    };
    
    const result = await TrustOrigin_backend.verify_product_v2(request);
    
    if (result.error.length > 0) {
      const apiError = result.error[0];
      return {
        status: { Invalid: null },
        error: "API Error: " + JSON.stringify(apiError)
      };
    }
    
    if (result.data.length === 0) {
      return {
        status: { Invalid: null },
        error: "No data returned from API"
      };
    }
    
    const verificationData = result.data[0];
    
    // Get product details if verification was successful
    if (verificationData.verification.length > 0) {
      // Use type assertion to tell TypeScript that the element exists
      const verification = verificationData.verification[0] as any;
      const productResult = await TrustOrigin_backend.get_product_by_id(verification.product_id);
      
      if ('product' in productResult) {
        const product = productResult.product;
        const orgResult = await TrustOrigin_backend.get_organization_by_id(product.org_id);
        
        // Check if organization exists in result before accessing name
        const orgName = 'organization' in orgResult ? orgResult.organization.name : "Unknown Organization";
        
        return {
          status: verificationData.status,
          productInfo: {
            id: product.id.toString(),
            name: product.name,
            description: product.description,
            category: product.category,
            organization: orgName,
            metadata: metadataToObject(product.metadata)
          }
        };
      }
      
      return {
        status: verificationData.status
      };
    }
    
    return {
      status: verificationData.status,
      error: "Product verification succeeded but no details available"
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
 * Verify a product using separate serial number and unique code
 * Enhanced API that supports rewards
 * 
 * @param {ProductVerificationRequest} request - Object containing serial_no and unique_code
 * @returns {Promise<EnhancedVerificationResult>} Result of verification including rewards if applicable
 * @example
 * const result = await verifyProductEnhanced({ serial_no: "def456", unique_code: "xyz789" });
 */
const verifyProductEnhanced = async (request: ProductVerificationRequest): Promise<EnhancedVerificationResult> => {
  try {
    const { serial_no, unique_code } = request;
    
    if (!serial_no || !unique_code) {
      return {
        status: { Invalid: null },
        error: "Missing serial number or unique code"
      };
    }
    
    // Convert serial_no to Principal
    let serialNoPrincipal;
    try {
      serialNoPrincipal = Principal.fromText(serial_no);
    } catch (error) {
      return {
        status: { Invalid: null },
        error: "Invalid serial number format"
      };
    }
    
    // Call enhanced backend verification API
    const enhancedVerifyRequest = {
      serial_no: serialNoPrincipal,
      unique_code: unique_code
    };
    
    const result = await TrustOrigin_backend.verify_product_v2(enhancedVerifyRequest);
    
    // Handle API response structure
    if (result.error.length > 0) {
      const apiError = result.error[0];
      return {
        status: { Invalid: null },
        error: "API Error: " + JSON.stringify(apiError)
      };
    }
    
    if (result.data.length === 0) {
      return {
        status: { Invalid: null },
        error: "No data returned from API"
      };
    }
    
    const verificationData = result.data[0];
    
    // Extract rewards if available
    let rewards = undefined;
    if (verificationData.rewards && verificationData.rewards.length > 0) {
      rewards = verificationData.rewards[0];
    }
    
    // Get product information if we have verification data
    let productInfo = undefined;
    if (verificationData.verification && verificationData.verification.length > 0) {
      const verification = verificationData.verification[0];
      if (verification) {
        try {
          const productResult = await TrustOrigin_backend.get_product_by_id(verification.product_id);
          
          if ('product' in productResult) {
            const product = productResult.product;
            const orgResult = await TrustOrigin_backend.get_organization_by_id(product.org_id);
            
            // Check if organization exists in result before accessing name
            const orgName = 'organization' in orgResult ? orgResult.organization.name : "Unknown Organization";
            
            productInfo = {
              id: product.id.toString(),
              name: product.name,
              description: product.description,
              category: product.category,
              organization: orgName,
              metadata: metadataToObject(product.metadata)
            };
          }
        } catch (error) {
          console.error("Failed to fetch product details:", error);
        }
      }
    }
    
    return {
      status: verificationData.status,
      productInfo,
      rewards
    };
  } catch (error) {
    console.error("Enhanced product verification failed:", error);
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
      
      // Check if organization exists in result before accessing name
      const orgName = 'organization' in organization ? organization.organization.name : "Unknown Organization";
      
      return {
        id: product.id.toString(),
        name: product.name,
        description: product.description,
        category: product.category,
        organization: orgName,
        metadata: metadataToObject(product.metadata)
      };
    }
    
    throw new Error('Product not found');
  } catch (error) {
    console.error("Failed to get product details:", error);
    throw error;
  }
};

/**
 * Submit wallet address to redeem rewards from a verified product
 * 
 * @param {RedeemRewardRequest} request - Request containing wallet address and verification details
 * @returns {Promise<RedeemRewardResponse>} Result of redemption request
 * @example
 * const result = await redeemReward({ 
 *   walletAddress: "abc123...", 
 *   serialNo: "def456", // Note: This should likely be the Principal string 
 *   uniqueCode: "xyz789"
 * });
 */
const redeemReward = async (request: RedeemRewardRequest): Promise<RedeemRewardResponse> => {
  try {
    const { walletAddress, serialNo, uniqueCode } = request;
    
    if (!walletAddress || !serialNo || !uniqueCode) {
      return {
        success: false,
        error: "Missing required information for redemption",
        message: "Missing required information for redemption"
      };
    }
    
    // Convert serialNo string back to Principal for the backend call
    let serialNoPrincipal;
    try {
      serialNoPrincipal = Principal.fromText(serialNo);
    } catch (error) {
      return {
        success: false,
        error: "Invalid serial number format for redemption request",
        message: "Invalid serial number format for redemption request"
      };
    }

    // Prepare backend request object
    const backendRequest = {
      wallet_address: walletAddress,
      serial_no: serialNoPrincipal,
      unique_code: uniqueCode,
    };
    
    // Call the actual backend endpoint
    const result = await TrustOrigin_backend.redeem_product_reward(backendRequest);

    // Handle the ApiResponse structure
    if (result.error.length > 0) {
        const apiError = result.error[0];
        const errorMessage = "Reward redemption failed: " + JSON.stringify(apiError);
        return {
            success: false,
            error: errorMessage,
            message: errorMessage
        };
    }

    if (result.data.length === 0) {
        const errorMessage = "No data returned from reward redemption API";
        return {
            success: false,
            error: errorMessage,
            message: errorMessage
        };
    }

    const redemptionData = result.data[0];

    // Return the data extracted from the ApiResponse
    return {
        success: redemptionData.success,
        transactionId: redemptionData.transaction_id[0] || undefined,
        message: redemptionData.message,
    };

  } catch (error) {
    console.error("Reward redemption failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error during redemption";
    return {
      success: false,
      error: errorMessage,
      message: errorMessage
    };
  }
};

export const productApi = {
  verifyProduct,
  verifyProductEnhanced,
  getProductDetails,
  parseVerificationCode,
  redeemReward
}; 