"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search } from "lucide-react";

// Generic filter configuration
export interface FilterConfig {
  key: string;
  label: string;
  type: "search" | "select" | "multiselect";
  options?: Array<{ value: string; label: string; badge?: boolean }>;
  placeholder?: string;
}

// Filter state interface
export interface FilterState {
  [key: string]: string | string[];
}

// Summary stats interface
export interface SummaryStats {
  [key: string]: {
    label: string;
    value: number | string;
    format?: (value: number | string) => string;
  };
}

interface FilterSidebarProps {
  title: string;
  filters: FilterConfig[];
  filterState: FilterState;
  onFilterChange: (key: string, value: string | string[]) => void;
  summaryStats?: SummaryStats;
  className?: string;
}

export function FilterSidebar({
  title,
  filters,
  filterState,
  onFilterChange,
  summaryStats,
  className = "",
}: FilterSidebarProps) {
  const renderFilterInput = (filter: FilterConfig) => {
    const value = filterState[filter.key] || "";

    switch (filter.type) {
      case "search":
        return (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              placeholder={
                filter.placeholder || `Search ${filter.label.toLowerCase()}...`
              }
              value={value as string}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
              className="pl-8 h-8 text-sm bg-background border-border text-foreground placeholder-muted-foreground focus:border-primary transition-colors duration-150"
            />
          </div>
        );

      case "select":
        return (
          <Select
            value={value as string}
            onValueChange={(newValue) => onFilterChange(filter.key, newValue)}
          >
            <SelectTrigger className="h-8 text-sm bg-background border-border text-foreground hover:bg-muted/50 transition-colors duration-150">
              <SelectValue
                placeholder={
                  filter.placeholder || `Select ${filter.label.toLowerCase()}`
                }
              />
            </SelectTrigger>
            <SelectContent className="bg-card border-border shadow-lg">
              {filter.options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-sm text-foreground hover:bg-muted/50 transition-colors duration-150"
                >
                  {option.badge ? (
                    <Badge
                      variant="secondary"
                      className="text-xs px-1.5 py-0.5"
                    >
                      {option.label}
                    </Badge>
                  ) : (
                    option.label
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return null;
    }
  };

  return (
    <div className={className || "w-full lg:w-80 flex-shrink-0"}>
      <Card className="sticky top-6 bg-card/95 backdrop-blur-sm border-border/50 shadow-sm">
        <CardContent className="p-3">
          {title && (
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Filter className="w-3 h-3 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            </div>
          )}

          <div className="space-y-3">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {filter.label}
                </label>
                {renderFilterInput(filter)}
              </div>
            ))}
          </div>

          {/* Compact Summary Stats */}
          {summaryStats && (
            <div className="mt-4 p-2.5 bg-muted/20 rounded-lg border border-border/30">
              <h4 className="text-xs font-semibold mb-2 text-foreground">
                Summary
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(summaryStats).map(([key, stat]) => (
                  <div key={key} className="text-center">
                    <div className="text-xs font-bold text-foreground">
                      {stat.format ? stat.format(stat.value) : stat.value}
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-tight">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
