/**
 * @file Product verification page
 * @fileoverview Public page for verifying product authenticity using QR codes
 * 
 * Functions:
 * - VerifyPage: Main verification page component
 * - StatusBadge: Displays verification status
 * - ProductInfo: Displays product information
 * - VerificationResultModal: Displays verification results
 * - RedeemWalletModal: Allows users to scan or input wallet address
 * - RedeemSuccessModal: Displays successful redemption
 * 
 * Constants:
 * - None
 * 
 * Flow:
 * 1. User scans product QR code using camera
 * 2. Code is verified with backend API
 * 3. Verification result is displayed to the user
 * 4. If authentic (first scan), user can redeem rewards
 * 5. User scans wallet QR or inputs address
 * 6. Confirmation of reward sent is displayed
 * 
 * Error Handling:
 * - Camera permission errors
 * - QR code scanning errors
 * - API verification errors
 * - Invalid code format errors
 * - Reward redemption errors
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
import type { ProductVerificationStatus, VerificationRewards } from '@declarations/TrustOrigin_backend/TrustOrigin_backend.did';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Asset imports
import logoImage from "@/assets/logo-customer-flow.png";
import successIcon from "@/assets/graphic-scan-success.svg";
import failureIcon from "@/assets/graphic-scan-failed.svg";
import redeemSuccessIcon from "@/assets/graphic-redeem-success.svg";
import helpIcon from "@/assets/icon-loading-problem.svg";
import coinIcon from "@/assets/icon-coin.svg";

interface VerificationState {
  status: ProductVerificationStatus | null;
  isLoading: boolean;
  error: string | null;
  productInfo: any | null;
  rewards: VerificationRewards | null;
  qrCodeResult: string | null;
}

interface WalletInputState {
  address: string;
  isSubmitting: boolean;
  error: string | null;
  isSuccess: boolean;
}

/**
 * Verification Result Modal component
 * 
 * @param {object} props - Component props
 * @param {ProductVerificationStatus | null} props.status - Verification status
 * @param {boolean} props.open - Whether the modal is open
 * @param {VerificationRewards | null} props.rewards - Rewards information
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onRedeemClick - Function to handle redeem click
 * @returns {JSX.Element} Modal component
 */
