import React, { useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGetMyResellerCertification } from '@/hooks/useQueries/authQueries';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';

// Assets imported directly from assets folder
import certificateLogo from '@/assets/certificate-logo.png';
import certificateQrPlaceholder from '@/assets/certificate-qr-placeholder.png';
import certificateBackground from '@/assets/certificate-background.png';
import certificateBgSvg from '@/assets/certificate-bg.svg';

const ResellerCertificationPage: React.FC = () => {
  const { user } = useAuth();
  const certificateRef = useRef<HTMLDivElement>(null);
  const {
    data: certificationData,
    isLoading,
    error 
  } = useGetMyResellerCertification();

  const handlePrint = useReactToPrint({
    contentRef: certificateRef,
    documentTitle: 'Reseller_Certification',
  });

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;

    const element = certificateRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: "#ffffff"
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('Reseller_Certification.pdf');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner size="lg" /></div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Certification</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Type guard for certificationData
  if (!certificationData || !certificationData.reseller_profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="default" className="bg-yellow-50 border-yellow-200 text-yellow-900">
          <AlertTitle className="text-yellow-900">Certification Not Found</AlertTitle>
          <AlertDescription className="text-yellow-800">
            Your reseller certification details could not be found. Please ensure your profile is complete.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Now certificationData and its nested properties are known to be defined
  const { 
    reseller_profile: reseller,
    associated_organization: organization,
    certification_code,
    certification_timestamp,
    user_details
  } = certificationData;

  const formattedTimestamp = (() => {
    if (!certification_timestamp) return 'N/A';
    const date = new Date(Number(certification_timestamp) / 1000000);
    const day = date.getDate();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  })();

  return (
    <div className="container mx-auto px-4 py-8 bg-white">
      <div className="text-center mb-8">
        <h1 className="text-xl font-extrabold text-gray-900 mb-2 font-manrope">Reseller Certification</h1>
        <p className="text-2xl font-normal text-gray-900 font-lexend">Download Your Certification</p>
      </div>
      
      <div className="flex flex-col items-center mb-8">
        {/* Certificate container with the same size as certificateBackground */}
        <div 
          ref={certificateRef} 
          className="w-full max-w-4xl bg-white rounded-[30px] overflow-hidden shadow-lg border border-gray-200 relative"
          style={{ aspectRatio: '16/9' }}
        >
          {/* 60:40 split container */}
          <div className="flex h-full">
            {/* Left section (60%) - Content in top-bottom order */}
            <div className="w-3/5 flex flex-col items-center justify-center p-8 space-y-6">
              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <QRCodeSVG 
                  value={reseller.public_key}
                  size={128}
                  bgColor={"#FFFFFF"}
                  fgColor={"#000000"}
                  level={"H"}
                  includeMargin={false}
                  className="w-32 h-32"
                />
              </div>
              
              {/* Reseller name */}
              <div className="text-center">
                <h2 className="text-2xl font-semibold font-lexend">{reseller.name}</h2>
              </div>
              
              {/* Brand name */}
              <div className="text-center">
                <p className="text-xl font-normal font-lexend">{organization.name}</p>
              </div>
              
              {/* Timestamp */}
              <div className="text-center">
                <p className="text-base font-light">{formattedTimestamp}</p>
              </div>
              
              {/* Logo */}
              <div className="mt-auto">
                <img src={certificateLogo} alt="TrueOrigin Logo" className="h-12 w-auto" />
              </div>
            </div>
            
            {/* Right section (40%) - Certificate SVG background */}
            <div className="w-2/5 flex justify-end h-full">
              <img 
                src={certificateBgSvg} 
                alt="Certificate Background" 
                className="h-full object-cover object-right"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Download button - outside certificate, centered below */}
      <div className="flex justify-center">
        <Button 
          onClick={handleDownloadPDF} 
          className="bg-[#212EFF] text-white hover:bg-blue-700 px-8 py-3 rounded-[10px] border border-[#313131] min-w-[200px]"
        >
          <span className="text-lg font-semibold font-manrope">Download</span>
        </Button>
      </div>
      
      {/* Additional details section */}
      <div className="mt-12 max-w-4xl mx-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">Certification Details</h3>
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase">Certification Code</h4>
                <p className="mt-1 text-gray-800 font-mono">{certification_code}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase">Certification Date</h4>
                <p className="mt-1 text-gray-800">{formattedTimestamp}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase">Reseller ID</h4>
                <p className="mt-1 text-gray-800 font-mono text-sm truncate">{reseller.id.toText()}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase">Brand Owner</h4>
                <p className="mt-1 text-gray-800">{organization.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResellerCertificationPage; 