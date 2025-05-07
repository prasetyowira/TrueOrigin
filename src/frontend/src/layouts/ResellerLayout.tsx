/**
 * @file Reseller Layout Component
 * @fileoverview Provides a consistent layout for all reseller pages with a sidebar navigation and content area.
 * Fetches and displays user information.
 * 
 * @module layouts/ResellerLayout
 * @requires react-router-dom - For navigation and routing context
 * @requires components/Sidebar - For navigation sidebar
 * @requires contexts/useAuthContext - For authentication state and user profile
 * @exports {FC} ResellerLayout - Main layout component
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar, { MenuItem } from '@/components/Sidebar';
import SidebarToggle from '@/components/SidebarToggle';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  LayoutDashboardIcon as LucideLayoutDashboard,
  BadgeCheckIcon as LucideBadgeCheck,
} from 'lucide-react';
import defaultAvatar from '@/assets/default-avatar.jpg';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import type { UserPublic as DidUserPublic } from '@declarations/TrustOrigin_backend/TrustOrigin_backend.did';

// Wrapper components for Lucide icons to match Sidebar's expected icon prop type
const LayoutDashboardIcon: React.FC<{ fillColor: string }> = ({ fillColor }) => (
  <LucideLayoutDashboard color={fillColor} />
);
const BadgeCheckIcon: React.FC<{ fillColor: string }> = ({ fillColor }) => (
  <LucideBadgeCheck color={fillColor} />
);

type ResellerLayoutProps = {
  children: React.ReactNode;
};

const ResellerLayout: React.FC<ResellerLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: isAuthLoading, resellerDetails } = useAuth();

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
    if (!user) return 'Reseller User';
    const firstName = user.first_name && user.first_name.length > 0 ? user.first_name[0] : null;
    const lastName = user.last_name && user.last_name.length > 0 ? user.last_name[0] : null;
    const email = user.email && user.email.length > 0 ? user.email[0] : null;

    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (email) return email;
    return user.id?.toText() || 'Reseller User';
  }, [user, isAuthLoading]);

  const organizationName = resellerDetails?.associated_organization?.name || 'Associated Brand';

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const menuItems: MenuItem[] = useMemo(() => [
    {
      label: 'Dashboard',
      icon: LayoutDashboardIcon,
      active: location.pathname.includes('/reseller/dashboard'),
      onClickEvent: () => handleNavigate('/reseller/dashboard'),
    },
    {
      label: 'Certification',
      icon: BadgeCheckIcon,
      active: location.pathname.includes('/reseller/certification'),
      onClickEvent: () => handleNavigate('/reseller/certification'),
    },
  ], [location.pathname, navigate]);

  const userAvatar = useMemo(() => {
    // Future: user?.detail_meta?.find(item => item.key === 'avatar')?.value || defaultAvatar;
    return defaultAvatar;
  }, [user]);

  useEffect(() => {
    const savedState = localStorage.getItem('resellerSidebarCollapsed');
    if (savedState !== null) {
      setCollapsed(savedState === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('resellerSidebarCollapsed', String(collapsed));
  }, [collapsed]);

  const formatOrgId = (idText: string | undefined) => {
    if (!idText) return 'N/A';
    return idText.length > 10 ? `${idText.slice(0, 5)}...${idText.slice(-5)}` : idText;
  };
  
  const currentPageTitle = menuItems.find(item => item.active)?.label || 'Reseller Portal';

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
              {isAuthLoading && !resellerDetails?.associated_organization ? (
                <div className="flex items-center text-sm text-gray-500">
                   <LoadingSpinner size="sm" className="mr-2" />
                  <span>Loading brand...</span>
                </div>
              ) : resellerDetails?.associated_organization ? (
                <div className="flex flex-col items-end">
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-1">Brand:</span>
                    <span className="text-sm font-bold text-primary">{resellerDetails.associated_organization.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-1">ID:</span>
                    <span className="text-xs text-gray-500" title={resellerDetails.associated_organization.id.toText()}>
                      {formatOrgId(resellerDetails.associated_organization.id.toText())}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-amber-600">No associated brand</span>
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

export default ResellerLayout; 