import React from 'react';
import { Link } from 'react-router-dom';

const ResellerRegistrationPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Reseller Registration (Placeholder)</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-700 mb-4">
          This page is a placeholder for reseller registration.
          The primary registration/profile completion flow is now handled through the 
          <Link to="/auth/login" className="text-cyan-600 hover:underline"> login page</Link> 
          after selecting the 'Reseller' role.
        </p>
        <p className="text-gray-700">
          This route might be used for a dedicated step if the login modal flow becomes too complex, or for displaying information before starting the process.
        </p>
      </div>
    </div>
  );
};

export default ResellerRegistrationPage; 