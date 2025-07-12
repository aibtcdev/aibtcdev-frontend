"use client";

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
import { Search, CheckCircle, XCircle, Activity, FileText } from "lucide-react";

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

interface FilterSidebarProps {
  title: string;
  filters: FilterConfig[];
  filterState: FilterState;
  onFilterChange: (key: string, value: string | string[]) => void;
  className?: string;
}

export function FilterSidebar({
  title,
  filters,
  filterState,
  onFilterChange,
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
            {filter.options?.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={`
                    flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-all
                    ${
                      isSelected
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-foreground hover:bg-muted/50 hover:text-foreground"
                    }
                  `}
                >
                  <span className="font-inter font-medium">{option.label}</span>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => {
                      const newSelectedValues = isSelected
                        ? selectedValues.filter((v) => v !== option.value)
                        : [...selectedValues, option.value];
                      onFilterChange(filter.key, newSelectedValues);
                    }}
                    className="h-4 w-4 shrink-0 border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary text-primary-foreground focus-visible:ring-primary/20"
                    aria-label={`Toggle filter for ${option.label}`}
                  />
                </label>
              );
            })}
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

                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      const newSelectedValues = isSelected
                        ? statusValues.filter((v) => v !== option.value)
                        : [...statusValues, option.value];
                      onFilterChange(filter.key, newSelectedValues);
                    }}
                    className={`
                      flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all
                      ${
                        isSelected
                          ? "bg-primary/10 font-semibold text-primary"
                          : "text-foreground hover:bg-muted/50 hover:text-foreground"
                      }
                    `}
                    aria-pressed={isSelected}
                    aria-label={`${isSelected ? "Remove" : "Add"} ${option.label} filter`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-4 w-4 ${!isSelected && "text-muted-foreground"}`}
                      />
                      <span className="font-inter font-medium">
                        {option.label}
                      </span>
                    </div>
                    {option.count !== undefined && (
                      <Badge
                        variant={isSelected ? "default" : "secondary"}
                        className="h-5"
                      >
                        {option.count}
                      </Badge>
                    )}
                  </button>
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
    <div className={className}>
      {title && (
        <div className="flex items-center ">
          <h3 className="text-lg font-semibold mb-4 pl-2">{title}</h3>
        </div>
      )}

      <div className="space-y-6">
        {filters.map((filter) => (
          <div key={filter.key} className="space-y-3">
            <label className="text-sm font-inter font-medium text-foreground px-1 block">
              {filter.label}
            </label>
            {renderFilterInput(filter)}
          </div>
        ))}
      </div>
    </div>
  );
}
