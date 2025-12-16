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
    <div className="mx-auto space-y-4 rounded-sm">
      {/* Header Section */}
      <div className="space-y-2 px-2">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-2">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-secondary" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {title}
              </h2>
              {description && (
                <p className="text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
          {/* Toolbar Section */}
          {toolbar && <div className="w-full lg:w-[400px]">{toolbar}</div>}
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-4">
        {isEmpty ? (
          <div className=" ">
            <div className="text-center space-y-4">
              {EmptyIcon && (
                <div className="w-12 h-12 rounded-sm bg-muted/50 flex items-center justify-center mx-auto">
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
          <div className="bg-card/30">{children}</div>
        )}
      </div>
    </div>
  );
}
