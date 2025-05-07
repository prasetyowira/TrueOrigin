import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGetMyResellerCertification, FEResellerCertificationPageContext } from '@/hooks/useQueries/authQueries'; // Import type too
import { LoadingSpinner } from '@/components/LoadingSpinner'; // Assuming this exists
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExternalLink } from 'lucide-react';
// Import DidMetadata directly from declarations
import { Metadata as DidMetadata } from '@declarations/TrustOrigin_backend/TrustOrigin_backend.did';

const ResellerCertificationPage: React.FC = () => {
  const { user } = useAuth(); // user is DidUserPublic | null
  const {
    data: certificationData, // This is FEResellerCertificationPageContext | undefined
    isLoading,
    error 
  } = useGetMyResellerCertification(); 

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
    reseller_profile: reseller, // reseller is DidResellerPublic
    associated_organization: organization, // DidOrganizationPublic
    certification_code,
    certification_timestamp,
    user_details // user_details is DidUserPublic
  } = certificationData;

  const formattedTimestamp = certification_timestamp 
    ? new Date(Number(certification_timestamp) / 1000000).toLocaleString() 
    : 'N/A';

  // Accessing optional fields from DidUserPublic requires unwrap or checking length
  const displayEmail = user_details.email && user_details.email.length > 0 ? user_details.email[0] : 'N/A';
  const resellerContactEmail = reseller.contact_email && reseller.contact_email.length > 0 ? reseller.contact_email[0] : 'N/A';
  const resellerContactPhone = reseller.contact_phone && reseller.contact_phone.length > 0 ? reseller.contact_phone[0] : 'N/A';

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Reseller Certification</h1>
      <p className="text-gray-600 mb-8">This page confirms your official certification status as a reseller for {organization.name}.</p>

      <Card className="mb-8 bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-cyan-700">Official Certification</CardTitle>
            <Badge variant="default" className="bg-cyan-600 text-white">Verified Reseller</Badge>
          </div>
          <CardDescription className="text-cyan-600">
            For <span className="font-semibold">{organization.name}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Certification Code:</span>
              <span className="font-mono text-cyan-700 bg-cyan-100 px-2 py-1 rounded-md">{certification_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Date Issued:</span>
              <span className="text-gray-700">{formattedTimestamp}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Reseller Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Name:</strong> {reseller.name}</p>
            {displayEmail !== 'N/A' && <p><strong>Account Email:</strong> {displayEmail}</p>}
            {resellerContactEmail !== 'N/A' && <p><strong>Contact Email:</strong> {resellerContactEmail}</p>}
            {resellerContactPhone !== 'N/A' && <p><strong>Contact Phone:</strong> {resellerContactPhone}</p>}
            <p><strong>User ID:</strong> <span className="font-mono text-xs">{reseller.user_id.toText()}</span></p>
            <p><strong>Reseller ID:</strong> <span className="font-mono text-xs">{reseller.id.toText()}</span></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Associated Brand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Brand Name:</strong> {organization.name}</p>
            <p><strong>Description:</strong> {organization.description}</p>
            <p><strong>Brand ID:</strong> <span className="font-mono text-xs">{organization.id.toText()}</span></p>
          </CardContent>
        </Card>
      </div>

      {/* reseller.ecommerce_urls is Array<DidMetadata> */}
      {reseller.ecommerce_urls && reseller.ecommerce_urls.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Registered E-commerce Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {reseller.ecommerce_urls.map((urlMeta: DidMetadata) => ( 
                <li key={urlMeta.key}>
                  <span className="font-semibold capitalize">{urlMeta.key.replace(/_/g, ' ')}: </span>
                  <a 
                    href={urlMeta.value.startsWith('http') ? urlMeta.value : `https://${urlMeta.value}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-cyan-600 hover:text-cyan-700 hover:underline inline-flex items-center"
                  >
                    {urlMeta.value} <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResellerCertificationPage; 