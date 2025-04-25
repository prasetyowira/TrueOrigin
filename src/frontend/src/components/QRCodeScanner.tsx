/**
 * @file QR Code Scanner component
 * @fileoverview Component that provides QR code scanning functionality using the device camera
 * 
 * Functions:
 * - QRCodeScanner: Main scanner component
 * 
 * Constants:
 * - None
 * 
 * Flow:
 * 1. Request camera access
 * 2. Initialize QR code scanner
 * 3. Detect and process QR codes
 * 4. Call onScan callback with result
 * 
 * Error Handling:
 * - Camera access denied
 * - Scanner initialization errors
 * - Invalid QR code formats
 * 
 * @module components/QRCodeScanner
 * @requires react - Core React library
 * @requires html5-qrcode - QR code scanning library
 * @exports {FC} QRCodeScanner - QR code scanner component
 */

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

interface QRCodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  width?: string;
  height?: string;
  fps?: number;
  qrbox?: number;
  disableFlip?: boolean;
}

/**
 * QR Code Scanner component using device camera
 * 
 * Provides a camera view that scans for QR codes and returns results
 * via the onScan callback.
 * 
 * @param {Function} onScan - Callback function for successful scan
 * @param {Function} onError - Optional callback function for errors
 * @param {string} width - Optional width of scanner element
 * @param {string} height - Optional height of scanner element
 * @param {number} fps - Optional frames per second for scanning
 * @param {number} qrbox - Optional QR box size in pixels
 * @param {boolean} disableFlip - Optional flag to disable image flipping
 * @returns {JSX.Element} QR code scanner component
 * @example
 * <QRCodeScanner
 *   onScan={(result) => console.log(result)}
 *   onError={(error) => console.error(error)}
 *   width="100%"
 *   height="300px"
 * />
 */
const QRCodeScanner = ({
  onScan,
  onError,
  width = '100%',
  height = '300px',
  fps = 10,
  qrbox = 250,
  disableFlip = false
}: QRCodeScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerId = useRef(`qr-scanner-${Math.random().toString(36).substring(2, 9)}`);

  // Function to request camera permission explicitly
  const requestCameraPermission = async () => {
    try {
      setIsRequesting(true);
      // Explicitly request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream immediately as we just need the permission
      stream.getTracks().forEach(track => track.stop());
      setError(null);
      initializeScanner();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Camera permission denied';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsRequesting(false);
    }
  };

  // Initialize the scanner after permissions are granted
  const initializeScanner = () => {
    // Create scanner container if it doesn't exist
    if (!document.getElementById(scannerId.current) && containerRef.current) {
      const scannerElement = document.createElement('div');
      scannerElement.id = scannerId.current;
      containerRef.current.appendChild(scannerElement);
    }

    // Initialize scanner
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(scannerId.current);
    }

    // Start scanner
    startScanner();
  };

  // Start the scanner
  const startScanner = async () => {
    try {
      setIsScanning(true);
      await scannerRef.current?.start(
        { facingMode: 'environment' },
        {
          fps,
          qrbox,
          disableFlip,
          aspectRatio: 1
        },
        (decodedText) => {
          // Successfully scanned QR code
          onScan(decodedText);
        },
        () => {
          // QR code not found - continue scanning
        }
      );
      setPermissionGranted(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    }
  };

  useEffect(() => {
    // Initialize scanner on mount
    requestCameraPermission();

    // Clean up scanner on unmount
    return () => {
      if (
        scannerRef.current &&
        scannerRef.current.getState() !== Html5QrcodeScannerState.NOT_STARTED
      ) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current = null;
          })
          .catch((err) => {
            console.error('Error stopping scanner:', err);
          });
      }
    };
  }, [fps, qrbox, disableFlip, onScan, onError]);

  return (
    <div className="qr-scanner-container">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error: {error}</p>
          <p className="text-sm">
            Please ensure camera permissions are enabled for this site.
          </p>
          <button
            onClick={requestCameraPermission}
            className="mt-3 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            disabled={isRequesting}
          >
            {isRequesting ? 'Requesting Access...' : 'Request Camera Permission'}
          </button>
        </div>
      )}
      
      <div 
        ref={containerRef}
        className="qr-scanner" 
        style={{ 
          width, 
          height,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '8px',
          background: '#000'
        }}
      >
        {!permissionGranted && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white">
            <p className="mb-4">
              {isRequesting ? 'Requesting camera permission...' : 'Camera access is required for scanning'}
            </p>
            {!isRequesting && !permissionGranted && (
              <button
                onClick={requestCameraPermission}
                className="bg-cyan-500 hover:bg-cyan-600 text-white py-2 px-4 rounded"
              >
                Allow Camera Access
              </button>
            )}
          </div>
        )}
        
        {/* Scanner target indicator */}
        {isScanning && !error && permissionGranted && (
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-64 h-64 border-2 border-white rounded-lg opacity-70"></div>
          </div>
        )}
      </div>
      
      <p className="text-center text-sm mt-2 text-gray-600">
        Position the QR code within the frame to scan
      </p>
    </div>
  );
};

export default QRCodeScanner; 