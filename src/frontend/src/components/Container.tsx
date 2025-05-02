import * as React from "react";
import { cn } from "@/lib/utils";

type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

interface ContainerProps {
  children: React.ReactNode;
  size?: ContainerSize;
  className?: string;
  centered?: boolean;
  padded?: boolean;
}

/**
 * A responsive container component for layout.
 */
const Container: React.FC<ContainerProps> = ({
  children,
  size = "lg",
  className,
  centered = false,
  padded = true,
}) => {
  const sizeClasses: Record<ContainerSize, string> = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    full: "max-w-full",
  };

  return (
    <div
      className={cn(
        "w-full",
        sizeClasses[size],
        padded && "px-4 md:px-6",
        centered && "mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export { Container }; 