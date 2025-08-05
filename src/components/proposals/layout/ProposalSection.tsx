"use client";

import React, { useState, createContext, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

// Context for section state management
interface ProposalSectionContextType {
  isOpen: boolean;
  toggle: () => void;
  sectionId: string;
}

const ProposalSectionContext = createContext<ProposalSectionContextType | null>(
  null
);

const useProposalSection = () => {
  const context = useContext(ProposalSectionContext);
  if (!context) {
    throw new Error(
      "useProposalSection must be used within ProposalSection.Provider"
    );
  }
  return context;
};

// Main Provider Component
interface ProposalSectionProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  sectionId: string;
  onToggle?: (isOpen: boolean) => void;
}

function ProposalSectionProvider({
  children,
  defaultOpen = false,
  sectionId,
  onToggle,
}: ProposalSectionProviderProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
  };

  return (
    <ProposalSectionContext.Provider value={{ isOpen, toggle, sectionId }}>
      {children}
    </ProposalSectionContext.Provider>
  );
}

// Card Wrapper Component
interface ProposalSectionCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "highlighted" | "muted" | "warning";
}

function ProposalSectionCard({
  children,
  className,
  variant = "default",
}: ProposalSectionCardProps) {
  const variantClasses = {
    default: "border-border/50",
    highlighted: "border-primary/20 bg-primary/5",
    muted: "border-muted/20 bg-muted/5",
    warning: "border-destructive/20 bg-destructive/5",
  };

  return (
    <Card className={cn(variantClasses[variant], className)}>{children}</Card>
  );
}

// Header Component with built-in collapsible trigger
interface ProposalSectionHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  collapsible?: boolean;
  className?: string;
}

function ProposalSectionHeader({
  icon,
  title,
  subtitle,
  badge,
  actions,
  collapsible = false,
  className,
}: ProposalSectionHeaderProps) {
  // Always call the hook, but conditionally use its value
  const context = useProposalSection();

  const headerContent = (
    <CardHeader className={cn("pb-4", className)}>
      <CardTitle className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              {title}
              {badge}
            </h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {collapsible && (
            <Button variant="ghost" size="sm">
              {context.isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardTitle>
    </CardHeader>
  );

  if (collapsible) {
    return (
      <CollapsibleTrigger asChild>
        <div className="cursor-pointer hover:bg-muted/50 transition-colors">
          {headerContent}
        </div>
      </CollapsibleTrigger>
    );
  }

  return headerContent;
}

// Content Component
interface ProposalSectionContentProps {
  children: React.ReactNode;
  collapsible?: boolean;
  className?: string;
  lazy?: boolean;
}

function ProposalSectionContent({
  children,
  collapsible = false,
  className,
  lazy = false,
}: ProposalSectionContentProps) {
  // Always call the hook, but conditionally use its value
  const context = useProposalSection();

  const content = (
    <CardContent className={cn("pt-0", className)}>
      {lazy && !context.isOpen ? null : children}
    </CardContent>
  );

  if (collapsible) {
    return <CollapsibleContent>{content}</CollapsibleContent>;
  }

  return content;
}

// Root Component that wraps everything
interface ProposalSectionRootProps {
  children: React.ReactNode;
  collapsible?: boolean;
}

function ProposalSectionRoot({
  children,
  collapsible = false,
}: ProposalSectionRootProps) {
  // Always call the hook, but conditionally use its value
  const context = useProposalSection();

  if (collapsible) {
    return (
      <Collapsible open={context.isOpen} onOpenChange={context.toggle}>
        {children}
      </Collapsible>
    );
  }

  return <>{children}</>;
}

// Compound Component Export
export const ProposalSection = {
  Provider: ProposalSectionProvider,
  Root: ProposalSectionRoot,
  Card: ProposalSectionCard,
  Header: ProposalSectionHeader,
  Content: ProposalSectionContent,
};

// Hook export for external use
export { useProposalSection };

// Types export
export type { ProposalSectionContextType };
