# Known Bugs

## 1. Camera Access in QR Scanner

### Issue Description
The QR code scanner in the Verify Product page fails to access the device camera properly. The scanner displays the error message "Unknown error" with a prompt to ensure camera permissions are enabled for the site, but the browser doesn't show the camera permission request dialog.

### Error Message
From browser console:
```
Failed to get profile: Yt: Invalid certificate: Signature verification failed
    at http://u6s2n-gx777-77774-qaaba-cai.localhost:4943/assets/index-Cs4uytv5.js:81:58912
    at async Promise.all (index 0)
    at async hE
```

### Root Cause Analysis
The issue appears to be related to certificate validation when accessing the camera over HTTPS. The browser is rejecting the self-signed certificate used in local development.

1. Camera APIs require secure context (HTTPS) to function
2. The local development certificate is self-signed
3. The browser is rejecting this certificate for the camera permission request

### Attempted Solutions
1. Added explicit camera permission request with button in the QRCodeScanner component
2. Configured Vite to use HTTPS in development
3. Modified the QR scanner component to properly handle permission states

### Potential Solutions
1. Manually accept the certificate by visiting the canister URL directly and proceeding through the security warning
2. Use a properly signed certificate for local development (e.g., mkcert)
3. Run the frontend directly with Vite instead of through dfx
4. Consider alternative QR code scanning libraries that might handle permissions differently

### Current Workaround
For now, we're deferring this issue to focus on other features. Users will need to manually accept the self-signed certificate by visiting the application URL directly and proceeding through the security warning before using the QR scanner.

### Assigned To
TBD

### Priority
Medium - Affects functionality but only in development environment 