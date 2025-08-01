"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  FileText,
  Users,
  AlertCircle,
  Search,
  ThumbsUp,
  MessageSquare,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Base Empty State Container
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  className?: string;
}

function EmptyStateBase({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed border-2", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        {icon && (
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-6">
          {description}
        </p>
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || "default"}
            className="min-w-[120px]"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// No Votes Empty State
export function NoVotesEmpty({
  onCreateVote,
  isVotingActive = false,
}: {
  onCreateVote?: () => void;
  isVotingActive?: boolean;
}) {
  return (
    <EmptyStateBase
      icon={<ThumbsUp className="h-8 w-8 text-muted-foreground" />}
      title="No votes recorded"
      description={
        isVotingActive
          ? "Be the first to vote on this proposal. Your voice matters in the decision-making process."
          : "No votes have been recorded for this proposal yet. Voting may not have started or has ended."
      }
      action={
        onCreateVote && isVotingActive
          ? {
              label: "Cast Your Vote",
              onClick: onCreateVote,
              variant: "default",
            }
          : undefined
      }
      className="border-primary/20 bg-primary/5"
    />
  );
}

// No Vetos Empty State
export function NoVetosEmpty({ onCreateVeto }: { onCreateVeto?: () => void }) {
  return (
    <EmptyStateBase
      icon={<Shield className="h-8 w-8 text-muted-foreground" />}
      title="No vetos submitted"
      description="No community members have submitted vetos for this proposal. This indicates general support for the proposal."
      action={
        onCreateVeto
          ? {
              label: "Submit Veto",
              onClick: onCreateVeto,
              variant: "outline",
            }
          : undefined
      }
      className="border-muted/20 bg-muted/5"
    />
  );
}

// No Proposals Empty State
export function NoProposalsEmpty({
  onCreateProposal,
  searchTerm,
}: {
  onCreateProposal?: () => void;
  searchTerm?: string;
}) {
  const isSearchResult = Boolean(searchTerm);

  return (
    <EmptyStateBase
      icon={
        isSearchResult ? (
          <Search className="h-8 w-8 text-muted-foreground" />
        ) : (
          <FileText className="h-8 w-8 text-muted-foreground" />
        )
      }
      title={isSearchResult ? "No proposals found" : "No proposals yet"}
      description={
        isSearchResult
          ? `No proposals match your search for "${searchTerm}". Try adjusting your search terms or filters.`
          : "This DAO hasn't created any proposals yet. Be the first to submit a proposal and get the community involved."
      }
      action={
        onCreateProposal && !isSearchResult
          ? {
              label: "Create Proposal",
              onClick: onCreateProposal,
              variant: "default",
            }
          : undefined
      }
      className={
        isSearchResult
          ? "border-muted/20 bg-muted/5"
          : "border-primary/20 bg-primary/5"
      }
    />
  );
}

// No DAOs Empty State
export function NoDAOsEmpty({ onCreateDAO }: { onCreateDAO?: () => void }) {
  return (
    <EmptyStateBase
      icon={<Users className="h-8 w-8 text-muted-foreground" />}
      title="No DAOs found"
      description="No decentralized autonomous organizations have been created yet. Start building the future of governance by creating the first DAO."
      action={
        onCreateDAO
          ? {
              label: "Create DAO",
              onClick: onCreateDAO,
              variant: "default",
            }
          : undefined
      }
      className="border-primary/20 bg-primary/5"
    />
  );
}

// Error State Component
export function ErrorState({
  title = "Something went wrong",
  description = "We encountered an error while loading the data. Please try again.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <EmptyStateBase
      icon={<AlertCircle className="h-8 w-8 text-destructive" />}
      title={title}
      description={description}
      action={
        onRetry
          ? {
              label: "Try Again",
              onClick: onRetry,
              variant: "outline",
            }
          : undefined
      }
      className={cn("border-destructive/20 bg-destructive/5", className)}
    />
  );
}

// Loading Timeout State
export function LoadingTimeoutState({
  onRetry,
  entityName = "content",
}: {
  onRetry?: () => void;
  entityName?: string;
}) {
  return (
    <EmptyStateBase
      icon={<Clock className="h-8 w-8 text-muted-foreground" />}
      title="Taking longer than expected"
      description={`Loading ${entityName} is taking longer than usual. This might be due to network conditions or high server load.`}
      action={
        onRetry
          ? {
              label: "Retry Loading",
              onClick: onRetry,
              variant: "outline",
            }
          : undefined
      }
      className="border-muted/20 bg-muted/5"
    />
  );
}

// Feature Coming Soon State
export function ComingSoonState({
  featureName,
  description,
  className,
}: {
  featureName: string;
  description?: string;
  className?: string;
}) {
  return (
    <EmptyStateBase
      icon={<MessageSquare className="h-8 w-8 text-muted-foreground" />}
      title={`${featureName} Coming Soon`}
      description={
        description ||
        `We're working hard to bring ${featureName.toLowerCase()} to you. Stay tuned for updates!`
      }
      className={cn("border-muted/20 bg-muted/5", className)}
    />
  );
}

// No Data Generic State
export function NoDataState({
  icon = <AlertCircle className="h-8 w-8 text-muted-foreground" />,
  title = "No data available",
  description = "There is no data to display at this time.",
  className,
}: {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <EmptyStateBase
      icon={icon}
      title={title}
      description={description}
      className={cn("border-muted/20 bg-muted/5", className)}
    />
  );
}

// Export all empty states
export const ProposalEmptyStates = {
  NoVotes: NoVotesEmpty,
  NoVetos: NoVetosEmpty,
  NoProposals: NoProposalsEmpty,
  NoDAOs: NoDAOsEmpty,
  Error: ErrorState,
  LoadingTimeout: LoadingTimeoutState,
  ComingSoon: ComingSoonState,
  NoData: NoDataState,
};
