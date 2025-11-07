"use client";

import React, {
  useState,
  createContext,
  useContext,
  useMemo,
  useRef,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  SortAsc,
  SortDesc,
  LayoutGrid,
  LayoutList,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Generic data type for table rows
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TableRowData = Record<string, any>;

// Context for DataTable state management
interface DataTableContextType {
  data: TableRowData[];
  columns: Column[];
  filteredData: TableRowData[];
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  searchTerm: string;
  viewMode: "table" | "grid";
  itemHeight: number;
  containerHeight: number;
  isLoading: boolean;
  error: string | null;
  setSortColumn: (column: string | null) => void;
  setSortDirection: (direction: "asc" | "desc") => void;
  setSearchTerm: (term: string) => void;
  setViewMode: (mode: "table" | "grid") => void;
}

const DataTableContext = createContext<DataTableContextType | null>(null);

const useDataTable = () => {
  const context = useContext(DataTableContext);
  if (!context) {
    throw new Error("useDataTable must be used within DataTable.Provider");
  }
  return context;
};

// Column definition interface
export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  minWidth?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: any, row: TableRowData, index: number) => React.ReactNode;
  headerRender?: () => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  responsive?: "always" | "sm" | "md" | "lg" | "xl";
}

// Main Provider Component
interface DataTableProviderProps {
  children: React.ReactNode;
  data: TableRowData[];
  columns: Column[];
  isLoading?: boolean;
  error?: string | null;
  defaultSort?: { column: string; direction: "asc" | "desc" };
  itemHeight?: number;
  containerHeight?: number;
  onSort?: (column: string, direction: "asc" | "desc") => void;
  onFilter?: (searchTerm: string) => void;
}

function DataTableProvider({
  children,
  data,
  columns,
  isLoading = false,
  error = null,
  defaultSort,
  itemHeight = 56,
  containerHeight = 400,
  onSort,
  onFilter,
}: DataTableProviderProps) {
  const [sortColumn, setSortColumn] = useState(defaultSort?.column || null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    defaultSort?.direction || "asc"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = data || [];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((row) =>
        columns.some((column) => {
          if (!column.filterable) return false;
          const value = row[column.key];
          return String(value || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (aValue === bValue) return 0;

        const comparison = aValue < bValue ? -1 : 1;
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, sortColumn, sortDirection, columns]);

  // Handle sort changes
  const handleSortChange = (column: string | null) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }

    if (onSort && column) {
      onSort(column, sortDirection === "asc" ? "desc" : "asc");
    }
  };

  // Handle search changes with debouncing
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    if (onFilter) {
      onFilter(term);
    }
  };

  const contextValue: DataTableContextType = {
    data,
    columns,
    filteredData,
    sortColumn,
    sortDirection,
    searchTerm,
    viewMode,
    itemHeight,
    containerHeight,
    isLoading,
    error,
    setSortColumn: handleSortChange,
    setSortDirection,
    setSearchTerm: handleSearchChange,
    setViewMode,
  };

  return (
    <DataTableContext.Provider value={contextValue}>
      {children}
    </DataTableContext.Provider>
  );
}

// Search Component
function DataTableSearch({
  placeholder = "Search...",
}: {
  placeholder?: string;
}) {
  const { searchTerm, setSearchTerm } = useDataTable();
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Debounced search handler
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSearch = (value: string) => {
    setLocalSearch(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(value);
    }, 300);
  };

  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={localSearch}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}

// View Toggle Component
function DataTableViewToggle() {
  const { viewMode, setViewMode } = useDataTable();

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-sm">
      <Button
        variant={viewMode === "table" ? "default" : "ghost"}
        size="sm"
        className="h-7 px-2"
        onClick={() => setViewMode("table")}
      >
        <LayoutList className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "grid" ? "default" : "ghost"}
        size="sm"
        className="h-7 px-2"
        onClick={() => setViewMode("grid")}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Toolbar Component
interface DataTableToolbarProps {
  children?: React.ReactNode;
  showSearch?: boolean;
  showViewToggle?: boolean;
  searchPlaceholder?: string;
}

