/**
 * @file Brand Owner Layout Component
 * @fileoverview Provides a consistent layout for all brand owner pages with a sidebar navigation and content area.
 * Fetches and displays user and organization information.
 * 
 * Functions:
 * - BrandOwnerLayout: Main layout component for brand owner pages
 * 
 * Constants:
 * - brandOwnerMenuItems: Navigation items for the sidebar (Dynamically generated based on pathname)
 * 
 * Flow:
 * 1. Get authentication context (user profile, selected org ID)
 * 2. Fetch organization details based on selected org ID
 * 3. Determine user avatar from profile metadata
 * 4. Render sidebar with navigation and user info
 * 5. Render header with current page title and organization info
 * 6. Render main content area using <Outlet />
 * 7. Handle sidebar collapse/expand state
 * 
 * Error Handling:
 * - Displays loading states for auth and organization data
 * - Handles missing organization or profile data gracefully
 * 
 * @module layouts/BrandOwnerLayout
 * @requires react-router-dom - For navigation and routing context
 * @requires components/Sidebar - For navigation sidebar
 * @requires contexts/useAuthContext - For authentication state and user profile
 * @requires hooks/useQueries/useGetOrganization - For fetching organization details
 * @exports {FC} BrandOwnerLayout - Main layout component
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar, { MenuItem } from '@/components/Sidebar';
import SidebarToggle from '@/components/SidebarToggle';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  ProductsIcon, 
  ProductAddIcon,
  AnalyticsIcon,
  ResellerIcon,
  UsersIcon 
} from '@/components/icons';
// Import hooks
import defaultAvatar from '@/assets/default-avatar.jpg';
import { useAuth } from '@/contexts/AuthContext';

// Define IconProps type matching what's in the icons file
type IconProps = {
  fillColor: string;
};

/**
 * Props for the BrandOwnerLayout component
 */
type BrandOwnerLayoutProps = {
  // Explicitly accept children, even though Outlet is used internally
  children: React.ReactNode; 
};

/**
 * Main layout component for brand owner dashboard
 * Provides sidebar navigation and content area, fetching user and org info.
 */
const BrandOwnerLayout: React.FC<BrandOwnerLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: isAuthLoading, brandOwnerDetails, role } = useAuth();
  const organization = brandOwnerDetails?.active_organization;

  const [collapsed, setCollapsed] = useState(false);

  const handleMenuToggle = () => {
    setCollapsed(!collapsed);
  };

  const principalIdForDisplay = useMemo(() => {
    if (isAuthLoading && !user) return 'Loading...';
    return user?.id?.toText() ?? 'N/A';
  }, [user, isAuthLoading]);

  const userDisplayName = useMemo(() => {
    if (isAuthLoading && !user) return 'Loading...';
    if (!user) return 'Brand Owner'; // Default display name
    const firstName = user.first_name && user.first_name.length > 0 ? user.first_name[0] : null;
    const lastName = user.last_name && user.last_name.length > 0 ? user.last_name[0] : null;
    const email = user.email && user.email.length > 0 ? user.email[0] : null;

    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (email) return email;
    return user.id?.toText() || 'Brand Owner';
  }, [user, isAuthLoading]);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const menuItems: MenuItem[] = useMemo(() => [
    {
      label: 'Products',
      icon: ProductsIcon as React.ComponentType<IconProps>,
      active: location.pathname.startsWith('/brand-owners/products') || location.pathname === '/brand-owners',
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
      active: location.pathname.startsWith('/brand-owners/resellers'),
      onClickEvent: () => handleNavigate('/brand-owners/resellers'),
    },
    {
      label: 'User Management',
      icon: UsersIcon as React.ComponentType<IconProps>,
      active: location.pathname.startsWith('/brand-owners/users'),
      onClickEvent: () => handleNavigate('/brand-owners/users'),
    },
    {
      label: 'Analytics', // Corrected label spelling
      icon: AnalyticsIcon as React.ComponentType<IconProps>,
      active: location.pathname.startsWith('/brand-owners/analytics'),
      onClickEvent: () => handleNavigate('/brand-owners/analytics'),
    },
  ], [location.pathname, navigate]);

  const userAvatar = useMemo(() => {
    return defaultAvatar;
  }, [user]);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setCollapsed(savedState === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  }, [collapsed]);

  const formatOrgId = (idText: string | undefined) => {
    if (!idText) return 'N/A';
    return idText.length > 10 ? `${idText.slice(0, 5)}...${idText.slice(-5)}` : idText;
  };

  const currentPageTitle = menuItems.find(item => item.active)?.label || 'Dashboard';

  if (isAuthLoading && !user) { 
    return <div className="flex h-screen items-center justify-center"><LoadingSpinner size="lg"/></div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        menuItems={menuItems} 
        userAvatar={userAvatar} 
        principalId={userDisplayName}
        collapsed={collapsed}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <SidebarToggle collapsed={collapsed} onClick={handleMenuToggle} />
              <div className="ml-4">
                <h1 className="text-xl font-semibold">{currentPageTitle}</h1>
              </div>
            </div>
            
            <div className="flex items-center">
              {isAuthLoading && !organization ? (
                <div className="flex items-center text-sm text-gray-500">
                   <LoadingSpinner size="sm" className="mr-2" />
                  <span>Loading org...</span>
                </div>
              ) : organization ? (
                <div className="flex flex-col items-end">
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-1">Organization:</span>
                    <span className="text-sm font-bold text-primary">{organization.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-1">ID:</span>
                    <span className="text-xs text-gray-500" title={organization.id.toText()}>
                      {formatOrgId(organization.id.toText())}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-end">
                  <span className="text-sm text-amber-600">No active organization</span>
                  {role && <span className="text-xs text-gray-500">Role: {role}</span>}
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default BrandOwnerLayout; 