import React from 'react';

const BrandOwnerDashboard: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Brand Owner Dashboard</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-700">
          Welcome to your dashboard. Manage your products, view analytics, and oversee reseller activities here.
        </p>
        {/* Placeholder for dashboard content */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Quick Stats (Placeholder)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-700">150</p>
              <p className="text-sm text-blue-600">Total Products</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-700">1,200</p>
              <p className="text-sm text-green-600">Verifications This Month</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-700">25</p>
              <p className="text-sm text-yellow-600">Active Resellers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandOwnerDashboard; 