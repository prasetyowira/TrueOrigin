import * as React from "react";
import { cn } from "@/lib/utils";

type TooltipPosition = "top" | "right" | "bottom" | "left";

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
}

/**
 * A tooltip component that displays contextual information on hover.
 */
const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = "top",
  delay = 300,
  className,
  contentClassName,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [delayHandler, setDelayHandler] = React.useState<NodeJS.Timeout | null>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  
  // Position classes
  const positionClasses: Record<TooltipPosition, string> = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-2",
    right: "left-full top-1/2 transform -translate-y-1/2 translate-x-2 ml-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 translate-y-2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 -translate-x-2 mr-2",
  };
  
  // Arrow position classes
  const arrowClasses: Record<TooltipPosition, string> = {
    top: "bottom-[-6px] left-1/2 transform -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent",
    right: "left-[-6px] top-1/2 transform -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent",
    bottom: "top-[-6px] left-1/2 transform -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent",
    left: "right-[-6px] top-1/2 transform -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent",
  };
  
  const showTooltip = () => {
    if (disabled) return;
    
    if (delayHandler) clearTimeout(delayHandler);
    const handler = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setDelayHandler(handler);
  };
  
  const hideTooltip = () => {
    if (delayHandler) clearTimeout(delayHandler);
    setDelayHandler(null);
    setIsVisible(false);
  };
  
  React.useEffect(() => {
    return () => {
      if (delayHandler) clearTimeout(delayHandler);
    };
  }, [delayHandler]);
  
  return (
    <div className={cn("relative inline-block", className)} onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            "absolute z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-md whitespace-nowrap",
            positionClasses[position],
            contentClassName
          )}
          role="tooltip"
        >
          {content}
          <div
            className={cn(
              "absolute w-0 h-0 border-4",
              arrowClasses[position]
            )}
          />
        </div>
      )}
    </div>
  );
};

export { Tooltip }; 