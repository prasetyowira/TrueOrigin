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
import { 
  ProductsIcon, 
  ProductAddIcon,
  AnalyticsIcon,
  ResellerIcon,
  UsersIcon 
} from '../components/icons';
import defaultAvatar from '../assets/default-avatar.jpg';

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
          <div className="px-4 py-2 flex items-center">
            <SidebarToggle collapsed={collapsed} onClick={handleMenuToggle} />
            <div className="ml-4">
              <h1 className="text-xl font-semibold">
                {menuItems.find(item => item.active)?.label || 'Dashboard'}
              </h1>
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