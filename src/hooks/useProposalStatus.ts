// hooks/useProposalStatus.ts
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchLatestChainState } from "@/services/chain-state.service";
import { getProposalStatus } from "@/utils/proposal";
import type { Proposal, ProposalWithDAO } from "@/types";
import {
  Clock,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

export function useProposalStatus(proposal: Proposal | ProposalWithDAO) {
  const { data: latestChainState } = useQuery({
    queryKey: ["latestChainState"],
    queryFn: fetchLatestChainState,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const currentBlockHeight = latestChainState?.bitcoin_block_height
    ? Number(latestChainState.bitcoin_block_height)
    : null;

  // Get the status using the same logic as ProposalCard
  const status = getProposalStatus(proposal, currentBlockHeight);

  // Memoize status configuration to prevent recalculation
  const statusConfig = useMemo(() => {
    switch (status) {
      case "DRAFT":
        return {
          icon: AlertCircle,
          color: "text-muted-foreground",
          bg: "bg-muted/10",
          border: "border-muted/20",
          label: "Draft",
          variant: "outline" as const,
        };
      case "PENDING":
        return {
          icon: Clock,
          color: "text-secondary",
          bg: "bg-secondary/10",
          border: "border-secondary/20",
          label: "Pending",
          variant: "secondary" as const,
        };
      case "ACTIVE":
        return {
          icon: BarChart3,
          color: "text-primary",
          bg: "bg-primary/10",
          border: "border-primary/20",
          label: "Active",
          variant: "default" as const,
        };
      case "VETO_PERIOD":
        return {
          icon: Clock,
          color: "text-accent",
          bg: "bg-accent/10",
          border: "border-accent/20",
          label: "Veto Period",
          variant: "outline" as const,
        };
      case "EXECUTION_WINDOW":
        return {
          icon: Clock,
          color: "text-accent",
          bg: "bg-accent/10",
          border: "border-accent/20",
          label: "Execution Window",
          variant: "outline" as const,
        };
      case "PASSED":
        return {
          icon: CheckCircle,
          color: "text-success",
          bg: "bg-success/10",
          border: "border-success/20",
          label: "Passed",
          variant: "secondary" as const,
        };
      case "FAILED":
        return {
          icon: XCircle,
          color: "text-destructive",
          bg: "bg-destructive/10",
          border: "border-destructive/20",
          label: "Failed",
          variant: "destructive" as const,
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-muted-foreground",
          bg: "bg-muted/10",
          border: "border-muted/20",
          label: "Unknown",
          variant: "outline" as const,
        };
    }
  }, [status]);

  return {
    status,
    statusConfig,
    isActive: status === "ACTIVE",
    isEnded: ["PASSED", "FAILED", "VETO_PERIOD", "EXECUTION_WINDOW"].includes(
      status
    ),
    isPassed: status === "PASSED",
    isFailed: status === "FAILED",
    isVetoPeriod: status === "VETO_PERIOD",
    isExecutionWindow: status === "EXECUTION_WINDOW",
    isDraft: status === "DRAFT",
    isPending: status === "PENDING",
  };
}
