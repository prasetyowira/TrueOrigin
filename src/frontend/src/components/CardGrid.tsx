import * as React from "react";
import { cn } from "@/lib/utils";

type GridColumns = 1 | 2 | 3 | 4 | 5 | 6;

interface CardGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    default: GridColumns;
    sm?: GridColumns;
    md?: GridColumns;
    lg?: GridColumns;
    xl?: GridColumns;
  };
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
}

/**
 * A responsive grid layout for displaying cards or content items.
 */
const CardGrid: React.FC<CardGridProps> = ({
  children,
  className,
  columns = { default: 1, md: 2, lg: 3 },
  gap = "md",
}) => {
  // Gap size classes
  const gapClasses = {
    none: "gap-0",
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  };

  // Build responsive grid template columns
  const gridColClasses = [
    `grid-cols-${columns.default}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cn(
        "grid",
        gridColClasses,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
};

export { CardGrid }; 