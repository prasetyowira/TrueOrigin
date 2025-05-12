import * as React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
  homeIcon?: boolean;
}

/**
 * A breadcrumb navigation component displaying the current page location hierarchy.
 */
const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className,
  separator = <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />,
  homeIcon = true,
}) => {
  if (!items.length) return null;

  return (
    <nav className={cn("flex", className)} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;
          
          const content = (
            <div className="flex items-center">
              {isFirst && homeIcon ? (
                <Home className="h-4 w-4 mr-1" />
              ) : item.icon ? (
                <span className="mr-1">{item.icon}</span>
              ) : null}
              <span className={cn(
                isLast ? "font-medium" : "text-muted-foreground",
              )}>
                {item.label}
              </span>
            </div>
          );

          return (
            <li key={index} className="inline-flex items-center">
              {index > 0 && separator}
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="inline-flex items-center hover:text-primary hover:underline transition-colors"
                >
                  {content}
                </Link>
              ) : (
                <span className="inline-flex items-center">
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export { Breadcrumb, type BreadcrumbItem }; 