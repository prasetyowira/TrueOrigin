import * as React from "react";
import { cn } from "@/lib/utils";

type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
  color?: string;
}

/**
 * A customizable loading spinner with different size variants.
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = "md", 
  className,
  color = "primary"
}) => {
  // Size variants in pixels
  const sizeClasses: Record<SpinnerSize, string> = {
    xs: "h-4 w-4 border-[2px]",
    sm: "h-6 w-6 border-[2px]",
    md: "h-8 w-8 border-[3px]",
    lg: "h-12 w-12 border-[3px]",
    xl: "h-16 w-16 border-[4px]",
  };

  // Color variants
  const colorClasses: Record<string, string> = {
    primary: "border-primary",
    secondary: "border-secondary",
    muted: "border-muted",
    white: "border-white",
    gray: "border-gray-300",
  };

  return (
    <div
      className={cn(
        "inline-block animate-spin rounded-full border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]",
        sizeClasses[size],
        colorClasses[color] || `border-${color}`,
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export { LoadingSpinner }; 