import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionItemProps {
  title: React.ReactNode;
  children: React.ReactNode;
  expanded?: boolean;
  onChange?: (expanded: boolean) => void;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

/**
 * An individual accordion item with a clickable title and expandable content.
 */
const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  children,
  expanded: controlledExpanded,
  onChange,
  className,
  titleClassName,
  contentClassName,
  icon = <ChevronDown className="h-4 w-4 transition-transform duration-200" />,
  disabled = false,
}) => {
  const [internalExpanded, setInternalExpanded] = React.useState(false);
  
  // Handle controlled vs uncontrolled state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  
  const toggleExpanded = () => {
    if (disabled) return;
    
    const newState = !isExpanded;
    if (controlledExpanded === undefined) {
      setInternalExpanded(newState);
    }
    
    if (onChange) {
      onChange(newState);
    }
  };

  return (
    <div className={cn("border-b", className)}>
      <button
        type="button"
        onClick={toggleExpanded}
        className={cn(
          "flex w-full items-center justify-between py-4 text-left font-medium transition-all hover:text-primary",
          disabled && "cursor-not-allowed opacity-50 hover:text-current",
          titleClassName
        )}
        disabled={disabled}
        aria-expanded={isExpanded}
      >
        <span>{title}</span>
        <span
          className={cn(
            "ml-2 flex-shrink-0 transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        >
          {icon}
        </span>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all",
          isExpanded ? "max-h-screen" : "max-h-0",
          contentClassName
        )}
        aria-hidden={!isExpanded}
      >
        <div className="pb-4 pt-2">{children}</div>
      </div>
    </div>
  );
};

interface AccordionProps {
  children: React.ReactNode;
  className?: string;
  allowMultiple?: boolean;
}

interface AccordionComposition {
  Item: typeof AccordionItem;
}

/**
 * An accordion component that groups collapsible content sections.
 */
const Accordion: React.FC<AccordionProps> & AccordionComposition = ({
  children,
  className,
  allowMultiple = false,
}) => {
  return (
    <div className={cn("divide-y divide-border rounded-md border", className)}>
      {children}
    </div>
  );
};

Accordion.Item = AccordionItem;

export { Accordion, AccordionItem }; 