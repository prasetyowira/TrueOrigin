import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGetMyResellerCertification } from '@/hooks/useQueries/authQueries';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExternalLink } from 'lucide-react';
import { Metadata as DidMetadata } from '@declarations/TrustOrigin_backend/TrustOrigin_backend.did';

const ResellerDashboardPage: React.FC = () => {
  const { user } = useAuth(); // user is DidUserPublic | null. Potentially useful for future enhancements.
  const {
    data: certificationData, // Renaming to dashboardData or similar might be good if it diverges more later.
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
          <AlertTitle>Error Loading Dashboard Data</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!certificationData || !certificationData.reseller_profile || !certificationData.associated_organization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="default" className="bg-yellow-50 border-yellow-200 text-yellow-900">
          <AlertTitle className="text-yellow-900">Information Not Found</AlertTitle>
          <AlertDescription className="text-yellow-800">
            Your reseller profile or associated brand details could not be found. Please ensure your profile is complete and properly associated.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { 
    reseller_profile: reseller, 
    associated_organization: organization,
    user_details
  } = certificationData;

  // Accessing optional fields from DidUserPublic requires unwrap or checking length
  const displayEmail = user_details.email && user_details.email.length > 0 ? user_details.email[0] : 'N/A';
  const resellerContactEmail = reseller.contact_email && reseller.contact_email.length > 0 ? reseller.contact_email[0] : 'N/A';
  const resellerContactPhone = reseller.contact_phone && reseller.contact_phone.length > 0 ? reseller.contact_phone[0] : 'N/A';
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Reseller Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Welcome to your Reseller Dashboard! Manage your profile, view associated brand products (once available), and track your activities here.
      </p>

      {/* Certification Card is REMOVED from here */}

      <div className="grid md:grid-cols-2 gap-8 mb-8"> {/* Added mb-8 for spacing before e-commerce card */}
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

export default ResellerDashboardPage; 