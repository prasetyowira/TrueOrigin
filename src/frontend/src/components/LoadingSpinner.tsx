/**
 * @file LoadingSpinner component
 * @fileoverview Reusable loading spinner component
 * 
 * @module components/LoadingSpinner
 * @exports {FC} LoadingSpinner - Loading spinner component
 */

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Displays a loading spinner animation
 * 
 * @param props - Component props including className and size
 * @returns Loading spinner component
 */
export function LoadingSpinner({ 
  className, 
  size = 'md',
  ...props 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={cn(
        "animate-spin text-transparent rounded-full border-2 border-t-primary border-r-primary border-b-gray-200 border-l-gray-200",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
} 