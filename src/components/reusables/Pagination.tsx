"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  className?: string;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className = "",
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
    >
      {/* Items per page selector */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="hidden sm:inline">Show</span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => onItemsPerPageChange(Number(value))}
        >
          <SelectTrigger className="w-16 sm:w-20 bg-background border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem
                key={size}
                value={size.toString()}
                className="text-foreground hover:bg-muted"
              >
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="hidden sm:inline">per page</span>
      </div>

      {/* Page info */}
      <div className="text-sm text-muted-foreground order-first sm:order-none">
        <span className="hidden sm:inline">Showing </span>
        {startItem}-{endItem}{" "}
        <span className="hidden sm:inline">of {totalItems} items</span>
        <span className="sm:hidden">/ {totalItems}</span>
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto max-w-full">
        {/* First page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 h-8 w-8 p-0 flex-shrink-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 h-8 w-8 p-0 flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
          {getVisiblePages().map((page, index) => (
            <div key={index} className="flex-shrink-0">
              {page === "..." ? (
                <span className="px-2 py-1 text-muted-foreground text-sm">
                  ...
                </span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className={
                    currentPage === page
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 h-8 w-8 p-0"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 p-0"
                  }
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Next page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 h-8 w-8 p-0 flex-shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 h-8 w-8 p-0 flex-shrink-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
