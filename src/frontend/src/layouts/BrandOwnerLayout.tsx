/**
 * @file Brand Owner Layout Component
 * @fileoverview Provides a consistent layout for all brand owner pages with a sidebar navigation and content area
 * 
 * Functions:
 * - BrandOwnerLayout: Main layout component for brand owner pages
 * 
 * Constants:
 * - brandOwnerMenuItems: Navigation items for the sidebar
 * 
 * Flow:
 * 1. Render sidebar with navigation options
 * 2. Render main content area that displays children components
 * 3. Handle sidebar collapse/expand functionality
 * 
 * Error Handling:
 * - None specific to layout
 * 
 * @module layouts/BrandOwnerLayout
 * @requires components/Sidebar - For navigation sidebar
 * @exports {FC} BrandOwnerLayout - Main layout component
 */

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SidebarToggle from '../components/SidebarToggle';
import { useAuthContext } from '../contexts/useAuthContext';
import { useGetOrganization } from '../hooks';
import { 
  ProductsIcon, 
  ProductAddIcon,
  AnalyticsIcon,
  ResellerIcon,
  UsersIcon 
} from '../components/icons';
import defaultAvatar from '../assets/default-avatar.jpg';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Define IconProps type matching what's in the icons file
type IconProps = {
  fillColor: string;
};

/**
 * Props for the BrandOwnerLayout component
 */
type BrandOwnerLayoutProps = {
  children?: React.ReactNode;
};

/**
 * Main layout component for brand owner dashboard
 * Provides sidebar navigation and content area
 */
const BrandOwnerLayout: React.FC<BrandOwnerLayoutProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, isLoading } = useAuthContext(); 
  const [collapsed, setCollapsed] = useState(false);
  
  // Fetch organization data
  const { data: organization, isLoading: isLoadingOrg } = useGetOrganization();

  const handleMenuToggle = () => {
    setCollapsed(!collapsed);
  };

  // Get principal ID from profile for display, handle loading state
  const principalId = isLoading ? 'Loading...' : (profile?.id?.toText() || 'Anonymous');

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const menuItems = [
    {
      label: 'Products',
      icon: ProductsIcon as React.ComponentType<IconProps>,
      active: location.pathname === '/brand-owners/products',
      onClickEvent: () => handleNavigate('/brand-owners/products'),
    },
    {
      label: 'Add Product',
      icon: ProductAddIcon as React.ComponentType<IconProps>,
      active: location.pathname === '/brand-owners/add-product',
      onClickEvent: () => handleNavigate('/brand-owners/add-product'),
    },
    {
      label: 'Reseller Management',
      icon: ResellerIcon as React.ComponentType<IconProps>,
      active: location.pathname === '/brand-owners/resellers',
      onClickEvent: () => handleNavigate('/brand-owners/resellers'),
    },
    {
      label: 'User Management',
      icon: UsersIcon as React.ComponentType<IconProps>,
      active: location.pathname === '/brand-owners/users',
      onClickEvent: () => handleNavigate('/brand-owners/users'),
    },
    {
      label: 'Analytic',
      icon: AnalyticsIcon as React.ComponentType<IconProps>,
      active: location.pathname === '/brand-owners/analytics',
      onClickEvent: () => handleNavigate('/brand-owners/analytics'),
    },
  ];

  // Get metadata from the profile to check for avatar
  const getAvatarFromMeta = () => {
    if (isLoading || !profile?.detail_meta) return '';
    
    const avatarMeta = profile.detail_meta.find(item => item.key === 'avatar');
    return avatarMeta ? avatarMeta.value : defaultAvatar;
  };

  const userAvatar = getAvatarFromMeta() || defaultAvatar;

  // Restore sidebar state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setCollapsed(savedState === 'true');
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  }, [collapsed]);

  // Format organization ID for display (shortened version)
  const formatOrgId = (id: string) => {
    if (id.length > 10) {
      return `${id.slice(0, 5)}...${id.slice(-5)}`;
    }
    return id;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        menuItems={menuItems} 
        userAvatar={userAvatar} 
        principalId={principalId}
        collapsed={collapsed}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <SidebarToggle collapsed={collapsed} onClick={handleMenuToggle} />
              <div className="ml-4">
                <h1 className="text-xl font-semibold">
                  {menuItems.find(item => item.active)?.label || 'Dashboard'}
                </h1>
              </div>
            </div>
            
            {/* Organization Info */}
            <div className="flex items-center">
              {isLoadingOrg ? (
                <div className="flex items-center text-sm text-gray-500">
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span>Loading organization...</span>
                </div>
              ) : organization ? (
                <div className="flex flex-col items-end">
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-1">Organization:</span>
                    <span className="text-sm font-bold text-primary">{organization.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-1">ID:</span>
                    <span className="text-xs text-gray-500" title={organization.id.toString()}>
                      {formatOrgId(organization.id.toString())}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No organization found</div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default BrandOwnerLayout; 