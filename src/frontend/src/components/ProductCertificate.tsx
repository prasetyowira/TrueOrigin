import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Product } from '@declarations/TrustOrigin_backend/TrustOrigin_backend.did';

// Import assets
import certificateLogo from '@/assets/product-certificate-logo.svg';
import certificateBgSvg from '@/assets/product-certificate-bg.svg';

interface ProductCertificateProps {
  product: Product;
  organizationName?: string;
}

const ProductCertificate = React.forwardRef<HTMLDivElement, ProductCertificateProps>(
  ({ product, organizationName = 'Brand Owner' }, ref) => {
    const formattedDate = (() => {
      const date = new Date();
      const day = date.getDate();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    })();

    // Truncate product key for display
    const truncatedKey = product.public_key ? 
      `KEY: ${product.public_key.substring(0, 5)}...${product.public_key.substring(product.public_key.length - 5)}` : 
      'KEY: N/A';

    return (
      <div 
        ref={ref}
        data-certificate="true"
        className="w-[800px] h-[600px] bg-white relative overflow-hidden p-8 flex flex-col"
      >
        {/* Main Certificate Container */}
        <div className="w-full h-full border-4 border-black rounded-xl flex overflow-hidden">
          {/* Left Section (60%) */}
          <div className="w-[60%] p-6 flex flex-col items-center justify-between bg-[#594748] text-white">
            {/* QR Code */}
            <div className="bg-white p-4 rounded-lg">
              <div className="w-36 h-36 flex items-center justify-center overflow-hidden">
                <QRCodeSVG 
                  value={product.public_key || 'No Public Key'} 
                  size={150}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  level="H"
                  className="rounded-md"
                />
              </div>
            </div>
            
            {/* Product Details */}
            <div className="text-center w-full">
              <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
              <p className="text-lg mb-1">{product.category}</p>
              <p className="text-sm text-gray-200 mb-4">{truncatedKey}</p>
              <p className="text-xs text-gray-300">Verified on {formattedDate}</p>
            </div>

            {/* Branding */}
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Protected by</h3>
              <h2 className="text-2xl font-extrabold">TrueOrigin</h2>
              <img src={certificateLogo} alt="TrueOrigin Logo" className="h-10 mt-2" />
            </div>
          </div>

          {/* Right Section (40%) with Background Design */}
          <div className="w-[40%] relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src={certificateBgSvg} 
                alt="Certificate Background" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-[#594748] opacity-70"></div>
            
            {/* Watermarks */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="transform -rotate-45 text-white opacity-10">
                <div className="flex flex-col">
                  {Array(8).fill(0).map((_, i) => (
                    <div key={i} className="flex">
                      {Array(4).fill(0).map((_, j) => (
                        <span key={j} className="text-2xl font-bold px-4">Genuine</span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Brand Name */}
            <div className="absolute bottom-8 right-8 text-white text-right">
              <h3 className="text-xl font-bold">{organizationName}</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ProductCertificate.displayName = 'ProductCertificate';

export default ProductCertificate; 