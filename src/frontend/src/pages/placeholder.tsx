/**
 * @file Placeholder Page Component
 * @fileoverview Generic placeholder component for pages that are not yet implemented
 * 
 * Functions:
 * - PlaceholderPage: Renders a placeholder UI for unimplemented pages
 * 
 * Constants:
 * - None
 * 
 * Flow:
 * 1. Render a simple card with the provided title
 * 2. Show a message indicating the page is in development
 * 
 * Error Handling:
 * - None
 * 
 * @module pages/placeholder
 * @requires components/ui/card - For card UI component
 * @exports {FC} PlaceholderPage - Placeholder page component
 */

import React from 'react';

interface PlaceholderPageProps {
  title: string;
  message?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ 
  title,
  message = "This page is under construction. Please check back later!"
}) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-4xl font-bold text-gray-400 mb-4">🚧</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">{title}</h2>
        <p className="text-gray-500">
          {message}
        </p>
        <button 
          onClick={() => window.history.back()}
          className="mt-6 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default PlaceholderPage; 