import logo from "../assets/true-origin.png"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from 'lucide-react'; // Placeholder icon

/**
 * Represents a single navigation item in the sidebar menu.
 */
type MenuItem = {
    /** The visible text label for the menu item. */
    label: string;
    /** A React component representing the icon for the menu item. */
    icon: React.ComponentType<{ fillColor: string }>;
    /** Whether the menu item is currently active/selected. */
    active: boolean;
    /** Function to call when the menu item is clicked. Receives the item's label. */
    onClickEvent: (label: string) => void;
}

/**
 * Props for the Sidebar component.
 */
type SidebarProps = {
    /** An array of MenuItem objects defining the navigation structure. */
    menuItems: MenuItem[];
    /** URL for the user's avatar image. */
    userAvatar: string;
    /** The display name of the logged-in user. */
    username: string;
}

/**
 * Renders the main application sidebar navigation.
 *
 * @param menuItems - Array of navigation items.
 * @param userAvatar - URL for the user's avatar.
 * @param username - Display name of the user.
 */
const Sidebar: React.FC<SidebarProps> = ({ menuItems, userAvatar, username }) => {
    return (
        <aside className="w-64 bg-white h-screen shadow-md flex flex-col justify-between">
            <div>
                <div className="p-4 flex items-center justify-center">
                    <img src={logo} className="max-w-[180px]" />
                </div>
                <nav className="mt-8">
                    <ul className="p-5">
                        {menuItems.map((item, index) => (
                            <li
                                key={index}
                                className={`flex items-center p-2 ${
                                  item.active
                                    ? "text-primary bg-gray-100"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                } rounded-lg gap-2 mt-2 cursor-pointer`}
                                onClick={() => item.onClickEvent(item.label)}
                            >
                                <item.icon fillColor="currentColor" />
                                <span>{item.label}</span>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
            <div className="p-4 border-t border-gray-200 flex items-center">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={userAvatar} alt={username} />
                    <AvatarFallback>{username.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{username}</p>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                        View profile
                    </a>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto rounded-full">
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>
        </aside>
    );
};

export default Sidebar