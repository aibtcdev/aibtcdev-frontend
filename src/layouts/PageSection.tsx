"use client";

import type React from "react";
import { LucideIcon } from "lucide-react";

interface PageSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

export function PageSection({
  children,
  title,
  description,
  icon: Icon,
  className = "",
}: PageSectionProps) {
  return (
    <div
      className={`bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-8 shadow-sm hover:border-border/80 transition-all duration-300 ${className}`}
    >
      {(title || description) && (
        <div className="flex items-center gap-3 mb-6">
          {Icon && (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          )}
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
