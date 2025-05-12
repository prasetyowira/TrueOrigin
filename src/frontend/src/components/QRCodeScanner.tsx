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

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera, AlertCircle, RefreshCw } from 'lucide-react';

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
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerId = useRef(`qr-scanner-${Math.random().toString(36).substring(2, 9)}`);

  const parseErrorMessage = (err: any): string => {
    if (err instanceof Error) {
      // Handle specific known error names from getUserMedia or html5-qrcode if possible
      if (err.name === 'NotAllowedError') {
        return 'Camera permission was denied. Please grant access in your browser settings.';
      }
      if (err.name === 'NotFoundError') {
        return 'No suitable camera found on this device.';
      }
      if (err.name === 'NotReadableError') {
        return 'The camera is already in use or cannot be accessed.';
      }
      return err.message; // Default to the error message
    }
    if (typeof err === 'string') return err;
    // Removed Html5QrcodeErrorTypes check as it's not exported
    return 'An unknown error occurred.'; // Simplified fallback
  };

  const calculateQrboxSize = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const minDimension = Math.min(containerWidth, containerHeight);
      return Math.floor(minDimension * 0.7) || 250; // Ensure it's at least 250 or a fallback
    }
    return qrbox;
  }, [qrbox]); // containerRef.current changes don't trigger re-calc, but qrbox prop change would

  const startScannerLogic = useCallback(async () => {
    if (!scannerRef.current || !permissionGranted) {
      if (!permissionGranted && permissionGranted !== null) setCurrentError("Camera permission is required to start the scanner.");
      return;
    }

    if (scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
      console.log("Scanner is already active.");
      return;
    }
    
    setCurrentError(null); // Clear previous scanner errors before starting
    setIsScanningActive(true);

    try {
      const adjustedQrbox = calculateQrboxSize();
      const config = {
        fps,
        qrbox: { width: adjustedQrbox, height: adjustedQrbox },
        disableFlip,
        aspectRatio: 1,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 1.5, // Slightly zoomed in by default
      };

      await scannerRef.current.start(
        { facingMode: 'environment' },
        config,
        (decodedText: string) => {
          onScan(decodedText);
          // Consider pausing or stopping scanner after successful scan
          // if (scannerRef.current) scannerRef.current.pause(true);
        },
        (errorMessage: string) => {
          // This callback is for QR code decoding errors, not critical setup errors
          // console.warn("QR Scan Error (non-critical):", errorMessage);
          // We generally don't set setCurrentError here unless it's persistent
        }
      );
      setCurrentError(null); // Explicitly clear errors on successful start
    } catch (err) {
      const errorMessage = parseErrorMessage(err);
      setCurrentError(`Failed to start scanner: ${errorMessage}`);
      if (onError) onError(errorMessage);
      setIsScanningActive(false);
    }
  }, [permissionGranted, fps, disableFlip, onScan, onError, calculateQrboxSize]);

  const initializeAndStartScanner = useCallback(() => {
    if (document.getElementById(scannerId.current) && scannerRef.current) {
       // Already initialized, just try to start
        startScannerLogic();
        return;
    }
    if (containerRef.current && !document.getElementById(scannerId.current)) {
      const scannerElement = document.createElement('div');
      scannerElement.id = scannerId.current;
      scannerElement.style.width = '100%';
      scannerElement.style.height = '100%';
      containerRef.current.appendChild(scannerElement);
    }

    if (!scannerRef.current && document.getElementById(scannerId.current)) {
      try {
        scannerRef.current = new Html5Qrcode(scannerId.current, { verbose: false });
      } catch (e) {
        const initError = parseErrorMessage(e);
        setCurrentError(`Failed to initialize Html5Qrcode: ${initError}`);
        if(onError) onError(initError);
        return;
      }
    }
    startScannerLogic();
  }, [startScannerLogic, onError]);

  const requestAndInitialize = useCallback(async () => {
    if (permissionGranted) {
      initializeAndStartScanner();
      return;
    }
    setIsRequestingPermission(true);
    setCurrentError(null); // Clear previous errors
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      setCurrentError(null); // Clear permission request error on success
      initializeAndStartScanner();
    } catch (err) {
      const errorMessage = parseErrorMessage(err);
      setPermissionGranted(false);
      setCurrentError(errorMessage); // This is likely "Camera permission denied"
      if (onError) onError(errorMessage);
    } finally {
      setIsRequestingPermission(false);
    }
  }, [initializeAndStartScanner, onError, permissionGranted]);

  useEffect(() => {
    // On mount, if permission not yet determined (null), try to request it.
    if (permissionGranted === null) {
        requestAndInitialize();
    }
    // If permission was granted previously, try to init and start
    else if (permissionGranted === true) {
        initializeAndStartScanner();
    }
    // If permissionGranted is false, user needs to click retry.

    return () => {
      if (scannerRef.current && scannerRef.current.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
        scannerRef.current.stop().catch((err) => {
          console.error('Error stopping scanner:', parseErrorMessage(err));
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionGranted]); // Rerun if permissionGranted state changes (e.g. from null to true/false)
  
  // Resize handler
   useEffect(() => {
    const handleResize = () => {
      if (scannerRef.current && scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING && permissionGranted) {
        scannerRef.current.stop()
          .then(() => startScannerLogic())
          .catch(err => console.error("Error restarting scanner on resize:", parseErrorMessage(err)));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [startScannerLogic, permissionGranted]);

  return (
    <div className="qr-scanner-container w-full max-w-md mx-auto">
      {currentError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {permissionGranted === false ? "Camera Permission Error" : "Scanner Error"}
          </AlertTitle>
          <AlertDescription>
            {currentError}
            {permissionGranted === false && " Please ensure camera permissions are enabled for this site."}
          </AlertDescription>
          {permissionGranted === false && (
            <Button
              onClick={requestAndInitialize}
              variant="destructive"
              className="mt-3 w-full"
              disabled={isRequestingPermission}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRequestingPermission ? 'animate-spin' : ''}`} />
              {isRequestingPermission ? 'Requesting...' : 'Retry Camera Permission'}
            </Button>
          )}
          {permissionGranted === true && currentError && (
             <Button
              onClick={startScannerLogic} 
              variant="outline"
              className="mt-3 w-full"
              disabled={isScanningActive || isRequestingPermission}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isScanningActive ? 'animate-spin' : ''}`} />
              Retry Scanner
            </Button>
          )}
        </Alert>
      )}

      <div
        ref={containerRef}
        className={`qr-scanner relative overflow-hidden rounded-lg bg-black ${currentError && permissionGranted === false ? 'hidden' : ''}`}
        style={{ width, height }}
      >
        {permissionGranted === null && !isRequestingPermission && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white p-4 text-center z-10">
                <Camera className="h-12 w-12 mb-4 text-gray-400" />
                <p className="mb-4">Checking camera permissions...</p>
            </div>
        )}
        {isRequestingPermission && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white p-4 text-center z-10">
            <Camera className="h-12 w-12 mb-4 text-gray-400 animate-pulse" />
            <p className="mb-4">Requesting camera permission...</p>
          </div>
        )}
        {!isRequestingPermission && permissionGranted === false && !currentError && (
            // This state occurs if permissionGranted was previously false and user hasn't clicked retry yet, or if initial check fails silently.
            // The error alert above with the retry button is the primary UI for this.
            // We can add a softer prompt here if needed, or ensure the error alert is always shown.
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white p-4 text-center z-10">
                <Camera className="h-12 w-12 mb-4 text-gray-400" />
                <p className="mb-4">Camera access is needed. Please click the retry button in the message above.</p>
            </div>
        )}
        <style>{`
          #${scannerId.current} video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover;
            border-radius: 0.5rem; /* Match parent rounding */
          }
          #${scannerId.current} {
            background-color: #000; /* Ensure div itself is black if video fails to load */
          }
        `}</style>
      </div>

      {permissionGranted && !currentError && (
        <p className="text-center text-sm mt-2 text-muted-foreground">
          Position the QR code within the frame to scan
        </p>
      )}
    </div>
  );
};

export default QRCodeScanner; 