import { MenuIcon, ChevronLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Props for the SidebarToggle component
 */
type SidebarToggleProps = {
  /** Whether the sidebar is currently collapsed */
  collapsed: boolean;
  /** Function to toggle the sidebar collapsed state */
  onClick: () => void;
  /** Optional classname for additional styling */
  className?: string;
};

/**
 * A button component that toggles the sidebar between expanded and collapsed states
 * 
 * @param collapsed Whether the sidebar is currently collapsed
 * @param onClick Function to call when the toggle is clicked
 * @param className Optional additional CSS classes
 */
const SidebarToggle: React.FC<SidebarToggleProps> = ({
  collapsed,
  onClick,
  className = ""
}) => {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      size="icon"
      className={`rounded-full ${className}`}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? (
        <MenuIcon className="h-5 w-5" />
      ) : (
        <ChevronLeftIcon className="h-5 w-5" />
      )}
    </Button>
  );
};

export default SidebarToggle; 