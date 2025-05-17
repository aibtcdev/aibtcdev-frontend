"use client";

import type React from "react";

import { ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LabeledFieldProps {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
  copy?: string;
  link?: string;
}

const LabeledField = ({
  icon: Icon,
  label,
  value,
  link,
}: LabeledFieldProps) => {
  const displayValue =
    (typeof value === "string" && value.trim() === "") || !value
      ? "No data available"
      : value;

  return (
    <div className="flex items-start gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5 flex-grow min-w-0">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {label}:
        </span>
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-xs break-all overflow-hidden text-ellipsis">
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline flex items-center gap-1"
              >
                {displayValue}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      <p>View on explorer</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </a>
            ) : (
              displayValue
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LabeledField;
