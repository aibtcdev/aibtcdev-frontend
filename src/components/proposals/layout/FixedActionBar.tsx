"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Vote, Share, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FixedActionBarProps {
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  primaryActionLabel?: string;
  primaryActionIcon?: React.ReactNode;
  secondaryActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "destructive";
  }>;
  className?: string;
  show?: boolean;
}

export function FixedActionBar({
  onPrimaryAction,
  onSecondaryAction,
  primaryActionLabel = "Vote",
  primaryActionIcon = <Vote className="h-4 w-4" />,
  secondaryActions = [],
  className,
  show = true,
}: FixedActionBarProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        "lg:hidden", // Only show on mobile/tablet
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/95 backdrop-blur-sm border-t border-border/50",
        "p-4 safe-area-pb", // Safe area for devices with home indicator
        className
      )}
    >
      <div className="flex items-center gap-3 max-w-md mx-auto">
        {/* Primary Action - Takes most space */}
        {onPrimaryAction && (
          <Button
            onClick={onPrimaryAction}
            className="flex-1 h-12 text-base font-semibold"
            size="lg"
          >
            {primaryActionIcon}
            <span className="ml-2">{primaryActionLabel}</span>
          </Button>
        )}

        {/* Secondary Action - Share button */}
        {onSecondaryAction && (
          <Button
            onClick={onSecondaryAction}
            variant="outline"
            className="h-12 px-4"
            size="lg"
          >
            <Share className="h-4 w-4" />
          </Button>
        )}

        {/* More Actions - Dropdown menu */}
        {secondaryActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 px-4" size="lg">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {secondaryActions.map((action, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={action.onClick}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    action.variant === "destructive" && "text-destructive"
                  )}
                >
                  {action.icon}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

// Spacer component to prevent content from being hidden behind the fixed bar
export function FixedActionBarSpacer({ show = true }: { show?: boolean }) {
  if (!show) return null;

  return <div className="lg:hidden h-20" />;
}

export default FixedActionBar;
