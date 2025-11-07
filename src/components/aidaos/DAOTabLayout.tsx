"use client";

import type React from "react";

interface DAOTabLayoutProps {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ElementType;
}

export function DAOTabLayout({
  title,
  description,
  icon: Icon,
  toolbar,
  children,
  isEmpty = false,
  emptyTitle,
  emptyDescription,
  emptyIcon: EmptyIcon,
}: DAOTabLayoutProps) {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-secondary" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>

        {/* Toolbar Section */}
        {toolbar && (
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            {toolbar}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="space-y-6">
        {isEmpty ? (
          <div className=" py-12">
            <div className="text-center space-y-4">
              {EmptyIcon && (
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                  <EmptyIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">
                  {emptyTitle || "No Data Found"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {emptyDescription || "No data available for this section."}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card/30 backdrop-blur-sm">{children}</div>
        )}
      </div>
    </div>
  );
}
