import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  bordered?: boolean;
  elevated?: boolean;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * A versatile card component with header, body, and footer sections.
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, hoverable, bordered = true, elevated }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg bg-card text-card-foreground",
          bordered && "border",
          elevated && "shadow-sm",
          hoverable && "transition-all duration-200 hover:shadow-md",
          className
        )}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

/**
 * Header section for the Card component.
 */
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

/**
 * Body section for the Card component.
 */
const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ children, className }, ref) => {
    return (
      <div ref={ref} className={cn("p-6 pt-0", className)}>
        {children}
      </div>
    );
  }
);

CardBody.displayName = "CardBody";

/**
 * Footer section for the Card component.
 */
const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardBody, CardFooter }; 