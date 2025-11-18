import React, { useMemo } from "react";
import { useProposalStatus } from "@/hooks/useProposalStatus";
import { CheckCircle2 } from "lucide-react";
import type { Proposal, ProposalWithDAO } from "@/types";

interface ProposalStatusBadgeProps {
  proposal: Proposal | ProposalWithDAO;
  size?: "sm" | "md" | "lg";
  className?: string;
  metQuorum?: boolean;
  metThreshold?: boolean;
}

export function ProposalStatusBadge({
  proposal,
  size = "md",
  className = "",
  metQuorum,
  metThreshold,
}: ProposalStatusBadgeProps) {
  const { statusConfig, isEnded } = useProposalStatus(proposal);

  // Override status config if voting ended and requirements were met
  const finalStatusConfig = useMemo(() => {
    if (isEnded && metQuorum && metThreshold) {
      return {
        icon: CheckCircle2,
        color: "text-success",
        bg: "bg-success/10",
        border: "border-success/20",
        label: "Passed",
      };
    }
    return statusConfig;
  }, [isEnded, metQuorum, metThreshold, statusConfig]);

  const StatusIcon = finalStatusConfig.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  const iconSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-3.5 w-3.5",
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-sm font-medium ${finalStatusConfig.bg} ${finalStatusConfig.border} ${finalStatusConfig.color} border ${sizeClasses[size]} ${className}`}
    >
      <StatusIcon className={iconSizes[size]} />
      {finalStatusConfig.label}
    </div>
  );
}
