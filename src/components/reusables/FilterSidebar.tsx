"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Activity,
  FileText,
} from "lucide-react";

// Generic filter configuration
export interface FilterConfig {
  key: string;
  label: string;
  type: "search" | "select" | "multiselect" | "status";
  options?: Array<{
    value: string;
    label: string;
    badge?: boolean;
    count?: number;
    color?: string;
  }>;
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
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
            <Input
              placeholder={
                filter.placeholder || `Search ${filter.label.toLowerCase()}...`
              }
              value={value as string}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
              className="pl-9 h-10 text-sm font-inter bg-background border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-border/80 transition-all duration-300 motion-reduce:transition-none"
              aria-label={`Search ${filter.label.toLowerCase()}`}
            />
          </div>
        );

      case "select":
        return (
          <Select
            value={value as string}
            onValueChange={(newValue) => onFilterChange(filter.key, newValue)}
          >
            <SelectTrigger className="h-10 text-sm font-inter bg-background border-border text-foreground hover:bg-muted/50 hover:border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 motion-reduce:transition-none">
              <SelectValue
                placeholder={
                  filter.placeholder || `Select ${filter.label.toLowerCase()}`
                }
              />
            </SelectTrigger>
            <SelectContent className="bg-card border-border shadow-lg backdrop-blur-sm">
              {filter.options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-sm font-inter text-foreground hover:bg-muted/50 focus:bg-muted/70 transition-colors duration-300 motion-reduce:transition-none cursor-pointer"
                >
                  {option.badge ? (
                    <Badge
                      variant="secondary"
                      className="text-xs font-inter px-2 py-0.5 bg-muted text-muted-foreground"
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

      case "multiselect":
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-track-muted/20 scrollbar-thumb-muted hover:scrollbar-thumb-muted/80">
            {filter.options?.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/30 transition-colors duration-300 motion-reduce:transition-none group cursor-pointer"
                onClick={() => {
                  const newSelectedValues = selectedValues.includes(
                    option.value
                  )
                    ? selectedValues.filter((v) => v !== option.value)
                    : [...selectedValues, option.value];
                  onFilterChange(filter.key, newSelectedValues);
                }}
              >
                <Checkbox
                  id={`${filter.key}-${option.value}`}
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const newSelectedValues = checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((v) => v !== option.value);
                    onFilterChange(filter.key, newSelectedValues);
                  }}
                  className="h-4 w-4 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 motion-reduce:transition-none"
                />
                <label
                  htmlFor={`${filter.key}-${option.value}`}
                  className="text-sm font-inter text-foreground cursor-pointer flex-1 group-hover:text-foreground transition-colors duration-300 motion-reduce:transition-none"
                >
                  {option.badge ? (
                    <Badge
                      variant="secondary"
                      className="text-xs font-inter px-2 py-0.5 bg-muted text-muted-foreground"
                    >
                      {option.label}
                    </Badge>
                  ) : (
                    option.label
                  )}
                </label>
              </div>
            ))}
          </div>
        );

      case "status":
        const statusValues = Array.isArray(value) ? value : [];

        const getStatusIcon = (statusValue: string) => {
          switch (statusValue) {
            case "DEPLOYED":
              return Activity;
            case "PASSED":
              return CheckCircle;
            case "FAILED":
              return XCircle;
            case "DRAFT":
              return FileText;
            default:
              return Activity;
          }
        };

        const getStatusStyles = (statusValue: string, isSelected: boolean) => {
          const baseStyles =
            "transition-all duration-300 motion-reduce:transition-none";

          switch (statusValue) {
            case "DEPLOYED":
              return isSelected
                ? `${baseStyles} text-blue-700 bg-blue-50 border-blue-200 shadow-sm hover:shadow-md`
                : `${baseStyles} text-blue-500 hover:text-blue-600`;
            case "PASSED":
              return isSelected
                ? `${baseStyles} text-green-700 bg-green-50 border-green-200 shadow-sm hover:shadow-md`
                : `${baseStyles} text-green-500 hover:text-green-600`;
            case "FAILED":
              return isSelected
                ? `${baseStyles} text-red-700 bg-red-50 border-red-200 shadow-sm hover:shadow-md`
                : `${baseStyles} text-red-500 hover:text-red-600`;
            case "DRAFT":
              return isSelected
                ? `${baseStyles} text-gray-700 bg-gray-50 border-gray-200 shadow-sm hover:shadow-md`
                : `${baseStyles} text-gray-500 hover:text-gray-600`;
            default:
              return isSelected
                ? `${baseStyles} text-gray-700 bg-gray-50 border-gray-200 shadow-sm hover:shadow-md`
                : `${baseStyles} text-gray-500 hover:text-gray-600`;
          }
        };

        // Quick action buttons for status filter
        const allSelected = filter.options?.every((option) =>
          statusValues.includes(option.value)
        );
        const noneSelected = statusValues.length === 0;

        return (
          <div className="space-y-3">
            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const allValues =
                    filter.options?.map((opt) => opt.value) || [];
                  onFilterChange(filter.key, allValues);
                }}
                disabled={allSelected}
                className="flex-1 px-3 py-2 text-xs font-inter font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted/50 hover:border-border/80 focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border transition-all duration-300 motion-reduce:transition-none"
                aria-label="Select all status filters"
              >
                Select All
              </button>
              <button
                onClick={() => onFilterChange(filter.key, [])}
                disabled={noneSelected}
                className="flex-1 px-3 py-2 text-xs font-inter font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted/50 hover:border-border/80 focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border transition-all duration-300 motion-reduce:transition-none"
                aria-label="Clear all status filters"
              >
                Clear All
              </button>
            </div>

            {/* Status Options */}
            <div className="space-y-2">
              {filter.options?.map((option) => {
                const isSelected = statusValues.includes(option.value);
                const Icon = getStatusIcon(option.value);
                const statusStyles = getStatusStyles(option.value, isSelected);

                return (
                  <div
                    key={option.value}
                    onClick={() => {
                      const newSelectedValues = isSelected
                        ? statusValues.filter((v) => v !== option.value)
                        : [...statusValues, option.value];
                      onFilterChange(filter.key, newSelectedValues);
                    }}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border cursor-pointer group
                      hover:scale-[1.02] active:scale-[0.98]
                      ${
                        isSelected
                          ? `${statusStyles} ring-1 ring-current/10`
                          : "bg-background border-border hover:bg-muted/30 hover:border-border/80"
                      }
                    `}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`${isSelected ? "Remove" : "Add"} ${option.label} filter`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        const newSelectedValues = isSelected
                          ? statusValues.filter((v) => v !== option.value)
                          : [...statusValues, option.value];
                        onFilterChange(filter.key, newSelectedValues);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-4 w-4 ${isSelected ? statusStyles.split(" ")[0] : "text-muted-foreground group-hover:text-foreground"}`}
                      />
                      <span
                        className={`text-sm font-inter font-medium ${isSelected ? statusStyles.split(" ")[0] : "text-foreground"}`}
                      >
                        {option.label}
                      </span>
                    </div>
                    {option.count !== undefined && (
                      <Badge
                        variant={isSelected ? "default" : "secondary"}
                        className={`text-xs font-inter px-2 py-1 transition-colors duration-300 motion-reduce:transition-none ${
                          isSelected
                            ? "bg-white/90 text-current border-current/20"
                            : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
                        }`}
                      >
                        {option.count}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={className || "w-full lg:w-80 flex-shrink-0"}>
      <Card className="sticky top-6 bg-card/95 backdrop-blur-xl border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300 motion-reduce:transition-none">
        <CardContent className="p-4 space-y-4">
          {title && (
            <div className="flex items-center gap-3 pb-2 border-b border-border/30">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Filter className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-base font-inter font-semibold text-foreground">
                {title}
              </h3>
            </div>
          )}

          <div className="space-y-4">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <label className="text-sm font-inter font-medium text-foreground block">
                  {filter.label}
                </label>
                {renderFilterInput(filter)}
              </div>
            ))}
          </div>

          {/* Enhanced Summary Stats */}
          {summaryStats && (
            <div className="mt-6 p-4 bg-muted/20 rounded-xl border border-border/30 backdrop-blur-sm">
              <h4 className="text-sm font-inter font-semibold mb-3 text-foreground">
                Summary
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(summaryStats).map(([key, stat]) => (
                  <div
                    key={key}
                    className="text-center p-2 rounded-lg bg-background/50 hover:bg-background/70 transition-colors duration-300 motion-reduce:transition-none"
                  >
                    <div className="text-lg font-inter font-bold text-foreground mb-1">
                      {stat.format ? stat.format(stat.value) : stat.value}
                    </div>
                    <div className="text-xs font-inter text-muted-foreground leading-tight">
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
