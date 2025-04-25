/**
 * @file Unauthorized access page
 * @fileoverview This page displays when a user attempts to access a route
 * for which they do not have the required permissions
 * 
 * Functions:
 * - UnauthorizedPage: Displays unauthorized message with options to go back
 * 
 * Constants:
 * - None
 * 
 * Flow:
 * 1. Display unauthorized message
 * 2. Provide options to go back or to dashboard
 * 
 * Error Handling:
 * - None
 * 
 * @module pages/unauthorized
 * @requires react-router-dom - For navigation
 * @exports {FC} UnauthorizedPage - Unauthorized page component
 */

import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/useAuthContext';

/**
 * Unauthorized page displayed when a user lacks permission
 * 
 * @returns {JSX.Element} Unauthorized page
 * @example
 * <UnauthorizedPage />
 */
const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuthContext();

  const goBack = () => {
    navigate(-1);
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="text-red-500 text-5xl mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
        
        <p className="text-gray-600 mb-6">
          {profile ? 
            `Sorry, ${profile.first_name?.[0] || ''}, you don't have permission to access this page.` : 
            'Sorry, you don\'t have permission to access this page.'}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={goBack}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
          >
            Go Back
          </button>
          
          <button
            onClick={goToDashboard}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage; 