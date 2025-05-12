import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu } from './interfaces';
import { useAuthContext } from '@/contexts/useAuthContext';
import { Button } from './ui/button';
import { Menu as MenuIcon, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  menuItems: Menu[];
  title: string;
  logo?: React.ReactNode;
}

/**
 * Shared dashboard layout component for Brand Owner and Reseller dashboards
 * 
 * Provides a responsive sidebar with navigation links and a main content area
 * that renders the current route's component via Outlet.
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  menuItems,
  title,
  logo,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout, profile } = useAuthContext();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  // Get user's initial for avatar
  const getUserInitial = () => {
    if (profile && profile.first_name && typeof profile.first_name === 'string' && profile.first_name.length > 0) {
      return profile.first_name[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-gray-200 shadow-lg transition-transform duration-300 ease-in-out transform lg:relative lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <div className="flex items-center gap-2">
            {logo}
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={toggleSidebar}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {menuItems.map((item, index) => (
              <li key={index}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  {typeof item.logo === 'string' ? (
                    <span>{item.logo}</span>
                  ) : (
                    item.logo
                  )}
                  <span>{item.name}</span>
                  <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer - User profile & logout */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                {getUserInitial()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{profile?.first_name || 'User'}</p>
                <p className="text-xs text-gray-500">{profile?.email || ''}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-gray-700"
            >
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 flex h-16 items-center bg-white border-b border-gray-200 px-4">
          <Button
            variant="ghost"
            size="sm"
            className="mr-4 lg:hidden"
            onClick={toggleSidebar}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">{title}</h1>
          <div className="ml-auto flex items-center space-x-4">
            {/* Other header controls can go here */}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay - when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}; 