const VerificationResultModal = ({ 
  status, 
  open, 
  rewards, 
  onClose, 
  onRedeemClick 
}: { 
  status: ProductVerificationStatus | null, 
  open: boolean, 
  rewards: VerificationRewards | null,
  onClose: () => void,
  onRedeemClick: () => void
}) => {
  if (!status) return null;

  const isFirstVerification = 'FirstVerification' in status;
  const isAlreadyScanned = 'MultipleVerification' in status;
  const isInvalid = 'Invalid' in status;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center p-4">
          {/* Logo */}
          <img src={logoImage} alt="TrueOrigin Logo" className="h-10 mb-4" />
          
          {/* Icon */}
          {isFirstVerification && (
            <div className="flex justify-center mb-4">
              <img src={successIcon} alt="Success" className="w-20 h-20" />
            </div>
          )}
          {(isAlreadyScanned || isInvalid) && (
            <div className="flex justify-center mb-4">
              <img src={failureIcon} alt="Failure" className="w-20 h-20" />
            </div>
          )}
          
          {/* Title */}
          <h2 className="text-xl font-bold mb-2">
            {isFirstVerification ? "Scan Success!" : "Verification Failed"}
          </h2>
          
          {/* Message */}
          <div className="text-center mb-6">
            {isFirstVerification && (
              <>
                <p className="text-green-600 font-semibold">1st Time Scan!</p>
                <p className="text-gray-700">Your Product is Genuine!</p>
              </>
            )}
            {isAlreadyScanned && (
              <>
                <p className="text-amber-600 font-semibold">Product is already scanned more than 1 time!</p>
                <p className="text-gray-700">Please beware!</p>
              </>
            )}
            {isInvalid && (
              <>
                <p className="text-red-600 font-semibold">Invalid Product Code!</p>
                <p className="text-gray-700">This product could not be verified.</p>
              </>
            )}
          </div>
          
          {/* Button */}
          {isFirstVerification && rewards && (
            <Button 
              className="w-full flex items-center justify-center gap-2" 
              onClick={onRedeemClick}
            >
              <img src={coinIcon} alt="Coin" className="w-5 h-5" />
              <span>Click to Redeem {rewards.points} Coins</span>
            </Button>
          )}
          {!isFirstVerification && (
            <Button 
              className="w-full bg-gray-500 hover:bg-gray-600" 
              onClick={onClose}
              variant="secondary"
            >
              {isAlreadyScanned ? "Sorry, You are not eligible" : "Back to Scanner"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Redeem Wallet Modal component
 * 
 * @param {object} props - Component props
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onWalletSubmit - Function to handle wallet submission
 * @param {WalletInputState} props.walletState - Current wallet state
 * @returns {JSX.Element} Modal component
 */
const RedeemWalletModal = ({ 
  open, 
  onClose, 
  onWalletSubmit,
  walletState 
}: { 
  open: boolean, 
  onClose: () => void,
  onWalletSubmit: (address: string) => void,
  walletState: WalletInputState
}) => {
  const [walletAddress, setWalletAddress] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [walletScannerError, setWalletScannerError] = useState<string | null>(null);

  const handleWalletScan = (result: string) => {
    setWalletAddress(result);
    setShowScanner(false);
    setWalletScannerError(null);
  };

  const handleWalletScanError = (errorMsg: string) => {
    setWalletScannerError(errorMsg);
  };

  const handleSubmit = () => {
    if (walletAddress.trim()) {
      onWalletSubmit(walletAddress.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Scan Your QR Code Wallet Address</DialogTitle>
          <DialogDescription className="text-center">
            Or Paste Your Wallet Address Below
          </DialogDescription>
        </DialogHeader>
        
        {showScanner ? (
          <div className="mb-4">
            <div className="relative">
              <QRCodeScanner 
                onScan={handleWalletScan}
                height="250px"
                onError={handleWalletScanError}
              />
              
              {/* Custom QR scanning overlay for wallet */}
              {!walletScannerError && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 relative">
                    {/* Scanning frame with animated corners */}
                    <div className="absolute top-0 left-0 w-8 h-2 bg-primary animate-corner"></div>
                    <div className="absolute top-0 left-0 w-2 h-8 bg-primary animate-corner"></div>
                    
                    <div className="absolute top-0 right-0 w-8 h-2 bg-primary animate-corner"></div>
                    <div className="absolute top-0 right-0 w-2 h-8 bg-primary animate-corner"></div>
                    
                    <div className="absolute bottom-0 left-0 w-8 h-2 bg-primary animate-corner"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-8 bg-primary animate-corner"></div>
                    
                    <div className="absolute bottom-0 right-0 w-8 h-2 bg-primary animate-corner"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-8 bg-primary animate-corner"></div>
                    
                    {/* Scanning animation */}
                    <div className="absolute top-0 left-0 right-0 w-full h-1 bg-primary opacity-70 animate-scan"></div>
                  </div>
                </div>
              )}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-2"
              onClick={() => setShowScanner(false)}
            >
              Enter Address Manually
            </Button>
          </div>
        ) : (
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Enter wallet address here"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="mb-2"
            />
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowScanner(true)}
            >
              Scan QR Code Instead
            </Button>
          </div>
        )}
        
        <div className="bg-gray-100 p-3 rounded-md mb-4">
          <h4 className="font-medium text-sm mb-1">Pro Tips:</h4>
          <ul className="text-sm text-gray-600 pl-4 list-disc">
            <li>Make sure your wallet is ICP compatible</li>
            <li>The QR code should contain your wallet address</li>
            <li>Double check the address before submitting</li>
          </ul>
        </div>
        
        <DialogFooter>
          <Button 
            className="w-full" 
            onClick={handleSubmit}
            disabled={!walletAddress.trim() || walletState.isSubmitting}
          >
            {walletState.isSubmitting ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Processing...
              </>
            ) : 'Submit Wallet Address'}
          </Button>
          {walletState.error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{walletState.error}</AlertDescription>
            </Alert>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Redeem Success Modal component
 * 
 * @param {object} props - Component props
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @returns {JSX.Element} Modal component
 */
const RedeemSuccessModal = ({ 
  open, 
  onClose 
}: { 
  open: boolean, 
  onClose: () => void
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center p-4">
          {/* Logo */}
          <img src={logoImage} alt="TrueOrigin Logo" className="h-10 mb-4" />
          
          {/* Success Icon */}
          <div className="flex justify-center mb-4">
            <img src={redeemSuccessIcon} alt="Success" className="w-20 h-20" />
          </div>
          
          {/* Title */}
          <h2 className="text-xl font-bold mb-2">Redeem Success!</h2>
          
          {/* Message */}
          <div className="text-center mb-6">
            <p className="text-green-600 font-semibold">Coin Sent! Please Check Your Wallet</p>
            <p className="text-gray-700">Happy Shopping!</p>
          </div>
          
          {/* Button */}
          <Button 
            className="w-full" 
            onClick={onClose}
          >
            Back to Home
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

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
    productInfo: null,
    rewards: null,
    qrCodeResult: null
  });
  
  const [showScanner, setShowScanner] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [showWalletInput, setShowWalletInput] = useState(false);
  const [showRedeemSuccess, setShowRedeemSuccess] = useState(false);
  
  const [walletState, setWalletState] = useState<WalletInputState>({
    address: "",
    isSubmitting: false,
    error: null,
    isSuccess: false
  });

  const handleScan = async (result: string) => {
    try {
      setVerification({
        ...verification,
        isLoading: true,
        error: null
      });
      
      // Temporarily hide the scanner to prevent multiple scans
      setShowScanner(false);
      
      // Split the result into serial number and unique code
      // Example format: "serialNo:uniqueCode"
      const [serialNo, uniqueCode] = result.split(":");
      
      if (!serialNo || !uniqueCode) {
        throw new Error("Invalid QR code format. Expected format: serialNo:uniqueCode");
      }
      
      // Verify the product using the enhanced API
      const verificationResult = await productApi.verifyProductEnhanced({
        serial_no: serialNo,
        unique_code: uniqueCode
      });
      
      setVerification({
        status: verificationResult.status,
        isLoading: false,
        error: verificationResult.error || null,
        productInfo: verificationResult.productInfo || null,
        rewards: verificationResult.rewards || null,
        qrCodeResult: result
      });
      
      // Show the verification result
      setShowResult(true);
    } catch (error) {
      setVerification({
        ...verification,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
        status: null,
        productInfo: null,
        rewards: null,
        qrCodeResult: null
      });
      
      // If there's an error, after a delay, reset the scanner
      setTimeout(() => {
        resetScanner();
      }, 3000);
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
      productInfo: null,
      rewards: null,
      qrCodeResult: null
    });
    setShowScanner(true);
    setShowResult(false);
  };
  
  const handleRedeemClick = () => {
    setShowResult(false);
    setShowWalletInput(true);
  };
  
  const handleWalletSubmit = async (address: string) => {
    try {
      setWalletState({
        ...walletState,
        address,
        isSubmitting: true,
        error: null
      });
      
      // Extract serialNo and uniqueCode from the QR result used for verification
      const [serialNo, uniqueCode] = verification.qrCodeResult?.split(":") || [null, null];

      if (!serialNo || !uniqueCode || !verification.rewards) {
        throw new Error("Missing verification data needed for redemption.");
      }

      // Call the actual backend API via productApi
      const result = await productApi.redeemReward({
        walletAddress: address,
        serialNo: serialNo,
        uniqueCode: uniqueCode,
      });
      
      if (!result.success) {
        throw new Error(result.message || result.error || "Failed to redeem reward");
      }
      
      setWalletState({
        ...walletState,
        isSubmitting: false,
        isSuccess: true
      });
      
      // Show the success modal
      setShowWalletInput(false);
      setShowRedeemSuccess(true);
    } catch (error) {
      setWalletState({
        ...walletState,
        isSubmitting: false,
        error: error instanceof Error ? error.message : "Failed to submit wallet address"
      });
    }
  };
  
  const handleResultClose = () => {
    setShowResult(false);
    resetScanner();
  };
  
  const handleWalletClose = () => {
    setShowWalletInput(false);
    resetScanner();
  };
  
  const handleRedeemSuccessClose = () => {
    setShowRedeemSuccess(false);
    resetScanner();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with logo */}
      <header className="bg-white border-b border-gray-200 p-4 flex justify-center">
        <img src={logoImage} alt="TrueOrigin Logo" className="h-10" />
      </header>
      
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-50">
        {showScanner && (
          <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-primary text-white text-center">
              <h1 className="text-xl font-bold">Scan Here</h1>
              <p className="text-sm">Place the code inside the frame</p>
            </div>
            
            <div className="p-4">
              <div className="relative">
                <QRCodeScanner 
                  onScan={handleScan} 
                  onError={handleScanError}
                  height="320px"
                />
                
                {/* Custom QR scanning overlay */}
                {!verification.error && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-64 h-64 relative">
                      {/* Scanning frame with animated corners */}
                      <div className="absolute top-0 left-0 w-10 h-2 bg-primary animate-corner"></div>
                      <div className="absolute top-0 left-0 w-2 h-10 bg-primary animate-corner"></div>
                      
                      <div className="absolute top-0 right-0 w-10 h-2 bg-primary animate-corner"></div>
                      <div className="absolute top-0 right-0 w-2 h-10 bg-primary animate-corner"></div>
                      
                      <div className="absolute bottom-0 left-0 w-10 h-2 bg-primary animate-corner"></div>
                      <div className="absolute bottom-0 left-0 w-2 h-10 bg-primary animate-corner"></div>
                      
                      <div className="absolute bottom-0 right-0 w-10 h-2 bg-primary animate-corner"></div>
                      <div className="absolute bottom-0 right-0 w-2 h-10 bg-primary animate-corner"></div>
                      
                      {/* Scanning animation */}
                      <div className="absolute top-0 left-0 right-0 w-full h-1 bg-primary opacity-70 animate-scan"></div>
                    </div>
                  </div>
                )}
              </div>
              
              {verification.error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{verification.error}</AlertDescription>
                </Alert>
              )}
              
              <div className="mt-4 text-center">
                <Link to="#" className="text-primary text-sm flex items-center justify-center">
                  <img src={helpIcon} alt="Help" className="w-4 h-4 mr-1" />
                  Have a problem?
                </Link>
              </div>
            </div>
          </div>
        )}
        
        {verification.isLoading && (
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md w-full max-w-md mx-auto">
            <div className="relative mb-4">
              <div className="h-16 w-16 rounded-full border-4 border-gray-200"></div>
              <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-t-4 border-primary animate-spin"></div>
            </div>
            <img src={logoImage} alt="TrueOrigin Logo" className="h-8 mt-2 mb-2 animate-pulse" />
            <p className="text-lg font-medium text-primary mt-2">Verifying product...</p>
            <p className="text-sm text-gray-500 mt-1">Please wait while we check authenticity</p>
          </div>
        )}
      </main>
      
      {/* Modals */}
      <VerificationResultModal 
        status={verification.status} 
        open={showResult} 
        rewards={verification.rewards}
        onClose={handleResultClose}
        onRedeemClick={handleRedeemClick}
      />
      
      <RedeemWalletModal 
        open={showWalletInput} 
        onClose={handleWalletClose}
        onWalletSubmit={handleWalletSubmit}
        walletState={walletState}
      />
      
      <RedeemSuccessModal 
        open={showRedeemSuccess} 
        onClose={handleRedeemSuccessClose}
      />
    </div>
  );
};

export default VerifyPage; 