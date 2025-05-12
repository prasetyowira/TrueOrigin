import * as React from "react";
import { cn } from "@/lib/utils";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: AvatarSize;
  rounded?: "full" | "md" | "lg";
  className?: string;
  fallbackClassName?: string;
}

/**
 * An avatar component displaying a user image or initials fallback.
 */
const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "User avatar",
  initials,
  size = "md",
  rounded = "full",
  className,
  fallbackClassName,
}) => {
  const [imageError, setImageError] = React.useState(false);
  
  // Size classes
  const sizeClasses: Record<AvatarSize, string> = {
    xs: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
    xl: "h-16 w-16 text-xl",
  };
  
  // Rounded classes
  const roundedClasses: Record<string, string> = {
    full: "rounded-full",
    md: "rounded-md",
    lg: "rounded-lg",
  };
  
  // Generate initials if not provided
  const getInitials = () => {
    if (initials) return initials;
    if (!alt || alt === "User avatar") return "U";
    
    return alt
      .split(" ")
      .map(word => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };
  
  const handleImageError = () => {
    setImageError(true);
  };
  
  return (
    <div 
      className={cn(
        "inline-flex items-center justify-center overflow-hidden bg-muted",
        sizeClasses[size],
        roundedClasses[rounded],
        className
      )}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          className={cn("h-full w-full object-cover")}
          onError={handleImageError}
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center bg-primary/10 font-medium text-primary",
            fallbackClassName
          )}
          aria-label={alt}
        >
          {getInitials()}
        </div>
      )}
    </div>
  );
};

export { Avatar }; 