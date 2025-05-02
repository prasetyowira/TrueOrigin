import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
  showFirstLast?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "outline" | "ghost";
}

/**
 * A pagination component for navigating through multi-page content.
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
  showFirstLast = true,
  size = "md",
  variant = "outline",
}) => {
  // Prevent out-of-bounds pages
  const safePage = Math.max(1, Math.min(currentPage, totalPages));

  // Define sizes for different variants
  const buttonSizes = {
    sm: "h-7 w-7 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-9 w-9",
  };
  
  // Generate page numbers to show
  const generatePagination = (): (number | "dots")[] => {
    if (totalPages <= siblingCount * 2 + 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Always include first and last page
    const startPages = Array.from(
      { length: siblingCount + 1 },
      (_, i) => i + 1
    );
    const endPages = Array.from(
      { length: siblingCount + 1 },
      (_, i) => totalPages - siblingCount + i
    );
    
    // Current page and siblings
    const middlePages = Array.from(
      { length: siblingCount * 2 + 1 },
      (_, i) => currentPage - siblingCount + i
    ).filter(page => page > 0 && page <= totalPages);
    
    const result: (number | "dots")[] = [];
    
    // Add first pages
    startPages.forEach(page => {
      if (!result.includes(page) && page <= totalPages) {
        result.push(page);
      }
    });
    
    // Add dots before middle pages if needed
    const lastResultItem = result[result.length - 1];
    if (typeof lastResultItem === 'number' && middlePages[0] > lastResultItem + 1) {
      result.push("dots");
    }
    
    // Add middle pages
    middlePages.forEach(page => {
      const lastItem = result[result.length - 1];
      if (!result.includes(page) && (lastItem === "dots" || typeof lastItem === 'number' && page > lastItem)) {
        result.push(page);
      }
    });
    
    // Add dots after middle pages if needed
    const lastResult = result[result.length - 1];
    const lastMiddlePage = middlePages[middlePages.length - 1];
    
    if (endPages[0] > (lastResult === "dots" 
      ? (typeof lastMiddlePage === 'number' ? lastMiddlePage + 1 : 0)
      : (typeof lastResult === 'number' ? lastResult + 1 : 0))
    ) {
      result.push("dots");
    }
    
    // Add end pages
    endPages.forEach(page => {
      const lastItem = result[result.length - 1];
      if (!result.includes(page) && (
        lastItem === "dots" || 
        (typeof lastItem === 'number' && page > lastItem)
      )) {
        result.push(page);
      }
    });
    
    return result;
  };
  
  const pageItems = generatePagination();
  
  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn("flex items-center justify-center", className)}
    >
      <ul className="flex items-center gap-1">
        {showFirstLast && (
          <li>
            <Button
              variant={variant}
              size="icon"
              className={buttonSizes[size]}
              onClick={() => onPageChange(1)}
              disabled={safePage === 1}
              aria-label="Go to first page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </li>
        )}
        
        <li>
          <Button
            variant={variant}
            size="icon"
            className={buttonSizes[size]}
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage === 1}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </li>
        
        {pageItems.map((page, i) => (
          <li key={i}>
            {page === "dots" ? (
              <span className="flex h-8 w-8 items-center justify-center">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            ) : (
              <Button
                variant={page === safePage ? "default" : variant}
                size="icon"
                className={buttonSizes[size]}
                onClick={() => onPageChange(page)}
                aria-current={page === safePage ? "page" : undefined}
                aria-label={`Page ${page}`}
              >
                {page}
              </Button>
            )}
          </li>
        ))}
        
        <li>
          <Button
            variant={variant}
            size="icon"
            className={buttonSizes[size]}
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage === totalPages}
            aria-label="Go to next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </li>
        
        {showFirstLast && (
          <li>
            <Button
              variant={variant}
              size="icon"
              className={buttonSizes[size]}
              onClick={() => onPageChange(totalPages)}
              disabled={safePage === totalPages}
              aria-label="Go to last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export { Pagination }; 