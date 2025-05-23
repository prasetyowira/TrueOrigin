import logo from "../assets/true-origin.png"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import UpdateOrganizationDialog from "./UpdateOrganizationDialog";
import { FEUserRole } from "@/hooks/useQueries/authQueries";

/**
 * Represents a single navigation item in the sidebar menu.
 */
export type MenuItem = {
    /** The visible text label for the menu item. */
    label: string;
    /** A React component representing the icon for the menu item. */
    icon: React.ComponentType<{ fillColor: string }>;
    /** Whether the menu item is currently active/selected. */
    active: boolean;
    /** Function to call when the menu item is clicked. Receives the item's label. */
    onClickEvent: (label: string) => void;
    disabled?: boolean;
}

/**
 * Props for the Sidebar component.
 */
type SidebarProps = {
    /** An array of MenuItem objects defining the navigation structure. */
    menuItems: MenuItem[];
    /** URL for the user's avatar image. */
    userAvatar: string;
    /** The principal ID of the logged-in user. */
    principalId: string;
    /** Whether the sidebar is collapsed (optional). */
    collapsed?: boolean;
    /** Callback when a menu item is clicked, useful for mobile views (optional). */
    onItemClick?: () => void;
}

/**
 * Renders the main application sidebar navigation.
 *
 * @param menuItems - Array of navigation items.
 * @param userAvatar - URL for the user's avatar.
 * @param principalId - Principal ID of the user.
 * @param collapsed - Whether the sidebar is in collapsed state.
 * @param onItemClick - Optional callback when a menu item is clicked.
 */
const Sidebar: React.FC<SidebarProps> = ({ 
    menuItems, 
    userAvatar, 
    principalId,
    collapsed = false,
    onItemClick
}) => {
    const { logout, user, role } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleMenuItemClick = (item: MenuItem) => {
        item.onClickEvent(item.label);
        if (onItemClick) onItemClick();
    };

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await logout();
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    // Use the 'role' from useAuth()
    const isBrandOwner = role === FEUserRole.BrandOwner;

    const getAvatarFallback = () => {
        if (!principalId || principalId === 'Loading...' || principalId === 'Anonymous') {
            return principalId === 'Loading...' ? '...' : 'A';
        }
        // Display name (principalId prop is now userDisplayName from ResellerLayout)
        const nameParts = principalId.split(' ');
        if (nameParts.length > 1) {
            return nameParts[0][0].toUpperCase() + nameParts[nameParts.length - 1][0].toUpperCase();
        }
        return principalId.charAt(0).toUpperCase();
    };

    // Handler for avatar click - open dialog only for brand owners
    const handleAvatarClick = () => {
        if (isBrandOwner) {
            setIsDialogOpen(true);
        }
    };

    return (
        <>
            <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-white h-screen shadow-md flex flex-col justify-between transition-all duration-300 ease-in-out`}>
                <div>
                    <div className={`p-4 flex items-center ${collapsed ? 'justify-center' : 'justify-center'}`}>
                        <img src={logo} className={collapsed ? "max-w-[40px]" : "max-w-[180px]"} alt="TrueOrigin Logo" />
                    </div>
                    <nav className="mt-8">
                        <ul className={`${collapsed ? 'p-2' : 'p-5'}`}>
                            {menuItems.map((item, index) => (
                                <li
                                    key={index}
                                    className={`flex items-center p-2 ${
                                      item.active
                                        ? "text-primary bg-indigo-100 font-semibold"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    } rounded-lg ${collapsed ? 'justify-center' : 'gap-2'} mt-2 cursor-pointer ${
                                      item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    onClick={() => !item.disabled && handleMenuItemClick(item)}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <item.icon fillColor={item.active ? "#2C42C0" : "currentColor"} />
                                    {!collapsed && <span>{item.label}</span>}
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
                <div className={`p-4 border-t border-gray-200 ${collapsed ? 'flex flex-col items-center' : 'flex items-center'}`}>
                    <div 
                        className={`cursor-pointer ${isBrandOwner ? 'hover:ring-2 hover:ring-offset-2 hover:ring-blue-500 rounded-full transition-all' : ''}`}
                        onClick={handleAvatarClick}
                        title={isBrandOwner ? "Update Organization" : undefined}
                    >
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={userAvatar} alt={principalId} />
                            <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                        </Avatar>
                    </div>
                    {!collapsed && (
                        <>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900" title={user?.id?.toText()}>{principalId}</p> {/* principalId is userDisplayName here */}
                                <p className="text-xs text-muted-foreground">{role ? role : 'User'}</p> {/* Display role */}
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="ml-auto rounded-full" 
                                onClick={handleLogout} 
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <LogOut className="h-5 w-5" />
                                )}
                            </Button>
                        </>
                    )}
                    {collapsed && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="mt-2 rounded-full" 
                            onClick={handleLogout} 
                            title="Logout"
                            disabled={isLoggingOut}
                        >
                            {isLoggingOut ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <LogOut className="h-5 w-5" />
                            )}
                        </Button>
                    )}
                </div>
            </aside>

            {/* Organization Update Dialog */}
            {isBrandOwner && (
                <UpdateOrganizationDialog 
                    open={isDialogOpen} 
                    onOpenChange={setIsDialogOpen} 
                />
            )}
        </>
    );
};

export default Sidebar