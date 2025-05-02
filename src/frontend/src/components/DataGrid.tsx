import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Column<T> {
  key: string;
  header: string;
  renderCell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  hidden?: boolean;
}

export interface DataGridProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  loading?: boolean;
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  currentPage?: number;
  totalItems?: number;
  sortable?: boolean;
  onSortChange?: (column: string, direction: "asc" | "desc" | null) => void;
  filterable?: boolean;
  onFilterChange?: (column: string, value: string) => void;
  emptyStateMessage?: string;
  className?: string;
  striped?: boolean;
  bordered?: boolean;
}

/**
 * A data grid component for displaying and managing tabular data with sorting, filtering, and pagination.
 */
function DataGrid<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  pagination = false,
  pageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  onPageChange,
  onPageSizeChange,
  currentPage = 1,
  totalItems = 0,
  sortable = false,
  onSortChange,
  filterable = false,
  onFilterChange,
  emptyStateMessage = "No data available",
  className,
  striped = false,
  bordered = false,
}: DataGridProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc" | null>(null);
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const [localCurrentPage, setLocalCurrentPage] = React.useState(currentPage);
  const [localPageSize, setLocalPageSize] = React.useState(pageSize);

  // Handle controlled vs uncontrolled pagination
  React.useEffect(() => {
    setLocalCurrentPage(currentPage);
  }, [currentPage]);

  React.useEffect(() => {
    setLocalPageSize(pageSize);
  }, [pageSize]);

  // Calculate pagination details
  const totalPages = Math.max(1, Math.ceil(totalItems / localPageSize));
  
  // Handle sort change
  const handleSortChange = (column: string) => {
    if (!sortable || !onSortChange) return;
    
    let newDirection: "asc" | "desc" | null = "asc";
    
    if (sortColumn === column) {
      if (sortDirection === "asc") newDirection = "desc";
      else if (sortDirection === "desc") newDirection = null;
    }
    
    setSortColumn(newDirection ? column : null);
    setSortDirection(newDirection);
    onSortChange(column, newDirection);
  };
  
  // Handle filter change
  const handleFilterChange = (column: string, value: string) => {
    if (!filterable || !onFilterChange) return;
    
    const newFilters = { ...filters, [column]: value };
    setFilters(newFilters);
    onFilterChange(column, value);
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setLocalCurrentPage(newPage);
    if (onPageChange) onPageChange(newPage);
  };
  
  // Handle page size change
  const handlePageSizeChange = (size: string) => {
    const newSize = parseInt(size, 10);
    setLocalPageSize(newSize);
    if (onPageSizeChange) onPageSizeChange(newSize);
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Filters */}
      {filterable && (
        <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {columns
            .filter((column) => !column.hidden)
            .map((column) => (
              <div key={`filter-${column.key}`}>
                <Input 
                  placeholder={`Filter by ${column.header}`}
                  value={filters[column.key] || ""}
                  onChange={(e) => handleFilterChange(column.key, e.target.value)}
                  className="w-full"
                />
              </div>
            ))}
        </div>
      )}
      
      {/* Data Table */}
      <div className="rounded-md border">
        <Table bordered={bordered}>
          <TableHeader>
            <TableRow>
              {columns
                .filter((column) => !column.hidden)
                .map((column) => (
                  <TableHead 
                    key={column.key}
                    className={cn(
                      column.sortable && sortable && "cursor-pointer select-none",
                    )}
                    onClick={() => {
                      if (column.sortable && sortable) {
                        handleSortChange(column.key);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.header}</span>
                      {column.sortable && sortable && (
                        <span className="inline-flex">
                          {sortColumn === column.key ? (
                            sortDirection === "asc" ? (
                              <SortAsc className="h-4 w-4" />
                            ) : sortDirection === "desc" ? (
                              <SortDesc className="h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4 opacity-50" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.filter((col) => !col.hidden).length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.filter((col) => !col.hidden).length}
                  className="h-24 text-center"
                >
                  {emptyStateMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, rowIndex) => (
                <TableRow 
                  key={keyExtractor(item)}
                  className={cn(
                    striped && rowIndex % 2 === 1 && "bg-muted/50"
                  )}
                >
                  {columns
                    .filter((column) => !column.hidden)
                    .map((column) => (
                      <TableCell key={`${keyExtractor(item)}-${column.key}`}>
                        {column.renderCell
                          ? column.renderCell(item)
                          : (item as any)[column.key] !== undefined
                          ? String((item as any)[column.key])
                          : ""}
                      </TableCell>
                    ))}
                </TableRow>
              ))
            )}
          </TableBody>
          {pagination && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={columns.filter((col) => !col.hidden).length}>
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        Rows per page:
                      </span>
                      <Select
                        value={String(localPageSize)}
                        onValueChange={handlePageSizeChange}
                      >
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue placeholder={String(localPageSize)} />
                        </SelectTrigger>
                        <SelectContent>
                          {pageSizeOptions.map((size) => (
                            <SelectItem key={size} value={String(size)}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">
                        {(localCurrentPage - 1) * localPageSize + 1}-
                        {Math.min(localCurrentPage * localPageSize, totalItems)} of {totalItems}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePageChange(1)}
                        disabled={localCurrentPage === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                        <span className="sr-only">First page</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePageChange(localCurrentPage - 1)}
                        disabled={localCurrentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous page</span>
                      </Button>
                      <span className="text-sm">
                        Page {localCurrentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePageChange(localCurrentPage + 1)}
                        disabled={localCurrentPage >= totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next page</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={localCurrentPage >= totalPages}
                      >
                        <ChevronsRight className="h-4 w-4" />
                        <span className="sr-only">Last page</span>
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}

export { DataGrid }; 