"use client";
import React, { forwardRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { FileEdit, Timer, CheckCircle2, XCircle } from "lucide-react";
import { Proposal } from "@/types/supabase";

interface StatusBadgeProps {
  status: Proposal["status"];
}

const StatusBadge = forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status }, ref) => {
    const config = {
      DRAFT: {
        color: "bg-secondary/10 text-secondary",
        icon: FileEdit,
        label: "Draft",
        tooltip: "This proposal is in draft state and not yet active.",
      },
      PENDING: {
        color: "bg-primary/10 text-primary",
        icon: Timer,
        label: "Pending",
        tooltip: "This proposal is awaiting votes.",
      },
      DEPLOYED: {
        color: "bg-primary/10 text-primary",
        icon: CheckCircle2,
        label: "Deployed",
        tooltip: "This proposal has been approved and executed.",
      },
      FAILED: {
        color: "bg-secondary/10 text-secondary",
        icon: XCircle,
        label: "Failed",
        tooltip: "This proposal did not receive enough support.",
      },
    };

    const { color, icon: Icon, label, tooltip } = config[status];

    return (
      <div ref={ref}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className={color}>
                <Icon className="h-3 w-3 mr-1" />
                {label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

export default StatusBadge;
