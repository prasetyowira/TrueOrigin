import * as React from "react";
import { cn } from "@/lib/utils";

interface TabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  defaultActiveId?: string;
  onChange?: (id: string) => void;
  className?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  contentClassName?: string;
  variant?: "default" | "underline" | "pills";
}

/**
 * A tabs component for organizing and navigating between related content sections.
 */
const Tabs: React.FC<TabsProps> = ({
  items,
  defaultActiveId,
  onChange,
  className,
  tabClassName,
  activeTabClassName,
  contentClassName,
  variant = "default",
}) => {
  const [activeId, setActiveId] = React.useState(defaultActiveId || items[0]?.id);

  const handleTabClick = (id: string) => {
    setActiveId(id);
    if (onChange) onChange(id);
  };

  // Style variants
  const variantStyles = {
    default: {
      tabContainer: "border-b border-border",
      tab: "px-4 py-2 border-b-2 border-transparent",
      activeTab: "border-primary text-primary font-medium",
    },
    underline: {
      tabContainer: "border-b border-border",
      tab: "px-4 py-2 border-b-2 border-transparent",
      activeTab: "border-primary text-primary font-medium",
    },
    pills: {
      tabContainer: "space-x-1",
      tab: "px-4 py-2 rounded-md",
      activeTab: "bg-primary/10 text-primary font-medium",
    },
  };

  const selectedVariant = variantStyles[variant];

  // Get the active tab content
  const activeTab = items.find((item) => item.id === activeId);

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("flex mb-4", selectedVariant.tabContainer)}>
        {items.map((item) => (
          <button
            key={item.id}
            className={cn(
              "transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2",
              selectedVariant.tab,
              item.disabled && "opacity-50 cursor-not-allowed",
              activeId === item.id ? selectedVariant.activeTab : "text-muted-foreground hover:text-foreground",
              tabClassName,
              activeId === item.id && activeTabClassName
            )}
            onClick={() => !item.disabled && handleTabClick(item.id)}
            disabled={item.disabled}
            aria-selected={activeId === item.id}
            role="tab"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className={cn("mt-2", contentClassName)}>
        {activeTab?.content}
      </div>
    </div>
  );
};

export { Tabs, type TabItem }; 