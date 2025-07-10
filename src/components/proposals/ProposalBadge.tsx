import React from "react";
import { useProposalStatus } from "@/hooks/useProposalStatus";
import type { Proposal, ProposalWithDAO } from "@/types";

interface ProposalStatusBadgeProps {
  proposal: Proposal | ProposalWithDAO;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProposalStatusBadge({
  proposal,
  size = "md",
  className = "",
}: ProposalStatusBadgeProps) {
  const { statusConfig } = useProposalStatus(proposal);
  const StatusIcon = statusConfig.icon;

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
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color} border ${sizeClasses[size]} ${className}`}
    >
      <StatusIcon className={iconSizes[size]} />
      {statusConfig.label}
    </div>
  );
}