function DataTableToolbar({
  children,
  showSearch = true,
  showViewToggle = false,
  searchPlaceholder,
}: DataTableToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 border-b border-border/50">
      <div className="flex items-center gap-2">
        {showSearch && <DataTableSearch placeholder={searchPlaceholder} />}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {showViewToggle && <DataTableViewToggle />}
      </div>
    </div>
  );
}

// Virtual Table Component
function DataTableVirtualized() {
  const {
    filteredData,
    columns,
    itemHeight,
    containerHeight,
    sortColumn,
    sortDirection,
    setSortColumn,
  } = useDataTable();

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  });

  const handleSort = (columnKey: string) => {
    if (columns.find((col) => col.key === columnKey)?.sortable) {
      setSortColumn(columnKey);
    }
  };

  if (!filteredData.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No data to display
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Table Header */}
      <div className="flex bg-muted/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn(
              "px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
              column.align === "center" && "text-center",
              column.align === "right" && "text-right",
              column.sortable &&
                "cursor-pointer hover:text-foreground transition-colors select-none"
            )}
            style={{
              width: column.width || `${100 / columns.length}%`,
              minWidth: column.minWidth || 100,
            }}
            onClick={() => column.sortable && handleSort(column.key)}
          >
            <div className="flex items-center gap-2">
              {column.headerRender ? column.headerRender() : column.label}
              {column.sortable && (
                <div className="flex flex-col">
                  <SortAsc
                    className={cn(
                      "h-3 w-3 transition-colors",
                      sortColumn === column.key && sortDirection === "asc"
                        ? "text-foreground"
                        : "text-muted-foreground/50"
                    )}
                  />
                  <SortDesc
                    className={cn(
                      "h-3 w-3 -mt-1 transition-colors",
                      sortColumn === column.key && sortDirection === "desc"
                        ? "text-foreground"
                        : "text-muted-foreground/50"
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Virtual List Container */}
      <div
        ref={parentRef}
        style={{ height: containerHeight }}
        className="overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const row = filteredData[virtualItem.index];

            return (
              <div
                key={virtualItem.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: virtualItem.size,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="flex items-center border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                {columns.map((column) => {
                  const value = row[column.key];
                  const cellContent = column.render
                    ? column.render(value, row, virtualItem.index)
                    : value;

                  return (
                    <div
                      key={column.key}
                      className={cn(
                        "px-4 py-3 text-sm align-middle",
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right",
                        column.className
                      )}
                      style={{
                        width: column.width || `${100 / columns.length}%`,
                        minWidth: column.minWidth || 100,
                      }}
                    >
                      {cellContent}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Loading Component
function DataTableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

// Empty State Component
interface DataTableEmptyProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

function DataTableEmpty({
  icon = <LayoutList className="h-12 w-12 text-muted-foreground/50" />,
  title = "No data found",
  description = "There are no items to display at this time.",
  action,
}: DataTableEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon}
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// Error Component
interface DataTableErrorProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

function DataTableError({
  title = "Failed to load data",
  description = "There was an error loading the data. Please try again.",
  onRetry,
}: DataTableErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-sm bg-destructive/10 flex items-center justify-center mb-4">
        <svg
          className="w-6 h-6 text-destructive"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        {description}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-4">
          Try Again
        </Button>
      )}
    </div>
  );
}

// Main Container Component
interface DataTableContainerProps {
  children: React.ReactNode;
  className?: string;
}

function DataTableContainer({ children, className }: DataTableContainerProps) {
  return <Card className={cn("overflow-hidden", className)}>{children}</Card>;
}

// Compound Component Export
export const DataTable = {
  Provider: DataTableProvider,
  Container: DataTableContainer,
  Toolbar: DataTableToolbar,
  Search: DataTableSearch,
  ViewToggle: DataTableViewToggle,
  Virtualized: DataTableVirtualized,
  Loading: DataTableLoading,
  Empty: DataTableEmpty,
  Error: DataTableError,
};

// Hook export
export { useDataTable };

// Types export
export type { DataTableContextType };
